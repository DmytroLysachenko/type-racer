import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin();
  if (!origin) return [];
  return [
    { url: origin.toString() },
    { url: new URL("/practice", origin).toString() },
  ];
}
