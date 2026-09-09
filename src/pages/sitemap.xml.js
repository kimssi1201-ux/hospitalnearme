import { getCategories } from "../lib/categories.mjs";
import { getActiveCampaigns } from "../lib/campaigns.mjs";
import { getExistingArticlePaths, getExistingFestivalPaths } from "../lib/legacy-content.mjs";
import { absoluteUrl } from "../lib/seo.mjs";

function escapeXml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const categories = await getCategories();
  const campaigns = await getActiveCampaigns();
  const articlePaths = await getExistingArticlePaths();
  const festivalPaths = await getExistingFestivalPaths();
  const paths = [
    "/",
    "/festival/",
    "/articles/",
    "/about",
    "/editorial-policy",
    "/contact",
    "/privacy",
    "/terms",
    "/disclaimer",
    ...categories.map((category) => `/category/${category.slug}/`),
    ...campaigns.map((campaign) => `/event/${campaign.slug}/`),
    ...articlePaths,
    ...festivalPaths
  ];
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = [...new Set(paths)].map((pathname) => {
    const priority = pathname === "/" ? "1.0" : pathname.startsWith("/event/") ? "0.9" : pathname.startsWith("/category/") ? "0.8" : "0.7";
    return `  <url><loc>${escapeXml(absoluteUrl(pathname))}</loc><lastmod>${lastmod}</lastmod><priority>${priority}</priority></url>`;
  }).join("\n");

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
    headers: { "content-type": "application/xml; charset=utf-8" }
  });
}
