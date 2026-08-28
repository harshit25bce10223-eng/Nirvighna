"""Background dataset downloader for Drishti AI training."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))
from train_drishti import download_from_kaggle, DEFAULT_KAGGLE_DATASETS  # noqa: E402

slug = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_KAGGLE_DATASETS[0]
print(f"[BG-DOWNLOAD] Fetching {slug} ...", flush=True)
try:
    p = download_from_kaggle(slug)
    print(f"[BG-DOWNLOAD] DONE -> {p}", flush=True)
except SystemExit as e:
    print(f"[BG-DOWNLOAD] FAILED: {e}", flush=True)
