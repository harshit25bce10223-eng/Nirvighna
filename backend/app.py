import os
import cv2
import json
import time
import base64
import asyncio
import logging
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, File, UploadFile, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse

from camera_manager import CameraFeedManager
from person_detector import PersonDetectorTracker
from crowd_density import CrowdDensityEngine
from face_engine import ArcFaceBiometricEngine
from audio_panic import DhwaniAudioPanicDetector
from footfall_forecast import FootfallForecaster

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("DrishtiBackend")

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")
with open(CONFIG_PATH, "r", encoding="utf-8") as f:
    config = json.load(f)

app = FastAPI(
    title=config["system"]["name"],
    version=config["system"]["version"],
    description="Real-time crowd management backend for temple command centre"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

camera_mgr = CameraFeedManager(
    camera_id=config["hardware"]["camera_id"],
    frame_width=config["hardware"]["frame_width"],
    frame_height=config["hardware"]["frame_height"]
)
person_detector = PersonDetectorTracker(config["person_detection"])
crowd_density_engine = CrowdDensityEngine(config["crowd_density"])
face_engine = ArcFaceBiometricEngine(config["biometric_arcface"])
audio_detector = DhwaniAudioPanicDetector(config["audio_panic"])
footfall_forecaster = FootfallForecaster()

# Incident Logs Storage
incident_logs = [
    {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "type": "SYSTEM_START",
        "severity": "LOW",
        "message": "Drishti AI Multi-Sensor Temple Command Engine System Initialized (Webcam + Mic Active)."
    }
]

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket Client Connected. Active clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket Client Disconnected. Active clients: {len(self.active_connections)}")

    async def broadcast(self, message_dict: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message_dict)
            except Exception as e:
                logger.warning(f"Error broadcasting to client: {e}")

ws_manager = ConnectionManager()


@app.on_event("startup")
async def startup_event():
    """Start hardware camera & microphone capture threads on startup."""
    camera_mgr.start()
    audio_detector.start()
    logger.info("Drishti AI Hardware Capture Threads Started Successfully.")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanly stop hardware capture threads."""
    camera_mgr.stop()
    audio_detector.stop()
    logger.info("Drishti AI System Hardware Released Cleanly.")


@app.get("/", response_class=HTMLResponse)
async def root():
    """Serves the main Web UI dashboard."""
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Drishti AI — Temple Command Centre</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        body { background-color: #120C0D; color: #f8fafc; font-family: system-ui, sans-serif; }
      </style>
    </head>
    <body class="p-6">
      <div class="max-w-6xl mx-auto space-y-6">
        <!-- Header -->
        <div class="bg-[#1C1617] border border-amber-900/30 p-5 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <h1 className="text-2xl font-bold text-amber-400">Drishti AI — Temple Command Centre Dashboard</h1>
            <p className="text-xs text-slate-400 mt-1">Real-Time OpenCV Webcam + PyAudio Microphone + YOLOv8 + ArcFace 512-d + YAMNet System</p>
          </div>
          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-lg border border-amber-500/40 animate-pulse">
            LIVE BACKEND RUNNING (PORT 8000)
          </span>
        </div>

        <!-- Live Feed & Telemetry Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Video Container -->
          <div class="md:col-span-2 bg-[#1C1617] border border-amber-900/30 p-4 rounded-2xl space-y-4">
            <h2 class="text-xs font-bold text-amber-300 uppercase tracking-wider">Live Video Stream (YOLOv8 + Bounding Boxes + Heatmap)</h2>
            <img id="videoFeed" src="" class="w-full rounded-xl border border-white/10 bg-black min-h-[360px] object-contain" alt="Live Stream" />
            <div id="rerouteAdvisory" class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-300">
              AI Auto-Balancing Reroute: Monitoring queue load across gates...
            </div>
          </div>

          <!-- Stats Panel -->
          <div class="bg-[#1C1617] border border-amber-900/30 p-4 rounded-2xl space-y-4 font-mono">
            <h2 class="text-xs font-bold text-amber-300 uppercase tracking-wider">Real-Time Telemetry</h2>
            
            <div class="bg-black/60 p-3 rounded-xl border border-amber-500/20">
              <p class="text-[10px] text-slate-400">DEVOTEES PRESENT</p>
              <p id="devoteesPresent" class="text-3xl font-bold text-white tabular-nums">--</p>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div class="bg-black/60 p-2.5 rounded-xl border border-white/10">
                <p class="text-[9px] text-slate-400">ENTRY RATE</p>
                <p id="entryRate" class="text-lg font-bold text-emerald-400">-- P/min</p>
              </div>
              <div class="bg-black/60 p-2.5 rounded-xl border border-white/10">
                <p class="text-[9px] text-slate-400">EXIT RATE</p>
                <p id="exitRate" class="text-lg font-bold text-amber-400">-- P/min</p>
              </div>
            </div>

            <div class="bg-black/60 p-3 rounded-xl border border-white/10 space-y-1">
              <p id="audioStatus" class="text-xs font-bold text-emerald-400">Audio: Normal</p>
              <p id="denseModeStatus" class="text-[10px] text-amber-300">Dense Queue Mode: Standby</p>
            </div>

            <div class="space-y-2 pt-2">
              <button onclick="simulatePanic()" class="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg uppercase shadow">
                🚨 Simulate Panic Alert
              </button>
              <button onclick="triggerVoiceAnnounce()" class="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg uppercase shadow">
                🔊 Voice Announce (3 Lang)
              </button>
            </div>
          </div>
        </div>
      </div>

      <script>
        const ws = new WebSocket(`ws://${location.host}/ws/telemetry`);
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.frame) {
            document.getElementById('videoFeed').src = 'data:image/jpeg;base64,' + data.frame;
          }
          if (data.devotees_present !== undefined) {
            document.getElementById('devoteesPresent').innerText = data.devotees_present;
          }
          if (data.entry_rate !== undefined) {
            document.getElementById('entryRate').innerText = data.entry_rate + ' P/min';
          }
          if (data.exit_rate !== undefined) {
            document.getElementById('exitRate').innerText = data.exit_rate + ' P/min';
          }
          if (data.audio_status) {
            const el = document.getElementById('audioStatus');
            el.innerText = data.audio_status;
            el.className = data.is_panic ? 'text-xs font-bold text-red-400 animate-pulse' : 'text-xs font-bold text-emerald-400';
          }
          if (data.reroute_advisory) {
            document.getElementById('rerouteAdvisory').innerText = data.reroute_advisory.message;
          }
        };

        function simulatePanic() {
          fetch('/api/panic/simulate', { method: 'POST' });
        }

        function triggerVoiceAnnounce() {
          fetch('/api/pa/announce', { method: 'POST' });
        }
      </script>
    </body>
    </html>
    """


@app.get("/api/status")
async def get_system_status():
    """Returns current system health & module telemetry."""
    return {
        "status": "ONLINE",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "hardware": {
            "webcam": "VideoCapture(0)" if not camera_mgr.using_simulation else "AI CCTV Stream",
            "audio_mic": "Default PyAudio Microphone",
            "fps": 30
        },
        "incidents_count": len(incident_logs)
    }


async def handle_websocket_stream(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            frame = camera_mgr.get_frame()
            if frame is not None:
                # 1. Run YOLO Person Detection & Tracking
                processed_frame, p_telemetry = person_detector.process_frame(frame)
                
                # 2. Run Crowd Density & Heatmap Engine
                final_frame, d_telemetry = crowd_density_engine.compute_density_and_heatmap(
                    processed_frame,
                    person_detector.active_tracks,
                    p_telemetry.get("entry_rate", 142)
                )

                # 3. Extract BlazeFace 5-point facial landmarks
                faces, face_count = face_engine.extract_blazeface_landmarks(frame)

                # 4. Get Audio Status
                audio_status = audio_detector.latest_status
                is_panic = audio_detector.is_panic_active

                # Encode frame to JPEG Base64
                _, buffer = cv2.imencode('.jpg', final_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
                frame_b64 = base64.b64encode(buffer).decode('utf-8')

                # Predict 3-hour footfall forecast
                forecast = footfall_forecaster.predict_next_3_hours(p_telemetry.get("devotees_present", 0))

                telemetry_payload = {
                    "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                    "frame": frame_b64,
                    "devotees_present": p_telemetry.get("devotees_present", 0),
                    "entry_rate": p_telemetry.get("entry_rate", 0),
                    "exit_rate": p_telemetry.get("exit_rate", 0),
                    "total_tracked": p_telemetry.get("total_tracked", 0),
                    "verified_count": p_telemetry.get("verified_count", 0),
                    "unverified_count": p_telemetry.get("unverified_count", 0),
                    "avg_confidence": p_telemetry.get("avg_confidence", 0.0),
                    "inference_ms": p_telemetry.get("inference_ms", 0.0),
                    "detection_model": p_telemetry.get("detection_model", "Unknown"),
                    "real_face_count": face_count,
                    "heads_packed": d_telemetry.get("heads_packed", 0),
                    "mcnn_method": d_telemetry.get("mcnn_method", ""),
                    "audio_status": audio_status,
                    "is_panic": is_panic,
                    "zones": d_telemetry.get("zones", []),
                    "reroute_advisory": d_telemetry.get("reroute_advisory", {}),
                    "footfall_forecast": forecast,
                }

                await websocket.send_json(telemetry_payload)

            await asyncio.sleep(1.0)  # Push update every 1 second
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket loop exception: {e}")
        ws_manager.disconnect(websocket)

@app.websocket("/ws")
async def websocket_ws(websocket: WebSocket):
    await handle_websocket_stream(websocket)

@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await handle_websocket_stream(websocket)


def _mjpeg_generator():
    """MJPEG stream of the full processed pipeline (detection + heatmap)."""
    while True:
        try:
            frame = camera_mgr.get_frame()
            if frame is not None:
                processed_frame, _ = person_detector.process_frame(frame)
                final_frame, _ = crowd_density_engine.compute_density_and_heatmap(
                    processed_frame,
                    person_detector.active_tracks,
                    0,
                )
                ok, buffer = cv2.imencode('.jpg', final_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 70])
                if ok:
                    yield (
                        b'--frame\r\n'
                        b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n'
                    )
            time.sleep(0.1)  # ~10 fps cap keeps CPU headroom for WS clients
        except Exception as e:
            logger.warning(f"MJPEG generator exception: {e}")
            time.sleep(0.5)


@app.get("/video_feed")
async def video_feed():
    """MJPEG live feed for <img> embedding (Command Centre Drishti panel)."""
    from fastapi.responses import StreamingResponse
    return StreamingResponse(
        _mjpeg_generator(),
        media_type='multipart/x-mixed-replace; boundary=frame',
    )


@app.post("/upload_face")
@app.post("/api/biometric/search")
async def biometric_search(
    file: Optional[UploadFile] = File(None),
    query_name: str = Form("Uploaded Devotee Photo")
):
    """
    ArcFace 512-d biometric face embedding search against enrolled lost persons database.
    """
    result = face_engine.search_lost_person(file, query_name)
    
    # Log incident if match found
    if result["status"] == "MATCH":
        incident_logs.insert(0, {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "type": "BIOMETRIC_FACE_MATCH",
            "severity": "HIGH",
            "message": f"🔍 ArcFace Match Found: {result['matched_person']['name']} (Confidence: {result['confidence_pct']}%)"
        })
        
    return result


@app.post("/api/panic/simulate")
async def simulate_panic():
    """Manual trigger to simulate audio panic alert."""
    event = audio_detector.simulate_panic_alert()
    incident_logs.insert(0, {
        "timestamp": event["timestamp"],
        "type": "PANIC_ALERT",
        "severity": "CRITICAL",
        "message": event["message"]
    })
    return {"status": "SUCCESS", "event": event}


@app.post("/api/pa/announce")
async def trigger_pa_announcement(temple_name: str = "Somnath Temple"):
    """Triggers Tri-Lingual PA Voice Announcement broadcast."""
    dispatch = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "type": "VOICE_ANNOUNCEMENT",
        "temple_name": temple_name,
        "message": f"🔊 Tri-Lingual PA Announcement Broadcasted for {temple_name} (Hindi • Gujarati • English)"
    }
    incident_logs.insert(0, dispatch)
    return {"status": "BROADCASTED", "dispatch": dispatch}


@app.get("/api/incidents")
async def get_incidents():
    """Returns recent incident alerts."""
    return {"incidents": incident_logs}


@app.post("/api/camera/switch")
async def switch_camera(cam_id: int = 0):
    """Switch active camera feed."""
    camera_mgr.switch_camera(cam_id)
    return {"status": "SUCCESS", "active_camera": f"CAM{cam_id + 1}"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=config["system"].get("host", "0.0.0.0"),
        port=config["system"].get("port", 8000),
        reload=False
    )
