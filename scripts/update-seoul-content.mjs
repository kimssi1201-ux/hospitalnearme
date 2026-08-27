import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { generateStaticArticles } from "./generate-static-articles.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outputPath = path.join(rootDir, "generated", "seoul-events.json");
const sitemapPath = path.join(rootDir, "sitemap.xml");
const indexPath = path.join(rootDir, "index.html");
const editorialDataPath = path.join(rootDir, "travel-data.js");

const siteOrigin = normalizeOrigin(process.env.SITE_ORIGIN || "https://view1.kr");
const publicSiteUrl = normalizeOrigin(process.env.PUBLIC_SITE_URL || siteOrigin);
const MIN_REFRESH_ITEMS = Number(process.env.MIN_REFRESH_ITEMS) || 24;

// Korea Tourism Organization TourAPI area codes, nationwide. Kept in sync
// with the `regions` list in travel-data.js.
const REGIONS = [
  { id: "seoul", label: "서울", areaCode: "1" },
  { id: "incheon", label: "인천", areaCode: "2" },
  { id: "daejeon", label: "대전", areaCode: "3" },
  { id: "daegu", label: "대구", areaCode: "4" },
  { id: "gwangju", label: "광주", areaCode: "5" },
  { id: "busan", label: "부산", areaCode: "6" },
  { id: "ulsan", label: "울산", areaCode: "7" },
  { id: "sejong", label: "세종", areaCode: "8" },
  { id: "gyeonggi", label: "경기", areaCode: "31" },
  { id: "gangwon", label: "강원", areaCode: "32" },
  { id: "chungbuk", label: "충북", areaCode: "33" },
  { id: "chungnam", label: "충남", areaCode: "34" },
  { id: "gyeongbuk", label: "경북", areaCode: "35" },
  { id: "gyeongnam", label: "경남", areaCode: "36" },
  { id: "jeonbuk", label: "전북", areaCode: "37" },
  { id: "jeonnam", label: "전남", areaCode: "38" },
  { id: "jeju", label: "제주", areaCode: "39" }
];

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

function monthEndDate(month) {
  const year = Number(month.slice(0, 4));
  const monthNumber = Number(month.slice(4, 6));
  const lastDay = String(new Date(year, monthNumber, 0).getDate()).padStart(2, "0");
  return `${month}${lastDay}`;
}

function currentKstCompactDate() {
  const parts = kstParts();
  return `${parts.year}${parts.month}${parts.day}`;
}

function todayKstIso() {
  const parts = kstParts();
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function refreshDateRanges() {
  const parts = kstParts();
  const year = Number(parts.year);
  const currentMonth = `${parts.year}${parts.month}`;
  const previousYear = String(year - 1);
  const previousMonth = `${previousYear}${parts.month}`;
  const previousDay = String(
    Math.min(Number(parts.day), Number(monthEndDate(previousMonth).slice(6)))
  ).padStart(2, "0");
  const ranges = [
    {
      id: "current-month",
      month: currentMonth,
      start: `${currentMonth}01`,
      end: monthEndDate(currentMonth),
      label: `${currentMonth} current month`
    },
    {
      id: "current-year-remainder",
      month: currentMonth,
      start: currentKstCompactDate(),
      end: `${parts.year}1231`,
      label: `${parts.year} remaining season`
    },
    {
      id: "previous-year-same-season",
      month: previousMonth,
      start: `${previousMonth}${previousDay}`,
      end: `${previousYear}1231`,
      label: `${previousYear} same-season fallback`
    },
    {
      id: "previous-year",
      month: `${previousYear}01`,
      start: `${previousYear}0101`,
      end: `${previousYear}1231`,
      label: `${previousYear} full-year fallback`
    }
  ];
  const seen = new Set();
  return ranges.filter((range) => {
    const key = `${range.start}:${range.end}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "daehan-festival-news-daily-refresh/1.0"
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
  return String(item?.id || item?.contentId || item?.title || `festival-event-${index}`).trim();
}

function compactDate(value) {
  const text = String(value || "").replace(/[^\d]/g, "");
  if (text.length < 8) return "";
  return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
}

function formatEventPeriod(start, end) {
  const startText = compactDate(start);
  const endText = compactDate(end);
  if (startText && endText && startText !== endText) return `${startText}~${endText}`;
  return startText || endText || "일정 확인 필요";
}

function normalizeUrl(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const url = text.startsWith("//") ? `https:${text}` : text;
  if (!/^https?:\/\//i.test(url)) return "";
  return url.replace(/^http:/i, "https:");
}

// Normalizes a raw TourAPI searchFestival2 item into the shape the site's
// static generator and client-side rendering already expect (previously
// filled in from the Seoul Open Data culture-event API).
function normalizeTourFestivalItem(item, region, index) {
  const title = String(item?.title || "").trim();
  const address = [item?.addr1, item?.addr2].filter(Boolean).join(" ").trim();
  const image = normalizeUrl(item?.firstimage || item?.firstimage2);
  const date = formatEventPeriod(item?.eventstartdate, item?.eventenddate);

  const contentId = String(item?.contentid || "").trim();

  return {
    id: `tour-${contentId || eventId(item, index)}`,
    source: "seoul",
    contentId,
    contentTypeId: String(item?.contenttypeid || "15").trim(),
    category: `${region.label} 축제`,
    categorySlug: "festival",
    title,
    summary: address
      ? `${address}에서 진행되는 ${region.label} 축제입니다. 방문 전 공식 안내에서 운영 시간과 요금을 확인하세요.`
      : `${region.label}에서 진행되는 축제입니다. 방문 전 공식 안내에서 운영 시간과 요금을 확인하세요.`,
    date,
    readTime: `${region.label} 축제 정보`,
    image,
    galleryImages: [],
    address,
    place: String(item?.addr1 || "").trim(),
    gu: "",
    tel: String(item?.tel || "").trim(),
    homepage: "",
    fee: "",
    time: "",
    org: "",
    target: "",
    isFree: "",
    updatedAt: String(item?.modifiedtime || item?.createdtime || "").trim(),
    lat: String(item?.mapy || "").trim(),
    lng: String(item?.mapx || "").trim(),
    areaCode: region.areaCode
  };
}

async function fetchRegionFestivals(region, range) {
  const query = new URLSearchParams({
    areaCode: region.areaCode,
    numOfRows: "100",
    pageNo: "1"
  });
  if (range) {
    query.set("month", range.month);
    query.set("eventStartDate", range.start);
    query.set("eventEndDate", range.end);
  }

  const endpoint = `${siteOrigin}/api/tour-festivals?${query.toString()}`;
  const payload = await fetchJson(endpoint);
  const rawItems = payload?.response?.body?.items?.item;
  const list = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];
  return list
    .filter((item) => item && item.title)
    .map((item, index) => normalizeTourFestivalItem(item, region, index));
}

async function fetchNationwideFestivalsForRange(range) {
  const settled = await Promise.allSettled(REGIONS.map((region) => fetchRegionFestivals(region, range)));
  const items = [];
  const failedRegions = [];

  settled.forEach((result, index) => {
    if (result.status === "fulfilled") {
      items.push(...result.value);
    } else {
      failedRegions.push(REGIONS[index].label);
      console.warn(`${REGIONS[index].label} 축제 데이터를 불러오지 못했습니다.`, result.reason);
    }
  });

  if (failedRegions.length) {
    console.warn(`다음 지역은 이번 새로고침에서 제외되었습니다: ${failedRegions.join(", ")}`);
  }

  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.id}::${item.title}`;
    if (!item.title || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchNationwideFestivals() {
  const ranges = refreshDateRanges();
  const attempts = [];
  let bestFallback = null;

  for (const range of ranges) {
    const items = await fetchNationwideFestivalsForRange(range);
    attempts.push({ id: range.id, start: range.start, end: range.end, count: items.length });
    if (items.length >= MIN_REFRESH_ITEMS) {
      if (attempts.length > 1) {
        const previousHadItems = attempts.slice(0, -1).some((attempt) => attempt.count > 0);
        const reason = previousHadItems
          ? `이전 후보 기간의 TourAPI 축제 목록이 최소 ${MIN_REFRESH_ITEMS}건에 못 미쳐`
          : "현재 날짜 범위에 TourAPI 축제 목록이 없어";
        console.warn(
          `${reason} ${range.label} (${range.start}-${range.end}) 데이터로 갱신합니다.`
        );
      }
      return { items, range, attempts };
    }
    if (items.length && (!bestFallback || items.length > bestFallback.items.length)) {
      bestFallback = { items, range };
      console.warn(
        `${range.label} (${range.start}-${range.end}) 데이터가 ${items.length}건뿐이라 최소 ${MIN_REFRESH_ITEMS}건 이상인 다음 후보 기간을 확인합니다.`
      );
    }
  }

  if (bestFallback) {
    return { ...bestFallback, attempts };
  }

  return { items: [], range: ranges[0], attempts };
}

const GALLERY_FETCH_CONCURRENCY = 8;
const GALLERY_IMAGE_LIMIT = 12;
// A festival's detailImage2 result alone is often thin (or empty), so a
// second, separate API - PhotoGalleryService1 (a keyword-search photo
// service, not tied to a contentId) - fills in the gap. It's a different
// data.go.kr application/key from TourAPI, so it's entirely optional: if
// PHOTO_GALLERY_API_KEY isn't configured on the worker, this is skipped
// after the first failed attempt instead of retrying on every item.
const PHOTO_GALLERY_MIN_IMAGES = 3;
let photoGalleryAvailable = true;

// TourAPI has a per-key daily call quota, and fetching a photo gallery is
// one extra request per festival. Cap how many festivals get a gallery per
// run instead of fetching for every item - the soonest-starting festivals
// (items are already date-sorted before this runs) get priority.
const GALLERY_FETCH_LIMIT = Number(process.env.GALLERY_FETCH_LIMIT) || 200;

// Strips the resolution/size suffix off a TourAPI-family image URL so two
// URLs pointing at the same underlying photo (different sizes) dedupe as
// one, e.g. https://tong.visitkorea.or.kr/cms/resource/17/3442117_image2_1.JPG
function imageFamilyKey(src) {
  const clean = String(src || "").split("?")[0];
  const resource = clean.match(/\/resource\/\d+\/([^/_]+)_image\d+_\d+/i);
  return resource ? resource[1].toLowerCase() : clean.toLowerCase();
}

function mergeGalleryImages(existing, extra, limit) {
  const seenFamilies = new Set(existing.map(imageFamilyKey));
  const merged = [...existing];
  for (const url of extra) {
    if (merged.length >= limit) break;
    const key = imageFamilyKey(url);
    if (!key || seenFamilies.has(key)) continue;
    seenFamilies.add(key);
    merged.push(url);
  }
  return merged;
}

function photoGalleryImageUrl(item) {
  return normalizeUrl(item?.galWebImageUrl || item?.galWebImageURL || item?.galwebimageurl || item?.galWebImgUrl);
}

function festivalGalleryKeywords(item, regionLabel) {
  const title = String(item.title || "")
    .replace(/\[[^\]]+\]/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const keywords = [title];
  if (regionLabel && title && !title.includes(regionLabel)) keywords.push(`${regionLabel} ${title}`);
  return [...new Set(keywords.filter(Boolean))].slice(0, 2);
}

// PhotoGalleryService1 matches by keyword, not contentId, so results can
// include photos of unrelated places that merely share a word. Require the
// gallery item's own title/location text to actually reference this
// festival's region or a distinctive word from its title.
function isRelevantGalleryItem(item, regionLabel, galleryItem) {
  const haystack = String(
    [galleryItem?.galTitle, galleryItem?.galPhotographyLocation, galleryItem?.galSearchKeyword]
      .filter(Boolean)
      .join(" ")
  ).trim();
  if (!haystack || !photoGalleryImageUrl(galleryItem)) return false;
  if (regionLabel && haystack.includes(regionLabel)) return true;

  const titleTokens = String(item.title || "")
    .replace(/[()[\]{}"'“”‘’·:|/\\_-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3);
  return titleTokens.some((token) => haystack.includes(token));
}

async function fetchPhotoGalleryImages(item, regionLabel) {
  if (!photoGalleryAvailable) return [];

  const seen = new Set();
  const urls = [];

  for (const keyword of festivalGalleryKeywords(item, regionLabel)) {
    try {
      const endpoint = `${siteOrigin}/api/tour-photo-gallery?keyword=${encodeURIComponent(keyword)}&numOfRows=10`;
      const payload = await fetchJson(endpoint);
      const rawItems = payload?.response?.body?.items?.item;
      const list = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

      for (const galleryItem of list) {
        if (!isRelevantGalleryItem(item, regionLabel, galleryItem)) continue;
        const url = photoGalleryImageUrl(galleryItem);
        if (!url || seen.has(url)) continue;
        seen.add(url);
        urls.push(url);
      }
    } catch (error) {
      if (String(error?.message || "").includes("PHOTO_GALLERY_API_KEY")) {
        photoGalleryAvailable = false;
        console.warn("PHOTO_GALLERY_API_KEY가 설정되지 않아 이번 실행에서는 포토갤러리 보조 사진을 건너뜁니다.");
      } else {
        console.warn(`${item.title || item.id} 포토갤러리 조회에 실패했습니다.`, error?.message || error);
      }
      break;
    }
  }

  return urls;
}

async function fetchFestivalGallery(item, regionLabel) {
  let detailImages = [];

  if (item.contentId) {
    try {
      const endpoint = `${siteOrigin}/api/tour-detail?endpoint=detailImage2&contentId=${encodeURIComponent(item.contentId)}&contentTypeId=${encodeURIComponent(item.contentTypeId)}`;
      const payload = await fetchJson(endpoint);
      const rawItems = payload?.response?.body?.items?.item;
      const list = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];
      detailImages = list.map((image) => normalizeUrl(image?.originimgurl || image?.smallimageurl)).filter(Boolean);
    } catch (error) {
      console.warn(`${item.title || item.id} 사진 정보를 불러오지 못했습니다.`, error?.message || error);
    }
  }

  let images = mergeGalleryImages([], detailImages, GALLERY_IMAGE_LIMIT);
  if (images.length < PHOTO_GALLERY_MIN_IMAGES) {
    const extra = await fetchPhotoGalleryImages(item, regionLabel);
    images = mergeGalleryImages(images, extra, GALLERY_IMAGE_LIMIT);
  }

  return images;
}

// Runs gallery lookups with limited concurrency so a run with hundreds of
// festivals doesn't fire hundreds of simultaneous requests at once.
async function attachGalleryImages(items) {
  const targets = items.slice(0, GALLERY_FETCH_LIMIT);
  const regionLabelByCode = new Map(REGIONS.map((region) => [region.areaCode, region.label]));
  const queue = [...targets];

  async function worker() {
    while (queue.length) {
      const item = queue.shift();
      item.galleryImages = await fetchFestivalGallery(item, regionLabelByCode.get(item.areaCode) || "");
    }
  }

  await Promise.all(Array.from({ length: GALLERY_FETCH_CONCURRENCY }, worker));
  const withPhotos = targets.filter((item) => item.galleryImages.length).length;
  console.log(`${targets.length}개 축제의 사진 정보를 확인했고, ${withPhotos}개에서 추가 사진을 찾았습니다.`);
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
  return `/seoul-events/${encodeURIComponent(String(item.id || "").replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-"))}/`;
}

function staticImageMarkup(item, size) {
  if (!item.image) {
    return `<div class="image-frame image-frame--${size} is-empty"><span>대한축제뉴스</span></div>`;
  }

  return `<div class="image-frame image-frame--${size} image-frame--api"><span class="image-fallback-text" aria-hidden="true">대한축제뉴스</span><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy" width="640" height="480" onerror="this.onerror=null;this.closest('.image-frame').classList.add('is-empty');this.remove()"></div>`;
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
  const posts = (await readEditorialPosts()).slice(0, 5).map((post) => ({
    ...post,
    image: "",
    href: `/articles/${encodeURIComponent(post.id)}/`
  }));
  if (!posts.length) throw new Error("No editorial posts are available for the static landing page.");

  let source = await readFile(indexPath, "utf8");
  source = replaceStaticBlock(source, "EDITORIAL", posts.map(editorialCardMarkup).join(""));
  source = replaceStaticBlock(source, "RECOMMENDED", items.slice(1, 5).map(recommendCardMarkup).join(""));
  source = replaceStaticBlock(source, "FEED", items.slice(5, 17).map(feedCardMarkup).join(""));
  await writeFile(indexPath, source, "utf8");
}

async function editorialArticleUrls() {
  const posts = await readEditorialPosts();
  return [...new Set(posts.map((item) => item.id))].map((id) => `${publicSiteUrl}/articles/${encodeURIComponent(id)}/`);
}

function sitemapXml(urls, lastmod) {
  const uniqueUrls = [...new Set(urls.filter(Boolean))];
  const entries = uniqueUrls
    .map((url, index) => {
      const priority = index === 0 ? "1.0" : url.includes("/articles/") ? "0.8" : "0.7";
      return `  <url><loc>${escapeXml(url)}</loc><lastmod>${lastmod}</lastmod><priority>${priority}</priority></url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

async function main() {
  const requestedMonth = currentKstMonth();
  const { items, range, attempts } = await fetchNationwideFestivals();
  const month = range.month;

  if (!items.length) {
    const attemptText = attempts.map((attempt) => `${attempt.start}-${attempt.end}: ${attempt.count}`).join(", ");
    throw new Error(`전국 축제 데이터가 비어 있어 정적 파일을 갱신하지 않았습니다. (${attemptText})`);
  }

  // Sort so the freshest/soonest-starting festivals lead the feed.
  items.sort((a, b) => a.date.localeCompare(b.date));

  await attachGalleryImages(items);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify(
      {
        ok: true,
        source: "한국관광공사 TourAPI 축제 정보",
        fetchedFrom: `${siteOrigin}/api/tour-festivals`,
        month,
        requestedMonth,
        queryRange: {
          start: range.start,
          end: range.end,
          label: range.label,
          fallback: range.month !== requestedMonth || range.start !== `${requestedMonth}01`
        },
        refreshAttempts: attempts,
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
  await generateStaticArticles();

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

  console.log(`Updated ${path.relative(rootDir, outputPath)} with ${items.length} items across ${REGIONS.length} regions for ${range.start}-${range.end}.`);
  if (range.month !== requestedMonth || range.start !== `${requestedMonth}01`) {
    console.log(`Requested ${requestedMonth}; used ${range.label} because earlier date ranges did not meet the ${MIN_REFRESH_ITEMS}-item minimum.`);
  }
  console.log(`Updated ${path.relative(rootDir, indexPath)} with crawlable article cards.`);
  console.log(`Updated ${path.relative(rootDir, sitemapPath)} with ${urls.length} stable public URLs.`);
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exitCode = 1;
});
