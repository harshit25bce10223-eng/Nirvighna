"""
STEP 11: Automated Retraining Pipeline & Model Versioning Engine
Triggers model retraining using actual_footfall ground truth data oversampled 3x.
Versions trained models with timestamped artifacts (ensemble_model_YYYYMMDD_HHMMSS.pkl),
updates ensemble_model.pkl pointer, logs to model_versions table, and supports rollback.
"""

import os
import shutil
import pickle
import numpy as np
import pandas as pd
from datetime import datetime
from prediction_logger import get_connection, init_db, log_audit
from generate_synthetic_data import get_festival_metadata
from train_models import FEATURE_COLUMNS, EnsembleModel, prepare_features
from catboost import CatBoostRegressor
from lightgbm import LGBMRegressor
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error, r2_score

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def execute_retraining_pipeline(user_id="admin"):
    """
    Main retraining workflow:
    1. Loads ground truth actual_footfall rows from database.
    2. Oversamples real data 3x to give higher weight to ground truth over synthetic baseline.
    3. Retrains CatBoost + LightGBM models.
    4. Versions output artifact: ensemble_model_YYYYMMDD_HHMMSS.pkl.
    5. Updates active ensemble_model.pkl pointer.
    6. Logs event in model_versions and audit_logs tables.
    """
    print(f"\n[RETRAINING] Initiated model retraining pipeline by {user_id} at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}...")
    init_db()
    conn, db_type = get_connection()

    # Query all recorded ground truth actual_footfall records
    df_real = pd.read_sql_query('''
        SELECT temple, date, time_slot, footfall_count as footfall
        FROM actual_footfall
    ''', conn)
    conn.close()

    real_count = len(df_real)
    print(f"[RETRAINING] Fetched {real_count} real ground truth telemetry rows.")

    # Load historical synthetic baseline dataset
    base_csv = os.path.join(SCRIPT_DIR, 'temple_footfall_synthetic.csv')
    df_base = pd.read_csv(base_csv) if os.path.exists(base_csv) else pd.DataFrame()
    synthetic_count = len(df_base)

    if not df_real.empty:
        # Augment real records with date features & festival metadata
        real_rows = []
        for _, row in df_real.iterrows():
            try:
                date_obj = datetime.strptime(row['date'], '%Y-%m-%d')
            except ValueError:
                continue
            
            day_of_week = date_obj.weekday()
            is_weekend = day_of_week in [5, 6]
            month = date_obj.month
            is_monsoon = month in [7, 8, 9]
            fest_mult, days_to_fest = get_festival_metadata(row['temple'], date_obj)

            real_rows.append({
                'temple': row['temple'],
                'date': row['date'],
                'day_of_week': day_of_week,
                'is_weekend': is_weekend,
                'month': month,
                'is_monsoon': is_monsoon,
                'time_slot': row['time_slot'],
                'festival_multiplier': fest_mult,
                'days_to_nearest_festival': days_to_fest,
                'footfall': row['footfall']
            })

        df_real_full = pd.DataFrame(real_rows)

        # STEP 11 Requirement: Oversample real ground-truth rows 3x
        df_real_oversampled = pd.concat([df_real_full] * 3, ignore_index=True)
        combined_df = pd.concat([df_base, df_real_oversampled], ignore_index=True)
    else:
        combined_df = df_base

    total_training_size = len(combined_df)
    print(f"[RETRAINING] Combined dataset prepared: {total_training_size} rows (Real Oversampled 3x: {len(df_real)*3}, Synthetic: {synthetic_count}).")

    # Prepare feature matrices
    X, y = prepare_features(combined_df)

    # Split 80% train / 20% test chronologically
    split_idx = int(len(combined_df) * 0.8)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

    # Train CatBoost Regressor
    print("[RETRAINING] Training updated CatBoostRegressor...")
    catboost_model = CatBoostRegressor(
        iterations=500,
        learning_rate=0.05,
        depth=6,
        random_seed=42,
        verbose=0
    )
    catboost_model.fit(X_train, y_train)

    # Train LightGBM Regressor
    print("[RETRAINING] Training updated LightGBMRegressor...")
    lightgbm_model = LGBMRegressor(
        n_estimators=500,
        learning_rate=0.05,
        num_leaves=31,
        random_state=42,
        verbose=-1
    )
    lightgbm_model.fit(X_train, y_train)

    # Evaluate Ensemble Predictions
    pred_cb = catboost_model.predict(X_test)
    pred_lgb = lightgbm_model.predict(X_test)
    pred_ens = (pred_cb + pred_lgb) / 2.0

    test_mae = float(mean_absolute_error(y_test, pred_ens))
    test_mape = float(mean_absolute_percentage_error(y_test, pred_ens) * 100.0)
    test_r2 = float(r2_score(y_test, pred_ens))

    # Version model artifact with timestamp (Step 11 requirement)
    timestamp_str = datetime.now().strftime('%Y%m%d_%H%M%S')
    version_id = f"ensemble_model_{timestamp_str}"
    versioned_filename = f"{version_id}.pkl"
    versioned_filepath = os.path.join(SCRIPT_DIR, versioned_filename)

    # Instantiate ensemble object
    ensemble_object = EnsembleModel(catboost_model, lightgbm_model, FEATURE_COLUMNS)

    with open(versioned_filepath, 'wb') as f:
        pickle.dump(ensemble_object, f)

    # Update active ensemble_model.pkl pointer
    active_path = os.path.join(SCRIPT_DIR, 'ensemble_model.pkl')
    shutil.copyfile(versioned_filepath, active_path)
    print(f"[OK] Saved timestamped artifact '{versioned_filename}' and updated active 'ensemble_model.pkl'.")

    # Record model version entry in model_versions table
    conn, db_type = get_connection()
    cursor = conn.cursor()
    ph = '%s' if db_type == 'postgres' else '?'

    # Deactivate previous active flags
    cursor.execute(f"UPDATE model_versions SET is_active = {0 if db_type=='sqlite' else 'FALSE'}")
    
    cursor.execute(f'''
        INSERT INTO model_versions (version_id, trained_at, train_data_size, real_data_count, synthetic_data_count, test_mae, test_mape, test_r2, is_active)
        VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {1 if db_type=='sqlite' else 'TRUE'})
    ''', (version_id, datetime.now().isoformat(), total_training_size, real_count, synthetic_count, round(test_mae, 2), round(test_mape, 2), round(test_r2, 4)))

    conn.commit()
    conn.close()

    # Log DPDP Audit Trail
    log_audit(
        event_type="RETRAIN",
        description=f"Model retrained to version {version_id}. Training size: {total_training_size} (Real: {real_count}). Test MAE: {test_mae:.2f}, R2: {test_r2:.4f}",
        user_id=user_id,
        details={"version_id": version_id, "train_size": total_training_size, "test_mae": test_mae, "test_r2": test_r2}
    )

    print(f"[RETRAINING] Completed successfully! Version: {version_id} | Test MAE: {test_mae:.2f} | R2: {test_r2:.4f}\n")
    return {
        "status": "success",
        "version_id": version_id,
        "trained_at": datetime.now().isoformat(),
        "train_data_size": total_training_size,
        "real_data_count": real_count,
        "synthetic_data_count": synthetic_count,
        "test_mae": round(test_mae, 2),
        "test_mape": round(test_mape, 2),
        "test_r2": round(test_r2, 4)
    }

def rollback_to_version(version_id, user_id="admin"):
    """
    Rolls back the active model pointer to a previous version artifact.
    """
    version_file = f"{version_id}.pkl"
    target_path = os.path.join(SCRIPT_DIR, version_file)

    if not os.path.exists(target_path):
        raise FileNotFoundError(f"Model version artifact '{version_file}' not found.")

    active_path = os.path.join(SCRIPT_DIR, 'ensemble_model.pkl')
    shutil.copyfile(target_path, active_path)

    conn, db_type = get_connection()
    cursor = conn.cursor()
    ph = '%s' if db_type == 'postgres' else '?'

    cursor.execute(f"UPDATE model_versions SET is_active = {0 if db_type=='sqlite' else 'FALSE'}")
    cursor.execute(f"UPDATE model_versions SET is_active = {1 if db_type=='sqlite' else 'TRUE'} WHERE version_id = {ph}", (version_id,))
    conn.commit()
    conn.close()

    log_audit(
        event_type="ROLLBACK",
        description=f"Active model rolled back to version {version_id}",
        user_id=user_id,
        details={"rollback_version": version_id}
    )

    print(f"[OK] Rolled back active model to version '{version_id}'.")
    return {"status": "success", "active_version": version_id}

if __name__ == '__main__':
    execute_retraining_pipeline()
