"""Shared URL pre-processing for the text (TF-IDF) models.

This lives in its own module so that saved scikit-learn pipelines can be
un-pickled by other scripts (e.g. the demo app). Anything that loads
models/*.pkl must have the `src/` folder on sys.path:

    import sys; sys.path.insert(0, "src")
"""
import re

_SCHEME = re.compile(r"^(?:https?|ftp)://", re.I)
_WWW = re.compile(r"^www\d*\.", re.I)


def lowercase_url(url) -> str:
    """Minimal cleaning only (used for the 'raw' ablation)."""
    return str(url).strip().lower()


def normalize_url(url) -> str:
    """Remove the scheme (http://, https://), a leading 'www.' and trailing slashes.

    Why: in the dataset, the presence of 'http://' / 'www.' is strongly tied
    to the class label (e.g. 100% of 'defacement' URLs start with http://).
    A model could score highly by learning that artefact instead of real
    malicious patterns, and it would not generalise to URLs a user pastes.

    Trailing slash (bug found by a teammate): 23% of phishing URLs in the data are bare
    hostnames without any '/', versus 0.1% of benign URLs. The first model therefore learned
    "no trailing slash => phishing": https://www.google.com scored 99.96% malicious while
    https://www.google.com/ scored 0.7%. Stripping trailing slashes in BOTH training and
    prediction removes this label proxy. Verify with src/slash_bug_check.py.
    """
    u = lowercase_url(url)
    u = _SCHEME.sub("", u)
    u = _WWW.sub("", u)
    u = u.rstrip("/")          # 'host' and 'host/' must look identical (see note below)
    return u
