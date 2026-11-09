#!/usr/bin/env python3
"""Regression test for the trailing-slash artefact.

Dataset artefact: 23% of phishing URLs were bare hostnames (no '/') versus 0.1% of benign URLs,
so the model learned "no trailing slash => phishing" (https://www.google.com -> 99.96% malicious,
https://www.google.com/ -> 0.7%). A correct model must give (almost) the same answer for
`host` and `host/`.

Usage:
    python src/slash_bug_check.py --tag before_fix     (writes results/slash_check_<tag>_*.csv)
"""
import argparse
import re
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
import text_utils  # noqa: F401,E402

EXAMPLES = ["https://www.google.com", "https://github.com", "https://www.bbc.co.uk",
            "https://en.wikipedia.org", "https://www.microsoft.com", "https://www.amazon.com",
            "http://paypa1.com.account-verify.ru"]


def host_only(url):
    u = re.sub(r"^(?:https?|ftp)://", "", str(url).strip().lower())
    u = re.sub(r"^www\d*\.", "", u).rstrip("/")
    return u if u and not re.search(r"[/?#]", u) else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--models", default="models")
    ap.add_argument("--test", default="data/processed/url_test.csv")
    ap.add_argument("--tag", default="check")
    ap.add_argument("--n", type=int, default=20000)
    ap.add_argument("--out", default="results")
    a = ap.parse_args()
    m = joblib.load(Path(a.models) / "text_model.pkl")
    out = Path(a.out); out.mkdir(exist_ok=True)

    rows = [{"url": u, "p_without_slash": m.predict_proba([u])[0, 1],
             "p_with_slash": m.predict_proba([u + "/"])[0, 1]} for u in EXAMPLES]
    pairs = pd.DataFrame(rows).round(4)
    pairs.to_csv(out / f"slash_check_{a.tag}_examples.csv", index=False)
    print(pairs.to_string(index=False))

    te = pd.read_csv(a.test)
    te["host"] = te.url.map(host_only)
    h = te.dropna(subset=["host"]).sample(frac=1, random_state=42).head(a.n)
    p0 = m.predict_proba(h.host.tolist())[:, 1]
    p1 = m.predict_proba((h.host + "/").tolist())[:, 1]
    flip = ((p0 >= .5) != (p1 >= .5))
    summ = pd.DataFrame([{"host_only_test_urls": len(h),
                          "share_malicious_true": h.is_malicious.mean(),
                          "verdict_flips_when_slash_added": flip.mean(),
                          "mean_abs_prob_change": np.abs(p0 - p1).mean(),
                          "acc_without_slash": ((p0 >= .5) == h.is_malicious.values).mean(),
                          "acc_with_slash": ((p1 >= .5) == h.is_malicious.values).mean()}]).round(4)
    summ.to_csv(out / f"slash_check_{a.tag}_testset.csv", index=False)
    print("\nHost-only URLs from the test set, `host` vs `host/`:")
    print(summ.T.to_string(header=False))
    assert flip.mean() < 0.01 or a.tag == "before_fix", "Trailing-slash invariance violated"


if __name__ == "__main__":
    main()
