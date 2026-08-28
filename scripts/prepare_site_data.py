"""
Site Data Preparation Tool — Temple CCTV footage -> label-ready frames
======================================================================
Apne mandir ke CCTV/video clips is script ko do — ye smartly frames
nikaal ke Roboflow pe label karne ke liye taiyaar kar dega.

USAGE:
  # Saare clips ek folder mein daalo (ya per-temple alag):
  python scripts\prepare_site_data.py --input "C:\footage\somnath" --temple tmp_somnath
  python scripts\prepare_site_data.py --input "C:\footage\dwarka"   --temple tmp_dwarka
  python scripts\prepare_site_data.py --input "C:\footage\ambaji"   --temple tmp_ambaji
  python scripts\prepare_site_data.py --input "C:\footage\pavagadh" --temple tmp_pavagadh

OUTPUT:
  data\site_training\<temple>\images\*.jpg   <- ye Roboflow pe upload karo

KYA KARTA HAI:
  - Har video se har N second pe frame nikaalta hai (default 2 sec)
  - Near-duplicate frames SKIP karta hai (crowd same dikhe to waste)
  - Busy/high-variety frames prefer karta hai (zyada log = zyada value)
"""

import argparse
import cv2
import numpy as np
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VIDEO_EXTS = {".mp4", ".avi", ".mkv", ".mov", ".wmv", ".ts", ".flv"}


def frame_signature(small_gray):
    """Coarse signature for near-duplicate detection."""
    return (small_gray / 32).astype(np.uint8)


def sig_distance(a, b):
    return float(np.mean(np.abs(a.astype(np.int16) - b.astype(np.int16))))


def extract_from_video(video_path, out_dir, every_n_sec, dup_thresh, max_frames, counter_start):
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        print(f"[SKIP] Cannot open: {video_path.name}")
        return counter_start

    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    step = max(1, int(fps * every_n_sec))
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"[VIDEO] {video_path.name} ({total // int(fps)}s @ {fps:.0f}fps)")

    recent_sigs = []
    saved = counter_start
    idx = 0

    while True:
        ret = cap.grab()
        if not ret:
            break
        if idx % step == 0:
            ret, frame = cap.retrieve()
            if not ret:
                break

            small = cv2.resize(frame, (64, 36))
            gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
            sig = frame_signature(gray)

            # skip near-duplicates of last few kept frames
            if any(sig_distance(sig, s) < dup_thresh for s in recent_sigs):
                idx += 1
                continue

            # prefer busier frames: edge density proxy
            edges = cv2.Canny(cv2.resize(frame, (320, 180)), 80, 160)
            busy_score = float(np.mean(edges > 0))

            out_name = f"{out_dir.name}_{saved:05d}_b{int(busy_score * 100):02d}.jpg"
            cv2.imwrite(str(out_dir / out_name), frame, [cv2.IMWRITE_JPEG_QUALITY, 88])
            saved += 1

            recent_sigs.append(sig)
            if len(recent_sigs) > 6:
                recent_sigs.pop(0)

            if max_frames and saved >= max_frames:
                break
        idx += 1

    cap.release()
    print(f"[OK] {video_path.name}: {saved - counter_start} unique frames")
    return saved


def main():
    ap = argparse.ArgumentParser(description="Temple CCTV footage -> label-ready frames")
    ap.add_argument("--input", required=True, help="Folder jisme mandir ke videos hain")
    ap.add_argument("--temple", required=True,
                    choices=["tmp_somnath", "tmp_dwarka", "tmp_ambaji", "tmp_pavagadh"])
    ap.add_argument("--every-n-sec", type=float, default=2.0)
    ap.add_argument("--dup-thresh", type=float, default=4.0,
                    help="Isse kam difference = duplicate (4 default)")
    ap.add_argument("--max-frames", type=int, default=400,
                    help="Per run maximum frames (Roboflow free tier friendly)")
    args = ap.parse_args()

    src = Path(args.input)
    if not src.exists():
        print(f"[ERROR] Input folder nahi mila: {src}")
        return

    out_dir = ROOT / "data" / "site_training" / args.temple / "images"
    out_dir.mkdir(parents=True, exist_ok=True)

    videos = [p for p in sorted(src.rglob("*")) if p.suffix.lower() in VIDEO_EXTS]
    if not videos:
        print(f"[ERROR] {src} mein koi video nahi mili ({', '.join(sorted(VIDEO_EXTS))})")
        return

    print(f"\n[PREPARE] {args.temple}: {len(videos)} videos -> {out_dir}\n")
    counter = len(list(out_dir.glob("*.jpg")))
    for v in videos:
        counter = extract_from_video(v, out_dir, args.every_n_sec, args.dup_thresh, None, counter)

    total = len(list(out_dir.glob("*.jpg")))
    print("\n" + "=" * 60)
    print(f"DONE: {total} total frames ready in:")
    print(f"  {out_dir}")
    print("=" * 60)
    print("""
NEXT STEPS (har mandir ke liye):
1. roboflow.com -> free account -> New Project
     Project type: Object Detection | Class: sirf 'person'
2. Is images folder ki jpgs upload karo (~200-400 best)
3. Label karo (box har insaan pe) -> Generate -> Export
     Format: YOLOv8 (zip download)
4. Zip extract karke mujhe path batao — main existing dataset ke
   saath MERGE karke final fine-tune chala dunga (target ~95%%)
""")


if __name__ == "__main__":
    main()
