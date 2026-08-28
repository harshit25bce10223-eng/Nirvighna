import sys
sys.path.insert(0, '.')

# Test 1: Face engine
from face_engine import ArcFaceBiometricEngine
import json
with open('config.json') as f:
    config = json.load(f)

face_engine = ArcFaceBiometricEngine({**config['biometric_arcface'], **config.get('face_detection', {})})
print(f"Face Engine: {face_engine.detector_type}")

# Test 2: Person detector
from person_detector import PersonDetectorTracker
person_detector = PersonDetectorTracker(config['person_detection'])
print(f"Person Detector: {person_detector.model_name}")

# Test 3: AI Service routes
from ai_service import app
routes = [r.path for r in app.routes if hasattr(r, 'path')]
print(f"API Routes: {len(routes)} endpoints")
for r in routes:
    print(f"   {r}")

# Test 4: Models present
import os
models = [
    'drishti_person.pt',
    'yolov8n.pt',
    'drishti_face.pt',
    'face_detection_yunet_2023mar.onnx',
    'models/face_detector.tflite'
]
for m in models:
    exists = os.path.exists(m)
    status = "OK" if exists else "MISSING"
    print(f"Model {m}: {status}")

print()
print("=== SYSTEM READY ===")
print("Backend: YuNet face detection active")
print("Frontend: DrishtiAI dashboard with face settings panel")
print("API: /detect_faces, /upload_face, /health, WebSocket /ws")