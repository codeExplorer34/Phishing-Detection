"""Run the saved URL-only model on hand-picked URLs (output samples for the report).

Run (from this folder, after phishing_model_numeric.py):
    python spot_check.py
    python spot_check.py "http://example.com/login" "https://www.google.com"
"""
import json
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from url_features import features_frame

HERE = Path(__file__).resolve().parent
MODELS = HERE / "outputs/models"

SPOT_CHECK_URLS = [
    "https://www.google.com", "https://www.google.com/",
    "https://www.amazon.com", "https://www.microsoft.com",
    "https://www.bbc.co.uk/news", "https://github.com/login",
    "http://192.168.4.2/paypal-login-verify/account.php",
    "http://paypa1-secure-update.com/signin",
    "http://free-gift-card.xyz/claim.exe",
]


def predict(urls):
    model_file, meta_file = MODELS / "numeric_url_model.pkl", MODELS / "numeric_url_features.json"
    if not model_file.exists():
        raise SystemExit("No saved model - run phishing_model_numeric.py first.")
    model = joblib.load(model_file)
    feats = json.loads(meta_file.read_text())["features"]
    p = model.predict_proba(features_frame(urls)[feats])[:, 1]
    return pd.DataFrame({"url": urls, "p_phishing": p.round(4),
                         "verdict": np.where(p >= 0.5, "PHISHING", "LEGITIMATE")})


if __name__ == "__main__":
    urls = sys.argv[1:] or SPOT_CHECK_URLS
    res = predict(urls)
    print(res.to_string(index=False))
    if not sys.argv[1:]:
        res.to_csv(HERE / "outputs/results/spot_checks.csv", index=False)
        print("saved outputs/results/spot_checks.csv")
