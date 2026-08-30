import os
import sys
import subprocess
import time
import shutil
import urllib.request
import webbrowser

# Ensure UTF-8 output on Windows console
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

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
    """Frees all Nirvighna service ports (3000, 8000, 8001) to prevent bind collisions."""
    print("\n[PORT CHECK] Ensuring ports 3000, 8000, and 8001 are free...")
    if sys.platform.startswith('win'):
        for p in [3000, 8000, 8001]:
            free_port_windows(p)
    else:
        for p in [3000, 8000, 8001]:
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
        print("[OK] YOLOv8n model weights found.")

def wait_for_service(url, name, max_retries=20, delay=1):
    """Polls a service URL until it responds with HTTP 200/300/400 or timeout."""
    for i in range(max_retries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'NirvighnaLauncher/1.0'})
            with urllib.request.urlopen(req, timeout=1.5) as res:
                if res.status in (200, 301, 302, 304, 404):
                    return True
        except Exception:
            pass
        time.sleep(delay)
    return False

def main():
    root_dir = os.path.abspath(os.path.dirname(__file__))
    os.chdir(root_dir)

    print("=" * 78)
    print(" 🛕 [NIRVIGHNA] — ALL-IN-ONE MASTER UNIFIED LAUNCHER")
    print("=" * 78)

    # 0. Free busy ports
    free_all_ports()

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
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    if not os.path.exists(node_modules):
        print("\n[STEP 2/4] Installing Node.js frontend dependencies (npm install)...")
        run_command(f"{npm_cmd} install", cwd=root_dir, description="NPM Package Installation")
    else:
        print("\n[STEP 2/4] [OK] Node.js frontend packages verified.")

    # 3. Check YOLO Weights
    print("\n[STEP 3/4] Checking AI model weights...")
    check_and_download_yolo(root_dir)


    # 4. Launch All Microservices Simultaneously
    print("\n[STEP 4/4] Launching All Nirvighna Portals & Microservices Simultaneously...")

    processes = []
    use_shell = sys.platform.startswith('win')

    # Service 1: Drishti AI Vision & WebSocket Backend (Port 8001)
    drishti_backend = os.path.join(root_dir, "backend", "app.py")
    if os.path.exists(drishti_backend):
        print("  [1/2] Starting Drishti AI Vision Backend -> http://127.0.0.1:8001")
        p1 = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8001", "--reload"],
            cwd=os.path.join(root_dir, "backend"),
            shell=use_shell
        )
        processes.append(("Drishti AI (Port 8001)", p1))
    else:
        print("  [SKIP] Drishti AI backend not found — Drishti panel will show offline demo mode.")
        p1 = None

    # Service 2: React Web Portal (Port 3000)
    print("  [2/2] Starting React Web Portal -> http://localhost:3000")
    p3 = subprocess.Popen(f"{npm_cmd} run dev -- --port 3000", cwd=root_dir, shell=True)
    processes.append(("Web Portal (Port 3000)", p3))

    print("\n[HEALTH CHECK] Waiting for all services to initialize...")
    s2_ok = wait_for_service("http://127.0.0.1:8001", "Drishti AI", max_retries=20) if p1 else False
    s3_ok = wait_for_service("http://localhost:3000", "Web Portal", max_retries=25)

    print(f"  • Drishti AI (Port 8001):       {'🟢 ONLINE' if s2_ok else '⚪ NOT RUNNING (demo mode active)'}")
    print(f"  • React Web Portal (Port 3000): {'🟢 ONLINE' if s3_ok else '🟡 STARTING'}")

    print("\n" + "=" * 78)
    print(" 🎉 [SUCCESS] NIRVIGHNA IS LIVE & READY!")
    print("=" * 78)
    print("  🔱 1. PILGRIM PORTAL:         http://localhost:3000/#/home")
    print("  🛡️ 2. VOLUNTEER FIELD HUB:    http://localhost:3000/#/v/login")
    print("        Direct Dashboard:       http://localhost:3000/#/v/dashboard")
    print("  🛰️ 3. UNIFIED COMMAND CENTRE: http://localhost:3000/#/command-centre/login")
    if s2_ok:
        print("  👁️ 4. DRISHTI AI BACKEND:     http://127.0.0.1:8001")
    print("=" * 78)
    print(" 💡 Tip: Press Ctrl+C in this terminal anytime to cleanly stop all services.")
    print("=" * 78 + "\n")


    # Automatically open the browser to the main portal
    try:
        webbrowser.open("http://localhost:3000/#/home")
    except Exception:
        pass

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\nStopping all Nirvighna microservices...")
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
