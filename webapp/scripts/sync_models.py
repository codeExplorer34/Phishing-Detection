"""Copy the members' trained models and the helper modules they need into webapp/api/.

Vercel only uploads the webapp/ folder, so the files must live inside it. The member
folders stay the single source of truth: re-run this script whenever a member retrains.

    python webapp/scripts/sync_models.py
"""
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]          # D:/375 Project
API = ROOT / "webapp" / "api"

COPIES = {
    # Model A (Member 2): Random Forest on URL-only features
    ROOT / "Member 2/csit375project/csit375project/outputs/models/numeric_url_model.pkl": API / "models/numeric_url_model.pkl",
    ROOT / "Member 2/csit375project/csit375project/outputs/models/numeric_url_features.json": API / "models/numeric_url_features.json",
    ROOT / "Member 2/csit375project/csit375project/url_features.py": API / "url_features.py",
    # Model B (Member 3): TF-IDF character n-grams + Logistic Regression
    ROOT / "Member 3/phishing_text/models/text_model.pkl": API / "models/text_model.pkl",
    ROOT / "Member 3/phishing_text/models/text_model_multiclass.pkl": API / "models/text_model_multiclass.pkl",
    # The pickled pipelines reference the module name `text_utils`, so it must be importable.
    ROOT / "Member 3/phishing_text/src/text_utils.py": API / "text_utils.py",
}


def main() -> int:
    missing = [str(src) for src in COPIES if not src.exists()]
    if missing:
        print("Missing source files:\n  " + "\n  ".join(missing), file=sys.stderr)
        return 1
    for src, dst in COPIES.items():
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        print(f"copied {src.relative_to(ROOT)} -> {dst.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
