#!/usr/bin/env bash

# Nirvighna Production ML Microservice Startup Script
set -e

echo "=========================================================================="
echo "🛕 Starting Nirvighna ML Crowd Prediction & Continuous Retraining System"
echo "=========================================================================="

# Check Python version
python3 --version || python --version

# Step 1: Install Dependencies
echo "[1/4] Installing Python requirements..."
pip install -q -r requirements.txt

# Step 2: Generate Initial Synthetic Dataset if not present
if [ ! -f "temple_footfall_synthetic.csv" ]; then
    echo "[2/4] Generating initial 2-year synthetic telemetry dataset..."
    python generate_synthetic_data.py
else
    echo "[2/4] Synthetic telemetry dataset exists."
fi

# Step 3: Train Initial Model Pipeline if not present
if [ ! -f "ensemble_model.pkl" ]; then
    echo "[3/4] Training CatBoost + LightGBM Ensemble AI Model..."
    python train_models.py
else
    echo "[3/4] Active Ensemble model artifact found."
fi

# Step 4: Launch FastAPI Microservice
echo "[4/4] Launching FastAPI prediction microservice on http://localhost:8000..."
uvicorn prediction_service:app --host 0.0.0.0 --port 8000
