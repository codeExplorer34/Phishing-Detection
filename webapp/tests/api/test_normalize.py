import pytest

from fishy.normalize import InvalidUrl, parse_url


def test_adds_http_when_no_scheme_and_remembers_it():
    p = parse_url("  paypa1-secure-update.com/signin ")
    assert p.url == "http://paypa1-secure-update.com/signin"
    assert p.scheme_given is False
    assert p.host == "paypa1-secure-update.com"
    assert p.path == "/signin"


def test_keeps_given_scheme_and_lowercases_host():
    p = parse_url("HTTPS://WWW.Google.COM/Search?q=1")
    assert p.scheme == "https" and p.scheme_given is True
    assert p.host == "www.google.com"
    assert p.query == "q=1"


def test_ip_host_and_port():
    p = parse_url("http://192.168.4.2:8080/login")
    assert p.is_ip is True and p.port == 8080


def test_userinfo_is_detected():
    assert parse_url("http://paypal.com@evil.ru/x").has_userinfo is True


def test_unicode_host_becomes_punycode():
    assert parse_url("http://pаypal.com").host.startswith("xn--")   # Cyrillic 'а'


@pytest.mark.parametrize("bad", [
    "", "   ", "not a url", "javascript:alert(1)", "mailto:a@b.com", "ftp://example.com",
    "http://", "localhost", "http://exa_mple.com", "http://example.c", "http://example.com:99999",
    "x" * 2049,
])
def test_rejects_invalid_input_with_friendly_message(bad):
    with pytest.raises(InvalidUrl) as err:
        parse_url(bad)
    assert len(str(err.value)) > 10


def test_host_with_port_is_not_mistaken_for_a_scheme():
    assert parse_url("example.com:8080/a").port == 8080
