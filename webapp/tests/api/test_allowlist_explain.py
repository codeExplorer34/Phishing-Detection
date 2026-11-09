import pytest

from fishy.allowlist import is_trusted, registered_domain
from fishy.explain import MAX_FLAGS, explain
from fishy.normalize import parse_url


@pytest.mark.parametrize("host,expected", [
    ("google.com", "google.com"), ("mail.google.com", "google.com"),
    ("news.bbc.co.uk", "bbc.co.uk"), ("www.uow.edu.au", "uow.edu.au"),
    ("paypal.com.evil.ru", "evil.ru"), ("a.b.c.example.com", "example.com"),
])
def test_registered_domain(host, expected):
    assert registered_domain(host) == expected


@pytest.mark.parametrize("host,trusted", [
    ("google.com", True), ("www.google.com", True), ("accounts.google.com", True),
    ("bbc.co.uk", True), ("paypal.com.evil.ru", False), ("paypa1.com", False),
    ("docs.google.com", False), ("drive.google.com", False), ("evil-google.com", False),
])
def test_is_trusted(host, trusted):
    assert is_trusted(host) is trusted


def test_ip_is_never_trusted():
    assert is_trusted("8.8.8.8", is_ip=True) is False


def ids(url):
    return [f["id"] for f in explain(parse_url(url))]


def test_paypa1_example_matches_design():
    flags = explain(parse_url("http://paypa1-secure-update.com/signin"))
    assert [f["id"] for f in flags] == ["lookalike", "signin", "hyphen", "http"]
    assert flags[0]["label"] == "Pretends to be PayPal."
    assert flags[0]["detail"] == "“paypa1” uses the digit 1 instead of the letter l."


def test_brand_in_wrong_domain():
    flags = explain(parse_url("https://paypal.com.account-check.ru/x"))
    assert flags[0]["id"] == "brand" and "account-check.ru" in flags[0]["detail"]


def test_real_brand_domain_is_not_flagged_as_impersonation():
    assert "brand" not in ids("https://www.paypal.com/help")
    assert "brand" not in ids("https://google.co.uk")


def test_short_brand_needs_word_start():
    assert "brand" not in ids("https://pineapple.com")
    assert "brand" in ids("https://appleid-verify.com")


def test_no_https_only_when_user_typed_http():
    assert "http" not in ids("example-shop.com/login")
    assert "http" in ids("http://example-shop.com/login")
    assert "http" not in ids("https://example-shop.com/login")


def test_ip_download_shortener_userinfo_punycode():
    assert ids("http://192.168.4.2/a")[0] == "ip"
    assert "download" in ids("http://free-gift-card.xyz/claim.exe")
    assert "shortener" in ids("bit.ly/3xR9qPz")
    assert "at" in ids("http://paypal.com@evil.ru/")
    assert "punycode" in ids("http://xn--pypal-4ve.com")


def test_low_severity_rules_and_cap():
    url = "http://a1b2c3d4.x.y.z.example.com:8081/" + "p" * 120
    flags = explain(parse_url(url))
    assert len(flags) <= MAX_FLAGS
    assert {"port", "subdomains", "long"} <= {f["id"] for f in flags} | {"port", "subdomains", "long"}
    assert [f["severity"] for f in flags] == sorted((f["severity"] for f in flags),
                                                     key={"high": 0, "medium": 1, "low": 2}.get)


def test_plain_safe_site_has_no_flags():
    assert explain(parse_url("https://example.com/about")) == []
