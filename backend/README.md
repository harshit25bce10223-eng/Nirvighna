# 🏛️ Drishti AI — Temple Command Centre Python Backend Engine

Real-Time Multi-Sensor Computer Vision & Audio Intelligence Backend for Temple Command Operations.

---

## 🚀 Quick Setup & Execution Guide

## Quick Setup & Execution Guide

---

## Kaggle Dataset Downloads — Secure Credential Handling

All dataset download scripts use **interactive, zero-storage credential handling**:

- Credentials are entered at runtime — never written to disk, `.env`, or code.
- The API key is input via `getpass.getpass()` so it is **never visible** while typing.
- A temporary `kaggle.json` is created in a system temp directory for authentication,
  and is **automatically deleted** after the download completes or fails.
- Environment variables are deleted from process memory immediately after use.
- Credentials **never appear** in error messages, logs, or stack traces.

### How to Run Dataset Downloads

```bash
# Drishti AI vision datasets (CrowdHuman + WIDER Face):
python backend/download_drishti_real_data.py
# -> Will ask: Kaggle Username, then hidden API Key

# ML crowd prediction real footfall data:
python backend/ml_engine/download_real_footfall_data.py
# -> Will ask whether to attempt Kaggle, then Username + hidden Key
```

### Where to Get Your Kaggle API Key

1. Go to https://www.kaggle.com -> Account -> API -> Create New Token
2. This downloads a `kaggle.json` file with your username and key
3. Open the file and copy the values when the script asks

### Alternative: Manual kaggle.json Setup (Standard Method)

If you prefer not to enter credentials interactively:
```bash
mkdir -p ~/.kaggle
cp kaggle.json ~/.kaggle/kaggle.json
chmod 600 ~/.kaggle/kaggle.json
```
The scripts will automatically detect and use `~/.kaggle/kaggle.json` without prompting.

### If No Kaggle Access

All scripts gracefully fall back to generating a **high-fidelity synthetic proxy dataset** —
no Kaggle account is required for the system to function.

---


Ensure Python 3.9+ is installed, then run:

```bash
cd backend
pip install -r requirements.txt
```

### 2. Run Main Backend Engine
Launch the FastAPI WebSocket server:

```bash
python app.py
```

Or using Uvicorn directly:

```bash
uvicorn app:app --host 0.0.0.0 --port 8000
```

### 3. Open Web Dashboard
Open your browser and navigate to:
👉 **`http://localhost:8000`**

---

## 🎯 Testing Procedure

1. **Webcam Feed**: OpenCV reads `cv2.VideoCapture(0)`. If no physical camera is plugged in, the system automatically falls back to an **AI Simulated 720p CCTV Feed**.
2. **YOLOv8 & DeepSORT Person Tracking**: Step in front of camera or observe live stream to see tracked person bounding boxes and confidence scores.
3. **Virtual Entry/Exit Line Crossing**: Walk across the green `ENTRY LINE` and red `EXIT LINE` to see `entry_rate` and `exit_rate` (P/min) update dynamically.
4. **Audio Panic Detection (DHWANI RAKSHAK)**: Play a scream sound near your microphone to trigger the 94 dB scream alert or click **`🚨 Simulate Panic Alert`**.
5. **Biometric Face Search (ArcFace 512-d)**: Click **`Upload Face Photo`** to extract 512-d embeddings and search against the FAISS enrolled lost person database.
6. **Heatmap & Reroute Advisories**: Observe thermal density heatmaps and automatic AI Reroute Advisories when zone loads exceed 80%.

---

## 🛠️ Architecture & Tech Stack

| Module | Technology Stack | Key Function |
| :--- | :--- | :--- |
| **Camera Manager** | OpenCV (`cv2.VideoCapture(0)`), Multi-threading | Non-blocking 30 FPS queueing & multi-cam switcher |
| **Person Detection** | Ultralytics YOLOv8n / YOLOv11n | COCO Class 0 (`person`), 0.85 Auto-count threshold |
| **Object Tracking** | DeepSORT / ByteTrack | Unique Track IDs, line crossing entry/exit rates |
| **Crowd Density & MCNN** | Spatial Grid (10x10) + CSRNet / MCNN ROI | Density ($P/\text{m}^2$), Thermal Heatmap, Reroute |
| **Face Landmarks** | Google BlazeFace | 5-point facial landmarks (eyes, nose, mouth) |
| **ArcFace Biometrics** | InsightFace ArcFace ResNet50 + FAISS | 512-d Float32 embeddings, Cosine Similarity |
| **Audio Panic** | PyAudio / sounddevice + YAMNet / FFT | 1-sec audio chunks, scream & siren classification |
| **Footfall Forecast** | Prophet / Time-Series Regression | Next 3-hour footfall forecast, MAPE < 10% |
| **Web Backend** | FastAPI + WebSockets | Live 1-second telemetry broadcast to Web UI |

---

> **DPDP Act 2023 Compliance**: Raw biometric face images are never stored on disk. Only L2-normalized 512-dimensional Float32 embeddings are stored with timestamped audit logs.
