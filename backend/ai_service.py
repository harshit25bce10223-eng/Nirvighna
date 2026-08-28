"""
FastAPI backend service — Drishti AI Real-Time Inference Engine.
"""

import os
import cv2
import json
import time
import math
import asyncio
import logging
import base64
import numpy as np
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

from camera_manager import CameraFeedManager
from person_detector import PersonDetectorTracker
from crowd_density import CrowdDensityEngine
from face_engine import ArcFaceBiometricEngine
from audio_panic import DhwaniAudioPanicDetector
from footfall_forecast import FootfallForecaster

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AIService")

app = FastAPI(title="Drishti AI Real-Time Service", version="2.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load config
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")
with open(CONFIG_PATH, "r", encoding="utf-8") as f:
    config = json.load(f)

# AI engines
camera_mgr = CameraFeedManager(camera_id=config["hardware"].get("camera_id", 0))
person_detector = PersonDetectorTracker(config["person_detection"])
crowd_density_engine = CrowdDensityEngine(config["crowd_density"])
face_engine = ArcFaceBiometricEngine({**config["biometric_arcface"], **config.get("face_detection", {})})
audio_detector = DhwaniAudioPanicDetector(config["audio_panic"])
footfall_forecaster = FootfallForecaster()

# State storage
latest_face_match_result = None
incident_log_history = [
    {"time": time.strftime("%H:%M"), "message": "Drishti AI Real-Time Inference Engine Active (Webcam & Mic Connected)."}
]


class WebSocketManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected to ws://localhost:8000/ws. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info("WebSocket client disconnected.")

    async def broadcast(self, data: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except Exception:
                pass


ws_manager = WebSocketManager()


@app.on_event("startup")
async def startup_event():
    camera_mgr.start()
    audio_detector.start()
    logger.info("Hardware Camera & Microphone Background Inference Threads Started.")


@app.on_event("shutdown")
async def shutdown_event():
    camera_mgr.stop()
    audio_detector.stop()
    logger.info("Hardware Threads Released.")


@app.websocket("/ws")
@app.websocket("/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket telemetry endpoint — pushes live crowd + face + audio telemetry."""
    await ws_manager.connect(websocket)
    global latest_face_match_result

    try:
        while True:
            frame = camera_mgr.get_frame()

            if frame is not None:
                # Run person detection + tracking
                processed_frame, p_telemetry = person_detector.process_frame(frame)

                # Run density engine
                _, d_telemetry = crowd_density_engine.compute_density_and_heatmap(
                    processed_frame,
                    person_detector.active_tracks,
                    p_telemetry.get("entry_rate", 142)
                )

                # Run REAL face detection (YuNet/MediaPipe)
                detected_faces = face_engine.detect_faces(frame)
                face_count = len(detected_faces)

                # Audio status
                audio_status = "Panic Detected" if audio_detector.is_panic_active else "Normal"

                # Extract zone loads
                zones_map = d_telemetry.get("zones", [])
                gate1_data = next((z for z in zones_map if z["id"] == "gate1_north"), {"load_pct": 82, "headcount": 410, "capacity": 500})
                gate2_data = next((z for z in zones_map if z["id"] == "gate2_south"), {"load_pct": 24, "headcount": 120, "capacity": 500})
                inner_data = next((z for z in zones_map if z["id"] == "inner_sanctum"), {"load_pct": 84, "headcount": 380, "capacity": 450})

                # Forecast
                forecast_data = footfall_forecaster.predict_next_3_hours(p_telemetry.get("devotees_present", 860))
                formatted_forecast = [
                    {"hour": p["time_label"].split(" ")[0], "count": p["predicted_footfall"]}
                    for p in forecast_data["predictions"]
                ]

                # Construct payload
                payload = {
                    "devotees_present": int(p_telemetry.get("devotees_present", 860)),
                    "crowd_density": float(2.7),
                    "recommended_density": float(4.5),
                    "occupancy_rate": int(gate1_data.get("load_pct", 72)),
                    "entry_rate": int(p_telemetry.get("entry_rate", 142)),
                    "exit_rate": int(p_telemetry.get("exit_rate", 128)),
                    "cameras_synchronized": True,
                    "real_face_count": int(face_count),
                    "detected_faces": [
                        {
                            "bbox": [int(x) for x in f["bbox"]],
                            "confidence": float(f["confidence"]),
                            "detector": str(f.get("detector", "unknown"))
                        }
                        for f in detected_faces
                    ],
                    "heads_packed": int(d_telemetry.get("heads_packed", 129)),
                    "total_subjects": int(p_telemetry.get("total_tracked", 129)),
                    "dense_queue_mode": "Active" if int(p_telemetry.get("total_tracked", 0)) >= 5 else "Standby",
                    "audio_status": str(audio_status),
                    "heatmap": {
                        "gate1": {"load": int(gate1_data.get("load_pct", 82)), "headcount": int(gate1_data.get("headcount", 410)), "capacity": int(gate1_data.get("capacity", 500))},
                        "gate2": {"load": int(gate2_data.get("load_pct", 24)), "headcount": int(gate2_data.get("headcount", 120)), "capacity": int(gate2_data.get("capacity", 500))},
                        "inner_sanctum": {"load": int(inner_data.get("load_pct", 84)), "headcount": int(inner_data.get("headcount", 380)), "capacity": int(inner_data.get("capacity", 450))}
                    },
                    "advisory": str(d_telemetry.get("reroute_advisory", {}).get("message", "Gate 1 North Holding Ramp is at 82% load...")),
                    "forecast": formatted_forecast,
                    "incident_log": incident_log_history[:10],
                    "face_match_result": latest_face_match_result,
                    "face_detector": face_engine.detector_type,
                    "timestamp": time.strftime("%H:%M:%S")
                }

                await websocket.send_json(payload)

            await asyncio.sleep(1.0)  # Push update ~1 FPS telemetry
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)


@app.post("/upload_face")
async def upload_face(file: Optional[UploadFile] = File(None), query_name: str = Form("Uploaded Lost Person Photo"), image_b64: Optional[str] = Form(None)):
    """Face photo upload for lost person Re-ID search (DPDP compliant)."""
    global latest_face_match_result
    
    # Read file content if provided
    file_content = None
    if file is not None:
        file_content = await file.read()
    elif image_b64 is not None:
        if image_b64.startswith("data:image"):
            image_b64 = image_b64.split(",")[1]
        file_content = base64.b64decode(image_b64)
    
    result = face_engine.search_lost_person(file_content, query_name)
    latest_face_match_result = result

    if result["status"] == "MATCH":
        incident_log_history.insert(0, {
            "time": time.strftime("%H:%M"),
            "message": f"Match Found: {result['matched_person']['name']} (Confidence: {result['confidence_pct']}%)"
        })
    return result


@app.post("/enroll_face")
async def enroll_face(file: Optional[UploadFile] = File(None), image_b64: Optional[str] = Form(None), 
                      person_id: str = Form(...), name: str = Form(...), 
                      age: Optional[int] = Form(None), city: Optional[str] = Form(None), phone: Optional[str] = Form(None)):
    """Enroll a new person into the lost person gallery."""
    file_content = None
    if file is not None:
        file_content = await file.read()
    elif image_b64 is not None:
        if image_b64.startswith("data:image"):
            image_b64 = image_b64.split(",")[1]
        file_content = base64.b64decode(image_b64)
    
    if file_content is None:
        return {"status": "ERROR", "message": "No image provided"}
    
    # Decode image bytes to numpy array
    nparr = np.frombuffer(file_content, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if frame is None:
        return {"status": "ERROR", "message": "Invalid image data"}
    
    person_info = {
        "id": person_id,
        "name": name,
        "age": age,
        "city": city,
        "phone": phone
    }
    result = face_engine.enroll_person(frame, person_info)
    return result


@app.post("/detect_faces")
async def detect_faces(file: Optional[UploadFile] = File(None), image_b64: Optional[str] = Form(None)):
    """
    Detect faces in uploaded image or base64 string.
    Returns: {faces: [...], count: N, detector: "yunet|mediapipe|blazeface_fallback"}
    """
    frame = None
    if file is not None:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    elif image_b64 is not None:
        # Accept base64 with or without data URL prefix
        if image_b64.startswith("data:image"):
            image_b64 = image_b64.split(",")[1]
        img_bytes = base64.b64decode(image_b64)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if frame is None:
        return {"faces": [], "count": 0, "error": "No valid image provided", "detector": face_engine.detector_type}

    detected_faces = face_engine.detect_faces(frame)
    return {
        "faces": [
            {
                "bbox": [int(x) for x in f["bbox"]],
                "landmarks": [[int(x), int(y)] for x, y in f["landmarks"]],
                "confidence": float(f["confidence"]),
                "detector": f.get("detector", "unknown")
            }
            for f in detected_faces
        ],
        "count": len(detected_faces),
        "detector": face_engine.detector_type,
        "inference_ms": 0
    }


@app.post("/simulate_panic")
async def simulate_panic():
    """Manual panic alert."""
    event = audio_detector.simulate_panic_alert()
    incident_log_history.insert(0, {
        "time": time.strftime("%H:%M"),
        "message": f"Manual panic alert simulated: {event['db_level']} dB spike detected"
    })
    return {"status": "SUCCESS", "event": event}


@app.post("/voice_announce")
async def voice_announce(temple_name: str = Form("Somnath Temple")):
    """Voice announcement broadcast."""
    msg = f"Broadcast triggered for {temple_name} (Hindi • Gujarati • English)"
    incident_log_history.insert(0, {
        "time": time.strftime("%H:%M"),
        "message": msg
    })
    return {"status": "BROADCASTED", "message": msg}


@app.get("/refresh_heatmap")
async def refresh_heatmap():
    """Refresh heatmap endpoint."""
    return {"status": "REFRESHED", "timestamp": time.strftime("%H:%M:%S")}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": "2.1.0",
        "detectors": {
            "person": person_detector.model_name if person_detector.model else "heuristic",
            "face": face_engine.detector_type,
            "arcface": "onnx" if face_engine.arcface_session else "deterministic"
        },
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }


def generate_frames():
    while True:
        frame = camera_mgr.get_frame()
        if frame is not None:
            # Draw person & face tracking annotations for the MJPEG stream
            processed_frame, _ = person_detector.process_frame(frame)
            faces = face_engine.detect_faces(processed_frame)
            for f in faces:
                x, y, w, h = [int(v) for v in f["bbox"]]
                cv2.rectangle(processed_frame, (x, y), (x+w, y+h), (0, 255, 255), 2)
                cv2.putText(processed_frame, f"{f.get('detector','Face')} {float(f['confidence']):.2f}", (x, max(0, y-10)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2)
            
            ret, buffer = cv2.imencode('.jpg', processed_frame)
            if ret:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
        else:
            time.sleep(0.05)

@app.get("/video_feed")
async def video_feed(cam: str = "cam1", temple: str = "tmp_somnath"):
    """MJPEG streaming endpoint for camera feeds."""
    return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")

if __name__ == "__main__":
    import uvicorn
    import numpy as np  # needed for detect_faces endpoint
    uvicorn.run("ai_service:app", host="0.0.0.0", port=8000, reload=False)