import os
import sys
import subprocess
import time
import urllib.request
import webbrowser
import threading

# Ensure UTF-8 output on Windows console
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

PORTS = [3000, 3001, 8000]

# Model URLs
YUNET_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"


def free_port_windows(port):
    """Frees a specific port on Windows by killing the listening process."""
    try:
        cmd = f'powershell -Command "Get-NetTCPConnection -LocalPort {port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique"'
        res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        pids = res.stdout.strip().split()
        for pid in pids:
            if pid and pid.isdigit() and int(pid) > 0:
                subprocess.run(f"taskkill /F /PID {pid}", shell=True, capture_output=True)
    except Exception:
        pass


def free_all_ports():
    """Frees all Nirvighna service ports to prevent bind collisions."""
    print("\n[PORT CHECK] Ensuring ports 3000, 3001 and 8000 are free...")
    if sys.platform.startswith('win'):
        for p in PORTS:
            free_port_windows(p)
    else:
        for p in PORTS:
            subprocess.run(f"fuser -k {p}/tcp", shell=True, capture_output=True)
    time.sleep(1)


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


def check_models(root_dir):
    """Ensures YOLO weights + YuNet + ArcFace exist; reports trained model status."""
    backend_dir = os.path.join(root_dir, "backend")
    trained = os.path.join(backend_dir, "drishti_person.pt")
    if os.path.exists(trained):
        print("[OK] Fine-tuned model found: backend/drishti_person.pt (Drishti AI will use this)")
    else:
        for name in ("yolov8s.pt", "yolov8n.pt"):
            target = os.path.join(backend_dir, name)
            if os.path.exists(target):
                print(f"[OK] Base weights found: {name}")
                break
        else:
            print("\n[DOWNLOAD] Downloading YOLOv8s weights (~22MB)...")
            url = "https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov8s.pt"
            try:
                urllib.request.urlretrieve(url, os.path.join(backend_dir, "yolov8s.pt"))
                print("[OK] Downloaded yolov8s.pt")
            except Exception as e:
                print(f"[WARN] Failed to auto-download YOLO weights: {e}")

    # YuNet face detector
    yunet_path = os.path.join(backend_dir, "face_detection_yunet_2023mar.onnx")
    if not os.path.exists(yunet_path):
        print("\n[DOWNLOAD] Downloading YuNet face detector (~2MB)...")
        try:
            urllib.request.urlretrieve(YUNET_URL, yunet_path)
            print("[OK] Downloaded YuNet face detector")
        except Exception as e:
            print(f"[WARN] Failed to download YuNet: {e}")
    else:
        print("[OK] YuNet face detector found")

    # ArcFace model (will auto-download on first run via insightface)
    print("[INFO] ArcFace model will auto-download on first run (~166MB) if missing")


def wait_for_service(url, name, max_retries=20, delay=1):
    """Polls a service URL until it responds or times out."""
    for _ in range(max_retries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'NirvighnaLauncher/1.0'})
            with urllib.request.urlopen(req, timeout=1.5) as res:
                if res.status in (200, 301, 302, 304, 404):
                    return True
        except Exception:
            pass
        time.sleep(delay)
    return False


def open_browser_later(url, delay_sec):
    """Opens a URL after a delay without blocking the main loop."""
    def worker():
        time.sleep(delay_sec)
        try:
            webbrowser.open(url)
        except Exception:
            pass
    import threading
    threading.Thread(target=worker, daemon=True).start()


def main():
    root_dir = os.path.abspath(os.path.dirname(__file__))
    os.chdir(root_dir)

    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"

    print("=" * 78)
    print(" 🛕 [NIRVIGHNA] — MASTER LAUNCHER | PILGRIM + VOLUNTEER + ADMIN + DRISHTI AI")
    print("=" * 78)

    # 0. Free busy ports
    free_all_ports()

    # 1. Python dependencies (backend)
    print("\n[STEP 1/3] Checking Python AI dependencies...")
    req_file = os.path.join(root_dir, "backend", "requirements.txt")
    if os.path.exists(req_file):
        run_command(f'"{sys.executable}" -m pip install -q -r "{req_file}"', description="Backend Requirements")

    # 2. Node dependencies
    node_modules = os.path.join(root_dir, "node_modules")
    if not os.path.exists(node_modules):
        print("\n[STEP 2/3] Installing frontend dependencies (npm install)...")
        run_command(f"{npm_cmd} install", cwd=root_dir, description="NPM Package Installation")
    else:
        print("\n[STEP 2/3] [OK] Frontend packages verified.")

    # 3. Model weights
    print("\n[STEP 3/3] Checking Drishti AI models...")
    check_models(root_dir)

    # Launch all services simultaneously
    print("\n[LAUNCH] Starting ALL Nirvighna services...")

    processes = []
    use_shell = sys.platform.startswith('win')

    # Prepare env with Kaggle key
    env = os.environ.copy()
    env["PYTHONPATH"] = os.path.join(root_dir, "backend")
    env["KAGGLE_KEY"] = "KGAT_a99c21687c698371e452e1779740016b"

    # Service 1: Drishti AI Vision & Audio Backend (Port 8000) - NEW ai_service with Face Detection + Re-ID
    print("  [1/4] Drishti AI Backend (Face Detection + Re-ID) -> http://127.0.0.1:8000")
    p1 = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "ai_service:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=os.path.join(root_dir, "backend"), shell=use_shell, env=env,
    )
    processes.append(("Drishti AI Backend (8000)", p1))

    # Service 2: Unified Web Portal — Pilgrim + Volunteer Hub + Command Centre (Port 3000)
    print("  [2/4] Unified Portal: Pilgrim + /v/* Volunteer + /command-centre Admin -> http://localhost:3000")
    p2 = subprocess.Popen(f"{npm_cmd} run dev", cwd=root_dir, shell=True, env=env)
    processes.append(("Unified Web Portal (3000)", p2))

    # Service 3: Dedicated Volunteer Android-style App (Port 3001)
    print("  [3/4] Dedicated Volunteer App -> http://localhost:3001")
    p3 = subprocess.Popen(f"{npm_cmd} run dev -- --config vite.volunteer.config.js", cwd=root_dir, shell=True, env=env)
    processes.append(("Volunteer App (3001)", p3))

    # Service 4: Drishti AI Face Detection Training (optional - only if you want to train)
    # Skipped by default - run manually: python backend/train_drishti_face.py

    # Health checks
    print("\n[HEALTH CHECK] Waiting for all services to initialize...")
    ok1 = wait_for_service("http://127.0.0.1:8000/health", "Drishti AI", max_retries=30)
    ok2 = wait_for_service("http://localhost:3000", "Unified Portal", max_retries=40)
    ok3 = wait_for_service("http://localhost:3001", "Volunteer App", max_retries=40)

    print(f"  • Drishti AI Backend   : {'🟢 ONLINE' if ok1 else '🟡 STARTING'} (Face Detection + Re-ID)")
    print(f"  • Unified Web Portal   : {'🟢 ONLINE' if ok2 else '🟡 STARTING'}")
    print(f"  • Volunteer App        : {'🟢 ONLINE' if ok3 else '🟡 STARTING'}")

    print("\n" + "=" * 78)
    print(" 🎉 NIRVIGHNA FULL STACK IS LIVE — SAARE PORTALS EK SAATH!")
    print("=" * 78)
    print("  🔱 PILGRIM PORTAL      : http://localhost:3000/home")
    print("  🛡️ VOLUNTEER HUB       : http://localhost:3000/v/login")
    print("  📱 VOLUNTEER APP       : http://localhost:3001/#/v/login")
    print("  🛰️ COMMAND CENTRE      : http://localhost:3000/command-centre")
    print("        Staff Login      : http://localhost:3000/command-centre/login")
    print("  👁️ DRISHTI AI API      : http://127.0.0.1:8000/docs (Swagger UI)")
    print("        Health Check     : http://127.0.0.1:8000/health")
    print("        Face Detection   : POST http://127.0.0.1:8000/detect_faces")
    print("        Re-ID Search     : POST http://127.0.0.1:8000/upload_face")
    print("        Enroll Face      : POST http://127.0.0.1:8000/enroll_face")
    print("        WebSocket        : ws://127.0.0.1:8000/ws")
    print("=" * 78)
    print(" 💡 Ctrl+C dabao to saare services cleanly band ho jayenge.")
    print("=" * 78 + "\n")

    # Auto-open all portals in browser tabs (staggered)
    if ok2:
        open_browser_later("http://localhost:3000/home", 2)
        open_browser_later("http://localhost:3000/command-centre/login", 5)
        open_browser_later("http://localhost:3000/command-centre/drishti_ai", 8)
    if ok3:
        open_browser_later("http://localhost:3001/#/v/login", 11)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\nStopping all Nirvighna services...")
        for name, proc in processes:
            try:
                if sys.platform.startswith('win'):
                    subprocess.run(f"taskkill /F /T /PID {proc.pid}", shell=True, capture_output=True)
                else:
                    proc.terminate()
                print(f"  • Stopped {name}")
            except Exception:
                pass
        free_all_ports()
        print("All services stopped cleanly.")
        sys.exit(0)


if __name__ == "__main__":
    main()
