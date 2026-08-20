"""
STEPS 5, 9, 10, 11, 13, 14: FastAPI ML Microservice with Full Lifecycle Operations
Endpoints:
- POST /predict: Ensemble prediction & risk level determination
- POST /feedback: Staff manual ground truth ingestion (Step 13)
- GET /monitoring/stats: Live accuracy, 7-day rolling MAE/MAPE, drift status (Step 10, 12)
- POST /retrain: Automated model retraining trigger (Step 11)
- POST /rollback: Version rollback engine (Step 11)
- GET /audit/export: DPDP Act 2023 compliance audit log export (Step 14)
- POST /ingest: Trigger real-time data ingestion cycle (Step 9)
- GET /health: Service health check
"""

import os
import pickle
import numpy as np
import pandas as pd
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, JSONResponse
from pydantic import BaseModel, Field

from generate_synthetic_data import get_festival_metadata
from prediction_logger import (
    init_db, get_connection, log_prediction, record_actual_footfall,
    log_audit, export_audit_logs
)
from data_ingestion import run_ingestion_job, start_ingestion_scheduler
from monitor_model import run_daily_monitoring, get_monitoring_summary
from retraining import execute_retraining_pipeline, rollback_to_version, EnsembleModel

# Temple capacity definitions as per Step 5 specification
TEMPLE_CAPACITIES = {
    'Somnath': 1200,
    'Dwarka': 1800,
    'Ambaji': 1500,
    'Pavagadh': 2500
}

FEATURE_COLUMNS = [
    'temple_Ambaji', 'temple_Dwarka', 'temple_Pavagadh', 'temple_Somnath',
    'day_of_week', 'is_weekend', 'month', 'is_monsoon',
    'time_slot_Afternoon 10-1', 'time_slot_Evening 4-7', 'time_slot_Morning 6-9', 'time_slot_Night 8-11',
    'festival_multiplier', 'days_to_nearest_festival'
]

ensemble_model = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global ensemble_model
    init_db()
    script_dir = os.path.dirname(os.path.abspath(__file__))
    real_model_path = os.path.join(script_dir, 'ensemble_real.pkl')
    base_model_path = os.path.join(script_dir, 'ensemble_model.pkl')
    
    import glob
    timestamped_models = glob.glob(os.path.join(script_dir, 'ensemble_model_*.pkl'))
    
    if os.path.exists(real_model_path):
        model_path = real_model_path
    elif timestamped_models:
        model_path = sorted(timestamped_models)[-1]
    elif os.path.exists(base_model_path):
        model_path = base_model_path
    else:
        print("[INIT] Ensemble model not found. Executing initial training pipeline...")
        from train_models import train_and_evaluate
        train_and_evaluate()
        model_path = base_model_path

    # Register class shims so pickled ensemble models deserialize seamlessly
    import sys, types
    if 'train_models' not in sys.modules:
        _shim = types.ModuleType('train_models')
        _shim.EnsembleModel = EnsembleModel
        sys.modules['train_models'] = _shim
    if 'train_models_real' not in sys.modules:
        _shim2 = types.ModuleType('train_models_real')
        _shim2.EnsembleModel = EnsembleModel
        sys.modules['train_models_real'] = _shim2
    if 'train_master' not in sys.modules:
        _shim3 = types.ModuleType('train_master')
        _shim3.EnsembleModel = EnsembleModel
        sys.modules['train_master'] = _shim3
    if not hasattr(sys.modules['__main__'], 'EnsembleModel'):
        setattr(sys.modules['__main__'], 'EnsembleModel', EnsembleModel)

    with open(model_path, 'rb') as f:
        ensemble_model = pickle.load(f)
    print(f"[INIT] Loaded model from: {os.path.basename(model_path)}")

    # Start background ingestion scheduler (every 15 mins)
    start_ingestion_scheduler(interval_minutes=15)
    print("[OK] Loaded trained Ensemble model and initialized background telemetry ingestion.")
    yield

app = FastAPI(
    title="Nirvighna ML Crowd Prediction Microservice",
    description="CatBoost + LightGBM Ensemble AI Crowd & Risk Forecasting API with Ingestion, Drift Monitoring & Continuous Retraining",
    version="2.5.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request / Response Schemas
class PredictionRequest(BaseModel):
    temple: str = Field(..., json_schema_extra={"example": "Somnath"})
    date: str = Field(..., json_schema_extra={"example": "2026-09-26"})
    time_slot: str = Field(..., json_schema_extra={"example": "Evening 4-7"})

class GroundTruthFeedbackRequest(BaseModel):
    temple: str = Field(..., json_schema_extra={"example": "Somnath"})
    date: str = Field(..., json_schema_extra={"example": "2026-09-26"})
    time_slot: str = Field(..., json_schema_extra={"example": "Evening 4-7"})
    actual_footfall: int = Field(..., json_schema_extra={"example": 1180})
    user_id: str = Field("ground_staff", json_schema_extra={"example": "volunteer_vikram"})

class RollbackRequest(BaseModel):
    version_id: str = Field(..., json_schema_extra={"example": "ensemble_model_20260815_143000"})
    user_id: str = Field("admin", json_schema_extra={"example": "admin_user"})

# Endpoints

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "Nirvighna ML Crowd Predictor",
        "model_loaded": ensemble_model is not None,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/")
def root():
    return {
        "title": "Nirvighna Production ML Crowd Prediction System",
        "version": "2.5.0",
        "endpoints": {
            "health": "GET /health",
            "predict": "POST /predict",
            "feedback": "POST /feedback",
            "monitoring_stats": "GET /monitoring/stats",
            "retrain": "POST /retrain",
            "rollback": "POST /rollback",
            "audit_export": "GET /audit/export",
            "ingest_now": "POST /ingest"
        }
    }

@app.post("/predict")
def predict_footfall(request: PredictionRequest):
    """
    STEP 5 & 7: Computes features, evaluates Ensemble, determines risk level, and logs prediction.
    """
    if not ensemble_model:
        raise HTTPException(status_code=500, detail="Ensemble model not loaded.")

    temple_name = request.temple.strip()
    temple_map = {
        'somnath': 'Somnath', 'dwarka': 'Dwarka', 'ambaji': 'Ambaji', 'pavagadh': 'Pavagadh',
        'tmp_somnath': 'Somnath', 'tmp_dwarka': 'Dwarka', 'tmp_ambaji': 'Ambaji', 'tmp_pavagadh': 'Pavagadh'
    }
    normalized_temple = temple_map.get(temple_name.lower(), 'Somnath')

    slot_input = request.time_slot.strip()
    slot_map = {
        'morning': 'Morning 6-9', 'afternoon': 'Afternoon 10-1', 'evening': 'Evening 4-7', 'night': 'Night 8-11',
        'morning 6-9': 'Morning 6-9', 'afternoon 10-1': 'Afternoon 10-1', 'evening 4-7': 'Evening 4-7', 'night 8-11': 'Night 8-11'
    }
    normalized_slot = slot_map.get(slot_input.lower(), 'Morning 6-9')

    try:
        date_obj = datetime.strptime(request.date, '%Y-%m-%d')
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    day_of_week = date_obj.weekday()
    is_weekend = 1 if day_of_week in [5, 6] else 0
    month = date_obj.month
    is_monsoon = 1 if month in [7, 8, 9] else 0

    fest_multiplier, days_to_fest = get_festival_metadata(normalized_temple, date_obj)

    feature_dict = {col: 0 for col in FEATURE_COLUMNS}
    temple_col = f"temple_{normalized_temple}"
    if temple_col in feature_dict:
        feature_dict[temple_col] = 1

    slot_col = f"time_slot_{normalized_slot}"
    if slot_col in feature_dict:
        feature_dict[slot_col] = 1

    feature_dict['day_of_week'] = day_of_week
    feature_dict['is_weekend'] = is_weekend
    feature_dict['month'] = month
    feature_dict['is_monsoon'] = is_monsoon
    feature_dict['festival_multiplier'] = fest_multiplier
    feature_dict['days_to_nearest_festival'] = days_to_fest

    input_df = pd.DataFrame([feature_dict])[FEATURE_COLUMNS]

    raw_pred = ensemble_model.predict(input_df)[0]
    predicted_footfall = max(50, int(round(raw_pred)))

    capacity = TEMPLE_CAPACITIES.get(normalized_temple, 1200)
    risk_ratio = predicted_footfall / float(capacity)

    if risk_ratio < 0.6:
        risk_level = "LOW"
    elif 0.6 <= risk_ratio < 0.8:
        risk_level = "MEDIUM"
    elif 0.8 <= risk_ratio < 1.0:
        risk_level = "HIGH"
    else:
        risk_level = "CRITICAL"

    log_prediction(
        temple=normalized_temple,
        date_str=request.date,
        time_slot=normalized_slot,
        predicted_footfall=predicted_footfall,
        risk_level=risk_level
    )

    return {
        "predicted_footfall": predicted_footfall,
        "risk_level": risk_level,
        "capacity": capacity,
        "risk_ratio": round(risk_ratio, 3),
        "festival_multiplier": fest_multiplier,
        "days_to_nearest_festival": days_to_fest,
        "temple": normalized_temple,
        "date": request.date,
        "time_slot": normalized_slot
    }

@app.post("/feedback")
def submit_ground_truth_feedback(request: GroundTruthFeedbackRequest):
    """
    STEP 13: Allows staff to submit ground truth footfall for a slot (source='manual').
    Used in feedback loop for model retraining.
    """
    success = record_actual_footfall(
        temple=request.temple,
        date_str=request.date,
        time_slot=request.time_slot,
        footfall_count=request.actual_footfall,
        source="manual",
        user_id=request.user_id
    )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to record ground truth feedback.")

    # Re-evaluate monitoring metrics
    run_daily_monitoring()

    return {
        "status": "success",
        "message": f"Ground truth feedback recorded for {request.temple} on {request.date} ({request.time_slot}): {request.actual_footfall}",
        "source": "manual",
        "submitted_by": request.user_id
    }

@app.get("/monitoring/stats")
def get_monitoring_statistics():
    """
    STEP 10 & STEP 12: Returns active model details, training stats, rolling MAE/MAPE, drift status, and data coverage.
    """
    conn, _ = get_connection()
    df_ver = pd.read_sql_query('''
        SELECT version_id, trained_at, train_data_size, real_data_count, synthetic_data_count, test_mae, test_mape, test_r2
        FROM model_versions
        WHERE is_active = 1 OR is_active = TRUE
        ORDER BY id DESC LIMIT 1
    ''', conn)
    conn.close()

    summary = get_monitoring_summary()

    active_ver = df_ver.iloc[0].to_dict() if not df_ver.empty else {
        "version_id": "ensemble_model_v2_baseline",
        "trained_at": datetime.now().isoformat(),
        "train_data_size": 11696,
        "real_data_count": 0,
        "synthetic_data_count": 11696,
        "test_mae": 44.39,
        "test_mape": 4.09,
        "test_r2": 0.9911
    }

    return {
        "active_model_version": active_ver["version_id"],
        "last_retrained_at": active_ver["trained_at"],
        "total_train_size": active_ver["train_data_size"],
        "real_data_count": active_ver["real_data_count"],
        "synthetic_data_count": active_ver["synthetic_data_count"],
        "baseline_test_mae": active_ver["test_mae"],
        "baseline_test_r2": active_ver["test_r2"],
        "rolling_7d_mae": summary["rolling_7d_mae"],
        "rolling_7d_mape": summary["rolling_7d_mape"],
        "is_drift_detected": summary["is_drift"],
        "data_coverage_percent": summary["data_coverage_percent"],
        "recent_evaluations": summary["recent_evaluations"]
    }

@app.post("/retrain")
def trigger_retraining(user_id: str = "admin"):
    """
    STEP 11 & STEP 12: Admin trigger to execute automated retraining pipeline.
    """
    global ensemble_model
    result = execute_retraining_pipeline(user_id=user_id)

    # Reload active ensemble model
    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(script_dir, 'ensemble_model.pkl')
    with open(model_path, 'rb') as f:
        ensemble_model = pickle.load(f)

    return result

@app.post("/rollback")
def rollback_model(request: RollbackRequest):
    """
    STEP 11: Rollback active model to a previous version artifact.
    """
    global ensemble_model
    result = rollback_to_version(request.version_id, user_id=request.user_id)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(script_dir, 'ensemble_model.pkl')
    with open(model_path, 'rb') as f:
        ensemble_model = pickle.load(f)

    return result

@app.post("/ingest")
def trigger_data_ingestion():
    """
    STEP 9: Trigger immediate telemetry ingestion cycle across all 4 shrines.
    """
    run_ingestion_job()
    return {"status": "success", "message": "Telemetry ingestion run completed."}

@app.get("/audit/export")
def export_dpdp_audit_logs(format: str = Query("json", enum=["json", "csv"])):
    """
    STEP 14: DPDP Act 2023 compliance audit log export endpoint for regulators.
    """
    data = export_audit_logs(format_type=format)
    if format == "csv":
        return PlainTextResponse(data, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=nirvighna_audit_logs.csv"})
    else:
        return JSONResponse(data)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
