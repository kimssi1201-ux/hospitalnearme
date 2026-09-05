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
  const href = String(value || "").match(/\bhref=["']([^"']+)["']/i)?.[1];
  const text = String(href || value || "").replace(/<[^>]*>/g, " ").trim();
  if (!text) return "";
  const url = text.startsWith("//") ? `https:${text}` : text;
  if (!/^https?:\/\//i.test(url)) return "";
  return url.replace(/^http:/i, "https:");
}

function cleanText(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function normalizeApiItem(item) {
  return Array.isArray(item) ? item[0] : item || {};
}

function normalizeApiItems(item) {
  if (Array.isArray(item)) return item;
  return item ? [item] : [];
}

function addDetailInfo(details, label, value) {
  const clean = cleanText(value);
  if (!clean || clean === "0" || clean === "선택안함") return;
  if (details.some((item) => item.label === label && item.value === clean)) return;
  details.push({ label, value: clean });
}

function collectTourDetailInfo(commonItem, introItem, detailInfoItems) {
  const details = [];
  addDetailInfo(details, "행사 장소", introItem?.eventplace);
  addDetailInfo(details, "행사 시간", introItem?.playtime);
  addDetailInfo(details, "이용 요금", introItem?.usetimefestival);
  addDetailInfo(details, "주최 기관", introItem?.sponsor1);
  addDetailInfo(details, "주관 기관", introItem?.sponsor2);
  addDetailInfo(details, "문의 전화", introItem?.sponsor1tel || commonItem?.tel);
  addDetailInfo(details, "행사 프로그램", introItem?.program);
  addDetailInfo(details, "부대 행사", introItem?.subevent);
  addDetailInfo(details, "관람 소요시간", introItem?.spendtimefestival);
  addDetailInfo(details, "참가 연령", introItem?.agelimit);
  addDetailInfo(details, "예매처", introItem?.bookingplace);
  addDetailInfo(details, "행사장 위치 안내", introItem?.placeinfo);
  addDetailInfo(details, "할인 정보", introItem?.discountinfofestival);
  addDetailInfo(details, "축제 등급", introItem?.festivalgrade);

  detailInfoItems.forEach((item) => {
    addDetailInfo(details, item?.infoname || item?.serialnum || "상세 정보", item?.infotext);
  });

  return details;
}

async function fetchFestivalOfficialDetails(item) {
  if (!item.contentId) return {};

  const baseQuery = {
    contentId: item.contentId,
    contentTypeId: item.contentTypeId || "15"
  };
  const detailUrl = (endpoint, extra = {}) => {
    const query = new URLSearchParams({ endpoint, ...baseQuery, ...extra });
    return `${siteOrigin}/api/tour-detail?${query.toString()}`;
  };

  const [commonResult, introResult, infoResult] = await Promise.allSettled([
    fetchJson(detailUrl("detailCommon2", {
      defaultYN: "Y",
      firstImageYN: "Y",
      areacodeYN: "Y",
      catcodeYN: "Y",
      addrinfoYN: "Y",
      mapinfoYN: "Y",
      overviewYN: "Y"
    })),
    fetchJson(detailUrl("detailIntro2")),
    fetchJson(detailUrl("detailInfo2", { numOfRows: "30", pageNo: "1" }))
  ]);

  const commonPayload = commonResult.status === "fulfilled" ? commonResult.value : {};
  const introPayload = introResult.status === "fulfilled" ? introResult.value : {};
  const infoPayload = infoResult.status === "fulfilled" ? infoResult.value : {};
  const commonItem = normalizeApiItem(commonPayload?.response?.body?.items?.item);
  const introItem = normalizeApiItem(introPayload?.response?.body?.items?.item);
  const detailInfoItems = normalizeApiItems(infoPayload?.response?.body?.items?.item);

  if (!commonItem?.title && !introItem?.contentid && !detailInfoItems.length) {
    const error = [commonResult, introResult, infoResult].find((result) => result.status === "rejected")?.reason;
    if (error) console.warn(`${item.title || item.id} 상세 정보를 불러오지 못했습니다.`, error?.message || error);
    return {};
  }

  const start = compactDate(introItem?.eventstartdate);
  const end = compactDate(introItem?.eventenddate);
  const detailDate = start || end ? (start && end && start !== end ? `${start}~${end}` : start || end) : "";
  const address = [commonItem?.addr1, commonItem?.addr2].filter(Boolean).join(" ").trim();
  const place = cleanText(introItem?.eventplace || commonItem?.addr2 || commonItem?.addr1);
  const homepage = normalizeUrl(commonItem?.homepage || introItem?.eventhomepage);
  const org = [cleanText(introItem?.sponsor1), cleanText(introItem?.sponsor2)].filter(Boolean).join(" / ");
  const detailInfo = collectTourDetailInfo(commonItem, introItem, detailInfoItems);
  const summary = cleanText(commonItem?.overview) || item.summary;

  return {
    summary,
    overview: cleanText(commonItem?.overview),
    date: detailDate || item.date,
    image: normalizeUrl(commonItem?.firstimage || commonItem?.firstimage2) || item.image,
    address: address || item.address,
    place: place || item.place,
    tel: cleanText(introItem?.sponsor1tel || commonItem?.tel) || item.tel,
    homepage: homepage || item.homepage,
    fee: cleanText(introItem?.usetimefestival) || item.fee,
    time: cleanText(introItem?.playtime) || item.time,
    org: org || item.org,
    target: cleanText(introItem?.agelimit) || item.target,
    program: cleanText(introItem?.program),
    subevent: cleanText(introItem?.subevent),
    booking: cleanText(introItem?.bookingplace),
    placeInfo: cleanText(introItem?.placeinfo),
    discountInfo: cleanText(introItem?.discountinfofestival),
    spendTime: cleanText(introItem?.spendtimefestival),
    festivalGrade: cleanText(introItem?.festivalgrade),
    detailInfo,
    lat: cleanText(commonItem?.mapy) || item.lat,
    lng: cleanText(commonItem?.mapx) || item.lng,
    updatedAt: cleanText(commonItem?.modifiedtime || commonItem?.createdtime) || item.updatedAt
  };
}

const DETAIL_FETCH_CONCURRENCY = 6;
const DETAIL_FETCH_LIMIT = Number(process.env.DETAIL_FETCH_LIMIT) || 260;

async function attachOfficialDetails(items) {
  const targets = items.slice(0, DETAIL_FETCH_LIMIT);
  const queue = [...targets];

  async function worker() {
    while (queue.length) {
      const item = queue.shift();
      const details = await fetchFestivalOfficialDetails(item);
      Object.assign(item, details);
    }
  }

  await Promise.all(Array.from({ length: DETAIL_FETCH_CONCURRENCY }, worker));
  const withOverview = targets.filter((item) => cleanText(item.overview)).length;
  const withFees = targets.filter((item) => cleanText(item.fee)).length;
  console.log(`${targets.length}개 축제의 TourAPI 상세 정보를 확인했고, 소개 ${withOverview}개 · 요금 ${withFees}개를 보강했습니다.`);
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

function staticArticleDateRange(item = {}) {
  const tokens = String(item.date || "").match(/\d{4}[-.]\d{1,2}[-.]\d{1,2}|\d{8}/g) || [];
  const values = tokens
    .map((token) => Number(String(token).replace(/\D/g, "")))
    .filter((value) => Number.isFinite(value) && value > 0);
  const start = values[0] || 0;
  return { start, end: values[values.length - 1] || start };
}

function staticCompactDateToUtc(value) {
  const text = String(value || "").replace(/\D/g, "");
  if (text.length !== 8) return null;
  const year = Number(text.slice(0, 4));
  const month = Number(text.slice(4, 6));
  const day = Number(text.slice(6, 8));
  if (!year || !month || !day) return null;
  return Date.UTC(year, month - 1, day);
}

function staticDateDiffDays(fromValue, toValue) {
  const from = staticCompactDateToUtc(fromValue);
  const to = staticCompactDateToUtc(toValue);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null;
  return Math.round((to - from) / 86400000);
}

function staticIsWeekend(value) {
  const date = staticCompactDateToUtc(value);
  if (!Number.isFinite(date)) return false;
  const day = new Date(date).getUTCDay();
  return day === 0 || day === 5 || day === 6;
}

function staticFestivalStatusInfo(item, today = Number(currentKstCompactDate())) {
  const { start, end } = staticArticleDateRange(item);
  if (!start) return null;
  if (start <= today && end >= today) {
    const daysLeft = staticDateDiffDays(today, end);
    return Number.isFinite(daysLeft) && daysLeft <= 3
      ? { key: "ending", label: "종료 임박" }
      : { key: "live", label: "진행 중" };
  }
  if (start > today) {
    const daysUntil = staticDateDiffDays(today, start);
    if (Number.isFinite(daysUntil) && daysUntil <= 3 && staticIsWeekend(start)) {
      return { key: "weekend", label: "이번 주말" };
    }
    if (Number.isFinite(daysUntil) && daysUntil <= 14) return { key: "soon", label: "곧 시작" };
    return { key: "scheduled", label: "예정" };
  }
  return { key: "past", label: "지난 행사" };
}

function staticStatusBadgeMarkup(item) {
  const status = staticFestivalStatusInfo(item);
  if (!status || status.key === "past") return "";
  return `<span class="status-badge status-badge--${escapeHtml(status.key)}">${escapeHtml(status.label)}</span>`;
}

function staticFestivalMetaMarkup(item) {
  const status = staticFestivalStatusInfo(item);
  return `<div class="festival-card-meta"><em>${escapeHtml(item.category || "축제")}</em>${status ? `<span class="festival-status-pill festival-status-pill--${escapeHtml(status.key)}">${escapeHtml(status.label)}</span>` : ""}</div>`;
}

function staticPeriodLabel(item) {
  return item.date ? `기간 ${item.date}` : item.readTime || "일정 확인";
}

function staticEventText(item = {}) {
  return [
    item.title,
    item.category,
    item.subCategory,
    item.rawCategory,
    item.summary,
    item.overview,
    item.program,
    item.subevent,
    item.place,
    item.address,
    ...(Array.isArray(item.detailInfo) ? item.detailInfo.map((entry) => entry?.value) : [])
  ].map(cleanText).filter(Boolean).join(" ");
}

function staticFeatureTerms(item = {}) {
  const text = staticEventText(item);
  const patterns = [
    ["눈썰매", /눈썰매/],
    ["얼음썰매", /얼음썰매/],
    ["얼음낚시", /얼음낚시|빙어|송어/],
    ["먹거리", /먹거리|푸드|야시장|맥주|와인|커피|김장|분식|바비큐|치맥|소맥|짬뽕|한우|인삼|갈치/],
    ["포토존", /포토존|사진|야경/],
    ["공연", /공연|콘서트|무대|음악|국악|댄스|포크|실연자/],
    ["체험", /체험|놀이|만들기|워크숍|레저|힐링/],
    ["전시", /전시|미디어아트|아트|박람회|미술|갤러리|웹툰/],
    ["꽃", /꽃|벚꽃|유채|메밀꽃|장미|국화|코스모스/],
    ["숲", /숲|정원|수목원|공원|자연|휴양림/],
    ["불꽃", /불꽃|불빛|빛축제|라이트|미디어파사드/],
    ["바다", /바다|해변|해수욕|물놀이|선셋|노을|포구/],
    ["전통", /전통|궁궐|문화재|국가유산|민속|유교|야행|왕릉|아라가야/],
    ["영화", /영화|단편영화/]
  ];
  const terms = [];
  for (const [label, pattern] of patterns) {
    if (pattern.test(text) && !terms.includes(label)) terms.push(label);
  }
  return terms.slice(0, 3);
}

function staticEventKindLabel(item = {}) {
  const text = staticEventText(item);
  if (/눈썰매|얼음|겨울|동장군|빙어|송어/.test(text)) return "겨울 축제";
  if (/먹거리|푸드|야시장|맥주|와인|커피|김장|분식|바비큐|치맥|소맥|짬뽕|한우|인삼|갈치/.test(text)) return "먹거리 축제";
  if (/꽃|숲|정원|수목원|자연|휴양림|코스모스|메밀꽃/.test(text)) return "자연 축제";
  if (/공연|콘서트|무대|음악|국악|댄스|포크|실연자/.test(text)) return "공연 축제";
  if (/전시|미디어아트|아트|박람회|미술|갤러리|웹툰/.test(text)) return "전시 행사";
  if (/불꽃|불빛|빛축제|라이트|야간|별밤|미디어파사드/.test(text)) return "야간 축제";
  if (/전통|궁궐|문화재|국가유산|민속|유교|야행|왕릉|아라가야/.test(text)) return "전통 문화 축제";
  if (/영화|단편영화/.test(text)) return "영화제";
  return "축제";
}

function staticShortPlace(value = "") {
  const text = cleanText(value)
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+[가-힣A-Za-z0-9·.-]+(?:로|길)\s*\d.*$/g, "")
    .replace(/서울특별시/g, "서울")
    .replace(/부산광역시/g, "부산")
    .replace(/대구광역시/g, "대구")
    .replace(/인천광역시/g, "인천")
    .replace(/광주광역시/g, "광주")
    .replace(/대전광역시/g, "대전")
    .replace(/울산광역시/g, "울산")
    .replace(/세종특별자치시/g, "세종")
    .replace(/경기도/g, "경기")
    .replace(/강원특별자치도/g, "강원")
    .replace(/충청북도/g, "충북")
    .replace(/충청남도/g, "충남")
    .replace(/전북특별자치도/g, "전북")
    .replace(/전라남도/g, "전남")
    .replace(/경상북도/g, "경북")
    .replace(/경상남도/g, "경남")
    .replace(/제주특별자치도/g, "제주")
    .replace(/[，,]\s*/g, " ")
    .replace(/\s*(일원|내|앞)$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "";
  const words = text.split(" ").filter(Boolean);
  if (words.length > 2) return words.slice(0, 2).join(" ");
  return text;
}

function staticDurationLabel(item = {}) {
  const { start, end } = staticArticleDateRange(item);
  if (!start || !end || start === end) return "";
  const diff = staticDateDiffDays(start, end);
  if (!Number.isFinite(diff)) return "";
  const days = diff + 1;
  if (days < 2 || days > 180) return "";
  return `${days}일간`;
}

function staticOverviewSentences(value = "") {
  return cleanText(value)
    .split(/(?<=[.!?。])\s+|(?<=다\.)\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function staticCompactHeadlineHook(value, maxLength = 54) {
  const text = cleanText(value).replace(/[“”"'‘’]/g, "").replace(/[.!?。]+$/g, "");
  if (!text) return "";
  if (text.length <= maxLength) return text;
  const slice = text.slice(0, maxLength + 1);
  const cut = Math.max(slice.lastIndexOf(" "), slice.lastIndexOf(","), slice.lastIndexOf("·"));
  const end = cut >= 28 ? cut : maxLength;
  return text.slice(0, end).replace(/[,.，。]\s*$/g, "");
}

function staticArticleHeadline(item = {}) {
  const title = cleanText(item.title) || "축제 소식";
  const features = staticFeatureTerms(item);
  const kind = staticEventKindLabel(item);
  const shortPlace = staticShortPlace(item.place || item.address || item.category);
  const duration = staticDurationLabel(item);
  let hook = "";

  if (features.length >= 2 && shortPlace) {
    hook = `${features.join("·")}까지, ${shortPlace}에서 즐기는 ${kind}`;
  } else if (features.length && shortPlace) {
    hook = `${features[0]} 중심으로 ${shortPlace}에서 만나는 ${kind}`;
  } else if (duration && shortPlace) {
    hook = `${duration} ${shortPlace}에서 이어지는 ${kind}, 방문 전 일정 확인`;
  } else if (shortPlace) {
    hook = `${shortPlace}에서 만나는 ${kind}, 일정·장소·요금까지 확인`;
  } else {
    hook = staticOverviewSentences(item.overview || item.summary)[0] || `${title}의 공식 일정과 방문 정보`;
  }

  return `“${staticCompactHeadlineHook(hook, 56)}”… ${title}`;
}

function staticDisplayTitle(item = {}) {
  return cleanText(item.articleTitle || item.displayTitle || item.headline) || staticArticleHeadline(item);
}

function withStaticArticleHeadline(item = {}) {
  return {
    ...item,
    articleTitle: staticArticleHeadline(item)
  };
}

function eventIdentity(item) {
  return String(item?.id || "").trim();
}

function uniqueEventItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const id = eventIdentity(item);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

async function previousEventItems(currentItems) {
  let payload;
  try {
    payload = JSON.parse(await readFile(outputPath, "utf8"));
  } catch {
    return [];
  }

  const currentIds = new Set(currentItems.map(eventIdentity).filter(Boolean));
  const priorItems = [
    ...(Array.isArray(payload.items) ? payload.items : []),
    ...(Array.isArray(payload.legacyItems) ? payload.legacyItems : [])
  ];

  return uniqueEventItems(priorItems)
    .filter((item) => !currentIds.has(eventIdentity(item)))
    .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
}

function staticImageMarkup(item, size) {
  if (!item.image) {
    return `<div class="image-frame image-frame--${size} is-empty"><span>대한축제뉴스</span></div>`;
  }

  return `<div class="image-frame image-frame--${size} image-frame--api" style="--api-image: url(&quot;${escapeHtml(item.image)}&quot;)"><span class="image-fallback-text" aria-hidden="true">대한축제뉴스</span><img src="${escapeHtml(item.image)}" alt="${escapeHtml(staticDisplayTitle(item))}" loading="lazy" width="640" height="480" onerror="this.onerror=null;this.closest('.image-frame').classList.add('is-empty');this.remove()"></div>`;
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
  const status = staticStatusBadgeMarkup(item);
  const title = staticDisplayTitle(item);
  return `
          <article class="news-recommend-card">
            <a href="${escapeHtml(href)}" aria-label="${escapeHtml(`${title} 자세히 보기`)}">
              ${staticImageMarkup(item, "recommend")}${status ? `
              ${status}` : ""}
              <div class="news-recommend-body">
                ${staticFestivalMetaMarkup(item)}
                <strong>${escapeHtml(title)}</strong>
              </div>
            </a>
          </article>`;
}

function feedCardMarkup(item) {
  const href = eventDetailUrl(item);
  const status = staticStatusBadgeMarkup(item);
  const title = staticDisplayTitle(item);
  return `
          <article class="news-list-card">
            <a href="${escapeHtml(href)}" aria-label="${escapeHtml(`${title} 자세히 보기`)}">
              ${staticImageMarkup(item, "feed")}${status ? `
              ${status}` : ""}
              <span>
                ${staticFestivalMetaMarkup(item)}
                <strong>${escapeHtml(title)}</strong>
                <small>${escapeHtml(staticPeriodLabel(item))}</small>
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
  let source = await readFile(indexPath, "utf8");
  if (source.includes("STATIC_EDITORIAL_START")) {
    const posts = (await readEditorialPosts()).slice(0, 5).map((post) => ({
      ...post,
      image: "",
      href: `/articles/${encodeURIComponent(post.id)}/`
    }));
    if (!posts.length) throw new Error("No editorial posts are available for the static landing page.");
    source = replaceStaticBlock(source, "EDITORIAL", posts.map(editorialCardMarkup).join(""));
  }
  if (source.includes("STATIC_RECOMMENDED_START")) {
    source = replaceStaticBlock(source, "RECOMMENDED", items.slice(1, 5).map(recommendCardMarkup).join(""));
  }
  source = replaceStaticBlock(source, "FEED", items.slice(0, 12).map(feedCardMarkup).join(""));
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

  await attachOfficialDetails(items);
  await attachGalleryImages(items);
  const legacyItems = (await previousEventItems(items)).map(withStaticArticleHeadline);
  const headlineItems = items.map(withStaticArticleHeadline);

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
        count: headlineItems.length,
        legacyCount: legacyItems.length,
        legacyItems,
        items: headlineItems
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  await updateStaticLanding(headlineItems);
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

  console.log(`Updated ${path.relative(rootDir, outputPath)} with ${headlineItems.length} items across ${REGIONS.length} regions for ${range.start}-${range.end}.`);
  if (range.month !== requestedMonth || range.start !== `${requestedMonth}01`) {
    console.log(`Requested ${requestedMonth}; used ${range.label} because earlier date ranges did not meet the ${MIN_REFRESH_ITEMS}-item minimum.`);
  }
  if (legacyItems.length) {
    console.log(`Preserved ${legacyItems.length} legacy event pages so existing /seoul-events/ URLs stay reachable.`);
  }
  console.log(`Updated ${path.relative(rootDir, indexPath)} with crawlable article cards.`);
  console.log(`Updated ${path.relative(rootDir, sitemapPath)} with ${urls.length} stable public URLs.`);
}

async function staticOnly() {
  const payload = JSON.parse(await readFile(outputPath, "utf8"));
  const items = Array.isArray(payload.items) ? payload.items.map(withStaticArticleHeadline) : [];
  if (!items.length) throw new Error("generated/seoul-events.json has no items for static-only update.");
  const legacyItems = Array.isArray(payload.legacyItems) ? payload.legacyItems.map(withStaticArticleHeadline) : [];
  await writeFile(
    outputPath,
    `${JSON.stringify({ ...payload, items, legacyItems }, null, 2)}\n`,
    "utf8"
  );
  await updateStaticLanding(items);
  await generateStaticArticles();
  console.log(`Updated static landing and generated pages from ${path.relative(rootDir, outputPath)}.`);
}

const runner = process.argv.includes("--static-only") ? staticOnly : main;

runner().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exitCode = 1;
});
