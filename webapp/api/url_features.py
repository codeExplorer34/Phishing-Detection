"""URL-only (lexical) feature extraction for the numeric phishing model.

The Kaggle 'web-page-phishing-detection' dataset has 81 features, but about
26 of them need the live web page or outside services (WHOIS, Google index,
page rank, web traffic). A user who pastes a URL into the demo app cannot
provide those, so the app-ready model (scenario 3) is trained only on
features that can be calculated from the URL string itself.

`extract_url_features(url)` re-implements those lexical features.
`agreement_table(df)` recalculates them for every URL in the dataset and
compares them with the dataset's own columns; only features that match on at
least AGREEMENT_THRESHOLD of rows are used for training, so the features the
app calculates are the same as the ones the model was trained on.
"""
import ipaddress
import re
import sys
from urllib.parse import urlsplit

import pandas as pd

AGREEMENT_THRESHOLD = 0.95

PHISH_HINTS = ["wp", "login", "includes", "admin", "content", "site", "images",
               "js", "alibaba", "css", "myaccount", "dropbox", "themes",
               "plugins", "signin", "view"]

SHORTENERS = re.compile(
    r"bit\.ly|goo\.gl|shorte\.st|go2l\.ink|x\.co|ow\.ly|t\.co|tinyurl|tr\.im|"
    r"is\.gd|cli\.gs|yfrog\.com|migre\.me|ff\.im|tiny\.cc|url4\.eu|twit\.ac|"
    r"su\.pr|twurl\.nl|snipurl\.com|short\.to|budurl\.com|ping\.fm|post\.ly|"
    r"just\.as|bkite\.com|snipr\.com|fic\.kr|loopt\.us|doiop\.com|short\.ie|"
    r"kl\.am|wp\.me|rubyurl\.com|om\.ly|to\.ly|bit\.do|lnkd\.in|db\.tt|"
    r"qr\.ae|adf\.ly|bitly\.com|cur\.lv|ity\.im|q\.gs|po\.st|bc\.vc|"
    r"twitthis\.com|u\.to|j\.mp|buzurl\.com|cutt\.us|u\.bb|yourls\.org|"
    r"prettylinkpro\.com|scrnch\.me|filoops\.info|vzturl\.com|qr\.net|"
    r"1url\.com|tweez\.me|v\.gd|link\.zip\.net")

WORD_SPLIT = re.compile(r"[-./?=@&%:_]")
PORT_RE = re.compile(r"^[a-z][a-z0-9+\-.]*://([^/@]+@)?([^/:]+):([0-9]+)", re.I)
PREFIX_SUFFIX_RE = re.compile(r"https?://[^\-]+-[^\-]+/")
HEX_IP_RE = re.compile(r"(0x[0-9a-f]{1,2}\.){3}0x[0-9a-f]{1,2}", re.I)


def _parts(url):
    """Split a URL into (hostname, path) safely, even for malformed input."""
    try:
        s = urlsplit(url)
        host = s.hostname or ""
        return host, s.path or ""
    except ValueError:
        return "", ""


def _has_ip(url, host):
    try:
        ipaddress.ip_address(host)
        return 1
    except ValueError:
        return int(bool(HEX_IP_RE.search(url)))


def _ratio(text, total):
    return 0.0 if total == 0 else sum(c.isdigit() for c in text) / total


def extract_url_features(url):
    """Return a dict of lexical features calculated from the URL string only."""
    url = str(url).strip()
    host, path = _parts(url)
    words = [w for w in WORD_SPLIT.split(host + path) if w]
    dslash = [m.start() for m in re.finditer("//", url)]
    # the dataset's nb_subdomains counts dots in the whole URL, capped to 1..3
    dots_in_url = url.count(".")
    return {
        "length_url": len(url),
        "length_hostname": len(host),
        "ip": _has_ip(url, host),
        "nb_dots": url.count("."),
        "nb_hyphens": url.count("-"),
        "nb_at": url.count("@"),
        "nb_qm": url.count("?"),
        "nb_and": url.count("&"),
        "nb_eq": url.count("="),
        "nb_underscore": url.count("_"),
        "nb_tilde": url.count("~"),
        "nb_percent": url.count("%"),
        "nb_slash": url.count("/"),
        "nb_star": url.count("*"),
        "nb_colon": url.count(":"),
        "nb_comma": url.count(","),
        "nb_semicolumn": url.count(";"),
        "nb_dollar": url.count("$"),
        "nb_space": url.count(" ") + url.count("%20"),
        "nb_www": sum("www" in w for w in words),
        "nb_com": sum("com" in w for w in words),
        "nb_dslash": int(bool(dslash) and dslash[-1] > 6),
        "http_in_path": path.count("http"),
        "https_token": int(not url.lower().startswith("https")),
        "ratio_digits_url": _ratio(url, len(url)),
        "ratio_digits_host": _ratio(host, len(host)),
        "punycode": int(url.lower().startswith(("http://xn--", "https://xn--"))),
        "port": int(bool(PORT_RE.search(url))),
        "nb_subdomains": min(max(dots_in_url, 1), 3),
        "prefix_suffix": int(bool(PREFIX_SUFFIX_RE.search(url))),
        "shortening_service": int(bool(SHORTENERS.search(url))),
        "phish_hints": sum(path.lower().count(h) for h in PHISH_HINTS),
    }


def features_frame(urls):
    """Calculate features for many URLs -> DataFrame (one row per URL)."""
    return pd.DataFrame([extract_url_features(u) for u in urls])


def agreement_table(df):
    """Compare recalculated features with the dataset's stored columns.

    Returns a DataFrame with the share of rows where they match (ratios are
    compared with a small tolerance) and whether each feature is kept.
    """
    calc = features_frame(df["url"])
    rows = []
    for col in calc.columns:
        if col not in df.columns:
            continue
        stored = df[col].reset_index(drop=True)
        if col.startswith("ratio_"):
            match = (calc[col] - stored).abs() <= 1e-3
        else:
            match = calc[col] == stored
        rows.append({"feature": col, "agreement": round(float(match.mean()), 4)})
    out = pd.DataFrame(rows).sort_values("agreement", ascending=False)
    out["kept"] = out["agreement"] >= AGREEMENT_THRESHOLD
    return out.reset_index(drop=True)


if __name__ == "__main__":
    # Usage: python url_features.py <numeric_train.csv>   (prints the agreement table)
    if len(sys.argv) != 2:
        raise SystemExit("usage: python url_features.py <numeric_train.csv>")
    print(agreement_table(pd.read_csv(sys.argv[1])).to_string(index=False))
