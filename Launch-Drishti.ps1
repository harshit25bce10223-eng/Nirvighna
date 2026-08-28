<# 
.SYNOPSIS
    Drishti AI - One-Click Launcher
    Runs backend + frontend + verifies models
#>

param(
    [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"

function Write-Color($msg, $color) {
    Write-Host $msg -ForegroundColor $color
}

function Check-Model($name, $url) {
    $path = "C:\SVH\Kavach\backend\$name"
    if (-not (Test-Path $path)) {
        Write-Color "Downloading $name..." Yellow
        try {
            Invoke-WebRequest -Uri $url -OutFile $path -UseBasicParsing
            Write-Color "  Downloaded: $name" Green
        } catch {
            Write-Color "  Failed: $($_.Exception.Message)" Red
            return $false
        }
    } else {
        Write-Color "Model found: $name" Green
    }
    return $true
}

Write-Color @"
============================================
    DRISHTI AI - ONE-CLICK LAUNCHER
    Face Detection + Re-ID + Crowd Management
============================================
"@ -ForegroundColor Cyan

# Check models
Write-Color "`n[1/5] Checking models..." Yellow
Check-Model "face_detection_yunet_2023mar.onnx" `
    "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"

# Install Python deps
Write-Color "`n[2/5] Installing Python dependencies..." Yellow
Set-Location "C:\SVH\Kavach\backend"
$env:PYTHONPATH = "C:\SVH\Kavach\backend"
$env:KAGGLE_KEY = "KGAT_a99c21687c698371e452e1779740016b"
pip install -q -r requirements.txt 2>&1 | Where-Object { $_ -notmatch "Requirement already satisfied|WARNING" }

# Build frontend
Write-Color "`n[3/5] Building frontend..." Yellow
Set-Location "C:\SVH\Kavach"
if (-not (Test-Path "dist")) {
    npm run build
} else {
    Write-Color "Frontend already built" Green
}

# Start backend
Write-Color "`n[4/5] Starting Backend (FastAPI on :8000)..." Yellow
$backend = Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "cd C:\SVH\Kavach\backend; `$env:PYTHONPATH='C:\SVH\Kavach\backend'; `$env:KAGGLE_KEY='KGAT_a99c21687c698371e452e1779740016b'; python ai_service.py" `
    -PassThru

Start-Sleep 3

# Check health
Write-Color "Waiting for backend health..." Yellow
for ($i=0; $i -lt 30; $i++) {
    try {
        $r = Invoke-RestMethod -Uri "http://localhost:8000/health" -TimeoutSec 2 -ErrorAction Stop
        if ($r.status -eq "healthy") { Write-Color "Backend healthy!" Green; break }
    } catch { }
    Start-Sleep 1
}

# Start frontend
Write-Color "`n[5/5] Starting Frontend (Vite on :5173)..." Yellow
$frontend = Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "cd C:\SVH\Kavach; npm run dev" `
    -PassThru

Start-Sleep 3

Write-Color @"
============================================
    DRISHTI AI RUNNING
============================================
Backend API:     http://localhost:8000
API Docs:        http://localhost:8000/docs
Health Check:    http://localhost:8000/health
Frontend:        http://localhost:5173
DrishtiAI Dashboard: http://localhost:5173/command-centre/drishti_ai

Features:
  - YuNet Face Detection (real-time)
  - ArcFace Embeddings (ONNX, 512-dim)
  - FAISS Vector Search (Re-ID)
  - Enroll / Search Lost Persons
  - Live CCTV WebSocket Telemetry
  - DPDP Act 2023 Compliant Audit

Press Ctrl+C in the backend/frontend windows to stop.
"@ -ForegroundColor Green

if (-not $NoBrowser) {
    Start-Process "http://localhost:5173/command-centre/drishti_ai"
}

Write-Color "`nServices running in separate windows. Close them to stop." Yellow