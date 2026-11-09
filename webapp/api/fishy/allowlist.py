"""A short list of well-known domains that skip the models' verdict.

Why it exists: Model B learned that bare homepages are usually phishing (they were in its
training data), so it flags sites like google.com. Member 3's README documents this.

Matching is on the registered domain, so "paypal.com.evil.ru" does NOT match paypal.com.
Hosts that serve pages anyone can create (Google Forms, Drive…) are never trusted,
because phishers really do host pages there.
"""

TRUSTED_DOMAINS = frozenset({
    "google.com", "youtube.com", "gmail.com", "github.com", "microsoft.com", "live.com",
    "outlook.com", "office.com", "apple.com", "icloud.com", "amazon.com", "paypal.com",
    "wikipedia.org", "bbc.co.uk", "bbc.com", "linkedin.com", "facebook.com", "instagram.com",
    "whatsapp.com", "x.com", "twitter.com", "netflix.com", "reddit.com", "stackoverflow.com",
    "python.org", "kaggle.com", "uow.edu.au", "uowdubai.ac.ae", "anthropic.com", "claude.ai",
    "openai.com", "vercel.com", "mozilla.org", "yahoo.com", "bing.com", "duckduckgo.com",
    "coursera.org", "spotify.com", "adobe.com", "zoom.us", "scikit-learn.org", "arxiv.org",
})

USER_CONTENT_HOSTS = frozenset({
    "docs.google.com", "drive.google.com", "sites.google.com", "forms.google.com",
    "script.google.com", "storage.googleapis.com", "firebasestorage.googleapis.com",
    "forms.office.com", "onedrive.live.com", "gist.github.com", "raw.githubusercontent.com",
})

# Second-level labels used under two-letter country endings: example.co.uk, uow.edu.au
_SECOND_LEVEL = frozenset({"co", "com", "ac", "edu", "gov", "org", "net"})


def registered_domain(host: str) -> str:
    """Approximate the name someone actually registered: "a.b.paypal.com" -> "paypal.com"."""
    labels = [label for label in host.lower().split(".") if label]
    if len(labels) <= 2:
        return ".".join(labels)
    if len(labels[-1]) == 2 and labels[-2] in _SECOND_LEVEL:
        return ".".join(labels[-3:])
    return ".".join(labels[-2:])


def is_trusted(host: str, is_ip: bool = False) -> bool:
    if is_ip:
        return False
    host = host.lower()
    if host in USER_CONTENT_HOSTS:
        return False
    return registered_domain(host) in TRUSTED_DOMAINS
