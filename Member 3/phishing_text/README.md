# CSIT375 Project 2 - Phishing / Malicious URL Detection
## Member 3 component: NLP (character n-gram TF-IDF) URL classifiers

Classifies raw URL strings with TF-IDF character 3-5-grams + Logistic Regression / Linear SVM.
Three tasks: **binary** (benign vs malicious), **phishing_vs_benign**, and **multiclass**
(benign / defacement / malware / phishing). Data: Member 1's `url_train.csv` / `url_test.csv`
(512,890 / 128,223 rows; columns `url`, `type`, `is_malicious`).

## Folder layout
```
src/text_utils.py          URL canonicalisation (strip http(s)://, www., trailing "/") - needed to load the .pkl models
src/train_text.py          pipeline: features, 5-fold CV, test evaluation, ablation, error analysis, saves models
src/predict_url.py         command-line predictor / class for the demo app (Member 4)
src/slash_bug_check.py     regression test: `host` and `host/` must get the same verdict
src/cross_dataset_eval.py  scores Member 1's other dataset (numeric_*.csv URLs) with the text model
models/                    text_model.pkl (binary), text_model_multiclass.pkl, text_model_phishing_only.pkl
results/                   tables (cv_results, test_results, ablation, threshold, errors, n-grams, slash checks, cross-dataset)
results/old_before_slash_fix/   results of the first model, kept for the before/after comparison
figures/                   confusion matrices, ROC curves, per-class F1, ablation chart
requirements.txt
```

## Setup
```
pip install -r requirements.txt        # Python 3.11+, no GPU needed
```
Put `url_train.csv` and `url_test.csv` in `data/processed/`.

## Run
```
python src/train_text.py --train data/processed/url_train.csv --test data/processed/url_test.csv --out . --n-jobs 4
python src/slash_bug_check.py --test data/processed/url_test.csv --tag after_fix
python src/cross_dataset_eval.py --data data/processed      # needs numeric_train.csv / numeric_test.csv there too
```
- Full training took roughly 30-40 min on a single slow CPU core (my sandbox); not timed on a laptop.
- Quick test: add `--sample 30000 --test-sample 10000 --cv-sample 15000 --out quick_test`.
- Progress is checkpointed in `checkpoints/`: if interrupted, re-run the same command and it resumes.
  Delete `checkpoints/` to retrain from scratch. Peak memory is about 2-3 GB.

## Predict
```
python src/predict_url.py "http://example.com/login" "https://www.wikipedia.org"
```
Python use: `sys.path.insert(0, "src"); from predict_url import TextURLClassifier; TextURLClassifier("models").predict(url)`

## Method
1. URLs lowercased; scheme, leading `www.` and trailing `/` removed (see the two dataset artefacts below).
2. `TfidfVectorizer(analyzer="char", ngram_range=(3,5), max_features=200000, min_df=3, sublinear_tf=True)`.
3. Logistic Regression (C=10) and Linear SVM (C=0.5), `class_weight="balanced"`, seed 42.
4. 5-fold stratified CV on a 100k-row sample; the vectoriser is re-fit inside each fold (no leakage).
5. Final models trained on the full training set and evaluated once on the held-out test set.

## Results (test set, 128,223 URLs)
| Task | Model | Accuracy | Precision | Recall | F1 | CV F1 (mean +/- std) |
|---|---|---|---|---|---|---|
| Binary | LogReg | 0.9252 | 0.8657 | 0.9171 | 0.8906 | 0.873 +/- 0.002 |
| Binary | Linear SVM | 0.9362 | 0.8900 | 0.9220 | 0.9057 | 0.878 +/- 0.001 |
| Phishing vs benign | LogReg | 0.9043 | 0.6781 | 0.8923 | 0.7706 | 0.741 +/- 0.005 |
| Phishing vs benign | Linear SVM | 0.9136 | 0.7072 | 0.8882 | 0.7874 | 0.742 +/- 0.004 |
| 4-class (macro) | LogReg | 0.9210 | 0.9026 | 0.9350 | 0.9158 | 0.897 +/- 0.001 |
| 4-class (macro) | Linear SVM | 0.9355 | 0.9249 | 0.9296 | 0.9270 | 0.901 +/- 0.002 |

Binary LogReg at threshold 0.5: 6,062 false positives, 3,533 false negatives.

## Dataset artefacts found (important for the Discussion)
**1. Scheme / `www` shortcut.** 100% of defacement URLs start with `http://`, ~89% of benign URLs have no scheme.
Ablation (Linear SVM, 100k training rows): binary F1 0.9635 with `http`/`www` kept vs 0.8820 with scheme, `www` and trailing `/` removed.

**2. Trailing-slash bug (found by a teammate).** 23% of phishing URLs are bare hostnames with no `/`, versus 0.1% of benign.
The first model learned "no trailing slash => phishing":

| URL | p(malicious) before fix | after fix |
|---|---|---|
| `https://www.google.com` / `.../` | 0.9996 / 0.0072 | 0.6876 / 0.6876 |
| `https://github.com` / `.../` | 0.9999 / 0.1831 | 0.9575 / 0.9575 |

On 14,528 host-only test URLs, adding a `/` flipped the verdict 65.7% of the time before the fix (accuracy 0.480 vs 0.795);
after the fix it flips 0% (accuracy 0.8005 either way). Fix: strip trailing slashes in training and prediction
(`text_utils.normalize_url`), retrain, and keep `slash_bug_check.py` as a regression test.
Files: `results/slash_check_before_fix_*.csv`, `results/slash_check_after_fix_*.csv`.

## Known limitations (include in the report)
- **Well-known homepages can still be flagged.** After the fix, `https://www.google.com` scores 0.69 and
  `https://github.com` 0.96 (both with or without `/`), because homepage-only URLs are mostly phishing in this dataset and a
  lexical model has no notion of site reputation. (`wikipedia.org` 0.02 and `amazon.com` 0.05 come out benign.)
  A possible mitigation is a rule layer with an allowlist of well-known domains in front of the model; not implemented.
- **Weak generalisation to other data.** On the 9,141 URLs of Member 1's other dataset that the model never saw
  (`results/cross_dataset_eval.csv`): accuracy 0.642, F1 0.631, ROC-AUC 0.734 at threshold 0.5, with 46% of legitimate URLs flagged.
  In-dataset scores overstate real-world performance. (Different label definitions and URL distributions also play a part.)
- **Probable label noise:** many "missed phishing" examples look like ordinary sites (youtube.com/watch, imdb.com, wikipedia.org).
- **Phishing is the weakest class** (phishing-only precision 0.68-0.71); URL text only - no page content, WHOIS or redirect data.
- Threshold trade-off: see `results/threshold_tradeoff.csv`.

## Generative-AI declaration (edit before submitting)
The code in `src/`, this README and the analysis scaffolding were generated with Claude (Anthropic), then run and reviewed by the
team member. The trailing-slash bug was found by a teammate and fixed with Claude's help. State here exactly which parts you changed yourself.
On 2026-11-09 Claude (Opus 5.5) also corrected `results/run_info.json`: `preprocessing` now mentions the trailing-slash
step, and `resumed_from_checkpoint` / `runtime_note` were added because 15.7 s was a resumed run. It also corrected the
same `preprocessing` text in `src/train_text.py`. No model, result or other code was changed.
