"""Find links and warning phrases in a pasted email or text message.

The phrase check is a fixed word list (rules, not machine learning). The site says so.
"""
import re

from .explain import BRANDS
from .normalize import InvalidUrl, parse_url

MAX_LINKS = 10
COMMON_TLDS = ("com|net|org|info|biz|io|co|ai|app|dev|xyz|top|online|site|shop|store|club|me|tv|"
               "us|uk|ae|in|pk|au|ca|de|fr|ru|cn|ly|gl|to|cc|ws|pw|tk|ml|ga|cf|gq|live|edu|gov|link|click")
URL_RE = re.compile(
    r"(?<![@\w.-])(?:https?://[^\s<>\"'`]+"
    r"|www\.[^\s<>\"'`]+"
    r"|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:" + COMMON_TLDS + r")\b(?:/[^\s<>\"'`]*)?)",
    re.I,
)
_TRAILING = ".,;:!?)]}'\"’”"

CUES = {
    "urgency": ("Urgency", ("urgent", "immediately", "right away", "as soon as possible", "within 24 hours",
                            "within 48 hours", "final notice", "last warning", "act now", "expires today")),
    "threat": ("Account threat", ("suspended", "suspension", "locked", "disabled", "unusual activity",
                                  "suspicious activity", "unauthorized", "will be closed")),
    "credentials": ("Asks for passwords or payment", (
        "verify your account", "confirm your password", "confirm your identity", "verify your identity",
        "update your payment", "enter your password", "reset your password", "login details",
        "card number", "cvv", "one-time code")),
    "reward": ("Too good to be true", ("you have won", "you've won", "congratulations", "gift card",
                                       "claim your", "free money", "lottery", "prize")),
}


def extract_urls(text: str) -> tuple[list[str], bool]:
    """Return (unique valid URLs in order, whether more than MAX_LINKS were found)."""
    seen: set[str] = set()
    urls: list[str] = []
    for match in URL_RE.finditer(text):
        candidate = match.group(0).rstrip(_TRAILING)
        try:
            parsed = parse_url(candidate)
        except InvalidUrl:
            continue
        key = parsed.url.lower().rstrip("/")
        if key in seen:
            continue
        seen.add(key)
        urls.append(candidate)
    return urls[:MAX_LINKS], len(urls) > MAX_LINKS


def find_cues(text: str) -> list[dict]:
    """Non-overlapping phrase matches with their positions, for highlighting."""
    hits = []
    for category, (_, phrases) in CUES.items():
        for phrase in phrases:
            for m in re.finditer(r"\b" + re.escape(phrase) + r"\b", text, re.I):
                hits.append({"start": m.start(), "end": m.end(), "category": category, "text": m.group(0)})
    hits.sort(key=lambda h: (h["start"], -(h["end"] - h["start"])))
    kept, last_end = [], -1
    for hit in hits:
        if hit["start"] >= last_end:
            kept.append(hit)
            last_end = hit["end"]
    return kept


def cue_summary(cues: list[dict]) -> list[dict]:
    counts: dict[str, int] = {}
    for cue in cues:
        counts[cue["category"]] = counts.get(cue["category"], 0) + 1
    return [{"category": c, "label": CUES[c][0], "count": counts[c]} for c in CUES if c in counts]


def brands_mentioned(text: str) -> list[str]:
    lower = text.lower()
    return [display for word, (display, _) in BRANDS.items() if re.search(r"\b" + word + r"\b", lower)]
