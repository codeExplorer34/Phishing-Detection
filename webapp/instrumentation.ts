/** Runs once when the Next.js server starts. */
export async function register(): Promise<void> {
  // Written as one inline condition so the Edge build drops the Node-only import entirely.
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "development") {
    // Next's dev proxy triggers a harmless Node 24 deprecation warning (util._extend); keep the console clean.
    process.noDeprecation = true;
    const { ensureDevApi } = await import("./lib/devApi");
    await ensureDevApi();
  }
}
