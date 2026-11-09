import type { MetadataRoute } from "next";

import { LAST_UPDATED } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE_URL, lastModified: LAST_UPDATED, changeFrequency: "weekly", priority: 1 }];
}
