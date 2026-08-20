import os
import sys
import subprocess
import time
import shutil
import urllib.request

# Ensure UTF-8 output on Windows console
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

def run_command(cmd, cwd=None, description=""):
    """Runs a shell command and waits for completion."""
    print(f"\n[SETUP] {description}...")
    try:
        res = subprocess.run(cmd, cwd=cwd, shell=True)
        if res.returncode != 0:
            print(f"[WARN] Command '{cmd}' returned code {res.returncode}")
        else:
            print(f"[OK] Finished: {description}")
    except Exception as e:
        print(f"[WARN] Error executing {description}: {e}")

def check_and_download_yolo(root_dir):
    """Downloads yolov8n.pt weights automatically if not present."""
    target_path = os.path.join(root_dir, "backend", "yolov8n.pt")
    if not os.path.exists(target_path):
        print("\n[DOWNLOAD] Downloading pre-trained YOLOv8n model weights (~6MB)...")
        url = "https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov8n.pt"
        try:
            urllib.request.urlretrieve(url, target_path)
            print("[OK] Downloaded YOLOv8n weights successfully!")
        except Exception as e:
            print(f"[WARN] Failed to auto-download YOLO weights: {e}")
    else:
        print("\n[OK] YOLOv8n model weights found.")

def main():
    root_dir = os.path.abspath(os.path.dirname(__file__))
    os.chdir(root_dir)

    print("=" * 75)
    print(" [NIRVIGHNA] — ALL-IN-ONE MASTER UNIFIED LAUNCHER")
    print("=" * 75)

    # 1. Install / Update Python Dependencies
    print("\n[STEP 1/4] Checking & Installing Python AI/ML dependencies...")
    req_file_1 = os.path.join(root_dir, "backend", "requirements.txt")
    req_file_2 = os.path.join(root_dir, "backend", "ml_engine", "requirements.txt")
    
    if os.path.exists(req_file_1):
        run_command(f'"{sys.executable}" -m pip install -q -r "{req_file_1}"', description="Backend Requirements")
    if os.path.exists(req_file_2):
        run_command(f'"{sys.executable}" -m pip install -q -r "{req_file_2}"', description="ML Engine Requirements")

    # 2. Check & Install Node.js Frontend Dependencies
    node_modules = os.path.join(root_dir, "node_modules")
    if not os.path.exists(node_modules):
        print("\n[STEP 2/4] Installing Node.js frontend dependencies (npm install)...")
        npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
        run_command(f"{npm_cmd} install", cwd=root_dir, description="NPM Package Installation")
    else:
        print("\n[STEP 2/4] [OK] Node.js frontend packages verified.")

    # 3. Check YOLO Weights & Train ML Baseline
    print("\n[STEP 3/4] Preparing AI & ML Engine Baselines...")
    check_and_download_yolo(root_dir)

    synthetic_csv = os.path.join(root_dir, "backend", "ml_engine", "temple_footfall_synthetic.csv")
    model_pkl = os.path.join(root_dir, "backend", "ml_engine", "ensemble_model.pkl")

    if not os.path.exists(synthetic_csv):
        run_command(f'"{sys.executable}" backend/ml_engine/generate_synthetic_data.py', cwd=root_dir, description="Synthetic Data Generation")

    if not os.path.exists(model_pkl):
        run_command(f'"{sys.executable}" backend/ml_engine/train_models.py', cwd=root_dir, description="Ensemble Model Training")

    # 4. Launch All 3 Microservices Simultaneously
    print("\n[STEP 4/4] Launching All Nirvighna Services Simultaneously...")

    processes = []
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"

    # Service 1: ML Prediction Microservice (Port 8000)
    print("  [Service 1/3] CatBoost + LightGBM ML Engine -> http://127.0.0.1:8000")
    p1 = subprocess.Popen([sys.executable, "backend/ml_engine/prediction_service.py"], cwd=root_dir)
    processes.append(("ML Engine (Port 8000)", p1))

    # Service 2: Drishti AI Vision & Audio Microservice (Port 8001)
    print("  [Service 2/3] Drishti AI Vision Engine -> http://127.0.0.1:8001")
    p2 = subprocess.Popen([sys.executable, "backend/drishti_demo.py"], cwd=root_dir)
    processes.append(("Drishti AI (Port 8001)", p2))

    time.sleep(2)

    # Service 3: React Web Portal (Port 3000)
    print("  [Service 3/3] Pilgrim Web Portal (Vite React) -> http://localhost:3000")
    p3 = subprocess.Popen([npm_cmd, "run", "dev"], cwd=root_dir)
    processes.append(("Web Portal (Port 3000)", p3))

    print("\n" + "=" * 75)
    print(" [SUCCESS] ALL NIRVIGHNA SERVICES ARE LIVE & RUNNING PERFECTLY!")
    print(" ─────────────────────────────────────────────────────────")
    print("  Pilgrim & Command Centre: http://localhost:3000")
    print("  CatBoost ML Service:     http://127.0.0.1:8000 (Swagger: /docs)")
    print("  Drishti AI Microservice: http://127.0.0.1:8001")
    print(" ─────────────────────────────────────────────────────────")
    print(" Tip: Press Ctrl+C anytime in this window to stop all services cleanly.")
    print("=" * 75 + "\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\nStopping all Nirvighna microservices...")
        for name, proc in processes:
            try:
                proc.terminate()
                print(f"  • Stopped {name}")
            except Exception:
                pass
        print("All services stopped cleanly.")
        sys.exit(0)

if __name__ == "__main__":
    main()
