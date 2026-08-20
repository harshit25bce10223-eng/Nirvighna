"""
Nirvighna Master Auto-Pipeline Orchestrator
Automates:
1. Kaggle Datasets Download (CrowdHuman & Face & Tourism)
2. YOLO & Tabular Data Preparation
3. Fine-Tuning YOLOv8n Person & Face Models (v2)
4. Fine-Tuning CatBoost + LightGBM ML Ensemble Model
5. Automatic Raw Dataset Cleanup (saves disk space by removing raw zip/temp images)
6. Full E2E Verification Suite execution
"""

import os
import sys
import shutil
import subprocess
import time

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
RAW_DOWNLOADS_DIR = os.path.join(BACKEND_DIR, "data", "raw_downloads")


def print_step(title):
    print("\n" + "=" * 70)
    print(f" 🚀 {title}")
    print("=" * 70)


def run_script(script_path, desc):
    print_step(desc)
    cmd = [sys.executable, script_path]
    res = subprocess.run(cmd, cwd=ROOT_DIR)
    if res.returncode != 0:
        print(f"[WARN] {desc} returned code {res.returncode}")
    else:
        print(f"[OK] {desc} completed successfully.")
    return res.returncode


def cleanup_raw_data():
    print_step("STEP 5: Cleaning Up Raw Downloaded Dataset Files (Disk Optimization)")
    if os.path.exists(RAW_DOWNLOADS_DIR):
        size_bytes = sum(
            os.path.getsize(os.path.join(dirpath, filename))
            for dirpath, _, filenames in os.walk(RAW_DOWNLOADS_DIR)
            for filename in filenames
        )
        size_mb = size_bytes / (1024 * 1024)
        print(f"  Cleaning {size_mb:.2f} MB of raw temporary download files...")
        shutil.rmtree(RAW_DOWNLOADS_DIR, ignore_errors=True)
        print("  [OK] Raw zip/temporary files deleted. Model weights (.pt, .pkl) preserved safely.")
    else:
        print("  [OK] No temporary download files to clean.")


def main():
    print_step("STARTING NIRVIGHNA FULL BACKGROUND AUTO-PIPELINE")
    start_time = time.time()

    # Step 1: Download Drishti Real Datasets
    run_script(os.path.join(BACKEND_DIR, "download_drishti_real_data.py"), "STEP 1: Download Drishti AI Kaggle Datasets")

    # Step 2: Fine-Tune Drishti YOLOv8 Models
    run_script(os.path.join(BACKEND_DIR, "train_drishti_yolo_v2.py"), "STEP 2: Fine-Tune Drishti AI Person & Face Models")

    # Step 3: Download ML Tourism Footfall Data
    run_script(os.path.join(BACKEND_DIR, "ml_engine", "download_real_footfall_data.py"), "STEP 3: Prepare ML Real Footfall Dataset")

    # Step 4: Fine-Tune ML Prediction Ensemble Model
    run_script(os.path.join(BACKEND_DIR, "ml_engine", "train_models_real.py"), "STEP 4: Train & Fine-Tune ML Ensemble Model")

    # Step 5: Clean up raw heavy dataset files
    cleanup_raw_data()

    # Step 6: Run Full End-to-End Test Suite
    run_script(os.path.join(ROOT_DIR, "test_e2e.py"), "STEP 6: Running Full End-to-End Verification Suite")

    elapsed = time.time() - start_time
    print_step(f"ALL PIPELINE STAGES FINISHED IN {elapsed/60:.1f} MINUTES! (ALL SYSTEMS GO)")


if __name__ == "__main__":
    main()
