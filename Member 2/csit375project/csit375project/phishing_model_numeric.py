"""CSIT375 - Member 2: numeric-feature phishing classifiers (Model A).

Dataset: Kaggle 'web-page-phishing-detection' (cleaned and split by Member 1).
Models : Logistic Regression, Random Forest, Gradient Boosting.

Three scenarios are compared:
  1. all_features   - all 81 numeric features
  2. no_leakage     - without google_index and page_rank. These come from
                      outside services and almost give the label away, and a
                      real-time detector cannot rely on them.
  3. url_only       - only lexical features calculated from the URL string
                      (url_features.py). This is the model the demo app uses.

For every scenario and model:
  - 5-fold stratified cross-validation on the training set (scaler inside a
    Pipeline, so each fold is scaled using only its own training part)
  - final fit on the full training set, one evaluation on the test set
  - accuracy, precision, recall, F1, classification report, confusion matrix

Run (from this folder):
    python phishing_model_numeric.py
    python phishing_model_numeric.py --data-dir data/processed --out outputs
"""
import argparse
import json
from pathlib import Path

import joblib
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, classification_report,
                             confusion_matrix, f1_score, precision_score,
                             recall_score)
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from url_features import agreement_table, features_frame

SEED = 42
HERE = Path(__file__).resolve().parent
LEAKY = ["google_index", "page_rank"]
SCORING = ["accuracy", "precision", "recall", "f1"]
LABELS = ["legitimate", "phishing"]


def make_models():
    return {
        "LogisticRegression": LogisticRegression(max_iter=2000, random_state=SEED),
        "RandomForest": RandomForestClassifier(n_estimators=200, random_state=SEED, n_jobs=-1),
        "GradientBoosting": GradientBoostingClassifier(n_estimators=100, random_state=SEED),
    }


def plot_cm(cm, title, path):
    """Normalised confusion matrix with raw counts (same style as Member 3)."""
    data = cm / cm.sum(axis=1, keepdims=True)
    fig, ax = plt.subplots(figsize=(4.6, 4.0))
    im = ax.imshow(data, cmap="Blues", vmin=0, vmax=1)
    ax.set_xticks(range(2), LABELS)
    ax.set_yticks(range(2), LABELS)
    ax.set_xlabel("Predicted")
    ax.set_ylabel("True")
    ax.set_title(title, fontsize=10)
    for i in range(2):
        for j in range(2):
            ax.text(j, i, f"{data[i, j]:.2f}\n({cm[i, j]:,})", ha="center", va="center",
                    fontsize=9, color="white" if data[i, j] > 0.5 else "black")
    fig.colorbar(im, fraction=0.046)
    fig.tight_layout()
    fig.savefig(path, dpi=150)
    plt.close(fig)


def plot_importance(pipe, features, title, path, k=15):
    """Top-k Random Forest feature importances."""
    imp = pd.Series(pipe.named_steps["clf"].feature_importances_, index=features)
    imp.sort_values().tail(k).plot.barh(figsize=(6.5, 5), color="#337ab7")
    plt.title(title, fontsize=10)
    plt.xlabel("Importance (mean decrease in impurity)")
    plt.tight_layout()
    plt.savefig(path, dpi=150)
    plt.close()
    return imp.sort_values(ascending=False)


def build_scenarios(train, test, out):
    """Return {scenario: (X_train, X_test)}."""
    feats = [c for c in train.columns if c not in ("url", "label")]
    agree = agreement_table(train)
    agree.to_csv(out / "results/feature_agreement.csv", index=False)
    url_feats = agree.loc[agree["kept"], "feature"].tolist()
    print(f"URL-only features kept after agreement check: {len(url_feats)}")
    # scenario 3 uses features *recalculated* from the URL, exactly like the app
    calc_tr = features_frame(train["url"])[url_feats]
    calc_te = features_frame(test["url"])[url_feats]
    no_leak = [c for c in feats if c not in LEAKY]
    return {
        "all_features": (train[feats], test[feats]),
        "no_leakage": (train[no_leak], test[no_leak]),
        "url_only": (calc_tr, calc_te),
    }


def run_scenario(name, X_tr, X_te, y_tr, y_te, out, n_jobs):
    """Cross-validate and test all models; return (cv_rows, test_rows, fitted)."""
    print(f"\n=== {name}: {X_tr.shape[1]} features ===")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
    cv_rows, test_rows, fitted = [], [], {}
    for mname, model in make_models().items():
        pipe = Pipeline([("scaler", StandardScaler()), ("clf", model)])
        cv = cross_validate(pipe, X_tr, y_tr, cv=skf, scoring=SCORING, n_jobs=n_jobs)
        cv_row = {"scenario": name, "model": mname, "n_features": X_tr.shape[1]}
        for m in SCORING:
            cv_row[f"{m}_mean"] = cv[f"test_{m}"].mean()
            cv_row[f"{m}_std"] = cv[f"test_{m}"].std()
        cv_rows.append(cv_row)

        pipe.fit(X_tr, y_tr)
        pred = pipe.predict(X_te)
        fitted[mname] = pipe
        test_rows.append({"scenario": name, "model": mname,
                          "accuracy": accuracy_score(y_te, pred),
                          "precision": precision_score(y_te, pred),
                          "recall": recall_score(y_te, pred),
                          "f1": f1_score(y_te, pred)})
        (out / f"results/classification_report_{name}_{mname}.txt").write_text(
            classification_report(y_te, pred, target_names=LABELS, digits=4))
        cm = confusion_matrix(y_te, pred)
        plot_cm(cm, f"{name} - {mname}", out / f"figures/cm_{name}_{mname}.png")
        t = test_rows[-1]
        print(f"  {mname:18s} CV F1={cv_row['f1_mean']:.4f}+/-{cv_row['f1_std']:.4f} | "
              f"TEST acc={t['accuracy']:.4f} P={t['precision']:.4f} "
              f"R={t['recall']:.4f} F1={t['f1']:.4f} | TN={cm[0, 0]} FP={cm[0, 1]} "
              f"FN={cm[1, 0]} TP={cm[1, 1]}")
    return cv_rows, test_rows, fitted


def plot_comparison(test_df, path):
    piv = test_df.pivot(index="model", columns="scenario", values="f1")
    piv = piv[["all_features", "no_leakage", "url_only"]]
    ax = piv.plot.bar(figsize=(7, 4), rot=0)
    ax.set_ylim(0.8, 1.0)
    ax.set_ylabel("F1 on test set")
    ax.set_title("Model A: test F1 by model and feature scenario")
    ax.legend(fontsize=8, loc="lower right")
    plt.tight_layout()
    plt.savefig(path, dpi=150)
    plt.close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data-dir", default=str(HERE / "data/processed"))
    ap.add_argument("--out", default=str(HERE / "outputs"))
    ap.add_argument("--n-jobs", type=int, default=1)
    args = ap.parse_args()

    data, out = Path(args.data_dir), Path(args.out)
    for f in ("numeric_train.csv", "numeric_test.csv"):
        if not (data / f).exists():
            raise SystemExit(f"Missing {data / f} - run Member 1's prep_data.py first.")
    for d in ("results", "figures", "models"):
        (out / d).mkdir(parents=True, exist_ok=True)

    train = pd.read_csv(data / "numeric_train.csv")
    test = pd.read_csv(data / "numeric_test.csv")
    y_tr, y_te = train["label"], test["label"]
    print(f"train={len(train):,} test={len(test):,}")

    cv_all, test_all, fitted_all = [], [], {}
    for name, (X_tr, X_te) in build_scenarios(train, test, out).items():
        cv_rows, test_rows, fitted = run_scenario(name, X_tr, X_te, y_tr, y_te, out, args.n_jobs)
        cv_all += cv_rows
        test_all += test_rows
        fitted_all[name] = (fitted, list(X_tr.columns))

    cv_df, test_df = pd.DataFrame(cv_all), pd.DataFrame(test_all)
    cv_df.to_csv(out / "results/cv_results.csv", index=False)
    test_df.to_csv(out / "results/test_results.csv", index=False)
    plot_comparison(test_df, out / "figures/model_comparison_f1.png")

    for scen in ("no_leakage", "url_only"):
        fitted, feats = fitted_all[scen]
        imp = plot_importance(fitted["RandomForest"], feats,
                              f"Random Forest - top 15 features ({scen})",
                              out / f"figures/feature_importance_{scen}.png")
        imp.rename("importance").to_csv(out / f"results/feature_importance_{scen}.csv")

    # app model: best url_only model chosen by CV F1 (not test F1, to avoid
    # selecting on the test set)
    cv_url = cv_df[cv_df.scenario == "url_only"].sort_values("f1_mean", ascending=False)
    best = cv_url.iloc[0]["model"]
    fitted, feats = fitted_all["url_only"]
    joblib.dump(fitted[best], out / "models/numeric_url_model.pkl", compress=3)
    (out / "models/numeric_url_features.json").write_text(
        json.dumps({"model": best, "features": feats}, indent=2))
    print(f"\nSaved app model: url_only / {best} -> {out / 'models/numeric_url_model.pkl'}")
    print("\n=== TEST SET SUMMARY ===")
    print(test_df.round(4).to_string(index=False))


if __name__ == "__main__":
    main()
