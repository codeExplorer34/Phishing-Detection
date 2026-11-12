import { describe, expect, it } from "vitest";

import { INTRO_KEY, INTRO_SCRIPT } from "@/lib/headScripts";

describe("head script", () => {
  it("is plain, valid JavaScript (a client reference here once broke it silently)", () => {
    expect(typeof INTRO_SCRIPT).toBe("string");
    expect(() => new Function(INTRO_SCRIPT)).not.toThrow();
    expect(INTRO_SCRIPT).toContain(INTRO_KEY);
    expect(INTRO_SCRIPT).toContain("prefers-reduced-motion: reduce");
  });
});
