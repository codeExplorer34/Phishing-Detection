import { defineConfig, devices } from "@playwright/test";

// Expects the API on :8000 and `next start` on :3000 (see README "Run the tests").
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000", channel: "msedge", trace: "off" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Edge"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { channel: "msedge", viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true } },
  ],
});
