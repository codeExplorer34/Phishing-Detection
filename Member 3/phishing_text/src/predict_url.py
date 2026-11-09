#!/usr/bin/env python3
"""Classify one or more URLs with the saved text (TF-IDF) models.

Usage:
    python src/predict_url.py "http://paypal-login.example.com/verify"
    python src/predict_url.py url1 url2 url3

Use inside another script (e.g. Member 4's Streamlit app):
    import sys; sys.path.insert(0, "src")
    from predict_url import TextURLClassifier
    clf = TextURLClassifier("models")
    clf.predict("http://example.com/login")
"""
import sys
from pathlib import Path

import joblib

sys.path.insert(0, str(Path(__file__).resolve().parent))
import text_utils  # noqa: F401,E402  (needed so the pickled pipelines can be loaded)


class TextURLClassifier:
    def __init__(self, model_dir="models", threshold=0.5):
        d = Path(model_dir)
        self.binary = joblib.load(d / "text_model.pkl")
        self.multi = joblib.load(d / "text_model_multiclass.pkl")
        self.threshold = threshold

    def predict(self, url: str) -> dict:
        p_mal = float(self.binary.predict_proba([url])[0, 1])
        probs = self.multi.predict_proba([url])[0]
        classes = list(self.multi.classes_)
        label = "MALICIOUS" if p_mal >= self.threshold else "BENIGN"
        return {
            "url": url,
            "verdict": label,
            "malicious_probability": round(p_mal, 4),
            "predicted_type": classes[int(probs.argmax())],
            "type_probabilities": {c: round(float(p), 4) for c, p in zip(classes, probs)},
        }


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    root = Path(__file__).resolve().parent.parent
    clf = TextURLClassifier(root / "models")
    for url in sys.argv[1:]:
        r = clf.predict(url)
        icon = "ALERT " if r["verdict"] == "MALICIOUS" else "OK    "
        print(f"{icon}{r['verdict']:9s} p(malicious)={r['malicious_probability']:.3f} "
              f"type={r['predicted_type']:10s} {r['url']}")


if __name__ == "__main__":
    main()
