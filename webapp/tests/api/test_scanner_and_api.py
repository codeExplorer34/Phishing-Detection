"""Uses the real models. Parity: the API must give the same probabilities as the members' scripts."""
import json
from pathlib import Path

import joblib
import pytest
from fastapi.testclient import TestClient

import index
from fishy import scanner

ROOT = Path(__file__).resolve().parents[3]


@pytest.fixture(scope="module")
def client():
    return TestClient(index.app)


@pytest.fixture(autouse=True)
def _reset_rate_limit():
    index._hits.clear()


def test_verdict_thresholds():
    assert scanner.verdict_for(0) == "safe"
    assert scanner.verdict_for(39) == "safe"
    assert scanner.verdict_for(40) == "suspicious"
    assert scanner.verdict_for(69) == "suspicious"
    assert scanner.verdict_for(70) == "dangerous"


def test_parity_with_member_models():
    import sys
    sys.path.insert(0, str(ROOT / "Member 2/csit375project/csit375project"))
    from url_features import features_frame

    m2 = ROOT / "Member 2/csit375project/csit375project/outputs/models"
    a = joblib.load(m2 / "numeric_url_model.pkl")
    feats = json.loads((m2 / "numeric_url_features.json").read_text())["features"]
    b = joblib.load(ROOT / "Member 3/phishing_text/models/text_model.pkl")
    for url in ["http://paypa1-secure-update.com/signin", "https://www.amazon.com", "http://bit.ly/3xR9qPz"]:
        result = scanner.score_url(url)
        assert result["models"]["a"] == round(float(a.predict_proba(features_frame([url])[feats])[0, 1]), 4)
        assert result["models"]["b"] == round(float(b.predict_proba([url])[0, 1]), 4)


def test_known_examples():
    paypa1 = scanner.score_url("http://paypa1-secure-update.com/signin")
    assert paypa1["verdict"] == "dangerous" and paypa1["risk"] == 93
    assert paypa1["threat_type"] == "phishing" and paypa1["flags"][0]["id"] == "lookalike"

    google = scanner.score_url("google.com")
    assert google["verdict"] == "safe" and google["trusted"] is True
    assert google["flags"] == [] and google["threat_type"] is None
    assert google["models_disagree"] is True

    bank = scanner.score_url("http://www.my-bank-online.info/login.php")
    assert bank["verdict"] == "suspicious" and bank["risk"] == 64


def test_health(client):
    r = client.get("/api/py/health")
    assert r.status_code == 200 and r.json() == {"ok": True, "data": {"status": "ok", "models_loaded": True}}


def test_scan_ok(client):
    r = client.post("/api/py/scan", json={"url": "paypa1-secure-update.com/signin"})
    body = r.json()
    assert r.status_code == 200 and body["ok"] is True
    assert body["data"]["host"] == "paypa1-secure-update.com"
    assert r.headers["cache-control"] == "no-store"


@pytest.mark.parametrize("payload,status", [
    ({"url": "javascript:alert(1)"}, 422), ({"url": ""}, 422), ({"url": "x" * 3000}, 422),
    ({}, 422), ({"url": 123}, 422),
])
def test_scan_rejects_bad_input(client, payload, status):
    r = client.post("/api/py/scan", json=payload)
    assert r.status_code == status and r.json()["ok"] is False and r.json()["error"]


def test_scan_message(client):
    text = "Urgent! Verify your account at http://paypa1-secure-update.com/signin or visit www.paypal.com"
    data = client.post("/api/py/scan-message", json={"text": text}).json()["data"]
    assert [l["host"] for l in data["links"]] == ["paypa1-secure-update.com", "www.paypal.com"]
    assert data["links"][1]["trusted"] is True
    assert {s["category"] for s in data["cue_summary"]} == {"urgency", "credentials"}
    assert data["brands"] == ["PayPal"]


def test_scan_message_rejects_too_long(client):
    r = client.post("/api/py/scan-message", json={"text": "a" * 5001})
    assert r.status_code == 422 and "message" in r.json()["error"]


def test_rate_limit(client):
    for _ in range(index.RATE_LIMIT):
        assert client.post("/api/py/scan", json={"url": "example.com"}).status_code == 200
    r = client.post("/api/py/scan", json={"url": "example.com"})
    assert r.status_code == 429 and r.json()["ok"] is False


def test_internal_error_is_hidden(client, monkeypatch):
    def boom(_):
        raise RuntimeError("secret detail")
    monkeypatch.setattr(index, "score_url", boom)
    r = client.post("/api/py/scan", json={"url": "example.com"})
    assert r.status_code == 500 and "secret" not in r.text
