# 🛕 Nirvighna ML Crowd Prediction & Self-Improving Lifecycle Microservice

Production-ready, self-improving machine learning crowd prediction system for the **Nirvighna** temple management platform. Powered by a **CatBoost + LightGBM Ensemble AI Model** with real-time telemetry ingestion, daily concept drift monitoring, automated retraining, DPDP Act 2023 compliance auditing, and Docker containerization.

---

## 📌 Architecture & 15-Step Pipeline Overview

```
 ┌────────────────────────────────┐       ┌────────────────────────────────┐
 │ Step 1: Telemetry Dataset      │       │ Steps 2-4: Model Training      │
 │ generate_synthetic_data.py     │ ────> │ train_models.py                │
 │ ~2 years (2024-2025) telemetry │       │ CatBoost + LightGBM Ensemble   │
 └────────────────────────────────┘       └───────────────┬────────────────┘
                                                          │ Saves ensemble_model.pkl
                                                          ▼
 ┌────────────────────────────────┐       ┌────────────────────────────────┐
 │ Step 9: Ingestion Pipeline     │       │ Step 5, 13, 14: FastAPI        │
 │ data_ingestion.py              │ ────> │ prediction_service.py          │
 │ Gate, CCTV, Booking, Manual    │       │ POST /predict, POST /feedback  │
 └────────────────────────────────┘       └───────────────┬────────────────┘
                                                          │
             ┌────────────────────────────────────────────┴───────────────────────────┐
             ▼                                                                        ▼
 ┌────────────────────────────────┐                               ┌────────────────────────────────┐
 │ Step 10: Drift Monitoring      │                               │ Step 12: Command Centre UI     │
 │ monitor_model.py               │ ─── (Triggers Drift Alert) ──>│ MLPerformanceTab.jsx           │
 │ 7-day MAE > 1.25x baseline     │                               │ Live Metrics, Retrain Button   │
 └───────────────┬────────────────┘                               └────────────────────────────────┘
                 │
                 ▼
 ┌────────────────────────────────┐       ┌────────────────────────────────┐
 │ Step 11: Retraining Engine     │       │ Step 15: Containerization      │
 │ retraining.py                  │ ────> │ Dockerfile & docker-compose    │
 │ Oversamples real rows 3x       │       │ start.sh local script          │
 └────────────────────────────────┘       └────────────────────────────────┘
```

---

## 🚀 Steps 9 to 15 Feature Details

### 1. Step 9: Real-time Telemetry Ingestion (`data_ingestion.py`)
- Background task (APScheduler / thread timer) running every 15 minutes.
- Aggregates footfall across 4 sources with deduplication priority:
  `gate_scan > cctv > booking > manual`.
- Stores raw counts in `actual_footfall` table and updates `prediction_logs`.

### 2. Step 10: Drift Detection & Monitoring (`monitor_model.py`)
- Compares `predicted_footfall` vs `actual_footfall` for all completed time slots.
- Calculates daily & rolling 7-day MAE and MAPE.
- If 7-day rolling MAE increases by **>25%** over baseline test set MAE (44.39), fires `"DRIFT DETECTED"` alert via log, UI notification, and optional webhook (`WEBHOOK_URL`).

### 3. Step 11: Automated Retraining Pipeline (`retraining.py`)
- Triggered manually or automatically upon concept drift detection.
- Loads ground truth rows from `actual_footfall` table and **oversamples real data 3x** over baseline data.
- Retrains CatBoost and LightGBM regressors.
- Versions model artifacts with timestamp (`ensemble_model_YYYYMMDD_HHMMSS.pkl`) and maintains pointer to active model.
- Supports instant version rollback (`POST /rollback`).

### 4. Step 12: Command Centre Performance Dashboard (`MLPerformanceTab.jsx`)
- Active Model Version, Last Retrained Date, Total Training Telemetry Count (Real vs Synthetic).
- Live 7-Day Rolling MAE & MAPE, Drift Status badge (`HEALTHY` vs `DRIFT DETECTED`).
- Time-Slot Data Coverage % progress bar.
- Interactive Predicted vs Actual footfall comparison table.
- "Retrain Now" button & "Log Staff Ground Truth" feedback form.

### 5. Step 13: Ground Truth Feedback Loop (`POST /feedback`)
- Staff endpoint to submit ground truth footfall for any slot when hardware scanners are offline.
- Recorded as `source='manual'` and heavily weighted (3x) in subsequent retraining runs.

### 6. Step 14: DPDP Act 2023 Compliance & Audit Logging (`prediction_logger.py`)
- Zero PII stored (names, Aadhaar, phone numbers excluded).
- Encrypted audit logging for all predictions, ground truth feedback, retraining, and rollbacks in `audit_logs` table.
- Regulator Export endpoint `GET /audit/export?format=csv`.

### 7. Step 15: Containerization & Deployment (`Dockerfile`, `docker-compose.yml`, `start.sh`)
- Dockerized service with Python 3.11-slim, libgomp1, Uvicorn, and health check.
- Docker Compose setup linking `ml-service` with `postgres-db`.
- Portable `start.sh` for one-command local execution.

---

## 🏃 Local Execution & API Reference

### Run Locally:
```bash
# Executable startup script
bash backend/ml_engine/start.sh

# Or start microservice directly
python backend/ml_engine/prediction_service.py
```

### Docker Compose Deployment:
```bash
docker-compose up -d --build
```

### Microservice Endpoints (`http://localhost:8000`):
- `GET /health`: Microservice health check
- `POST /predict`: Predict footfall & risk level
- `POST /feedback`: Log staff manual ground truth count
- `GET /monitoring/stats`: Get 7-day rolling MAE/MAPE & drift status
- `POST /retrain`: Execute model retraining pipeline
- `POST /rollback`: Rollback to previous model version
- `POST /ingest`: Run telemetry ingestion job
- `GET /audit/export?format=csv`: Download DPDP audit log CSV
