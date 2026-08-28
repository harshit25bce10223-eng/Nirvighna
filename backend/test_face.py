from ai_service import app
from face_engine import ArcFaceBiometricEngine
import json

with open('config.json') as f:
    config = json.load(f)

# Test face engine initialization
face_engine = ArcFaceBiometricEngine({**config['biometric_arcface'], **config.get('face_detection', {})})
print(f'Detector type: {face_engine.detector_type}')
print(f'Model preference: {config["face_detection"]["model_preference"]}')
print('Face engine initialized successfully!')

# Test detect_faces with a dummy frame
import numpy as np
dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
faces = face_engine.detect_faces(dummy_frame)
print(f'Detected {len(faces)} faces in dummy frame')