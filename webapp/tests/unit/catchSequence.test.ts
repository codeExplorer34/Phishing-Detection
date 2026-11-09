import { describe, expect, it } from "vitest";

import { catchFor, catchForMessage, worstLink } from "@/lib/catchSequence";

const link = (verdict: "safe" | "suspicious" | "dangerous", risk: number, trusted = false) => ({ verdict, risk, trusted });

describe("catchFor", () => {
  it("reels in a phish for dangerous links, with the real score", () => {
    expect(catchFor(link("dangerous", 93))).toEqual({ kind: "phish", tag: "Phish on the line · risk 93" });
  });
  it("reels in a nibbler for suspicious links", () => {
    expect(catchFor(link("suspicious", 52)).kind).toBe("nibbler");
    expect(catchFor(link("suspicious", 52)).tag).toContain("risk 52");
  });
  it("reels in a boot for safe links", () => {
    expect(catchFor(link("safe", 12)).kind).toBe("boot");
  });
  it("treats trusted sites as safe even when the models score them high", () => {
    expect(catchFor(link("dangerous", 81, true)).kind).toBe("boot");
  });
});

describe("worstLink and catchForMessage", () => {
  it("picks the highest verdict, then the highest risk", () => {
    const links = [link("suspicious", 60), link("dangerous", 71), link("dangerous", 88), link("safe", 5)];
    expect(worstLink(links)?.risk).toBe(88);
  });
  it("ignores a trusted link's raw verdict", () => {
    expect(worstLink([link("dangerous", 90, true), link("suspicious", 45)])?.risk).toBe(45);
  });
  it("uses the worst link of a message", () => {
    expect(catchForMessage({ links: [link("safe", 3), link("dangerous", 95)] as never }).kind).toBe("phish");
  });
  it("says so when a message has no links", () => {
    expect(catchForMessage({ links: [] })).toEqual({ kind: "boot", tag: "No links in this message" });
  });
});
