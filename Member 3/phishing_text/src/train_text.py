#!/usr/bin/env python3
"""
CSIT375 - Member 3: NLP (character n-gram TF-IDF) URL classifiers.

What this script does (in order)
  1. Loads the train/test splits produced by Member 1.
  2. Cleans URLs (strips http(s):// and www.) -> avoids a dataset shortcut.
  3. Builds TF-IDF character 3-5-gram features.
  4. Trains Logistic Regression and Linear SVM for three tasks:
        binary             benign vs malicious (any type)
        phishing_vs_benign benign vs phishing only (the brief's "Phishing/Legitimate")
        multiclass         benign / defacement / malware / phishing
  5. 5-fold stratified cross-validation (vectoriser is re-fit inside every fold,
     so there is no leakage from validation folds into the TF-IDF statistics).
  6. Final evaluation on the untouched test set: accuracy, precision, recall,
     F1, confusion matrices, ROC curve.
  7. Ablation: raw URLs vs cleaned URLs (shows the scheme/'www' shortcut).
  8. Error analysis + most informative n-grams.
  9. Saves models (joblib) for the demo app, plus all tables/figures.

Run (from the project root):
    python src/train_text.py --train data/processed/url_train.csv \
                             --test  data/processed/url_test.csv
Quick smoke test (about 1 minute):
    python src/train_text.py --train ... --test ... --sample 40000 --cv-sample 20000
"""
import argparse
import json
import sys
import time
import warnings
from pathlib import Path

import joblib
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import scipy.sparse as sp
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, classification_report,
                             confusion_matrix, f1_score, precision_score,
                             recall_score, roc_auc_score, roc_curve)
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.svm import LinearSVC

sys.path.insert(0, str(Path(__file__).resolve().parent))
from text_utils import lowercase_url, normalize_url  # noqa: E402

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)

SEED = 42
PP_VERSION = "slashfix1"   # bump when URL pre-processing changes: invalidates old checkpoints
CLASS_ORDER = ["benign", "defacement", "malware", "phishing"]


# --------------------------------------------------------------------------- #
# helpers
# --------------------------------------------------------------------------- #
def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)


def make_vectorizer(preprocessor, max_features):
    return TfidfVectorizer(
        analyzer="char", ngram_range=(3, 5), max_features=max_features,
        min_df=3, sublinear_tf=True, preprocessor=preprocessor,
        dtype=np.float32,
    )


def make_models():
    """Same hyper-parameters for every task so the comparison is fair.
    class_weight='balanced' compensates for the rare 'malware' class."""
    return {
        "LogisticRegression": LogisticRegression(
            C=10, max_iter=300, class_weight="balanced", random_state=SEED),
        "LinearSVM": LinearSVC(
            C=0.5, class_weight="balanced", random_state=SEED),
    }


def metrics_row(model, task, y_true, y_pred, binary):
    avg = "binary" if binary else "macro"
    kw = dict(average=avg, zero_division=0)
    return {
        "task": task, "model": model,
        "accuracy": accuracy_score(y_true, y_pred),
        "precision": precision_score(y_true, y_pred, **kw),
        "recall": recall_score(y_true, y_pred, **kw),
        "f1": f1_score(y_true, y_pred, **kw),
        "averaging": "binary(positive=1)" if binary else "macro",
    }


def plot_cm(cm, labels, title, path, normalize=False):
    data = cm / cm.sum(axis=1, keepdims=True) if normalize else cm
    fig, ax = plt.subplots(figsize=(5.2, 4.4))
    im = ax.imshow(data, cmap="Blues")
    ax.set_xticks(range(len(labels)), labels, rotation=30, ha="right")
    ax.set_yticks(range(len(labels)), labels)
    ax.set_xlabel("Predicted")
    ax.set_ylabel("True")
    ax.set_title(title)
    for i in range(len(labels)):
        for j in range(len(labels)):
            txt = f"{data[i, j]:.2f}\n({cm[i, j]:,})" if normalize else f"{cm[i, j]:,}"
            ax.text(j, i, txt, ha="center", va="center", fontsize=8,
                    color="white" if data[i, j] > data.max() / 2 else "black")
    fig.colorbar(im, fraction=0.046)
    fig.tight_layout()
    fig.savefig(path, dpi=150)
    plt.close(fig)


def top_ngrams(vec, clf, class_names, k=15):
    """Most informative n-grams from a linear model's weights."""
    names = np.array(vec.get_feature_names_out())
    coef = clf.coef_
    rows = []
    if coef.shape[0] == 1:  # binary
        order = np.argsort(coef[0])
        for rank, i in enumerate(order[::-1][:k], 1):
            rows.append((class_names[1], rank, names[i], coef[0][i]))
        for rank, i in enumerate(order[:k], 1):
            rows.append((class_names[0], rank, names[i], coef[0][i]))
    else:
        for c, cname in enumerate(clf.classes_):
            for rank, i in enumerate(np.argsort(coef[c])[::-1][:k], 1):
                rows.append((cname, rank, names[i], coef[c][i]))
    return pd.DataFrame(rows, columns=["class", "rank", "ngram", "weight"])


def subsample(df, n, seed=SEED):
    if n is None or n >= len(df):
        return df
    idx, _ = train_test_split(df.index, train_size=n, stratify=df["type"],
                              random_state=seed)
    return df.loc[idx]


# --------------------------------------------------------------------------- #
# main
# --------------------------------------------------------------------------- #
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--train", required=True)
    ap.add_argument("--test", required=True)
    ap.add_argument("--out", default=".", help="project root for models/results/figures")
    ap.add_argument("--sample", type=int, default=None,
                    help="use only N training rows (quick test)")
    ap.add_argument("--test-sample", type=int, default=None)
    ap.add_argument("--cv-sample", type=int, default=100_000,
                    help="rows used for 5-fold CV (CV on 500k rows is slow)")
    ap.add_argument("--max-features", type=int, default=200_000)
    ap.add_argument("--n-jobs", type=int, default=2)
    ap.add_argument("--skip-cv", action="store_true")
    ap.add_argument("--skip-ablation", action="store_true")
    ap.add_argument("--ablation-sample", type=int, default=150_000)
    args = ap.parse_args()

    out = Path(args.out)
    for d in ("models", "results", "figures"):
        (out / d).mkdir(parents=True, exist_ok=True)
    T0 = time.time()

    # ---- 1. data -------------------------------------------------------- #
    train = pd.read_csv(args.train)
    test = pd.read_csv(args.test)
    assert {"url", "type", "is_malicious"} <= set(train.columns), "unexpected columns"
    train, test = subsample(train, args.sample), subsample(test, args.test_sample)
    train = train.reset_index(drop=True)
    test = test.reset_index(drop=True)
    overlap = len(set(train.url) & set(test.url))
    log(f"train={len(train):,} test={len(test):,} | URL overlap train/test = {overlap}")
    assert overlap == 0, "data leakage: same URL in train and test"

    # ---- 2/3. features (cleaned URLs) ---------------------------------- #
    ck = out / "checkpoints"          # lets an interrupted run resume
    ck.mkdir(exist_ok=True)
    tag = f"{PP_VERSION}_{len(train)}_{len(test)}_{args.max_features}"
    if (ck / f"vec_{tag}.joblib").exists() and (ck / f"Xte_{tag}.npz").exists():
        log("loading TF-IDF features from checkpoint")
        vec = joblib.load(ck / f"vec_{tag}.joblib")
        Xtr = sp.load_npz(ck / f"Xtr_{tag}.npz")
        Xte = sp.load_npz(ck / f"Xte_{tag}.npz")
    else:
        log("fitting TF-IDF (cleaned URLs, char 3-5-grams) ...")
        vec = make_vectorizer(normalize_url, args.max_features)
        Xtr = vec.fit_transform(train.url)
        Xte = vec.transform(test.url)
        sp.save_npz(ck / f"Xtr_{tag}.npz", Xtr, compressed=False)
        sp.save_npz(ck / f"Xte_{tag}.npz", Xte, compressed=False)
        joblib.dump(vec, ck / f"vec_{tag}.joblib")   # written last = completeness marker
    log(f"feature matrix train {Xtr.shape}, non-zeros {Xtr.nnz:,}")

    # ---- task definitions ---------------------------------------------- #
    tasks = {
        "binary": dict(
            mask_tr=np.ones(len(train), bool), mask_te=np.ones(len(test), bool),
            y_tr=train.is_malicious.values, y_te=test.is_malicious.values,
            binary=True, labels=["benign", "malicious"]),
    }
    mtr, mte = train.type.isin(["benign", "phishing"]).values, test.type.isin(["benign", "phishing"]).values
    tasks["phishing_vs_benign"] = dict(
        mask_tr=mtr, mask_te=mte,
        y_tr=(train.type[mtr] == "phishing").astype(int).values,
        y_te=(test.type[mte] == "phishing").astype(int).values,
        binary=True, labels=["benign", "phishing"])
    tasks["multiclass"] = dict(
        mask_tr=np.ones(len(train), bool), mask_te=np.ones(len(test), bool),
        y_tr=train.type.values, y_te=test.type.values,
        binary=False, labels=CLASS_ORDER)

    # ---- 5. cross-validation ------------------------------------------- #
    cv_rows = []
    if not args.skip_cv:
        cvdf = subsample(train, args.cv_sample).reset_index(drop=True)
        log(f"5-fold stratified CV on {len(cvdf):,} rows (vectoriser re-fit per fold)")
        skf = StratifiedKFold(5, shuffle=True, random_state=SEED)
        for tname, t in tasks.items():
            if tname == "binary":
                sub, y = cvdf, cvdf.is_malicious.values
            elif tname == "phishing_vs_benign":
                sub = cvdf[cvdf.type.isin(["benign", "phishing"])]
                y = (sub.type == "phishing").astype(int).values
            else:
                sub, y = cvdf, cvdf.type.values
            scoring = (["accuracy", "precision", "recall", "f1"] if t["binary"] else
                       ["accuracy", "precision_macro", "recall_macro", "f1_macro"])
            for mname, model in make_models().items():
                pipe = Pipeline([("tfidf", make_vectorizer(normalize_url, args.max_features)),
                                 ("clf", model)])
                cvp = ck / f"cv_{tag}_{args.cv_sample}_{tname}_{mname}.json"
                if cvp.exists():
                    row = json.loads(cvp.read_text())
                else:
                    s = cross_validate(pipe, sub.url, y, cv=skf, scoring=scoring, n_jobs=args.n_jobs)
                    row = {"task": tname, "model": mname, "cv_rows": len(sub)}
                    for m in scoring:
                        v = s[f"test_{m}"]
                        row[m.replace("_macro", "") + "_mean"] = float(v.mean())
                        row[m.replace("_macro", "") + "_std"] = float(v.std())
                    cvp.write_text(json.dumps(row))
                cv_rows.append(row)
                log(f"  CV {tname:19s} {mname:18s} F1 = {row['f1_mean']:.4f} +/- {row['f1_std']:.4f}")
        pd.DataFrame(cv_rows).to_csv(out / "results/cv_results.csv", index=False)

    # ---- 4/6. final training + test evaluation ------------------------- #
    test_rows, fitted, scores = [], {}, {}
    for tname, t in tasks.items():
        Xa, Xb = Xtr[t["mask_tr"]], Xte[t["mask_te"]]
        for mname, model in make_models().items():
            mpath = ck / f"model_{tag}_{tname}_{mname}.joblib"
            if mpath.exists():
                model, fit_secs = joblib.load(mpath)
                log(f"  loaded fitted {tname}/{mname} from checkpoint")
            else:
                t0 = time.time()
                model.fit(Xa, t["y_tr"])
                fit_secs = time.time() - t0
                joblib.dump((model, fit_secs), mpath)
            pred = model.predict(Xb)
            fitted[(tname, mname)] = model
            row = metrics_row(mname, tname, t["y_te"], pred, t["binary"])
            row["train_seconds"] = round(fit_secs, 1)
            if t["binary"]:
                sc = (model.predict_proba(Xb)[:, 1] if hasattr(model, "predict_proba")
                      else model.decision_function(Xb))
                scores[(tname, mname)] = sc
                row["roc_auc"] = roc_auc_score(t["y_te"], sc)
            test_rows.append(row)
            labels = t["labels"]
            rep = classification_report(
                t["y_te"], pred, digits=4, zero_division=0,
                target_names=None if not t["binary"] else labels)
            (out / f"results/classification_report_{tname}_{mname}.txt").write_text(rep)
            cm = confusion_matrix(t["y_te"], pred,
                                  labels=(None if t["binary"] else CLASS_ORDER))
            np.savetxt(out / f"results/confusion_{tname}_{mname}.csv", cm, fmt="%d",
                       delimiter=",", header=",".join(labels), comments="")
            plot_cm(cm, labels, f"{tname} - {mname}",
                    out / f"figures/cm_{tname}_{mname}.png", normalize=not t["binary"] or True)
            log(f"  TEST {tname:19s} {mname:18s} acc={row['accuracy']:.4f} "
                f"P={row['precision']:.4f} R={row['recall']:.4f} F1={row['f1']:.4f}")
    res = pd.DataFrame(test_rows)
    res.to_csv(out / "results/test_results.csv", index=False)

    # ROC curve (binary tasks)
    fig, axs = plt.subplots(1, 2, figsize=(10, 4))
    for ax, tname in zip(axs, ["binary", "phishing_vs_benign"]):
        for mname in make_models():
            fpr, tpr, _ = roc_curve(tasks[tname]["y_te"], scores[(tname, mname)])
            auc = res[(res.task == tname) & (res.model == mname)].roc_auc.iloc[0]
            ax.plot(fpr, tpr, label=f"{mname} (AUC={auc:.3f})")
        ax.plot([0, 1], [0, 1], "k--", lw=0.8)
        ax.set_title(f"ROC - {tname}")
        ax.set_xlabel("False positive rate")
        ax.set_ylabel("True positive rate")
        ax.legend(loc="lower right")
    fig.tight_layout()
    fig.savefig(out / "figures/roc_binary.png", dpi=150)
    plt.close(fig)

    # per-class F1 bar (multiclass)
    fig, ax = plt.subplots(figsize=(7, 4))
    w = 0.38
    for k, mname in enumerate(make_models()):
        p = fitted[("multiclass", mname)].predict(Xte)
        f1s = f1_score(test.type, p, labels=CLASS_ORDER, average=None)
        ax.bar(np.arange(4) + k * w, f1s, w, label=mname)
    ax.set_xticks(np.arange(4) + w / 2, CLASS_ORDER)
    ax.set_ylabel("F1 on test set")
    ax.set_ylim(0, 1)
    ax.set_title("Multi-class: per-class F1")
    ax.legend()
    fig.tight_layout()
    fig.savefig(out / "figures/multiclass_f1_per_class.png", dpi=150)
    plt.close(fig)

    # ---- 8. error analysis --------------------------------------------- #
    best_bin = fitted[("binary", "LogisticRegression")]
    p_mal = best_bin.predict_proba(Xte)[:, 1]
    pred = (p_mal >= 0.5).astype(int)
    err = test.assign(p_malicious=p_mal, predicted=pred)
    err["url_length"] = err.url.str.len()
    fp = err[(err.is_malicious == 0) & (err.predicted == 1)].sort_values("p_malicious", ascending=False)
    fn = err[(err.is_malicious == 1) & (err.predicted == 0)].sort_values("p_malicious")
    ex = pd.concat([fp.head(10).assign(error="false_positive (benign flagged)"),
                    fn.head(10).assign(error="false_negative (threat missed)")])
    ex[["error", "url", "type", "p_malicious", "url_length"]].to_csv(
        out / "results/error_examples.csv", index=False)
    by_type = (err[err.is_malicious == 1].assign(missed=lambda d: d.predicted == 0)
               .groupby("type").agg(n=("missed", "size"), missed=("missed", "sum"),
                                    miss_rate=("missed", "mean"), median_len=("url_length", "median")))
    by_type.to_csv(out / "results/miss_rate_by_threat_type.csv")
    log(f"errors: {len(fp):,} false positives, {len(fn):,} false negatives")
    log("miss rate by threat type:\n" + by_type.round(4).to_string())
    # threshold trade-off (security teams care about missed threats)
    thr_rows = []
    for thr in (0.2, 0.3, 0.4, 0.5, 0.6, 0.7):
        p = (p_mal >= thr).astype(int)
        thr_rows.append({"threshold": thr,
                         "precision": precision_score(test.is_malicious, p),
                         "recall": recall_score(test.is_malicious, p),
                         "f1": f1_score(test.is_malicious, p),
                         "false_positives": int(((p == 1) & (test.is_malicious == 0)).sum()),
                         "false_negatives": int(((p == 0) & (test.is_malicious == 1)).sum())})
    pd.DataFrame(thr_rows).to_csv(out / "results/threshold_tradeoff.csv", index=False)

    # informative n-grams
    tn = pd.concat([top_ngrams(vec, fitted[("binary", "LogisticRegression")], ["benign", "malicious"]),
                    top_ngrams(vec, fitted[("multiclass", "LogisticRegression")], CLASS_ORDER)],
                   keys=["binary", "multiclass"], names=["task"]).reset_index(level=0)
    tn.to_csv(out / "results/top_ngrams.csv", index=False)

    # ---- 9. save models for the demo app ------------------------------- #
    def bundle(task, mname):
        return Pipeline([("tfidf", vec), ("clf", fitted[(task, mname)])])

    joblib.dump(bundle("binary", "LogisticRegression"), out / "models/text_model.pkl", compress=3)
    joblib.dump(bundle("multiclass", "LogisticRegression"), out / "models/text_model_multiclass.pkl", compress=3)
    joblib.dump(bundle("phishing_vs_benign", "LogisticRegression"), out / "models/text_model_phishing_only.pkl", compress=3)

    meta = {"seed": SEED, "train_rows": len(train), "test_rows": len(test),
            "max_features": args.max_features, "ngram_range": [3, 5],
            "preprocessing": "lowercase, strip scheme, leading www. and trailing /",
            "total_runtime_seconds": round(time.time() - T0, 1)}
    (out / "results/run_info.json").write_text(json.dumps(meta, indent=2))
    # ---- 7. ablation: raw vs cleaned (runs last; sampled to save memory) -- #
    if not args.skip_ablation:
        del Xtr, Xte
        sub_tr = subsample(train, args.ablation_sample).reset_index(drop=True)
        log(f"ablation: raw vs cleaned URLs, LinearSVM, trained on {len(sub_tr):,} rows, "
            f"tested on all {len(test):,} test rows")
        rows = []
        for tag, pre in [("raw (keeps http/www)", lowercase_url),
                         ("cleaned (scheme, www, trailing / removed)", normalize_url)]:
            v2 = make_vectorizer(pre, args.max_features)
            Xa, Xb = v2.fit_transform(sub_tr.url), v2.transform(test.url)
            for task, y_tr, y_te, binary in [
                    ("binary", sub_tr.is_malicious, test.is_malicious, True),
                    ("multiclass", sub_tr.type, test.type, False)]:
                m = LinearSVC(C=0.5, class_weight="balanced", random_state=SEED).fit(Xa, y_tr)
                r = metrics_row("LinearSVM", task, y_te, m.predict(Xb), binary)
                r["url_preprocessing"] = tag
                rows.append(r)
                log(f"  {tag:30s} {task:10s} acc={r['accuracy']:.4f} F1={r['f1']:.4f}")
            del Xa, Xb
        abl = pd.DataFrame(rows)[["url_preprocessing", "task", "accuracy", "precision", "recall", "f1"]]
        abl.to_csv(out / "results/ablation_raw_vs_cleaned.csv", index=False)
        fig, ax = plt.subplots(figsize=(6, 4))
        abl.pivot(index="task", columns="url_preprocessing", values="f1").plot.bar(ax=ax, rot=0)
        ax.set_ylim(0.5, 1)
        ax.set_ylabel("F1 on test set")
        ax.set_title("Effect of removing the http/www shortcut")
        fig.tight_layout()
        fig.savefig(out / "figures/ablation_raw_vs_cleaned.png", dpi=150)
        plt.close(fig)

    log(f"DONE in {time.time() - T0:.0f}s. Outputs in {out.resolve()}")
    print("\n=== TEST SET SUMMARY ===")
    print(res.round(4).to_string(index=False))


if __name__ == "__main__":
    main()
