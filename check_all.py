import sys
import os
import json
import torch
import cv2

print('=== COMPREHENSIVE SYSTEM CHECK ===')
print()

# 1. Python environment
import ultralytics
import cv2
import numpy as np
print('PyTorch:', torch.__version__, '| CUDA:', torch.cuda.is_available(), '| Device:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU')
print('Ultralytics:', ultralytics.__version__)
print('OpenCV:', cv2.__version__)
print()

# 2. Backend imports
sys.path.insert(0, r'C:\SVH\Kavach\backend')
try:
    from person_detector import PersonDetectorTracker
    from crowd_density import CrowdDensityEngine
    from face_engine import ArcFaceBiometricEngine
    from audio_panic import DhwaniAudioPanicDetector
    from footfall_forecast import FootfallForecaster
    print('All backend modules import successfully')
except Exception as e:
    print('Backend import error:', e)

# 3. Model loading
with open(r'C:\SVH\Kavach\backend\config.json') as f:
    config = json.load(f)

from person_detector import PersonDetectorTracker
detector = PersonDetectorTracker(config['person_detection'])
print('Model loaded:', detector.model_name)
print('CUDA available:', torch.cuda.is_available())
if torch.cuda.is_available():
    print('GPU:', torch.cuda.get_device_name(0))

# 4. Check model file
model_path = r'C:\SVH\Kavach\backend\drishti_person.pt'
if os.path.exists(model_path):
    size_mb = os.path.getsize(model_path) / 1024 / 1024
    print('Model file:', model_path, '({:.1f} MB)'.format(os.path.getsize(model_path) / 1024 / 1024))
else:
    print('Model file: NOT FOUND')

print()
print('=== BACKEND CHECK COMPLETE ===')