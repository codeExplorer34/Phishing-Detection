/** Best-effort host of what the user typed, for the instant blocklist check. Null if unparseable. */
export function hostOf(input: string): string | null {
  const text = input.trim();
  if (!text || /\s/.test(text)) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `http://${text}`;
  try {
    const { protocol, hostname } = new URL(withScheme);
    if (protocol !== "http:" && protocol !== "https:") return null;
    return hostname.replace(/\.$/, "").toLowerCase() || null;
  } catch {
    return null;
  }
}

/** A URL that is safe to put in an href: only http(s). */
export function safeHref(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : null;
  } catch {
    return null;
  }
}
