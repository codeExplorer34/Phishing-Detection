from fishy.message import MAX_LINKS, brands_mentioned, cue_summary, extract_urls, find_cues

SAMPLE = (
    "Subject: Urgent: your account has been suspended\n\n"
    "Dear customer,\nWe noticed unusual activity on your PayPal account. Verify your account "
    "within 24 hours or it will be permanently suspended.\n\n"
    "Confirm your password here: http://paypa1-secure-update.com/signin\n"
    "Or use this short link: bit.ly/3xR9qPz\n\n"
    "Need help? Visit https://www.paypal.com/help. Reply to support@paypal.com."
)


def test_extracts_full_bare_and_www_links_but_not_emails():
    urls, truncated = extract_urls(SAMPLE)
    assert urls == ["http://paypa1-secure-update.com/signin", "bit.ly/3xR9qPz", "https://www.paypal.com/help"]
    assert truncated is False


def test_dedupes_and_strips_punctuation():
    urls, _ = extract_urls("See (https://a-b.com/x). Again: https://a-b.com/x, and www.c-d.org!")
    assert urls == ["https://a-b.com/x", "www.c-d.org"]


def test_limits_number_of_links():
    text = " ".join(f"https://site{i}.com" for i in range(MAX_LINKS + 3))
    urls, truncated = extract_urls(text)
    assert len(urls) == MAX_LINKS and truncated is True


def test_ignores_non_link_words():
    assert extract_urls("Nothing here, e.g. a sentence. Node version 3.11 is fine.")[0] == []


def test_cues_positions_and_summary():
    cues = find_cues(SAMPLE)
    for cue in cues:
        assert SAMPLE[cue["start"]:cue["end"]] == cue["text"]
    starts = [c["start"] for c in cues]
    assert starts == sorted(starts)
    summary = {s["category"]: s["count"] for s in cue_summary(cues)}
    assert summary == {"urgency": 2, "threat": 3, "credentials": 2}


def test_overlapping_cues_keep_the_longer_phrase():
    cues = find_cues("Please verify your account now")
    assert [c["text"] for c in cues] == ["verify your account"]


def test_brands_mentioned():
    assert brands_mentioned(SAMPLE) == ["PayPal"]
    assert brands_mentioned("I like pineapples") == []
