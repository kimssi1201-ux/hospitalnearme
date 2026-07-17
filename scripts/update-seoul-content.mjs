import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outputPath = path.join(rootDir, "generated", "seoul-events.json");
const sitemapPath = path.join(rootDir, "sitemap.xml");

const siteOrigin = normalizeOrigin(process.env.SITE_ORIGIN || "https://view1.kr");
const publicSiteUrl = normalizeOrigin(process.env.PUBLIC_SITE_URL || siteOrigin);
const maxSitemapEvents = Number(process.env.MAX_SITEMAP_EVENTS || 160);

function normalizeOrigin(value) {
  return String(value || "https://view1.kr").replace(/\/+$/, "");
}

function kstParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  return {
    year: parts.find((part) => part.type === "year")?.value || String(date.getUTCFullYear()),
    month: parts.find((part) => part.type === "month")?.value || String(date.getUTCMonth() + 1).padStart(2, "0"),
    day: parts.find((part) => part.type === "day")?.value || String(date.getUTCDate()).padStart(2, "0")
  };
}

function currentKstMonth() {
  const parts = kstParts();
  return `${parts.year}${parts.month}`;
}

function todayKstIso() {
  const parts = kstParts();
  return `${parts.year}-${parts.month}-${parts.day}`;
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "seoul-travel-news-daily-refresh/1.0"
      },
      signal: controller.signal
    });
    const payload = await response.json();

    if (!response.ok || payload?.ok === false) {
      throw new Error(payload?.message || `HTTP ${response.status}`);
    }

    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

function eventId(item, index) {
  return String(item?.id || item?.contentId || item?.title || `seoul-event-${index}`).trim();
}

function normalizeItems(items) {
  const list = Array.isArray(items) ? items : items ? [items] : [];
  const seen = new Set();

  return list
    .filter((item) => item && item.title)
    .map((item, index) => ({
      id: eventId(item, index),
      source: "seoul",
      category: String(item.category || "서울 문화행사"),
      title: String(item.title || "").trim(),
      summary: String(item.summary || "").trim(),
      date: String(item.date || "").trim(),
      readTime: String(item.readTime || "서울 행사 정보").trim(),
      image: String(item.image || "").replace(/^http:/, "https:"),
      address: String(item.address || item.place || "").trim(),
      place: String(item.place || "").trim(),
      gu: String(item.gu || "").trim(),
      tel: String(item.tel || "").trim(),
      homepage: String(item.homepage || "").trim(),
      fee: String(item.fee || "").trim(),
      time: String(item.time || "").trim(),
      org: String(item.org || "").trim(),
      target: String(item.target || "").trim(),
      isFree: String(item.isFree || "").trim(),
      updatedAt: String(item.updatedAt || "").trim(),
      lat: String(item.lat || "").trim(),
      lng: String(item.lng || "").trim()
    }))
    .filter((item) => {
      const key = `${item.id}::${item.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function detailUrlForItem(item) {
  const params = new URLSearchParams({
    source: "seoul",
    id: item.id || "",
    title: item.title || "",
    category: item.category || "",
    rawCategory: item.category || "",
    subCategory: item.category || "",
    date: item.date || "",
    image: item.image || "",
    address: item.address || item.place || "",
    summary: item.summary || "",
    tel: item.tel || "",
    homepage: item.homepage || "",
    fee: item.fee || "",
    time: item.time || "",
    org: item.org || "",
    target: item.target || "",
    isFree: item.isFree || "",
    updatedAt: item.updatedAt || "",
    lat: item.lat || "",
    lng: item.lng || ""
  });

  return `${publicSiteUrl}/festival-detail?${params.toString()}`;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function readExistingSitemapUrls() {
  try {
    const sitemap = await readFile(sitemapPath, "utf8");
    return [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  } catch {
    return [];
  }
}

function sitemapXml(urls, lastmod) {
  const uniqueUrls = [...new Set(urls.filter(Boolean))];
  const entries = uniqueUrls
    .map((url, index) => {
      const priority = index === 0 ? "1.0" : url.includes("festival-detail") ? "0.8" : "0.7";
      return `  <url><loc>${escapeXml(url)}</loc><lastmod>${lastmod}</lastmod><priority>${priority}</priority></url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

async function main() {
  const month = currentKstMonth();
  const endpoint = `${siteOrigin}/api/seoul-events?limit=300&month=${month}`;
  const payload = await fetchJson(endpoint);
  const items = normalizeItems(payload.items);

  if (!items.length) {
    throw new Error("서울 문화행사 데이터가 비어 있어 정적 파일을 갱신하지 않았습니다.");
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify(
      {
        ok: true,
        source: payload.source || "서울 열린데이터광장 문화행사 정보",
        fetchedFrom: endpoint,
        month,
        updatedAt: new Date().toISOString(),
        count: items.length,
        items
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  const existingUrls = await readExistingSitemapUrls();
  const generatedUrls = items.slice(0, maxSitemapEvents).map(detailUrlForItem);
  const urls = [
    `${publicSiteUrl}/`,
    ...existingUrls,
    `${publicSiteUrl}/generated/seoul-events.json`,
    ...generatedUrls
  ];
  await writeFile(sitemapPath, sitemapXml(urls, todayKstIso()), "utf8");

  console.log(`Updated ${path.relative(rootDir, outputPath)} with ${items.length} items for ${month}.`);
  console.log(`Updated ${path.relative(rootDir, sitemapPath)} with ${generatedUrls.length} generated article URLs.`);
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exitCode = 1;
});
