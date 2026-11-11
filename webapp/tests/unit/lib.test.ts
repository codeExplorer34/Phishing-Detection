import { describe, expect, it } from "vitest";

import { request, scanLink } from "@/lib/api";
import { ACCURACY_ROWS, accuracyTakeaway, EXAMPLE_RESULT, FINDINGS, METRICS, WORST } from "@/lib/content";
import { toCsv, toHostsFile } from "@/lib/exportBlocklist";
import { f3, longDate, timeAgo } from "@/lib/format";
import type { Entry } from "@/lib/protectionStore";
import { healthSchema } from "@/lib/schemas";
import { hostOf, safeHref } from "@/lib/url";
import { barColor, headlineFor, percent, scoredAsNote, threatLabel, trustedOverrideNote } from "@/lib/verdict";

const e = (host: string, extra: Partial<Entry> = {}): Entry => ({
  id: host, url: `http://${host}/`, host, risk: 90, verdict: "dangerous", threatType: "phishing",
  source: "link", at: Date.UTC(2026, 10, 9), ...extra,
});

describe("exports", () => {
  it("writes a hosts file and comments out IP addresses", () => {
    const text = toHostsFile([e("evil.com"), e("192.168.4.2"), e("evil.com")], new Date(Date.UTC(2026, 10, 9)));
    expect(text).toContain("0.0.0.0 evil.com");
    expect(text.match(/evil\.com/g)).toHaveLength(1);
    expect(text).toContain("# 192.168.4.2 (an IP address, can't be blocked here)");
    expect(text).not.toContain("0.0.0.0 192.168.4.2");
  });

  it("writes CSV with quoting and blocks formula injection", () => {
    const csv = toCsv([e("a.com", { url: 'http://a.com/"x",y', threatType: null }), e("=cmd.com")]);
    const [header, first, second] = csv.trim().split("\n");
    expect(header).toBe("host,url,risk,verdict,type,found_in,date");
    expect(first).toContain('"http://a.com/""x"",y"');
    expect(second.startsWith("'=cmd.com")).toBe(true);
  });
});

describe("url helpers", () => {
  it("finds the host of typed input", () => {
    expect(hostOf(" PayPa1-Secure.com/signin ")).toBe("paypa1-secure.com");
    expect(hostOf("https://www.google.com.")).toBe("www.google.com");
    expect(hostOf("javascript:alert(1)")).toBeNull();
    expect(hostOf("two words")).toBeNull();
    expect(hostOf("")).toBeNull();
  });

  it("only allows http(s) hrefs", () => {
    expect(safeHref("https://a.com/x")).toBe("https://a.com/x");
    expect(safeHref("javascript:alert(1)")).toBeNull();
    expect(safeHref("nonsense")).toBeNull();
  });
});

describe("formatting and verdicts", () => {
  it("formats", () => {
    const now = 1_000_000_000;
    expect(timeAgo(now - 10_000, now)).toBe("just now");
    expect(timeAgo(now - 5 * 60_000, now)).toBe("5 min ago");
    expect(timeAgo(now - 3 * 3_600_000, now)).toBe("3 h ago");
    expect(timeAgo(now - 30 * 3_600_000, now)).toBe("yesterday");
    expect(timeAgo(now - 72 * 3_600_000, now)).toBe("3 days ago");
    expect(f3(0.8)).toBe("0.800");
    expect(longDate("2026-11-09")).toBe("9 November 2026");
    expect(percent(0.895)).toBe("89.5%");
  });

  it("maps verdicts", () => {
    expect(barColor(0.1)).toBe("#059669");
    expect(barColor(0.5)).toBe("#D97706");
    expect(barColor(0.9)).toBe("#E11D48");
    expect(threatLabel("malware")).toBe("Looks like malware");
    expect(threatLabel(null)).toBeNull();
    expect(threatLabel("benign")).toBeNull();
    expect(headlineFor({ verdict: "dangerous", trusted: false })).toBe("Blocked automatically");
    expect(headlineFor({ verdict: "safe", trusted: true })).toBe("Looks safe");
  });

  it("explains when the trusted list changed the answer and when it did not", () => {
    const base = { trusted: true, registered_domain: "google.com" };
    expect(trustedOverrideNote({ ...base, risk: 34, model_verdict: "safe" }))
      .toBe("The two models average 34 out of 100, which is Safe anyway. google.com is also on Fishy’s trusted list.");
    expect(trustedOverrideNote({ ...base, registered_domain: "uowdubai.ac.ae", risk: 70, model_verdict: "dangerous" }))
      .toBe("The two models average 70 out of 100 (Dangerous). Fishy shows it as safe because uowdubai.ac.ae is on its trusted list of well-known sites.");
    expect(trustedOverrideNote({ ...base, trusted: false, risk: 90, model_verdict: "dangerous" })).toBeNull();
  });

  it("notes the added http:// only when Fishy added it", () => {
    expect(scoredAsNote({ input: "google.com", url: "http://google.com" })).toMatch(/^Scored as http:\/\/google\.com\. /);
    expect(scoredAsNote({ input: "https://google.com", url: "https://google.com" })).toBeNull();
  });
});

describe("content is built from real metrics", () => {
  it("matches metrics.json", () => {
    expect(ACCURACY_ROWS[1].a).toBe(METRICS.cross_dataset.url.a);
    expect(WORST.both).toBe(Math.min(METRICS.cross_dataset.url.both, METRICS.cross_dataset.web_page.both));
    expect(FINDINGS[1].figure).toBe(METRICS.ip_mismatches.toLocaleString("en-US"));
    expect(EXAMPLE_RESULT.verdict).toBe("dangerous");
    const takeaway = accuracyTakeaway();
    for (const n of [WORST.a, WORST.b, WORST.both]) expect(takeaway).toContain(f3(n));
  });
});

describe("api client", () => {
  const respond = (status: number, body: unknown) => async () =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

  it("returns validated data", async () => {
    const out = await request("/x", healthSchema, {}, respond(200, { ok: true, data: { status: "ok", models_loaded: true } }));
    expect(out).toEqual({ ok: true, data: { status: "ok", models_loaded: true } });
  });

  it("passes server error messages through", async () => {
    const out = await scanLink("x", respond(422, { ok: false, error: "Paste a link to check." }));
    expect(out).toEqual({ ok: false, error: "Paste a link to check." });
  });

  it("rejects responses with the wrong shape", async () => {
    const out = await scanLink("x", respond(200, { ok: true, data: { risk: "high" } }));
    expect(out.ok).toBe(false);
  });

  it("gives friendly messages for rate limits, server errors and network failure", async () => {
    expect(await scanLink("x", async () => new Response("nope", { status: 429 }))).toMatchObject({ ok: false, error: expect.stringMatching(/Wait a minute/) });
    expect(await scanLink("x", async () => new Response("nope", { status: 502 }))).toMatchObject({ ok: false, error: expect.stringMatching(/Fishy’s side/) });
    expect(await scanLink("x", async () => { throw new TypeError("network"); })).toMatchObject({ ok: false, error: expect.stringMatching(/couldn’t reach/) });
  });
});
