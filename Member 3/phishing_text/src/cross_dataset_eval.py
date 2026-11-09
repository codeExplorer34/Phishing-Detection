#!/usr/bin/env python3
"""Cross-dataset test: score Member 1's *other* dataset (numeric_train/test.csv, which has a `url`
column and a phishing/legitimate `label`) with the saved text model.

URLs that also appear in url_train.csv are removed so the model is never tested on what it trained on.
Usage:
    python src/cross_dataset_eval.py --data data/processed
"""
import argparse
import sys
from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import (accuracy_score, confusion_matrix, f1_score,
                             precision_score, recall_score, roc_auc_score)

sys.path.insert(0, str(Path(__file__).resolve().parent))
from text_utils import normalize_url  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default="data/processed")
    ap.add_argument("--models", default="models")
    ap.add_argument("--out", default="results")
    a = ap.parse_args()
    d = Path(a.data)
    n = pd.concat([pd.read_csv(d / "numeric_train.csv", usecols=["url", "label"]),
                   pd.read_csv(d / "numeric_test.csv", usecols=["url", "label"])])
    n["norm"] = n.url.map(normalize_url)
    seen = set(pd.read_csv(d / "url_train.csv").url.map(normalize_url))
    clean = n[~n.norm.isin(seen)]
    print(f"{len(n):,} URLs in the other dataset; {len(n) - len(clean):,} also in url_train.csv (removed); "
          f"evaluating on {len(clean):,}")
    m = joblib.load(Path(a.models) / "text_model.pkl")
    p = m.predict_proba(clean.url)[:, 1]
    rows = []
    for thr in (0.5, 0.7, 0.9):
        pr = (p >= thr).astype(int)
        tn, fp, fn, tp = confusion_matrix(clean.label, pr).ravel()
        rows.append({"threshold": thr, "accuracy": accuracy_score(clean.label, pr),
                     "precision": precision_score(clean.label, pr), "recall": recall_score(clean.label, pr),
                     "f1": f1_score(clean.label, pr), "TN": tn, "FP": fp, "FN": fn, "TP": tp,
                     "legit_flagged_rate": fp / (tn + fp)})
    res = pd.DataFrame(rows).round(4)
    res["roc_auc"] = round(roc_auc_score(clean.label, p), 4)
    Path(a.out).mkdir(exist_ok=True)
    res.to_csv(Path(a.out) / "cross_dataset_eval.csv", index=False)
    print(res.to_string(index=False))


if __name__ == "__main__":
    main()
