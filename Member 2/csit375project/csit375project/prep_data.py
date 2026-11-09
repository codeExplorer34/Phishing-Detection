
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split

SEED = 42
TEST_SIZE = 0.20
RAW = Path(".")
OUT = Path("data/processed")
FIG = Path("figures")
OUT.mkdir(parents=True, exist_ok=True)
FIG.mkdir(parents=True, exist_ok=True)

report = []  


def log(msg=""):
    print(msg)
    report.append(str(msg))


def save_fig(name):
    plt.tight_layout()
    plt.savefig(FIG / name, dpi=150)
    plt.close()


# ---------------------------------------------------------------------------
# 1) NUMERIC FEATURE DATASET 
# ---------------------------------------------------------------------------
def prep_numeric():
    log("=" * 60)
    log("NUMERIC DATASET (dataset_phishing.csv)")
    log("=" * 60)
    df = pd.read_csv(RAW / "dataset_phishing.csv")
    log(f"Raw shape: {df.shape}")

    # target: 'status' = legitimate / phishing -> 0 / 1
    df["label"] = (df["status"].str.lower() == "phishing").astype(int)
    df = df.drop(columns=["status"])

    # cleaning
    n0 = len(df)
    df = df.replace([np.inf, -np.inf], np.nan)
    missing = int(df.isna().sum().sum())
    df = df.dropna()
    df = df.drop_duplicates(subset="url")  # same URL twice = leakage risk
    log(f"Missing values dropped: {missing} | rows removed total: {n0 - len(df)}")

    # constant columns carry no information
    feats = [c for c in df.columns if c not in ("url", "label")]
    const = [c for c in feats if df[c].nunique() <= 1]
    df = df.drop(columns=const)
    log(f"Constant columns dropped: {const}")

    feats = [c for c in df.columns if c not in ("url", "label")]
    log(f"Clean shape: {df.shape} | numeric features: {len(feats)}")
    log("Class balance:\n" + df["label"].value_counts().rename({0: "legitimate", 1: "phishing"}).to_string())

    # --- charts ---
    ax = df["label"].map({0: "legitimate", 1: "phishing"}).value_counts().plot.bar(color=["#4c9f70", "#d9534f"])
    ax.set_title("Class balance - URL feature dataset")
    ax.set_ylabel("Count")
    plt.xticks(rotation=0)
    save_fig("numeric_class_balance.png")

    corr = df[feats + ["label"]].corr()["label"].drop("label").sort_values(key=abs, ascending=False).head(15)
    corr.sort_values().plot.barh(color="#337ab7")
    plt.title("Top 15 features by correlation with phishing label")
    save_fig("numeric_top_correlations.png")
    log("Top 5 correlated features:\n" + corr.head(5).round(3).to_string())

    for col in ["length_url", "length_hostname", "nb_dots", "nb_www", "google_index", "page_rank"]:
        if col in df.columns:
            plt.figure(figsize=(6, 4))
            sns.boxplot(data=df, x="label", y=col, showfliers=False)
            plt.xticks([0, 1], ["legitimate", "phishing"])
            plt.title(f"{col} by class")
            save_fig(f"numeric_box_{col}.png")

    # --- split (stratified; url column kept for reference, drop it before training) ---
    train, test = train_test_split(df, test_size=TEST_SIZE, stratify=df["label"], random_state=SEED)
    assert set(train["url"]).isdisjoint(test["url"]), "URL leakage between train and test!"
    train.to_csv(OUT / "numeric_train.csv", index=False)
    test.to_csv(OUT / "numeric_test.csv", index=False)
    log(f"Train: {train.shape} | Test: {test.shape} | no URL overlap: OK")


# ---------------------------------------------------------------------------
# 2) URL STRING DATASET 
# ---------------------------------------------------------------------------
def prep_urls():
    log("")
    log("=" * 60)
    log("URL DATASET (malicious_phish.csv)")
    log("=" * 60)
    df = pd.read_csv(RAW / "malicious_phish.csv")  # columns: url, type
    log(f"Raw shape: {df.shape}")

    n0 = len(df)
    df = df.dropna(subset=["url", "type"])
    df["url"] = df["url"].astype(str).str.strip()
    df["type"] = df["type"].str.lower().str.strip()
    # same URL with conflicting labels = noise, drop all copies
    conflict = df.groupby("url")["type"].nunique()
    bad = conflict[conflict > 1].index
    df = df[~df["url"].isin(bad)]
    df = df.drop_duplicates(subset="url")
    log(f"Rows removed (NaN, dupes, conflicting labels): {n0 - len(df)}")

    # binary label too (benign=0, anything else=1)
    df["is_malicious"] = (df["type"] != "benign").astype(int)
    log("Class counts:\n" + df["type"].value_counts().to_string())

    # --- charts ---
    df["type"].value_counts().plot.bar(color="#337ab7")
    plt.title("URL types (imbalanced - use class weights / stratify)")
    plt.ylabel("Count")
    plt.xticks(rotation=0)
    save_fig("url_class_counts.png")

    df["url_len"] = df["url"].str.len()
    plt.figure(figsize=(7, 4))
    sns.boxplot(data=df, x="type", y="url_len", showfliers=False)
    plt.title("URL length by type")
    save_fig("url_length_by_type.png")

    df = df.drop(columns=["url_len"])

    # --- split (stratified on multi-class type) ---
    train, test = train_test_split(df, test_size=TEST_SIZE, stratify=df["type"], random_state=SEED)
    assert set(train["url"]).isdisjoint(test["url"]), "URL leakage between train and test!"
    train.to_csv(OUT / "url_train.csv", index=False)
    test.to_csv(OUT / "url_test.csv", index=False)
    log(f"Train: {train.shape} | Test: {test.shape} | no URL overlap: OK")


if __name__ == "__main__":
    for name in ("dataset_phishing.csv", "malicious_phish.csv"):
        if not (RAW / name).exists():
            raise SystemExit(f"Missing {RAW / name} - download it from Kaggle first.")
    prep_numeric()
    prep_urls()
    (OUT / "data_report.txt").write_text("\n".join(report), encoding="utf-8")
    log("\nDone. Send data/processed/ to Members 2 and 3, figures/ to Member 4.")