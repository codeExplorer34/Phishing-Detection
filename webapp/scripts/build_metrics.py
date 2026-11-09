"""Build webapp/data/metrics.json: every number shown on the site, from its real source.

1. Member 2 and Member 3 result CSVs (in-domain test scores).
2. Member 3 slash-bug check CSVs.
3. A cross-dataset check run here: each model scored on links neither model saw in training.

    python webapp/scripts/build_metrics.py      (takes about 1-2 minutes)
"""
import json
import sys
from datetime import date
from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import f1_score

ROOT = Path(__file__).resolve().parents[2]
M2 = ROOT / "Member 2/csit375project/csit375project"
M3 = ROOT / "Member 3/phishing_text"
DATA = ROOT / "Member 1/data/processed"
OUT = ROOT / "webapp/data/metrics.json"
THRESHOLD = 0.5

sys.path.insert(0, str(M3 / "src"))
sys.path.insert(0, str(M2))
from text_utils import normalize_url  # noqa: E402
from url_features import features_frame  # noqa: E402


def r3(x: float) -> float:
    return round(float(x), 3)


def in_domain() -> dict:
    m2 = pd.read_csv(M2 / "outputs/results/test_results.csv")
    m3 = pd.read_csv(M3 / "results/test_results.csv")
    rf = m2[m2.model == "RandomForest"].set_index("scenario")
    lr = m3[m3.model == "LogisticRegression"].set_index("task")
    return {
        "model_a_all_features_f1": r3(rf.loc["all_features", "f1"]),
        "model_a_no_leakage_f1": r3(rf.loc["no_leakage", "f1"]),
        "model_a_url_only_f1": r3(rf.loc["url_only", "f1"]),
        "model_b_binary_f1": r3(lr.loc["binary", "f1"]),
        "model_b_multiclass_macro_f1": r3(m3[(m3.task == "multiclass") & (m3.model == "LinearSVM")].f1.iloc[0]),
    }


def slash_bug() -> dict:
    before = pd.read_csv(M3 / "results/slash_check_before_fix_testset.csv").iloc[0]
    after = pd.read_csv(M3 / "results/slash_check_after_fix_testset.csv").iloc[0]
    return {"domains": int(before.host_only_test_urls),
            "flip_rate_before": r3(before.verdict_flips_when_slash_added),
            "flip_rate_after": r3(after.verdict_flips_when_slash_added)}


def ip_mismatches() -> int:
    agree = pd.read_csv(M2 / "outputs/results/feature_agreement.csv").set_index("feature")
    train = pd.read_csv(DATA / "numeric_train.csv", usecols=["url", "ip"])
    calc = features_frame(train.url)
    return int(((train.ip == 1) & (calc.ip == 0)).sum()) if agree.loc["ip", "kept"] == False else 0  # noqa: E712


def cross_dataset() -> dict:
    a = joblib.load(M2 / "outputs/models/numeric_url_model.pkl")
    feats = json.loads((M2 / "outputs/models/numeric_url_features.json").read_text())["features"]
    b = joblib.load(M3 / "models/text_model.pkl")
    seen_b = set(pd.read_csv(DATA / "url_train.csv", usecols=["url"]).url.map(normalize_url))
    seen_a = set(pd.read_csv(DATA / "numeric_train.csv", usecols=["url"]).url.map(normalize_url))

    web = pd.read_csv(DATA / "numeric_test.csv", usecols=["url", "label"])
    web = web[~web.url.map(normalize_url).isin(seen_b)]
    urls = pd.read_csv(DATA / "url_test.csv")
    urls = urls[urls.type.isin(["benign", "phishing"])]
    urls = urls[~urls.url.map(normalize_url).isin(seen_a)]
    urls = pd.DataFrame({"url": urls.url, "label": (urls.type == "phishing").astype(int)})

    out = {}
    for name, df in (("web_page", web), ("url", urls)):
        p_a = a.predict_proba(features_frame(df.url)[feats])[:, 1]
        p_b = b.predict_proba(df.url)[:, 1]
        y = df.label.values
        score = lambda p: r3(f1_score(y, (p >= THRESHOLD).astype(int)))  # noqa: E731
        out[name] = {"links": int(len(df)), "a": score(p_a), "b": score(p_b), "both": score((p_a + p_b) / 2)}
    return out


def main() -> None:
    metrics = {
        "last_updated": date.today().isoformat(),
        "threshold": THRESHOLD,
        "in_domain": in_domain(),
        "cross_dataset": cross_dataset(),
        "slash_bug": slash_bug(),
        "ip_mismatches": ip_mismatches(),
        "splits": {"url_train": 512890, "url_test": 128223},
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(metrics, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(metrics, indent=2))
    write_example()


def write_example() -> None:
    """The 'Example result' shown before a visitor checks anything: real output of the app's scorer."""
    sys.path.insert(0, str(ROOT / "webapp/api"))
    from fishy.scanner import score_url

    example = score_url(EXAMPLE_URL)
    (OUT.parent / "example-result.json").write_text(json.dumps(example, indent=2, ensure_ascii=False) + "\n",
                                                    encoding="utf-8")
    print(f"example: {EXAMPLE_URL} -> {example['verdict']} {example['risk']}")


EXAMPLE_URL = "http://paypa1-secure-update.com/signin"


if __name__ == "__main__":
    main()
