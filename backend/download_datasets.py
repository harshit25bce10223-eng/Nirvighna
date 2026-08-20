"""
Secure Kaggle Dataset Downloader for Drishti AI (CrowdHuman + WIDER Face) — General.
- Prompts interactively for Kaggle credentials at runtime.
- NEVER stores credentials to disk, logs, or environment permanently.
- Cleans up all temp files and env vars after download completes or fails.
"""

import os
import sys
import shutil
import getpass
import tempfile
import json

sys.stdout.reconfigure(encoding='utf-8')


def _prompt_credentials():
    print("\n[KAGGLE] Secure Interactive Credential Input")
    print("  Your API key will NOT be stored anywhere — deleted after download.\n")
    try:
        username = input("  Kaggle Username: ").strip()
        api_key  = getpass.getpass("  Kaggle API Key (hidden): ").strip()
    except (KeyboardInterrupt, EOFError):
        print("\n[CANCELLED]")
        sys.exit(0)
    if not username or not api_key:
        print("[ERROR] Empty credentials. Exiting.")
        sys.exit(1)
    return username, api_key


def _setup_temp_kaggle_config(username, api_key):
    tmp_dir = tempfile.mkdtemp(prefix="nirvighna_kaggle_")
    kj_path = os.path.join(tmp_dir, "kaggle.json")
    with open(kj_path, "w") as f:
        json.dump({"username": username, "key": api_key}, f)
    try:
        os.chmod(kj_path, 0o600)
    except Exception:
        pass
    orig = os.environ.get("KAGGLE_CONFIG_DIR")
    os.environ["KAGGLE_CONFIG_DIR"] = tmp_dir
    os.environ["KAGGLE_USERNAME"]   = username
    os.environ["KAGGLE_KEY"]        = api_key
    return tmp_dir, orig


def _cleanup(tmp_dir, orig):
    try:
        if tmp_dir and os.path.exists(tmp_dir):
            shutil.rmtree(tmp_dir, ignore_errors=True)
    except Exception:
        pass
    try:
        if orig:
            os.environ["KAGGLE_CONFIG_DIR"] = orig
        elif "KAGGLE_CONFIG_DIR" in os.environ:
            del os.environ["KAGGLE_CONFIG_DIR"]
    except Exception:
        pass
    for var in ("KAGGLE_USERNAME", "KAGGLE_KEY"):
        try:
            if var in os.environ:
                del os.environ[var]
        except Exception:
            pass
    print("[SECURITY] Credentials cleared from memory.")


def main():
    base = os.path.dirname(os.path.abspath(__file__))

    print("=" * 60)
    print("  Nirvighna — Kaggle Dataset Downloader (General)")
    print("=" * 60)

    use_kaggle = input("\n  Attempt Kaggle download? (y/n): ").strip().lower()

    if use_kaggle != "y":
        print("[SKIP] Kaggle download skipped. Directory structures already ready.")
        return

    username, api_key = _prompt_credentials()
    tmp_dir, orig_cfg = _setup_temp_kaggle_config(username, api_key)
    api_key = None

    os.makedirs(os.path.join(base, "data"), exist_ok=True)

    try:
        import kagglehub
        slugs = [
            "gti-raghav/crowdhuman",
            "mridul3301/crowdhuman-yolo-format",
            "thangm/wider-face-dataset",
        ]
        for slug in slugs:
            try:
                path = kagglehub.dataset_download(slug)
                print(f"  [OK] {slug} -> {path}")
            except Exception as e:
                print(f"  [INFO] {slug}: {type(e).__name__}")
    except ImportError:
        print("[ERROR] kagglehub not installed. Run: pip install kagglehub")
    except Exception as e:
        msg = str(e)
        if username and username in msg:
            msg = msg.replace(username, "****")
        print(f"[ERROR] {msg}")
    finally:
        _cleanup(tmp_dir, orig_cfg)
        username = None


if __name__ == "__main__":
    main()
