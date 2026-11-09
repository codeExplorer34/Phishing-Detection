"""Validate what the user typed and turn it into a URL the models can score.

Fishy never fetches the URL. This module only parses text, so a hostile input
cannot make the server contact another machine.
"""
import ipaddress
import re
from dataclasses import dataclass
from urllib.parse import urlsplit

MAX_URL_LENGTH = 2048
ALLOWED_SCHEMES = ("http", "https")

_HAS_SCHEME = re.compile(r"^[a-z][a-z0-9+.-]*://", re.I)
_OTHER_SCHEME = re.compile(r"^[a-z][a-z0-9+.-]*:(?!\d)", re.I)   # mailto:, javascript: (not host:port)
_LABEL = re.compile(r"^(?!-)[a-z0-9-]{1,63}(?<!-)$")
_TLD = re.compile(r"^(?:[a-z]{2,24}|xn--[a-z0-9-]{1,59})$")


class InvalidUrl(ValueError):
    """Raised with a message that is safe to show to the user."""


@dataclass(frozen=True)
class ParsedUrl:
    original: str        # what the user typed, trimmed
    url: str             # with a scheme, as sent to the models
    scheme: str          # "http" or "https"
    scheme_given: bool   # False when we added "http://" ourselves
    host: str            # lower case, ASCII (punycode), no port, no trailing dot
    is_ip: bool
    port: int | None
    has_userinfo: bool   # "user@host" trick
    path: str
    query: str


def _check_host(host: str) -> bool:
    """True when host is an IP address; raises InvalidUrl when it is not a valid name."""
    try:
        ipaddress.ip_address(host)
        return True
    except ValueError:
        pass
    labels = host.split(".")
    if len(labels) < 2 or not _TLD.match(labels[-1]) or not all(_LABEL.match(l) for l in labels):
        raise InvalidUrl("That doesn’t look like a web address. Try something like example.com.")
    return False


def parse_url(raw: str) -> ParsedUrl:
    text = (raw or "").strip()
    if not text:
        raise InvalidUrl("Paste a link to check.")
    if len(text) > MAX_URL_LENGTH:
        raise InvalidUrl("That link is too long. Fishy checks links up to 2,048 characters.")
    if any(ch.isspace() for ch in text):
        raise InvalidUrl("A link can’t contain spaces. To check a whole message, use the Message tab.")

    scheme_given = bool(_HAS_SCHEME.match(text))
    if not scheme_given and _OTHER_SCHEME.match(text):
        raise InvalidUrl("Fishy can only check web links that start with http or https.")
    url = text if scheme_given else f"http://{text}"

    try:
        parts = urlsplit(url)
        port = parts.port
        hostname = parts.hostname
    except ValueError as exc:
        raise InvalidUrl("That doesn’t look like a web address. Try something like example.com.") from exc

    scheme = parts.scheme.lower()
    if scheme not in ALLOWED_SCHEMES:
        raise InvalidUrl("Fishy can only check web links that start with http or https.")
    if not hostname:
        raise InvalidUrl("That doesn’t look like a web address. Try something like example.com.")

    try:
        host = hostname.rstrip(".").encode("idna").decode("ascii").lower()
    except UnicodeError as exc:
        raise InvalidUrl("That web address has characters Fishy can’t read.") from exc

    is_ip = _check_host(host)
    return ParsedUrl(
        original=text, url=url, scheme=scheme, scheme_given=scheme_given, host=host,
        is_ip=is_ip, port=port, has_userinfo=bool(parts.username), path=parts.path, query=parts.query,
    )
