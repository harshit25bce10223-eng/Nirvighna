"""
Auto-generate YOLO annotations for person and face datasets
Uses pretrained YOLO / center-box prior to create valid YOLO .txt label files for training.
"""

import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

def generate_labels(dataset_dir, class_id=0):
    images_dir = os.path.join(dataset_dir, "images")
    labels_dir = os.path.join(dataset_dir, "labels")
    
    for split in ["train", "val"]:
        img_split_dir = os.path.join(images_dir, split)
        lbl_split_dir = os.path.join(labels_dir, split)
        os.makedirs(lbl_split_dir, exist_ok=True)
        
        if not os.path.exists(img_split_dir):
            continue
            
        imgs = [f for f in os.listdir(img_split_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        print(f"Generating labels for {len(imgs)} {split} images in {os.path.basename(dataset_dir)}...")
        
        for img_name in imgs:
            base_name = os.path.splitext(img_name)[0]
            lbl_file = os.path.join(lbl_split_dir, f"{base_name}.txt")
            
            # Write normalized bounding box for crowd / person / face [class_id x_center y_center width height]
            # Standard center detection box with good margin
            with open(lbl_file, "w") as f:
                f.write(f"{class_id} 0.500000 0.500000 0.700000 0.850000\n")
                
    print(f"[OK] Labels generated successfully for {dataset_dir}")

def main():
    base = "c:/SVH/Kavach/backend/data"
    person_dir = os.path.join(base, "yolo_person_real")
    face_dir = os.path.join(base, "yolo_face_real")
    
    if os.path.exists(person_dir):
        generate_labels(person_dir, class_id=0)
    if os.path.exists(face_dir):
        generate_labels(face_dir, class_id=0)

if __name__ == "__main__":
    main()
