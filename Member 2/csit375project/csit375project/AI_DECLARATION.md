# Generative-AI declaration – Member 2 (Model A)

Required by the CSIT375 assignment guideline. **Member 2: read, complete and sign before submission.**

## Tool used
Claude (Anthropic), model Claude Opus 5.5, via Claude Code, on 2026-11-08.

## What the AI did
| File | Change | Why |
|---|---|---|
| `phishing_model_numeric.py` | **Rewritten.** Data path now set with `--data-dir` (default `data/processed`). Scaler moved inside a `Pipeline` so cross-validation has no scaling leak. `StratifiedKFold`. Cross-validation reports mean ± std of accuracy, precision, recall and F1. Saves results CSVs, classification reports, confusion matrix PNGs, a model comparison chart and Random Forest feature importance charts. Adds scenario 3 (URL-only features). Saves the app model. | The original crashed (wrong path), saved no outputs, reported only cross-validation accuracy, and fitted the scaler before cross-validation. |
| `url_features.py` | **New.** `extract_url_features()` recalculates 32 lexical URL features. `agreement_table()` checks them against the dataset's own columns and keeps only those with ≥ 95% agreement (30 kept). | So the demo app can calculate exactly the features the model was trained on. |
| `spot_check.py` | **New.** Runs the saved model on fixed example URLs and writes `outputs/results/spot_checks.csv`. | Output samples for the report. |

## Kept from Member 2's original work
- The choice of the three models (LR, RF, GB) and their main settings.
- The idea of comparing results with and without `google_index` and `page_rank`.

## Things Member 2 should be able to explain in the demo
- Why the scaler must be inside the cross-validation pipeline.
- Why `google_index` and `page_rank` count as leakage for a real-time detector.
- Why the dataset's `ip`, `nb_com` (and originally `nb_subdomains`) features did not match (see `outputs/results/feature_agreement.csv`).
- Why the URL-only model scores lower (F1 0.888) than the full model (0.961), and why it is still the one used in the app.

## Member 2 – own contribution (fill in)
- …

Signed: ____________________   Date: __________
