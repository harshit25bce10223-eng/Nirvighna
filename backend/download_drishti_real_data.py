"""
Nirvighna Drishti AI — Kaggle Dataset Downloader
Downloads Person / Crowd and Face detection datasets using Kaggle API.
"""

import os
import sys
import shutil
import tempfile
import json
import yaml
import zipfile

sys.stdout.reconfigure(encoding='utf-8')


def _init_kaggle_api():
    """Initializes Kaggle API using ~/.kaggle/kaggle.json or access_token."""
    from kaggle.api.kaggle_api_extended import KaggleApi
    api = KaggleApi()
    api.authenticate()
    print("[OK] Kaggle API Authenticated successfully.")
    return api


def _download_with_kaggle_pkg(api, slug, dest_dir):
    """Downloads and unzips dataset files."""
    try:
        os.makedirs(dest_dir, exist_ok=True)
        print(f"  [DOWNLOADING] {slug}...")
        api.dataset_download_files(slug, path=dest_dir, unzip=True, quiet=False)
        print(f"  [OK] Successfully downloaded & extracted: {slug}")
        return dest_dir
    except Exception as e:
        err = str(e)
        print(f"  [INFO] {slug}: {type(e).__name__} ({err[:120]})")
        return None


def _copy_images_to_split(src_dir, dest_base, limit=1000, train_pct=0.8):
    """Recursively find images in src_dir, copy to YOLO train/val split."""
    if not src_dir or not os.path.isdir(src_dir):
        return 0

    imgs = []
    for root, _, files in os.walk(src_dir):
        for f in files:
            if f.lower().endswith((".jpg", ".jpeg", ".png", ".bmp", ".webp")):
                imgs.append(os.path.join(root, f))
            if len(imgs) >= limit:
                break
        if len(imgs) >= limit:
            break

    imgs = imgs[:limit]
    if not imgs:
        return 0

    n_train = int(len(imgs) * train_pct)
    splits = {"train": imgs[:n_train], "val": imgs[n_train:]}
    for split, split_imgs in splits.items():
        split_dir = os.path.join(dest_base, "images", split)
        os.makedirs(split_dir, exist_ok=True)
        for img in split_imgs:
            shutil.copy2(img, os.path.join(split_dir, os.path.basename(img)))

    print(f"  [OK] Copied {n_train} train / {len(imgs)-n_train} val images -> {os.path.basename(dest_base)}")
    return len(imgs)


def _write_data_yaml(dest_dir, nc, class_name):
    cfg = {
        "path":  dest_dir,
        "train": "images/train",
        "val":   "images/val",
        "nc":    nc,
        "names": [class_name],
    }
    yaml_path = os.path.join(dest_dir, "data.yaml")
    with open(yaml_path, "w") as f:
        yaml.dump(cfg, f, default_flow_style=False)
    print(f"  [OK] YOLO config written: {yaml_path}")


def _setup_dirs(base):
    person_dir = os.path.join(base, "data", "yolo_person_real")
    face_dir   = os.path.join(base, "data", "yolo_face_real")
    for d in [person_dir, face_dir]:
        for sub in ["images/train", "images/val", "labels/train", "labels/val"]:
            os.makedirs(os.path.join(d, sub), exist_ok=True)
    _write_data_yaml(person_dir, 1, "person")
    _write_data_yaml(face_dir,   1, "face")
    return person_dir, face_dir


def main():
    base = os.path.dirname(os.path.abspath(__file__))
    raw_dir = os.path.join(base, "data", "raw_downloads")

    print("=" * 62)
    print("  Nirvighna Drishti AI — Kaggle Dataset Downloader")
    print("=" * 62)

    try:
        api = _init_kaggle_api()
    except Exception as e:
        print(f"[ERROR] Failed to authenticate Kaggle API: {e}")
        return

    person_dir, face_dir = _setup_dirs(base)

    try:
        # 1. Person / Crowd datasets
        print("\n[1/2] Downloading Person / Crowd detection dataset from Kaggle...")
        person_raw = os.path.join(raw_dir, "crowdhuman")

        person_slugs = [
            "permanalwep/crowdhuman-crowd-detection",
            "menhari/crowd-human-crowd-detection",
            "mridul3301/crowdhuman-yolo-format",
            "fareselmenshawii/crowdhuman-dataset",
            "gti-raghav/crowdhuman"
        ]
        person_dl = None
        for slug in person_slugs:
            person_dl = _download_with_kaggle_pkg(api, slug, person_raw)
            if person_dl:
                break

        n_person = _copy_images_to_split(person_raw, person_dir)

        # 2. Face datasets
        print("\n[2/2] Downloading Face detection dataset from Kaggle...")
        face_raw = os.path.join(raw_dir, "widerface")

        face_slugs = [
            "atulanandjha/lfwpeople",
            "thangm/wider-face-dataset",
            "aayushmishra1512/tinyface",
            "sbaghbidi/face-detection-dataset"
        ]
        face_dl = None
        for slug in face_slugs:
            face_dl = _download_with_kaggle_pkg(api, slug, face_raw)
            if face_dl:
                break

        n_face = _copy_images_to_split(face_raw, face_dir)

        # Summary
        print("\n" + "=" * 62)
        print("  DOWNLOAD SUMMARY")
        print("=" * 62)
        person_count = len(os.listdir(os.path.join(person_dir, "images", "train")))
        face_count   = len(os.listdir(os.path.join(face_dir,   "images", "train")))
        print(f"  Person images (train): {person_count}")
        print(f"  Face images   (train): {face_count}")
        print("\n[SUCCESS] Datasets organized for YOLOv8 fine-tuning.")

    except Exception as e:
        print(f"\n[ERROR] {e}")


if __name__ == "__main__":
    main()
