/**
 * Sitemap Generation
 * Generates XML sitemap for SEO
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

const BASE_URL = "https://nop-intelligence.com";

const staticRoutes = [
  { path: "/", priority: 1.0, changefreq: "daily" },
  { path: "/contributes", priority: 0.9, changefreq: "hourly" },
  { path: "/portfolio", priority: 0.8, changefreq: "daily" },
  { path: "/search", priority: 0.7, changefreq: "daily" },
  { path: "/features", priority: 0.6, changefreq: "monthly" },
  { path: "/about", priority: 0.6, changefreq: "monthly" },
  { path: "/roadmap", priority: 0.6, changefreq: "monthly" },
  { path: "/legal", priority: 0.5, changefreq: "monthly" },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticRoutes
  .map(
    (route) => `  <url>
    <loc>${BASE_URL}${route.path}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).send(sitemap);
  } catch (error) {
    console.error("[sitemap] Error generating sitemap", error);
    return res.status(500).json({ error: "Failed to generate sitemap" });
  }
}

