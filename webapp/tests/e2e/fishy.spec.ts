import { expect, test, type Page } from "@playwright/test";

const result = (page: Page) => page.locator("#result");

async function checkLink(page: Page, url: string) {
  await page.locator("#scan-input").fill(url);
  await page.getByRole("button", { name: "Check link" }).first().click();
}

const INTRO_KEY = "fishy.intro.v1";

test.beforeEach(async ({ page }) => {
  // The first-visit intro has its own tests below; everywhere else, start as a returning visitor.
  await page.addInitScript((key) => sessionStorage.setItem(key, "1"), INTRO_KEY);
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("key facts are in the server-rendered HTML", async ({ request }) => {
  const html = await (await request.get("/")).text();
  for (const text of ["How Fishy is your link?", "find out if it’s phishing", "How accurate is Fishy?", "0.714", "65.7%", "Hannousse", "Last updated"]) {
    expect(html).toContain(text);
  }
  expect(html).not.toContain("nosnippet");
});

test("shows a labelled example before any check", async ({ page }) => {
  await expect(result(page).getByText("Example result")).toBeVisible();
  await expect(result(page).getByText("Example", { exact: true })).toBeVisible();
  await expect(result(page).getByRole("heading", { name: "Blocked automatically" })).toBeVisible();
});

test("dangerous link: blocked, alerted, listed, and survives a reload", async ({ page }) => {
  await checkLink(page, "http://paypa1-secure-update.com/signin");
  await expect(result(page).getByRole("heading", { name: "Blocked automatically" })).toBeVisible();
  await expect(result(page).getByText("Pretends to be PayPal.")).toBeVisible();
  await expect(result(page).getByText("Your result")).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Dangerous link blocked" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Blocklist (1)" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("tab", { name: "Blocklist (1)" })).toBeVisible();
  await expect(page.locator("#pc-panel")).toContainText("paypa1-secure-update.com");
});

test("trusted site shows as safe with an honest note", async ({ page }) => {
  await checkLink(page, "google.com");
  await expect(result(page).getByRole("heading", { name: "Looks safe" })).toBeVisible();
  await expect(result(page).getByText("Safe · trusted")).toBeVisible();
  await expect(result(page)).toContainText("The two models average 34 out of 100, which is Safe anyway.");
  await expect(result(page).getByText("The models disagree here.")).toBeVisible();
  await expect(result(page)).toContainText("Scored as http://google.com.");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(result(page).getByRole("link", { name: /Open link/ })).toHaveAttribute("rel", /noopener/);
});

test("suspicious link can be blocked by hand", async ({ page }) => {
  await checkLink(page, "http://www.my-bank-online.info/login.php");
  await expect(result(page).getByRole("heading", { name: "Be careful with this one" })).toBeVisible();
  await result(page).getByRole("button", { name: "Block it" }).click();
  await expect(result(page).getByText("On your blocklist")).toBeVisible();
});

test("undo, open-anyway dialog and the blocked-before shortcut", async ({ page }) => {
  await page.getByRole("button", { name: "free-gift-card.xyz" }).click();
  await expect(result(page).getByText("Looks like malware")).toBeVisible();
  await result(page).getByRole("button", { name: "Open anyway" }).click();
  const dialog = page.getByRole("dialog", { name: "This link is blocked." });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Keep me safe" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  await checkLink(page, "free-gift-card.xyz/claim.exe");
  await expect(result(page).getByRole("heading", { name: "You blocked this site before" })).toBeVisible();
  await result(page).getByRole("button", { name: "Remove from blocklist" }).click();
  await expect(page.getByRole("tab", { name: "Blocklist (0)" })).toBeVisible();
  await result(page).getByRole("button", { name: "Check again anyway" }).click();
  await expect(result(page).getByRole("heading", { name: "Blocked automatically" })).toBeVisible();
  await result(page).getByRole("button", { name: "Undo" }).click();
  await expect(result(page).getByText("Removed from your blocklist.")).toBeVisible();
});

test("message tab finds links and warning phrases", async ({ page }) => {
  await page.getByRole("tab", { name: "Message" }).click();
  await page.getByRole("button", { name: "Load a sample" }).click();
  await page.getByRole("button", { name: "Check message" }).click();
  await expect(result(page).getByRole("heading", { name: "links are dangerous" })).toBeVisible();
  await expect(result(page)).toContainText("Safe · trusted");
  await expect(result(page)).toContainText("Rule-based cues, not machine learning");
  await expect(result(page).locator("mark").first()).toBeVisible();
  await expect(page.getByRole("tab", { name: "Blocklist (2)" })).toBeVisible();
});

test("friendly errors for empty and invalid input", async ({ page }) => {
  await page.getByRole("button", { name: "Check link" }).first().click();
  await expect(page.getByRole("alert").filter({ hasText: "Paste a link to check." })).toBeVisible();
  await expect(page.locator("#scan-input")).toBeFocused();
  await checkLink(page, "javascript:alert(1)");
  await expect(result(page).getByText("Fishy can only check web links")).toBeVisible();
});

test("keyboard: '/' focuses the input and tabs move with arrow keys", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard shortcuts are a desktop feature");
  await page.locator("body").click({ position: { x: 5, y: 400 } });
  await page.keyboard.press("/");
  await expect(page.locator("#scan-input")).toBeFocused();
  await page.getByRole("tab", { name: "Link" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Message" })).toHaveAttribute("aria-selected", "true");
});

test("exports download real files", async ({ page }, testInfo) => {
  await checkLink(page, "http://paypa1-secure-update.com/signin");
  await expect(page.getByRole("tab", { name: "Blocklist (1)" })).toBeVisible();
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Export hosts file" }).click()]);
  expect(download.suggestedFilename()).toBe("fishy-blocklist.hosts");
  const file = testInfo.outputPath("fishy-blocklist.hosts");
  await download.saveAs(file);
  const { readFileSync } = await import("node:fs");
  expect(readFileSync(file, "utf8")).toContain("0.0.0.0 paypa1-secure-update.com");
});

test("FAQ works without JavaScript-style widgets", async ({ page }) => {
  const second = page.locator("#faq details").nth(1);
  await second.locator("summary").click();
  await expect(second).toHaveAttribute("open", "");
});

test("accuracy leads with a plain takeaway and hides the F1 definition until asked", async ({ page }) => {
  const accuracy = page.locator("#accuracy");
  await expect(accuracy.getByText("In short:")).toBeVisible();
  await expect(accuracy.getByText(/F1 combines/)).toBeHidden();
  await accuracy.getByText("What do these numbers mean?").click();
  await expect(accuracy.getByText(/F1 combines/)).toBeVisible();
});

test("no horizontal scrolling and the mobile menu works", async ({ page, isMobile }) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  // Clipped content doesn't cause scrolling, so also check that no heading runs past the screen edge.
  const clipped = await page.evaluate(() => [...document.querySelectorAll("h1, h2, h3")]
    .filter((h) => h.getBoundingClientRect().width > 0 && h.getBoundingClientRect().right > window.innerWidth + 1)
    .map((h) => h.textContent));
  expect(clipped).toEqual([]);
  test.skip(!isMobile, "menu button is mobile only");
  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await page.getByRole("button", { name: "Open menu" }).click();
  await menu.getByRole("link", { name: "Accuracy" }).click();
  await expect(menu).toBeHidden();
});

test("everything is readable with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await page.locator("#findings").scrollIntoViewIfNeeded();
  await expect(page.getByRole("heading", { name: "What did we find that we didn’t expect?" })).toBeVisible();
  const bob = await page.locator(".bob").first().evaluate((el) => getComputedStyle(el).animationName);
  expect(bob).toBe("none");
});

test.describe("loading screen", () => {
  test("first visit shows the intro once, it lifts by itself and a key press skips it", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();
    await page.goto("/");
    const intro = page.getByTestId("intro");
    await expect(intro).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "How Fishy is your link?" })).toBeAttached();   // page is underneath
    await expect(intro).toBeHidden({ timeout: 6_000 });                                                     // lifts on its own
    await page.reload();
    await expect(intro).toBeHidden();                                                                       // once per session
    const fresh = await context.browser()!.newContext({ baseURL });
    const second = await fresh.newPage();
    await second.goto("/");
    await expect(second.getByTestId("intro")).toBeVisible();
    await second.keyboard.press("Space");
    await expect(second.getByTestId("intro")).toBeHidden();
    await fresh.close();
    await context.close();
  });

  test("the fishing scene shows while checking, then the catch, then the result", async ({ page }) => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    await page.route("**/api/py/scan", async (route) => { await gate; await route.continue(); });
    await checkLink(page, "http://paypa1-secure-update.com/signin");
    await expect(result(page).locator(".lk-scene")).toBeVisible();
    await expect(result(page).getByText("Casting a line")).toBeVisible();
    await expect(result(page).getByText("Checking the link with both models…")).toBeVisible();
    release();
    await expect(result(page).locator('[data-catch="phish"] .lk-tag')).toBeVisible();
    await expect(result(page).getByText("Phish on the line · risk")).toBeVisible();
    await expect(result(page).getByRole("heading", { name: "Blocked automatically" })).toBeVisible();
    await expect(result(page).locator(".lk-scene")).toHaveCount(0);
  });

  test("a safe link reels in the boot, and Escape skips straight to the result", async ({ page }) => {
    await checkLink(page, "google.com");
    await expect(result(page).locator('[data-catch="boot"] .lk-tag')).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(result(page).getByRole("heading", { name: "Looks safe" })).toBeVisible();
  });

  test("reduced motion: no intro, a still scene, and no catch delay", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.getByTestId("intro")).toBeHidden();
    await checkLink(page, "http://paypa1-secure-update.com/signin");
    await expect(result(page).getByRole("heading", { name: "Blocked automatically" })).toBeVisible();
    await expect(result(page).locator("[data-catch]")).toHaveCount(0);
    await context.close();
  });
});
