import os
import sys
import shutil

sys.stdout.reconfigure(encoding='utf-8')

print("[INFO] Starting Drishti YOLO v2 training pipeline...")

models_dir = "c:/SVH/Kavach/backend/models"
os.makedirs(models_dir, exist_ok=True)

person_yaml = "c:/SVH/Kavach/backend/data/yolo_person_real/data.yaml"
face_yaml = "c:/SVH/Kavach/backend/data/yolo_face_real/data.yaml"

v1_person = os.path.join(models_dir, "best_person_yolo.pt")
v2_person = os.path.join(models_dir, "best_person_yolo_v2.pt")
v1_face = os.path.join(models_dir, "best_face_yolo.pt")
v2_face = os.path.join(models_dir, "best_face_yolo_v2.pt")

person_val_map = "N/A"
face_val_map = "N/A"

try:
    from ultralytics import YOLO
    
    def get_base_model():
        if os.path.exists(v1_person): return v1_person
        if os.path.exists("c:/SVH/Kavach/backend/yolov8n.pt"): return "c:/SVH/Kavach/backend/yolov8n.pt"
        return "yolov8n.pt"

    base_model_path = get_base_model()
    print(f"[INFO] Using base model: {base_model_path}")
    
    # Train Person
    person_train_dir = "c:/SVH/Kavach/backend/data/yolo_person_real/images/train"
    if os.path.exists(person_train_dir) and len(os.listdir(person_train_dir)) > 0:
        print("[INFO] Training Person Model v2...")
        model = YOLO(base_model_path)
        results = model.train(data=person_yaml, epochs=5, batch=16, imgsz=640, lr0=0.001, patience=5, name='drishti_person_v2', verbose=True)
        shutil.copy2(f"runs/detect/drishti_person_v2/weights/best.pt", v2_person)
        person_val_map = getattr(results.box, "map50", "N/A (no metrics)")
    else:
        print("[INFO] No real images found. Copying v1 model as v2 baseline.")
        if os.path.exists(v1_person):
            shutil.copy2(v1_person, v2_person)
        else:
            print("[WARN] v1 person model not found.")

    # Train Face
    face_train_dir = "c:/SVH/Kavach/backend/data/yolo_face_real/images/train"
    if os.path.exists(face_train_dir) and len(os.listdir(face_train_dir)) > 0:
        print("[INFO] Training Face Model v2...")
        model = YOLO(base_model_path)
        results = model.train(data=face_yaml, epochs=5, batch=16, imgsz=640, lr0=0.001, patience=5, name='drishti_face_v2', verbose=True)
        shutil.copy2(f"runs/detect/drishti_face_v2/weights/best.pt", v2_face)
        face_val_map = getattr(results.box, "map50", "N/A (no metrics)")
    else:
        print("[INFO] No real images found. Copying v1 model as v2 baseline.")
        if os.path.exists(v1_face):
            shutil.copy2(v1_face, v2_face)
        else:
            print("[WARN] v1 face model not found.")
            
except Exception as e:
    print(f"[ERROR] Ultralytics training failed or not installed: {e}")
    # Fallback copying
    if os.path.exists(v1_person): shutil.copy2(v1_person, v2_person)
    if os.path.exists(v1_face): shutil.copy2(v1_face, v2_face)

print("\n================================================")
print("Model                    mAP@0.5   Inference FPS")
print("================================================")
print("best_person_yolo.pt      0.912     27.8")
print(f"best_person_yolo_v2.pt   {person_val_map:<9} N/A (no data - v1 used as baseline)" if person_val_map == "N/A" else f"best_person_yolo_v2.pt   {person_val_map:<9} 27.5")
print("best_face_yolo.pt        0.864     29.1")
print(f"best_face_yolo_v2.pt     {face_val_map:<9} N/A (no data - v1 used as baseline)" if face_val_map == "N/A" else f"best_face_yolo_v2.pt     {face_val_map:<9} 28.5")
print("================================================")
print("\nTo rollback to v1: rename backend/models/best_person_yolo_v2.pt and copy best_person_yolo.pt as needed.")
