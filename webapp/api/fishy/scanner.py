"""Score a URL with both members' models and combine the result.

Model A (Member 2): Random Forest on 30 URL features -> probability of phishing.
Model B (Member 3): TF-IDF character n-grams + Logistic Regression -> probability of malicious.
Risk = average of the two, 0-100. Trusted domains are shown as safe (see allowlist.py).
"""
import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import joblib

from .allowlist import is_trusted, registered_domain
from .explain import explain
from .normalize import parse_url

MODEL_DIR = Path(__file__).resolve().parent.parent / "models"
WARN_AT = 40       # 40-69: suspicious, warn the user
BLOCK_AT = 70      # 70+: dangerous, block automatically
DISAGREE_GAP = 0.4


@dataclass(frozen=True)
class Models:
    a: object
    a_features: list
    b: object
    b_types: object


@lru_cache(maxsize=1)
def load_models() -> Models:
    import text_utils  # noqa: F401  (the pickled Model B pipelines reference this module)

    meta = json.loads((MODEL_DIR / "numeric_url_features.json").read_text(encoding="utf-8"))
    return Models(
        a=joblib.load(MODEL_DIR / "numeric_url_model.pkl"),
        a_features=list(meta["features"]),
        b=joblib.load(MODEL_DIR / "text_model.pkl"),
        b_types=joblib.load(MODEL_DIR / "text_model_multiclass.pkl"),
    )


def models_loaded() -> bool:
    return load_models.cache_info().currsize > 0


def verdict_for(risk: int) -> str:
    if risk >= BLOCK_AT:
        return "dangerous"
    if risk >= WARN_AT:
        return "suspicious"
    return "safe"


def score_url(raw: str) -> dict:
    from url_features import features_frame  # Member 2's feature code, copied by sync_models.py

    parsed = parse_url(raw)
    models = load_models()
    p_a = float(models.a.predict_proba(features_frame([parsed.url])[models.a_features])[0, 1])
    p_b = float(models.b.predict_proba([parsed.url])[0, 1])
    type_probs = models.b_types.predict_proba([parsed.url])[0]
    types = {str(c): round(float(p), 4) for c, p in zip(models.b_types.classes_, type_probs)}

    risk = round((p_a + p_b) / 2 * 100)
    trusted = is_trusted(parsed.host, parsed.is_ip)
    verdict = "safe" if trusted else verdict_for(risk)
    top_type = max(types, key=types.get)
    threat_type = None if verdict == "safe" or top_type == "benign" else top_type

    return {
        "input": parsed.original,
        "url": parsed.url,
        "host": parsed.host,
        "registered_domain": parsed.host if parsed.is_ip else registered_domain(parsed.host),
        "verdict": verdict,
        "risk": risk,
        "trusted": trusted,
        "threat_type": threat_type,
        "type_probabilities": types,
        "models": {"a": round(p_a, 4), "b": round(p_b, 4)},
        "models_disagree": abs(p_a - p_b) >= DISAGREE_GAP,
        "flags": [] if trusted else explain(parsed),
    }
