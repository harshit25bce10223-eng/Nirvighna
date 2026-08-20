import sys
import os
import pandas as pd
import numpy as np
import datetime
import pickle
import sqlite3
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error, r2_score
import warnings

warnings.filterwarnings('ignore')
sys.stdout.reconfigure(encoding='utf-8')

# Ensure models are imported
try:
    from catboost import CatBoostRegressor
    HAS_CATBOOST = True
except ImportError:
    HAS_CATBOOST = False
    from sklearn.ensemble import RandomForestRegressor

try:
    import lightgbm as lgb
except ImportError:
    pass

def load_data():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    synth_path = os.path.join(base_dir, 'temple_footfall_synthetic.csv')
    real_path = os.path.join(base_dir, 'real_footfall_data.csv')
    
    synth_df = pd.read_csv(synth_path)
    real_df = pd.read_csv(real_path)
    
    return synth_df, real_df

def prepare_features(df):
    df_out = df.copy()
    if 'date' in df_out.columns:
        df_out['date'] = pd.to_datetime(df_out['date'])
        if 'day_of_week' not in df_out.columns:
            df_out['day_of_week'] = df_out['date'].dt.dayofweek
        if 'month' not in df_out.columns:
            df_out['month'] = df_out['date'].dt.month
        if 'is_weekend' not in df_out.columns:
            df_out['is_weekend'] = df_out['day_of_week'].isin([5, 6]).astype(int)
        if 'is_monsoon' not in df_out.columns:
            df_out['is_monsoon'] = df_out['month'].isin([7, 8, 9]).astype(int)
            
    if 'time_slot' not in df_out.columns:
        slots = ['Morning 6-9', 'Afternoon 10-1', 'Evening 4-7', 'Night 8-11']
        weights = [0.8, 1.2, 1.5, 0.6]
        
        new_rows = []
        for _, row in df_out.iterrows():
            for i, slot in enumerate(slots):
                new_row = row.copy()
                new_row['time_slot'] = slot
                new_row['footfall'] = int(row['footfall'] * weights[i] / sum(weights))
                new_rows.append(new_row)
        df_out = pd.DataFrame(new_rows)
        
    if 'festival_multiplier' not in df_out.columns:
        df_out['festival_multiplier'] = 1.0
    if 'days_to_nearest_festival' not in df_out.columns:
        df_out['days_to_nearest_festival'] = 30
        
    # One-hot encoding
    if 'temple' in df_out.columns:
        df_out = pd.get_dummies(df_out, columns=['temple'], prefix='temple')
    if 'time_slot' in df_out.columns:
        df_out = pd.get_dummies(df_out, columns=['time_slot'], prefix='time_slot')
        
    # Ensure all required features exist
    FEATURE_COLUMNS = [
        'temple_Ambaji', 'temple_Dwarka', 'temple_Pavagadh', 'temple_Somnath',
        'day_of_week', 'is_weekend', 'month', 'is_monsoon',
        'time_slot_Afternoon 10-1', 'time_slot_Evening 4-7', 'time_slot_Morning 6-9', 'time_slot_Night 8-11',
        'festival_multiplier', 'days_to_nearest_festival'
    ]
    
    for col in FEATURE_COLUMNS:
        if col not in df_out.columns:
            df_out[col] = 0
            
    # Boolean to int conversion for one hot columns
    for col in FEATURE_COLUMNS:
        df_out[col] = df_out[col].astype(int)
        
    return df_out, FEATURE_COLUMNS

def train_and_evaluate():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    synth_df, real_df = load_data()
    
    synth_prep, FEATURE_COLUMNS = prepare_features(synth_df)
    real_prep, _ = prepare_features(real_df)
    
    # Oversample real data 3x
    real_3x = pd.concat([real_prep]*3, ignore_index=True)
    
    combined_df = pd.concat([synth_prep, real_3x], ignore_index=True)
    combined_df = combined_df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    if 'date' in combined_df.columns:
        combined_df = combined_df.sort_values('date').reset_index(drop=True)
        
    split_idx = int(len(combined_df) * 0.8)
    train_df = combined_df.iloc[:split_idx]
    test_df = combined_df.iloc[split_idx:]
    
    X_train = train_df[FEATURE_COLUMNS]
    y_train = train_df['footfall']
    X_test = test_df[FEATURE_COLUMNS]
    y_test = test_df['footfall']
    
    models = {}
    if HAS_CATBOOST:
        cb = CatBoostRegressor(iterations=600, learning_rate=0.05, depth=6, verbose=0)
        cb.fit(X_train, y_train)
        models['catboost'] = cb
        cb.save_model(os.path.join(base_dir, 'catboost_real.cbm'))
    else:
        cb = RandomForestRegressor(n_estimators=100, random_state=42)
        cb.fit(X_train, y_train)
        models['catboost'] = cb
        with open(os.path.join(base_dir, 'catboost_real.pkl'), 'wb') as f:
            pickle.dump(cb, f)
            
    lgb_model = lgb.LGBMRegressor(n_estimators=600, learning_rate=0.05, num_leaves=31, verbose=-1)
    lgb_model.fit(X_train, y_train)
    models['lightgbm'] = lgb_model
    lgb_model.booster_.save_model(os.path.join(base_dir, 'lightgbm_real.txt'))
    
    # Ensemble predictions
    cb_preds = models['catboost'].predict(X_test)
    lgb_preds = models['lightgbm'].predict(X_test)
    new_ensemble_preds = (cb_preds + lgb_preds) / 2
    
    new_mae = mean_absolute_error(y_test, new_ensemble_preds)
    new_mape = mean_absolute_percentage_error(y_test, new_ensemble_preds) * 100
    new_r2 = r2_score(y_test, new_ensemble_preds)
    
    from train_models import EnsembleModel
    ensemble = EnsembleModel(cb, lgb_model, FEATURE_COLUMNS)
    
    with open(os.path.join(base_dir, 'ensemble_real.pkl'), 'wb') as f:
        pickle.dump(ensemble, f)
        
    # Evaluate old model
    old_model_path = os.path.join(base_dir, 'ensemble_model.pkl')
    if os.path.exists(old_model_path):
        with open(old_model_path, 'rb') as f:
            old_models = pickle.load(f)
            
        try:
            # check if it's a dict or EnsembleModel
            if isinstance(old_models, dict):
                old_cb_preds = old_models['catboost'].predict(X_test)
                old_lgb_preds = old_models['lightgbm'].predict(X_test)
                old_ensemble_preds = (old_cb_preds + old_lgb_preds) / 2
            else:
                old_ensemble_preds = old_models.predict(X_test)
            
            old_mae = mean_absolute_error(y_test, old_ensemble_preds)
            old_mape = mean_absolute_percentage_error(y_test, old_ensemble_preds) * 100
            old_r2 = r2_score(y_test, old_ensemble_preds)
        except Exception as e:
            print("Failed to evaluate old model:", e)
            old_mae = old_mape = old_r2 = float('nan')
    else:
        old_mae = old_mape = old_r2 = float('nan')
        
    print("================================================")
    print("Model                    MAE        MAPE(%)    R2")
    print("================================================")
    print(f"Synthetic-Only Ensemble  {old_mae:<10.2f} {old_mape:<10.2f} {old_r2:<10.4f}")
    print(f"Real-Data Ensemble       {new_mae:<10.2f} {new_mape:<10.2f} {new_r2:<10.4f}")
    print("================================================")
    
    # Log to DB
    try:
        conn = sqlite3.connect(os.path.join(base_dir, 'prediction_logs.db'))
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS model_versions
                     (id INTEGER PRIMARY KEY AUTOINCREMENT,
                      version_name TEXT,
                      source TEXT,
                      mae REAL,
                      r2 REAL,
                      created_at TEXT)''')
        c.execute("INSERT INTO model_versions (version_name, source, mae, r2, created_at) VALUES (?, ?, ?, ?, ?)",
                  (f"ensemble_real_{datetime.datetime.now().strftime('%Y%m%d')}", 'real_data', new_mae, new_r2, datetime.datetime.now().isoformat()))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[WARNING] Could not log to database: {e}")

if __name__ == '__main__':
    train_and_evaluate()
