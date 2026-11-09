"""Fishy API (FastAPI), deployed as a Vercel Python function.

Routes live under /api/py/ (see next.config.ts rewrites). Every response uses the same
envelope: {"ok": true, "data": ...} or {"ok": false, "error": "message for the user"}.
"""
import logging
import sys
import time
from collections import defaultdict, deque
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))   # text_utils, url_features, fishy

from fastapi import FastAPI, Request                       # noqa: E402
from fastapi.exceptions import RequestValidationError      # noqa: E402
from fastapi.responses import JSONResponse                 # noqa: E402
from pydantic import BaseModel, Field                      # noqa: E402

from fishy.message import brands_mentioned, cue_summary, extract_urls, find_cues  # noqa: E402
from fishy.normalize import MAX_URL_LENGTH, InvalidUrl    # noqa: E402
from fishy.scanner import load_models, models_loaded, score_url  # noqa: E402

MAX_MESSAGE_LENGTH = 5000
RATE_LIMIT = 40            # requests per window per client (best effort, per function instance)
RATE_WINDOW_SECONDS = 60

log = logging.getLogger("fishy")
app = FastAPI(title="Fishy API", docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")
_hits: dict[str, deque] = defaultdict(deque)


class ScanRequest(BaseModel):
    url: str = Field(min_length=1, max_length=MAX_URL_LENGTH)


class MessageRequest(BaseModel):
    text: str = Field(min_length=1, max_length=MAX_MESSAGE_LENGTH)


def ok(data, status: int = 200) -> JSONResponse:
    return JSONResponse({"ok": True, "data": data}, status_code=status, headers={"Cache-Control": "no-store"})


def fail(message: str, status: int) -> JSONResponse:
    return JSONResponse({"ok": False, "error": message}, status_code=status, headers={"Cache-Control": "no-store"})


def _client_id(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    return forwarded.split(",")[0].strip() or (request.client.host if request.client else "unknown")


def _rate_limited(request: Request) -> bool:
    now = time.monotonic()
    hits = _hits[_client_id(request)]
    while hits and now - hits[0] > RATE_WINDOW_SECONDS:
        hits.popleft()
    if len(hits) >= RATE_LIMIT:
        return True
    hits.append(now)
    return False


@app.exception_handler(RequestValidationError)
async def _invalid_request(request: Request, _exc: RequestValidationError) -> JSONResponse:
    if request.url.path.endswith("scan-message"):
        return fail(f"Paste a message between 1 and {MAX_MESSAGE_LENGTH:,} characters.", 422)
    return fail(f"Paste a link between 1 and {MAX_URL_LENGTH:,} characters.", 422)


@app.get("/api/py/health")
def health() -> JSONResponse:
    try:
        load_models()
    except Exception:  # noqa: BLE001
        log.exception("model loading failed")
        return fail("The models could not be loaded.", 503)
    return ok({"status": "ok", "models_loaded": models_loaded()})


@app.post("/api/py/scan")
def scan(body: ScanRequest, request: Request) -> JSONResponse:
    if _rate_limited(request):
        return fail("You’ve checked a lot of links quickly. Wait a minute and try again.", 429)
    try:
        return ok(score_url(body.url))
    except InvalidUrl as exc:
        return fail(str(exc), 422)
    except Exception:  # noqa: BLE001
        log.exception("scan failed")          # the URL is deliberately not logged
        return fail("Something went wrong while checking this link. Please try again.", 500)


@app.post("/api/py/scan-message")
def scan_message(body: MessageRequest, request: Request) -> JSONResponse:
    if _rate_limited(request):
        return fail("You’ve checked a lot of messages quickly. Wait a minute and try again.", 429)
    try:
        urls, truncated = extract_urls(body.text)
        cues = find_cues(body.text)
        links = [score_url(u) for u in urls]
    except Exception:  # noqa: BLE001
        log.exception("message scan failed")
        return fail("Something went wrong while checking this message. Please try again.", 500)
    return ok({
        "links": links,
        "truncated": truncated,
        "cues": cues,
        "cue_summary": cue_summary(cues),
        "brands": brands_mentioned(body.text),
    })
