@echo off
chcp 65001 >nul
title Drishti AI - Complete Stack Launcher

echo.
echo ============================================
echo    DRISHTI AI - FACE DETECTION + RE-ID
echo    Temple Crowd Management System
echo ============================================
echo.

:: Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found in PATH
    pause
    exit /b 1
)

:: Check Node
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found in PATH
    pause
    exit /b 1
)

:: Set environment
set PYTHONPATH=C:\SVH\Kavach\backend
set KAGGLE_KEY=KGAT_a99c21687c698371e452e1779740016b

:: Kill any existing processes on ports 8000 and 5173
echo [1/4] Cleaning up old processes...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *ai_service*" >nul 2>&1
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *vite*" >nul 2>&1
timeout /t 1 /nobreak >nul

:: Install/Update Python deps
echo [2/4] Checking Python dependencies...
cd /d C:\SVH\Kavach\backend
pip install -q -r requirements.txt 2>&1 | findstr /V "Requirement already satisfied WARNING" || true

:: Verify models exist
echo [3/4] Verifying models...
if not exist "C:\SVH\Kavach\backend\face_detection_yunet_2023mar.onnx" (
    echo Downloading YuNet face detector...
    python -c "import urllib.request; urllib.request.urlretrieve('https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx', 'C:\SVH\Kavach\backend\face_detection_yunet_2023mar.onnx')"
) else (
    echo Model found: face_detection_yunet_2023mar.onnx
)
if not exist "C:\SVH\Kavach\backend\arcface_r100.onnx" (
    echo ArcFace model will be downloaded on first run (may take 30-60s)...
)

:: Build frontend if needed
echo [4/4] Building frontend...
cd /d C:\SVH\Kavach
if not exist "dist" (
    npm run build
)

echo.
echo ============================================
echo    STARTING SERVICES
echo ============================================
echo.
echo [Backend]  http://localhost:8000
echo [Frontend] http://localhost:5173
echo [API Docs] http://localhost:8000/docs
echo [Health]   http://localhost:8000/health
echo.
echo Press Ctrl+C to stop all services
echo ============================================
echo.

:: Start Backend in new window
start "Drishti AI Backend" cmd /k "cd /d C:\SVH\Kavach\backend && set PYTHONPATH=C:\SVH\Kavach\backend && set KAGGLE_KEY=KGAT_a99c21687c698371e452e1779740016b && python ai_service.py"

:: Wait for backend to start
timeout /t 3 /nobreak >nul

:: Start Frontend in new window
start "Drishti AI Frontend" cmd /k "cd /d C:\SVH\Kavach && npm run dev"

echo.
echo Services starting... Check the two new windows.
echo.
pause