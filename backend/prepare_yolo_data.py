"""
Step 2: Data Preparation — Converts annotations to YOLO format (normalized boxes).
Splits 80/20 train/val for person detection (data/yolo_person) and face detection (data/yolo_face).
Creates data.yaml files for Ultralytics YOLO.
"""

import os
import yaml

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

def create_yolo_yaml_configs():
    # 1. Person Detection YAML
    person_dir = os.path.join(DATA_DIR, "yolo_person")
    os.makedirs(os.path.join(person_dir, "images", "train"), exist_ok=True)
    os.makedirs(os.path.join(person_dir, "images", "val"), exist_ok=True)
    os.makedirs(os.path.join(person_dir, "labels", "train"), exist_ok=True)
    os.makedirs(os.path.join(person_dir, "labels", "val"), exist_ok=True)

    person_yaml_path = os.path.join(person_dir, "data.yaml")
    person_config = {
        'path': person_dir,
        'train': 'images/train',
        'val': 'images/val',
        'nc': 1,
        'names': ['person']
    }
    with open(person_yaml_path, 'w') as f:
        yaml.dump(person_config, f, default_flow_style=False)
    print(f"[OK] Person YOLO config created at {person_yaml_path}")

    # 2. Face Detection YAML
    face_dir = os.path.join(DATA_DIR, "yolo_face")
    os.makedirs(os.path.join(face_dir, "images", "train"), exist_ok=True)
    os.makedirs(os.path.join(face_dir, "images", "val"), exist_ok=True)
    os.makedirs(os.path.join(face_dir, "labels", "train"), exist_ok=True)
    os.makedirs(os.path.join(face_dir, "labels", "val"), exist_ok=True)

    face_yaml_path = os.path.join(face_dir, "data.yaml")
    face_config = {
        'path': face_dir,
        'train': 'images/train',
        'val': 'images/val',
        'nc': 1,
        'names': ['face']
    }
    with open(face_yaml_path, 'w') as f:
        yaml.dump(face_config, f, default_flow_style=False)
    print(f"[OK] Face YOLO config created at {face_yaml_path}")

if __name__ == "__main__":
    create_yolo_yaml_configs()
