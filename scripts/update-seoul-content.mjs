import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outputPath = path.join(rootDir, "generated", "seoul-events.json");
const sitemapPath = path.join(rootDir, "sitemap.xml");
const indexPath = path.join(rootDir, "index.html");
const editorialDataPath = path.join(rootDir, "travel-data.js");

const siteOrigin = normalizeOrigin(process.env.SITE_ORIGIN || "https://view1.kr");
const publicSiteUrl = normalizeOrigin(process.env.PUBLIC_SITE_URL || siteOrigin);

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
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : { message: (await response.text()).slice(0, 200) };

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

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeXml(value) {
  return escapeHtml(value).replaceAll("&#39;", "&apos;");
}

function eventDetailUrl(item) {
  const params = new URLSearchParams({ source: "seoul", id: item.id });
  return `festival-detail?${params.toString()}`;
}

function staticImageMarkup(item, size) {
  if (!item.image) {
    return `<div class="image-frame image-frame--${size} is-empty"><span>SEOUL TRAVEL NEWS</span></div>`;
  }

  return `<div class="image-frame image-frame--${size} image-frame--api"><span class="image-fallback-text" aria-hidden="true">SEOUL TRAVEL NEWS</span><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy" width="640" height="480" onerror="this.onerror=null;this.closest('.image-frame').classList.add('is-empty');this.remove()"></div>`;
}

function editorialCategoryKey(item = {}) {
  const text = `${item.category || ""} ${item.title || ""}`;
  if (/전시|미술|박물관|갤러리/.test(text)) return "exhibition";
  if (/공연|야간|데이트|콘서트|무대/.test(text)) return "performance";
  if (/가족|아이|체험|교육|도서관/.test(text)) return "experience";
  if (/축제|전통|궁궐/.test(text)) return "festival";
  return "event";
}

function eventCategoryKey(item = {}) {
  const text = `${item.category || ""} ${item.title || ""}`;
  if (/전시|미술|박물관|갤러리/.test(text)) return "exhibition";
  if (/공연|클래식|연극|콘서트|무용|국악|뮤지컬|오페라/.test(text)) return "performance";
  if (/교육|체험|어린이|가족/.test(text)) return "experience";
  if (/축제|전통|궁궐/.test(text)) return "festival";
  return "event";
}

function mapEditorialImages(posts, items) {
  const imagePool = items.filter((item) => item.image);
  const used = new Set();

  return posts.map((post) => {
    const wanted = editorialCategoryKey(post);
    const match = imagePool.find((item) => !used.has(item.id) && eventCategoryKey(item) === wanted)
      || imagePool.find((item) => !used.has(item.id));
    if (!match) return { ...post, image: "" };
    used.add(match.id);
    return { ...post, image: match.image };
  });
}

function editorialCardMarkup(item, index) {
  return `
          <article class="editorial-card ${index === 0 ? "editorial-card--lead" : ""}">
            <a href="${escapeHtml(item.href)}" aria-label="${escapeHtml(`${item.title} 자세히 보기`)}">
              ${staticImageMarkup(item, index === 0 ? "hero" : "thumb")}
              <span>
                <em>${escapeHtml(item.category || "서울 여행")}</em>
                <strong>${escapeHtml(item.title)}</strong>
                <small>${escapeHtml(item.summary)}</small>
                <b>${escapeHtml(item.date)} · ${escapeHtml(item.readTime || "자세히 읽기")}</b>
              </span>
            </a>
          </article>`;
}

function recommendCardMarkup(item) {
  const href = eventDetailUrl(item);
  return `
          <article class="news-recommend-card">
            <a href="${escapeHtml(href)}" aria-label="${escapeHtml(`${item.title} 자세히 보기`)}">
              ${staticImageMarkup(item, "recommend")}
              <div class="news-recommend-body">
                <span class="category-label">${escapeHtml(item.category)}</span>
                <strong>${escapeHtml(item.title)}</strong>
              </div>
            </a>
          </article>`;
}

function feedCardMarkup(item) {
  const href = eventDetailUrl(item);
  return `
          <article class="news-list-card">
            <a href="${escapeHtml(href)}" aria-label="${escapeHtml(`${item.title} 자세히 보기`)}">
              ${staticImageMarkup(item, "feed")}
              <span>
                <em>${escapeHtml(item.category)}</em>
                <strong>${escapeHtml(item.title)}</strong>
                <small>${escapeHtml(item.date)} · ${escapeHtml(item.readTime)}</small>
              </span>
            </a>
          </article>`;
}

function replaceStaticBlock(source, name, markup) {
  const start = `<!-- STATIC_${name}_START -->`;
  const end = `<!-- STATIC_${name}_END -->`;
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (!pattern.test(source)) throw new Error(`Static HTML marker not found: ${name}`);
  return source.replace(pattern, `${start}\n${markup}\n          ${end}`);
}

async function readEditorialPosts() {
  const source = await readFile(editorialDataPath, "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox, { filename: editorialDataPath, timeout: 1000 });
  const data = sandbox.window.TRAVEL_PORTAL_DATA || {};
  const posts = Array.isArray(data.editorialPosts) ? data.editorialPosts : [];
  return posts.filter((item) => item?.title && item?.href);
}

async function updateStaticLanding(items) {
  const posts = mapEditorialImages((await readEditorialPosts()).slice(0, 5), items);
  if (!posts.length) throw new Error("No editorial posts are available for the static landing page.");

  let source = await readFile(indexPath, "utf8");
  source = replaceStaticBlock(source, "EDITORIAL", posts.map(editorialCardMarkup).join(""));
  source = replaceStaticBlock(source, "RECOMMENDED", items.slice(1, 5).map(recommendCardMarkup).join(""));
  source = replaceStaticBlock(source, "FEED", items.slice(5, 17).map(feedCardMarkup).join(""));
  await writeFile(indexPath, source, "utf8");
}

async function editorialArticleUrls() {
  const posts = await readEditorialPosts();
  return [...new Set(posts.map((item) => item.href))].map((pathname) => `${publicSiteUrl}/${pathname}`);
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

  await updateStaticLanding(items);

  const editorialUrls = await editorialArticleUrls();
  const urls = [
    `${publicSiteUrl}/`,
    `${publicSiteUrl}/about`,
    `${publicSiteUrl}/editorial-policy`,
    `${publicSiteUrl}/contact`,
    `${publicSiteUrl}/privacy`,
    `${publicSiteUrl}/terms`,
    `${publicSiteUrl}/disclaimer`,
    ...editorialUrls
  ];
  await writeFile(sitemapPath, sitemapXml(urls, todayKstIso()), "utf8");

  console.log(`Updated ${path.relative(rootDir, outputPath)} with ${items.length} items for ${month}.`);
  console.log(`Updated ${path.relative(rootDir, indexPath)} with crawlable article cards.`);
  console.log(`Updated ${path.relative(rootDir, sitemapPath)} with ${urls.length} stable public URLs.`);
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exitCode = 1;
});
