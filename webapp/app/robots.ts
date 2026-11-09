import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

// Search engines and AI search assistants are welcome to read and quote the site.
const AI_SEARCH_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot",
  "PerplexityBot", "Google-Extended", "Bingbot", "Applebot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: "/api/" },
      ...AI_SEARCH_BOTS.map((userAgent) => ({ userAgent, allow: "/", disallow: "/api/" })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
