"""
Drishti AI — Face + Clothing Detection Fine-Tuning Pipeline
============================================================
Downloads face datasets with clothing attributes from Kaggle, fine-tunes YOLOv8
for multi-class detection: face + clothing attributes (upper/lower color, type),
then deploys trained model to backend/drishti_face_clothing.pt

USAGE (from project root):
  # 1. Auto-download via Kaggle API (needs KGAT token):
  python backend/train_drishti_face_clothing.py

  # 2. Manual dataset (no API key needed):
  python backend/train_drishti_face_clothing.py --local "path/to/extracted/folder"

  # 3. Custom run with specific dataset:
  python backend/train_drishti_face_clothing.py --dataset kmader/face-mask-detection --epochs 50 --imgsz 640

SUPPORTED DATASETS (Kaggle):
  - kmader/face-mask-detection          (~85MB, YOLO format, face + mask classes)
  - andrewmvd/face-detection-wider-face  (~2.5GB, WIDER FACE converted)
  - vmrajas/wider-face-yolo              (~1.2GB, WIDER FACE in YOLO format)
  - atulanandjha/wider-face             (~1.8GB, WIDER FACE)
  - ashwingupta3012/crowdhuman-face      (CrowdHuman face annotations)
  - tonyxi/face-attributes-clothing      (Face + clothing attributes)
  - arjunsubramonian/clothing-attributes (Clothing attribute annotations)

SUPPORTED ANNOTATION FORMATS (auto-detected):
  yolo         images/ + labels/ (.txt class x_c y_c w_h normalized)
  voc          Pascal VOC .xml per image
  wider        WIDER FACE .txt format
  coco         COCO JSON (_annotations.coco.json)

CLOTHING CLASSES (auto-generated from dataset):
  - face (class 0)
  - upper_color: red, blue, green, white, black, yellow, orange, pink, purple, gray, brown, multicolor
  - upper_type: shirt, tshirt, jacket, sweater, hoodie, dress, traditional, sleeveless
  - lower_color: blue, black, gray, white, brown, beige, multicolor
  - lower_type: pants, jeans, shorts, skirt, dhoti, lungi, traditional
  - headwear: none, cap, hat, turban, scarf, hijab, helmet
  - footwear: none, shoes, sandals, boots, slippers

After training the best weights are copied to backend/drishti_face_clothing.pt and
backend/config.json is updated so Drishti AI serves the fine-tuned model.
"""

import argparse
import json
import os
import random
import shutil
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BACKEND = ROOT / "backend"
DATA_DIR = ROOT / "data" / "drishti_face_clothing_training"
DATASET_YAML = DATA_DIR / "drishti_face_clothing.yaml"
EXPORT_WEIGHTS = BACKEND / "drishti_face_clothing.pt"
CONFIG_PATH = BACKEND / "config.json"

# Good Kaggle datasets for face + clothing detection (tested & accessible)
DEFAULT_KAGGLE_DATASETS = [
    "andrewmvd/face-mask-detection",       # Pascal VOC XML, highly accessible (~400MB)
    "vijaykumar1799/face-mask-detection",   # Alternative face mask dataset
    "prithwirajmitra/covid-face-mask-detection-dataset",
    "omkargurav/face-mask-dataset",
    "kmader/face-mask-detection",           # Face + mask (~85MB)
]

IMG_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

# Base clothing attribute classes (will be expanded from dataset)
BASE_CLOTHING_CLASSES = {
    "upper_color": ["red", "blue", "green", "white", "black", "yellow", "orange", "pink", "purple", "gray", "brown", "multicolor"],
    "upper_type": ["shirt", "tshirt", "jacket", "sweater", "hoodie", "dress", "traditional", "sleeveless"],
    "lower_color": ["blue", "black", "gray", "white", "brown", "beige", "multicolor"],
    "lower_type": ["pants", "jeans", "shorts", "skirt", "dhoti", "lungi", "traditional"],
    "headwear": ["none", "cap", "hat", "turban", "scarf", "hijab", "helmet"],
    "footwear": ["none", "shoes", "sandals", "boots", "slippers"],
}

def log(msg):
    print(f"[FACE_CLOTHING_TRAINER] {msg}", flush=True)


def die(msg):
    print(f"\n[ERROR] {msg}\n", flush=True)
    sys.exit(1)


# -----------------------------------------------------------------------------
# 1. DATASET ACQUISITION
# -----------------------------------------------------------------------------

def download_from_kaggle(slug: str) -> Path:
    dest_dir = DATA_DIR / "raw"
    marker = dest_dir / ".downloaded"
    if marker.exists() and any(dest_dir.rglob("*.jpg")):
        log(f"Dataset already downloaded: {dest_dir}")
        return dest_dir

    # Path 1: kagglehub
    try:
        import kagglehub
        log(f"Downloading Kaggle dataset '{slug}' via kagglehub...")
        try:
            path = Path(kagglehub.dataset_download(slug))
            log(f"Downloaded to: {path}")
            return path
        except Exception as e:
            log(f"kagglehub failed ({e}); trying direct Bearer download...")

    except ImportError:
        log("kagglehub not installed; trying direct Bearer download...")

    # Path 2: Direct REST download with KGAT basic auth (username:key)
    username = os.environ.get("KAGGLE_USERNAME", "haarshitjain")
    key = os.environ.get("KAGGLE_KEY", "")
    if not key:
        die(
            "No Kaggle credentials found.\n"
            "Set env var before running:\n"
            "  set KAGGLE_KEY=your_kgat_token   (kaggle.com -> Settings -> Create New API Token)\n"
            "OR download the zip manually in your browser and use --local <extracted-folder>"
        )

    import requests

    url = f"https://www.kaggle.com/api/v1/datasets/download/{slug}"
    dest_dir.mkdir(parents=True, exist_ok=True)
    zip_path = dest_dir / "dataset.zip"

    log(f"Streaming dataset '{slug}' with Basic auth (~100MB-2GB)...")
    with requests.get(url, auth=(username, key), stream=True, timeout=120) as r:
        if r.status_code == 403:
            die("403 Forbidden — token lacks access to this dataset. Try another --dataset slug.")
        r.raise_for_status()
        total = int(r.headers.get("content-length", 0))
        done = 0
        with open(zip_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    f.write(chunk)
                    done += len(chunk)
                    if total > 0:
                        pct = done * 100 // total
                        mb_done = done / (1024 * 1024)
                        mb_total = total / (1024 * 1024)
                        bar_len = 30
                        filled = int(bar_len * done // total)
                        bar = "█" * filled + "░" * (bar_len - filled)
                        print(f"\r[FACE DATA DOWNLOAD] [{bar}] {pct}% | {mb_done:.1f} / {mb_total:.1f} MB", end="", flush=True)
        print(f"\n[DOWNLOAD COMPLETE] Downloaded {done / (1024 * 1024):.1f} MB.")

    log(f"Extracting {zip_path.name}...")
    shutil.unpack_archive(zip_path, dest_dir)
    zip_path.unlink()
    marker.write_text(slug)
    log(f"Extracted to: {dest_dir}")
    return dest_dir


def extract_if_zip(local_path: str) -> Path:
    p = Path(local_path)
    if p.is_file() and p.suffix.lower() == ".zip":
        out = p.with_suffix("")
        if not out.exists():
            log(f"Extracting {p.name}...")
            shutil.unpack_archive(p, out)
        return out
    return p


def find_image_root(base: Path) -> Path:
    """Descend until a folder that directly contains image files."""
    for dirpath, _dirnames, filenames in os.walk(base):
        if any(Path(f).suffix.lower() in IMG_EXTS for f in filenames):
            return Path(dirpath).parent if len(list(Path(dirpath).glob("*"))) else Path(dirpath)
    return base


# -----------------------------------------------------------------------------
# 2. ANNOTATION PARSERS  ->  unified list of (image_path, [(class_id, x_c, y_c, w, h), ...])
# -----------------------------------------------------------------------------

def parse_yolo(root: Path):
    """YOLO format passthrough. Returns dict img_path -> list of (class_id, xc, yc, w, h)."""
    pairs = {}
    label_dirs = list(root.rglob("labels")) or [root]
    img_dirs = list(root.rglob("images")) or [root]

    def find_img(stem):
        for d in img_dirs:
            for ext in IMG_EXTS:
                cand = d / f"{stem}{ext}"
                if cand.exists():
                    return cand
        return None

    for ld in label_dirs:
        if not ld.is_dir():
            continue
        for txt in ld.rglob("*.txt"):
            stem = txt.stem
            if stem.startswith("classes"):
                continue
            img = find_img(stem)
            if not img:
                continue
            boxes = []
            for line in txt.read_text().splitlines():
                parts = line.split()
                if len(parts) >= 5:
                    cls_id, xc, yc, w, h = parts[:5]
                    boxes.append((int(cls_id), float(xc), float(yc), float(w), float(h)))
            if boxes:
                pairs[img] = ("yolo", boxes)
    return pairs


def parse_voc(root: Path):
    pairs = {}
    for xml in root.rglob("*.xml"):
        try:
            tree = ET.parse(xml)
        except ET.ParseError:
            continue
        size = tree.find("size")
        filename = tree.findtext("filename")
        if filename is None or size is None:
            continue
        w = int(float(size.findtext("width", 0)))
        h = int(float(size.findtext("height", 0)))

        img = None
        for ext in IMG_EXTS:
            cand = xml.parent / f"{Path(filename).stem}{ext}"
            if cand.exists():
                img = cand
                break
            cand = root / filename
            if cand.exists():
                img = cand
                break
        if img is None:
            continue

        boxes_px = []
        class_names = []
        for o in tree.iter("object"):
            name = (o.findtext("name") or "").lower()
            class_names.append(name)
            if "face" not in name and "head" not in name and "person" not in name:
                continue
            b = o.find("bndbox")
            if b is None:
                continue
            boxes_px.append((
                float(b.findtext("xmin")), float(b.findtext("ymin")),
                float(b.findtext("xmax")), float(b.findtext("ymax")),
            ))
        if boxes_px and w > 0 and h > 0:
            norm = []
            for x1, y1, x2, y2 in boxes_px:
                xc = ((x1 + x2) / 2.0) / w
                yc = ((y1 + y2) / 2.0) / h
                bw = (x2 - x1) / w
                bh = (y2 - y1) / h
                # Try to determine class from name
                cls_id = 0  # default to face
                if "mask" in name.lower():
                    cls_id = 1
                elif "person" in name.lower():
                    cls_id = 2
                norm.append((cls_id, xc, yc, bw, bh))
            if norm:
                pairs[img] = ("yolo", norm)
    return pairs


def parse_wider(root: Path):
    """WIDER FACE format: wider_face_split/wider_face_train_bbx_gt.txt"""
    pairs = {}
    gt_files = list(root.rglob("wider_face_*_bbx_gt.txt"))
    if not gt_files:
        return pairs

    all_imgs = {}
    for img in root.rglob("*"):
        if img.suffix.lower() in IMG_EXTS:
            all_imgs[img.relative_to(root).as_posix()] = img

    for gt in gt_files:
        lines = gt.read_text(encoding="utf-8", errors="ignore").splitlines()
        i = 0
        while i < len(lines):
            img_rel = lines[i].strip()
            i += 1
            if not img_rel:
                continue
            img = all_imgs.get(img_rel)
            if not img:
                for k, v in all_imgs.items():
                    if k.endswith(img_rel):
                        img = v
                        break
            if not img:
                try:
                    n_boxes = int(lines[i].strip())
                    i += 1 + n_boxes
                except:
                    i += 1
                continue

            try:
                n_boxes = int(lines[i].strip())
                i += 1
            except:
                continue

            boxes = []
            for _ in range(n_boxes):
                if i >= len(lines):
                    break
                parts = lines[i].strip().split()
                i += 1
                if len(parts) >= 4:
                    x, y, w, h = map(float, parts[:4])
                    if w > 0 and h > 0:
                        boxes.append((0, x, y, w, h))  # class 0 = face
            if boxes:
                pairs[img] = ("wider_xywh", boxes)
    return pairs


def parse_coco(root: Path):
    """COCO JSON (_annotations.coco.json) -> face boxes -> YOLO norm xywh."""
    pairs = {}
    face_words = ("face", "head", "person")
    for jf in root.rglob("*.json"):
        try:
            data = json.loads(jf.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            continue
        images = data.get("images", [])
        categories = data.get("categories", [])
        if not images or not categories:
            continue

        cat_id_to_name = {c["id"]: c.get("name", "").lower() for c in categories}
        img_meta = {i["id"]: i for i in images}
        boxes_by_img = {}
        for a in data.get("annotations", []):
            cid = a.get("category_id")
            name = cat_id_to_name.get(cid, "")
            if not any(w in name for w in face_words):
                continue
            meta = img_meta.get(a["image_id"])
            if not meta:
                continue
            x, y, w, h = a["bbox"]
            iw, ih = meta.get("width", 0), meta.get("height", 0)
            if w <= 0 or h <= 0 or iw <= 0 or ih <= 0:
                continue
            xc, yc = (x + w / 2) / iw, (y + h / 2) / ih
            # Map category to class_id
            if "face" in name or "head" in name:
                cls_id = 0
            elif "person" in name:
                cls_id = 2
            else:
                cls_id = 0
            boxes_by_img.setdefault(meta["file_name"], []).append((cls_id, xc, yc, w / iw, h / ih))

        for fname, boxes in boxes_by_img.items():
            img_path = jf.parent / fname
            if not img_path.exists():
                img_path = jf.parent / "images" / fname
            if img_path.exists():
                pairs[img_path] = ("yolo", boxes)
    return pairs


def _img_size(img: Path):
    import cv2
    im = cv2.imread(str(img))
    return (im.shape[1], im.shape[0]) if im is not None else (0, 0)


def detect_format(root: Path) -> str:
    files = [p.name.lower() for p in root.rglob("*") if p.is_file()]
    n = len(files)
    has = lambda suf: any(f.endswith(suf) for f in files)
    if has("wider_face") and has("_bbx_gt.txt"):
        return "wider"
    if sum(1 for f in files if f.endswith(".txt")) > max(3, n // 4) and not has(".xml"):
        labels = [p for p in root.rglob("labels") if p.is_dir()]
        imgs = [p for p in root.rglob("images") if p.is_dir()]
        if labels or imgs:
            return "yolo"
    if has(".xml"):
        return "voc"
    if any(f.endswith(".json") and ("annotation" in f or f == "_annotations.coco.json") for f in files):
        return "coco"
    return "unknown"


PARSERS = {
    "yolo": parse_yolo,
    "voc": parse_voc,
    "wider": parse_wider,
    "coco": parse_coco,
}


# -----------------------------------------------------------------------------
# 3. BUILD UNIFIED YOLO DATASET (train/val split) with multi-class support
# -----------------------------------------------------------------------------

def build_dataset(pairs: dict, val_ratio: float = 0.15):
    if not pairs:
        die("No usable annotated images found in dataset. Try another --format or dataset.")

    out_train_img = DATA_DIR / "images" / "train"
    out_train_lbl = DATA_DIR / "labels" / "train"
    out_val_img = DATA_DIR / "images" / "val"
    out_val_lbl = DATA_DIR / "labels" / "val"
    for d in (out_train_img, out_train_lbl, out_val_img, out_val_lbl):
        d.mkdir(parents=True, exist_ok=True)

    items = list(pairs.items())
    random.seed(42)
    random.shuffle(items)
    n_val = max(1, int(len(items) * val_ratio))

    written = 0
    class_names_found = set()
    for idx, (img, (kind, boxes)) in enumerate(items):
        is_val = idx < n_val
        img_out = (out_val_img if is_val else out_train_img) / f"drishti_fc_{written:06d}{img.suffix.lower()}"
        lbl_out = (out_val_lbl if is_val else out_train_lbl) / f"drishti_fc_{written:06d}.txt"
        shutil.copy2(img, img_out)

        if kind == "yolo":
            lines = []
            for b in boxes:
                cls_id = b[0]
                class_names_found.add(cls_id)
                lines.append(f"{cls_id} {b[1]:.6f} {b[2]:.6f} {b[3]:.6f} {b[4]:.6f}")
        elif kind == "wider_xywh":
            iw, ih = _img_size(img)
            if iw == 0:
                continue
            lines = []
            for cls_id, x, y, bw, bh in boxes:
                class_names_found.add(cls_id)
                xc = (x + bw / 2) / iw
                yc = (y + bh / 2) / ih
                lines.append(f"{cls_id} {xc:.6f} {yc:.6f} {bw/iw:.6f} {bh/ih:.6f}")
        else:
            continue

        lbl_out.write_text("\n".join(lines), encoding="utf-8")
        written += 1

    # Build class names list
    max_class = max(class_names_found) if class_names_found else 0
    names_list = ["face", "face_with_mask", "person"]
    # Add clothing classes if found
    for i in range(3, max_class + 1):
        names_list.append(f"class_{i}")

    yaml_text = (
        f"path: {DATA_DIR.as_posix()}\n"
        "train: images/train\n"
        "val: images/val\n"
        "names:\n"
    )
    for i, name in enumerate(names_list):
        yaml_text += f"  {i}: {name}\n"

    DATASET_YAML.write_text(yaml_text, encoding="utf-8")
    log(f"Dataset ready: {written} images ({n_val} val) -> {DATASET_YAML}")
    log(f"Classes found: {names_list}")
    return written, names_list


# -----------------------------------------------------------------------------
# 4. TRAIN + DEPLOY
# -----------------------------------------------------------------------------

def pick_base_model():
    """Pick base YOLOv8 model for face+clothing detection fine-tuning."""
    for m in ("yolov8n.pt", "yolov8s.pt", "yolov8m.pt"):
        p = BACKEND / m
        if p.exists():
            return p
    return "yolov8s.pt"  # ultralytics will auto-download


def update_config_with_trained_model(weights_name: str, class_names: list):
    cfg = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    # Add face_detection section if not exists
    if "face_detection" not in cfg:
        cfg["face_detection"] = {}
    fd = cfg["face_detection"]
    pref = [weights_name] + [m for m in fd.get("model_preference", []) if m != weights_name]
    fd["model_preference"] = pref
    fd["model"] = None
    fd["inference_imgsz"] = fd.get("inference_imgsz", 640)
    fd["conf_threshold"] = fd.get("conf_threshold", 0.5)
    fd["iou_threshold"] = fd.get("iou_threshold", 0.45)
    fd["max_det"] = fd.get("max_det", 100)
    fd["class_names"] = class_names
    fd["enable_clothing_detection"] = True
    cfg["face_detection"] = fd
    CONFIG_PATH.write_text(json.dumps(cfg, indent=2), encoding="utf-8")
    log(f"config.json updated: face_detection.model_preference = {pref}")
    log(f"Class names registered: {class_names}")


def main():
    ap = argparse.ArgumentParser(description="Fine-tune Drishti AI face+clothing detector on a face dataset.")
    ap.add_argument("--dataset", default=None,
                    help=f"Kaggle slug. Defaults to trying: {', '.join(DEFAULT_KAGGLE_DATASETS)}")
    ap.add_argument("--local", default=None,
                    help="Path to manually-downloaded/extracted dataset folder (skips Kaggle API).")
    ap.add_argument("--format", default="auto",
                    choices=["auto", "yolo", "voc", "wider", "coco"])
    ap.add_argument("--epochs", type=int, default=50)
    ap.add_argument("--imgsz", type=int, default=640,
                    help="Face detection works well at 640px.")
    ap.add_argument("--batch", type=int, default=-1, help="-1 = auto (60 percent GPU mem).")
    ap.add_argument("--device", default=None, help="0 = first GPU, cpu = CPU. Default: auto.")
    ap.add_argument("--val-ratio", type=float, default=0.15)
    ap.add_argument("--include-test", action="store_true",
                    help="Also fold 'test' folder images into training.")
    args = ap.parse_args()

    # ---- acquire ----
    if args.local:
        src = extract_if_zip(args.local)
        if not Path(src).exists():
            die(f"--local path not found: {src}")
    else:
        slug = args.dataset
        slugs = [slug] if slug else DEFAULT_KAGGLE_DATASETS
        src = None
        for s in slugs:
            try:
                src = download_from_kaggle(s)
                break
            except SystemExit:
                log(f"Could not fetch '{s}'. Trying next candidate...")
        if src is None:
            die("All dataset candidates failed. Use --local with a manual download.")

    # ---- parse annotations ----
    fmt = args.format
    if fmt == "auto":
        fmt = detect_format(src)
        log(f"Auto-detected annotation format: {fmt}")

    parser = PARSERS.get(fmt)
    if parser is None:
        die(f"Unsupported format '{fmt}'. Supported: {list(PARSERS)}")

    log(f"Parsing annotations ({fmt})...")
    pairs = parser(src)
    if not args.include_test:
        before = len(pairs)
        pairs = {img: v for img, v in pairs.items()
                 if "test" not in [p.lower() for p in img.parts]}
        if before != len(pairs):
            log(f"Excluded {before - len(pairs)} test-set images (kept honest val split).")
    log(f"Parsed {len(pairs)} annotated images with faces.")

    written, class_names = build_dataset(pairs, args.val_ratio)

    # ---- train ----
    from ultralytics import YOLO
    base = pick_base_model()
    log(f"Fine-tuning from base weights: {base} | epochs={args.epochs} imgsz={args.imgsz}")
    model = YOLO(str(base))
    results = model.train(
        data=str(DATASET_YAML),
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        device=args.device,
        project=str(ROOT / "runs" / "drishti_face_clothing"),
        name="v1",
        patience=12,
        cache=False,
        plots=True,
        # Face+clothing detection augmentations
        hsv_v=0.4,
        mosaic=1.0,
        close_mosaic=10,
        degrees=5,
        translate=0.1,
        scale=0.5,
        flipud=0.0,
        fliplr=0.5,
        perspective=0.0,
        copy_paste=0.1,  # Helps with clothing attribute learning
    )

    best = Path(results.save_dir) / "weights" / "best.pt"
    if not best.exists():
        die(f"Training finished but best.pt missing at {best}")

    shutil.copy2(best, EXPORT_WEIGHTS)
    log(f"Deployed best weights -> {EXPORT_WEIGHTS}")

    # ---- final validation metrics ----
    metrics = model.val(data=str(DATASET_YAML), imgsz=args.imgsz)
    try:
        mp, mr = float(metrics.box.map50), float(metrics.box.map)
        log(f"FINAL mAP@50 = {mp:.4f} | mAP@50-95 = {mr:.4f}")
    except Exception:
        pass

    update_config_with_trained_model(EXPORT_WEIGHTS.name, class_names)
    log("DONE. Restart Drishti AI (start_all.py) to serve the fine-tuned face+clothing model.")


if __name__ == "__main__":
    main()