#!/usr/bin/env python3
"""
Drishti AI - Unified Launcher
Starts backend (FastAPI) + frontend (Vite) + verifies models
Single command: python launch_drishti.py
"""
import os
import sys
import subprocess
import time
import signal
import threading
import webbrowser
from pathlib import Path

ROOT = Path(__file__).parent.resolve()
# Since script is in C:\SVH\Kavach, Kavach dir is ROOT
BACKEND_DIR = ROOT / "backend"
FRONTEND_DIR = ROOT

# Colors for output
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
CYAN = "\033[96m"
RESET = "\033[0m"
BOLD = "\033[1m"

processes = []

def log(msg, color=CYAN):
    print(f"{color}{msg}{RESET}")

def run_cmd(cmd, cwd=None, shell=True):
    """Run command and return process"""
    return subprocess.Popen(cmd, cwd=cwd or ROOT, shell=shell,
                           stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                           universal_newlines=True, bufsize=1)

def stream_output(proc, prefix, color):
    """Stream process output with prefix"""
    for line in proc.stdout:
        print(f"{color}[{prefix}]{RESET} {line.rstrip()}")

def check_models():
    """Verify/download required models"""
    models = {
        "face_detection_yunet_2023mar.onnx": 
            "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx",
    }
    
    for name, url in models.items():
        path = BACKEND_DIR / name
        if not path.exists():
            log(f"Downloading {name}...", YELLOW)
            try:
                import urllib.request
                urllib.request.urlretrieve(url, path)
                log(f"  Downloaded: {path}", GREEN)
            except Exception as e:
                log(f"  Failed: {e}", RED)
                return False
        else:
            log(f"Model found: {name}", GREEN)
    return True

def install_deps():
    """Install Python dependencies"""
    req_file = BACKEND_DIR / "requirements.txt"
    if req_file.exists():
        log("Installing Python dependencies...", YELLOW)
        result = subprocess.run([sys.executable, "-m", "pip", "install", "-q", "-r", str(req_file)],
                              capture_output=True, text=True, cwd=BACKEND_DIR)
        if result.returncode == 0:
            log("Dependencies installed", GREEN)
        else:
            log(f"Warning: {result.stderr[:200]}", YELLOW)

def build_frontend():
    """Build frontend if dist doesn't exist"""
    dist_dir = FRONTEND_DIR / "dist"
    if not dist_dir.exists():
        log("Building frontend (first run)...", YELLOW)
        result = subprocess.run("npm run build", shell=True, cwd=FRONTEND_DIR,
                              capture_output=True, text=True)
        if result.returncode == 0:
            log("Frontend built", GREEN)
        else:
            log(f"Build failed: {result.stderr[:300]}", RED)
            return False
    return True

def start_backend():
    """Start FastAPI backend"""
    env = os.environ.copy()
    env["PYTHONPATH"] = str(BACKEND_DIR)
    env["KAGGLE_KEY"] = "KGAT_a99c21687c698371e452e1779740016b"
    
    proc = subprocess.Popen(
        [sys.executable, "ai_service.py"],
        cwd=BACKEND_DIR,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True,
        bufsize=1
    )
    processes.append(("Backend", proc, GREEN))
    return proc

def start_frontend():
    """Start Vite dev server"""
    proc = subprocess.Popen(
        "npm run dev",
        cwd=FRONTEND_DIR,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True,
        bufsize=1
    )
    processes.append(("Frontend", proc, CYAN))
    return proc

def wait_for_health(max_wait=30):
    """Wait for backend health endpoint"""
    import requests
    for i in range(max_wait):
        try:
            r = requests.get("http://localhost:8000/health", timeout=2)
            if r.status_code == 200:
                return True
        except:
            pass
        time.sleep(1)
    return False

def signal_handler(sig, frame):
    log("\nShutting down...", YELLOW)
    for name, proc, _ in processes:
        log(f"Stopping {name}...", YELLOW)
        proc.terminate()
    sys.exit(0)

def main():
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print(f"""
{BOLD}{CYAN}============================================
    DRISHTI AI - UNIFIED LAUNCHER
    Face Detection + Re-ID + Crowd Management
============================================{RESET}
""")
    
    # Setup
    log("Checking models...", YELLOW)
    if not check_models():
        log("Model download failed", RED)
        return 1
    
    install_deps()
    
    if not build_frontend():
        return 1
    
    # Start services
    log("\nStarting Backend (FastAPI on :8000)...", YELLOW)
    backend_proc = start_backend()
    
    # Stream backend output in background
    threading.Thread(target=stream_output, args=(backend_proc, "BACKEND", GREEN), daemon=True).start()
    
    # Wait for health
    log("Waiting for backend health...", YELLOW)
    if wait_for_health(30):
        log("Backend healthy!", GREEN)
    else:
        log("Backend health check timeout", RED)
    
    log("\nStarting Frontend (Vite on :5173)...", YELLOW)
    frontend_proc = start_frontend()
    threading.Thread(target=stream_output, args=(frontend_proc, "FRONTEND", CYAN), daemon=True).start()
    
    time.sleep(3)
    
    print(f"""
{BOLD}{GREEN}============================================
    DRISHTI AI RUNNING
============================================{RESET}
{CYAN}Backend API:{RESET}     http://localhost:8000
{CYAN}API Docs:{RESET}        http://localhost:8000/docs
{CYAN}Health Check:{RESET}    http://localhost:8000/health
{CYAN}Frontend:{RESET}        http://localhost:5173
{CYAN}DrishtiAI Dashboard:{RESET} http://localhost:5173/command-centre/drishti_ai

{BOLD}Features:{RESET}
  - YuNet Face Detection (real-time)
  - ArcFace Embeddings (ONNX, 512-dim)
  - FAISS Vector Search (Re-ID)
  - Enroll / Search Lost Persons
  - Live CCTV WebSocket Telemetry
  - DPDP Act 2023 Compliant Audit

Press {BOLD}Ctrl+C{RESET} to stop all services
""")
    
    # Open browser
    try:
        webbrowser.open("http://localhost:5173/command-centre/drishti_ai")
    except:
        pass
    
    # Keep alive
    try:
        while True:
            time.sleep(1)
            # Check if processes died
            for name, proc, _ in processes:
                if proc.poll() is not None:
                    log(f"{name} process died!", RED)
    except KeyboardInterrupt:
        pass
    finally:
        signal_handler(None, None)

if __name__ == "__main__":
    sys.exit(main())