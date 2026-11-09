"""Plain-language reasons shown under a result ("Why Fishy flagged it").

These are simple, transparent rules that explain the address to a person. They do not
change the risk score, which comes only from the two models.
"""
import re
from dataclasses import dataclass

from .allowlist import registered_domain
from .normalize import ParsedUrl

SEVERITY_ORDER = {"high": 0, "medium": 1, "low": 2}
MAX_FLAGS = 6

BRANDS = {  # brand word -> (display name, real registered domain)
    "paypal": ("PayPal", "paypal.com"), "apple": ("Apple", "apple.com"),
    "microsoft": ("Microsoft", "microsoft.com"), "amazon": ("Amazon", "amazon.com"),
    "netflix": ("Netflix", "netflix.com"), "google": ("Google", "google.com"),
    "facebook": ("Facebook", "facebook.com"), "instagram": ("Instagram", "instagram.com"),
    "whatsapp": ("WhatsApp", "whatsapp.com"), "linkedin": ("LinkedIn", "linkedin.com"),
    "outlook": ("Outlook", "outlook.com"), "icloud": ("iCloud", "icloud.com"),
    "dropbox": ("Dropbox", "dropbox.com"), "docusign": ("DocuSign", "docusign.com"),
    "coinbase": ("Coinbase", "coinbase.com"), "binance": ("Binance", "binance.com"),
}
LOOKALIKE = {"0": "o", "1": "l", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s"}
_LEET = str.maketrans(LOOKALIKE)

SIGN_IN_WORDS = ("signin", "sign-in", "login", "log-in", "logon", "webscr")
VERIFY_WORDS = ("verify", "verification", "confirm", "unlock", "update", "secure", "validate")
ACCOUNT_WORDS = ("account", "password", "billing", "banking", "wallet", "invoice", "payment")
RISKY_EXTENSIONS = (".exe", ".scr", ".apk", ".msi", ".bat", ".cmd", ".vbs", ".jar", ".zip",
                    ".rar", ".iso", ".dmg", ".js", ".hta", ".ps1")
SHORTENERS = frozenset({"bit.ly", "bitly.com", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd",
                        "buff.ly", "rebrand.ly", "cutt.ly", "shorturl.at", "tiny.cc", "rb.gy",
                        "t.ly", "s.id", "v.gd", "lnkd.in"})


@dataclass(frozen=True)
class Flag:
    id: str
    label: str
    detail: str
    severity: str


def _lookalike_detail(original: str, brand: str) -> str:
    swaps = [(o, b) for o, b in zip(original, brand) if o != b]
    if len(swaps) == 1:
        digit, letter = swaps[0]
        kind = "digit" if digit.isdigit() else "character"
        return f"“{original}” uses the {kind} {digit} instead of the letter {letter}."
    return f"“{original}” uses look-alike characters to imitate “{brand}”."


def _find_word(text: str, word: str) -> int:
    """Index of word in text. Short brands must start a word ("pineapple" is not Apple)."""
    if len(word) >= 6:
        return text.find(word)
    match = re.search(r"(?<![a-z])" + re.escape(word), text)
    return match.start() if match else -1


def _brand_flag(host: str) -> Flag | None:
    reg = registered_domain(host)
    reg_name = reg.split(".")[0]
    for word, (display, real) in BRANDS.items():
        if reg_name == word:            # the brand's own site, any country ending
            continue
        if _find_word(host, word) != -1:
            return Flag("brand", f"Pretends to be {display}.",
                        f"“{word}” appears in the address, but the site is {reg}, not {real}.", "high")
        index = _find_word(host.translate(_LEET), word)
        if index != -1:
            original = host[index:index + len(word)]
            return Flag("lookalike", f"Pretends to be {display}.", _lookalike_detail(original, word), "high")
    return None


def _word_flag(text: str, words: tuple[str, ...], flag_id: str, label: str) -> Flag | None:
    found = [w for w in words if w in text]
    if not found:
        return None
    quoted = ", ".join(f"“{w}”" for w in found[:2])
    return Flag(flag_id, label, f"The address contains {quoted}.", "medium")


def explain(parsed: ParsedUrl) -> list[dict]:
    host = parsed.host
    reg = registered_domain(host)
    subdomain = host[: -len(reg)].rstrip(".") if host.endswith(reg) else ""
    words_text = f"{subdomain} {parsed.path} {parsed.query}".lower()
    path = parsed.path.lower()
    flags: list[Flag | None] = []

    if parsed.is_ip:
        flags.append(Flag("ip", "Uses an IP address instead of a name.",
                          "Real companies almost always use a name like example.com.", "high"))
    else:
        flags.append(_brand_flag(host))
    if parsed.has_userinfo:
        flags.append(Flag("at", "Hides the real address with @.",
                          "Your browser ignores everything before the @ sign.", "high"))
    if any(label.startswith("xn--") for label in host.split(".")):
        flags.append(Flag("punycode", "Uses look-alike letters.",
                          "The name contains international characters that can imitate a real site.", "high"))
    ext = next((e for e in RISKY_EXTENSIONS if path.endswith(e)), None)
    if ext:
        flags.append(Flag("download", f"Downloads a {ext} file directly.",
                          "Opening it could install something on your device.", "high"))
    flags.append(_word_flag(words_text, SIGN_IN_WORDS, "signin", "Asks you to sign in."))
    flags.append(_word_flag(words_text, VERIFY_WORDS, "verify", "Asks you to verify or update something."))
    flags.append(_word_flag(words_text, ACCOUNT_WORDS, "account", "Mentions your account or payments."))
    if host in SHORTENERS:
        flags.append(Flag("shortener", "Shortened link.",
                          "Services like bit.ly hide where the link really goes.", "medium"))
    reg_label = reg.split(".")[0]
    if not parsed.is_ip and "-" in reg_label:
        flags.append(Flag("hyphen", "Hyphenated name.",
                          f"“{reg_label}” uses hyphens, a common way to sound official.", "medium"))
    if parsed.scheme_given and parsed.scheme == "http":
        flags.append(Flag("http", "No HTTPS.", "Anything you type would not be encrypted.", "medium"))
    if parsed.port not in (None, 80, 443):
        flags.append(Flag("port", "Uses an unusual port.", f"Port {parsed.port} is rare for normal websites.", "low"))
    if not parsed.is_ip and host.count(".") >= 4:
        flags.append(Flag("subdomains", "Unusually many dots in the name.",
                          "Long chains of subdomains can hide the real site.", "low"))
    if len(parsed.url) > 100:
        flags.append(Flag("long", "Very long address.", f"It is {len(parsed.url)} characters long.", "low"))
    digits = sum(ch.isdigit() for ch in host)
    if not parsed.is_ip and host and digits / len(host) > 0.3:
        flags.append(Flag("digits", "Lots of numbers in the name.", "Normal site names rarely look like this.", "low"))

    kept = sorted((f for f in flags if f), key=lambda f: SEVERITY_ORDER[f.severity])
    return [f.__dict__ for f in kept[:MAX_FLAGS]]
