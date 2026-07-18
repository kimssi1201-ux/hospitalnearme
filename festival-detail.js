const fallbackData = {
  articles: [
    {
      id: "festival-detail-fallback",
      category: "축제 정보",
      title: "축제 상세 정보를 확인해 주세요",
      summary: "목록에서 축제를 선택하면 일정, 장소, 사진, 방문 전 체크사항을 자세히 볼 수 있습니다.",
      date: "일정 확인 필요",
      readTime: "축제 상세",
      image: ""
    }
  ]
};
const data = window.TRAVEL_PORTAL_DATA || fallbackData;
const params = new URLSearchParams(window.location.search);
const source = params.get("source");
const id = params.get("id");
const fallbackTitle = params.get("title");
const fallbackContentTypeId = params.get("contentTypeId") || "15";
const fallbackCategory = params.get("category");
const fallbackRawCategory = params.get("rawCategory");
const fallbackSubCategory = params.get("subCategory");
const fallbackCategorySlug = params.get("categorySlug");
const fallbackDate = params.get("date");
const fallbackImage = params.get("image");
const fallbackAddress = params.get("address");
const fallbackMapx = params.get("mapx");
const fallbackMapy = params.get("mapy");
const fallbackLat = params.get("lat");
const fallbackLng = params.get("lng");
const fallbackSummary = params.get("summary");
const fallbackTel = params.get("tel");
const fallbackHomepage = params.get("homepage");
const fallbackFee = params.get("fee");
const fallbackTime = params.get("time");
const fallbackOrg = params.get("org");
const fallbackTarget = params.get("target");
const fallbackIsFree = params.get("isFree");
const fallbackUpdatedAt = params.get("updatedAt");
const supportedLanguages = ["ko", "en", "ja", "zh"];
const state = {
  language: getStoredLanguage(),
  article: null,
  coupang: {
    items: [],
    loaded: false,
    error: false,
    landingUrl: ""
  }
};
const DEFAULT_DETAIL_IMAGE = "";
const API_IMAGE_HOSTS = new Set(["culture.seoul.go.kr", "tong.visitkorea.or.kr"]);
const IMAGE_FIELD_NAMES = [
  "image",
  "MAIN_IMG",
  "mainImg",
  "mainImage",
  "mainImageUrl",
  "imageUrl",
  "imageURL",
  "thumbnail",
  "thumbnailUrl",
  "thumbnailURL",
  "representativeImageUrl",
  "firstimage",
  "firstimage2",
  "productImage",
  "originimgurl",
  "smallimageurl",
  "url"
];

const DETAIL_I18N = {
  ko: {
    "brand.name": "서울여행뉴스",
    "brand.tagline": "서울 여행 정보 뉴스",
    "footer.tagline": "서울 여행 선택을 돕는 뉴스 포털",
    "footer.description": "서울 문화행사, 축제 일정, 방문 준비, 교통과 주변 여행 정보를 뉴스 피드로 정리합니다.",
    "nav.festivals": "축제 정보",
    "nav.booking": "예약 전 체크",
    "nav.guide": "방문 가이드",
    "back.list": "목록으로 돌아가기",
    "loading.title": "축제 정보를 불러오는 중입니다.",
    "loading.desc": "잠시 후 일정, 장소, 방문 전 체크사항이 표시됩니다.",
    "related.title": "함께 보면 좋은 축제 글",
    "common.all": "전체 보기",
    "meta.suffix": "서울여행뉴스",
    "meta.description": "{title} 일정, 장소, 교통, 예약 전 체크사항을 정보성 블로그 형식으로 정리했습니다.",
    "category.festival": "서울 축제",
    "summary.fallback": "방문 전 확인하면 좋은 서울 축제 상세 정보입니다.",
    "summary.localized": "{title} 방문을 계획할 때 확인하면 좋은 일정, 장소, 교통, 예약 전 체크 정보를 정리했습니다.",
    "read.detail": "축제 상세",
    "date.needCheck": "일정 확인 필요",
    "place.needCheck": "장소 확인 필요",
    "official.check": "공식 안내 확인",
    "fact.schedule": "일정",
    "fact.place": "장소",
    "fact.hours": "운영 시간",
    "fact.fee": "이용 요금",
    "fact.category": "분류",
    "fact.updated": "업데이트",
    "fact.readTime": "읽는 시간",
    "fact.checkPoint": "체크 포인트",
    "fact.checkValue": "일정·교통·예약",
    "gallery.eyebrow": "Festival Photos",
    "gallery.title": "축제 사진",
    "gallery.desc": "현장 분위기를 미리 볼 수 있도록 관련 사진을 함께 모았습니다.",
    "gallery.alt": "{title} 추가 사진 {index}",
    "overview.title": "축제 소개",
    "overview.extra": "기본 소개 외에도 방문 전에는 행사 시간, 장소 이동, 현장 혼잡, 우천 운영 여부를 함께 확인해야 실제 일정 관리가 쉽습니다.",
    "address": "주소",
    "tel": "문의",
    "basicInfo": "축제 기본 정보",
    "checklist.title": "방문 전 체크리스트",
    "guide.eyebrow": "Visit Guide",
    "guide.title": "방문 전 참고 포인트",
    "guide.desc": "축제 기본 정보를 바탕으로 방문 전 확인할 내용을 짧게 보강합니다.",
    "guide.load": "방문 팁 더 보기",
    "guide.loading": "방문 팁을 불러오는 중",
    "guide.reload": "방문 팁 다시 불러오기",
    "guide.retry": "잠시 후 다시 시도하기",
    "guide.point": "방문 포인트",
    "official.link": "공식 안내 보기",
    "related.aria": "{title} 상세 보기"
  },
  en: {
    "brand.name": "Seoul Travel News",
    "brand.tagline": "Seoul travel information",
    "footer.tagline": "A news guide for Seoul trips",
    "footer.description": "A Seoul travel news feed covering cultural events, festivals, visit preparation, transport, and nearby information.",
    "nav.festivals": "Festivals",
    "nav.booking": "Before You Go",
    "nav.guide": "Visit Guide",
    "back.list": "Back to list",
    "loading.title": "Loading festival details.",
    "loading.desc": "Schedule, location, and visit checks will appear shortly.",
    "related.title": "More festival reads",
    "common.all": "View all",
    "meta.suffix": "Seoul Travel News",
    "meta.description": "A practical guide to {title}, including schedule, location, transport, and booking checks.",
    "category.festival": "Seoul Festival",
    "summary.fallback": "Festival details to review before planning your visit.",
    "summary.localized": "A practical guide to {title}, covering schedule, location, transport, and pre-visit checks.",
    "read.detail": "Festival guide",
    "date.needCheck": "Check schedule",
    "place.needCheck": "Check location",
    "official.check": "Check official notice",
    "fact.schedule": "Schedule",
    "fact.place": "Place",
    "fact.hours": "Hours",
    "fact.fee": "Fee",
    "fact.category": "Category",
    "fact.updated": "Updated",
    "fact.readTime": "Read time",
    "fact.checkPoint": "Check point",
    "fact.checkValue": "Date · transport · booking",
    "gallery.eyebrow": "Festival Photos",
    "gallery.title": "Festival Photos",
    "gallery.desc": "Photos are gathered to help you preview the atmosphere before visiting.",
    "gallery.alt": "{title} photo {index}",
    "overview.title": "Festival Overview",
    "overview.extra": "Beyond the basic introduction, check hours, route, crowd level, and rain policy before finalizing your plan.",
    "address": "Address",
    "tel": "Contact",
    "basicInfo": "Festival basic information",
    "checklist.title": "Pre-visit checklist",
    "guide.eyebrow": "Visit Guide",
    "guide.title": "Helpful notes before visiting",
    "guide.desc": "Generate a short guide based on the festival information.",
    "guide.load": "Show visit tips",
    "guide.loading": "Loading visit tips",
    "guide.reload": "Reload visit tips",
    "guide.retry": "Try again later",
    "guide.point": "Visit point",
    "official.link": "Official information",
    "related.aria": "View {title} details"
  },
  ja: {
    "brand.name": "ソウル旅行ニュース",
    "brand.tagline": "ソウル旅行情報ニュース",
    "footer.tagline": "ソウル旅行選びを助けるニュースポータル",
    "footer.description": "ソウルの文化行事、祭りの日程、訪問準備、交通情報をニュース形式で整理します。",
    "nav.festivals": "祭り情報",
    "nav.booking": "訪問前チェック",
    "nav.guide": "訪問ガイド",
    "back.list": "一覧に戻る",
    "loading.title": "祭り情報を読み込んでいます。",
    "loading.desc": "日程、場所、訪問前チェックをまもなく表示します。",
    "related.title": "一緒に読みたい祭り記事",
    "common.all": "すべて見る",
    "meta.suffix": "ソウル旅行ニュース",
    "meta.description": "{title}の日程、場所、交通、予約前チェックを情報記事として整理しました。",
    "category.festival": "韓国の祭り",
    "summary.fallback": "訪問前に確認したい祭りの詳細情報です。",
    "summary.localized": "{title}を訪問する前に確認したい日程、場所、交通、予約前チェックを整理しました。",
    "read.detail": "祭り詳細",
    "date.needCheck": "日程確認が必要",
    "place.needCheck": "場所確認が必要",
    "official.check": "公式案内を確認",
    "fact.schedule": "日程",
    "fact.place": "場所",
    "fact.hours": "運営時間",
    "fact.fee": "利用料金",
    "fact.category": "分類",
    "fact.updated": "更新",
    "fact.readTime": "読む時間",
    "fact.checkPoint": "確認ポイント",
    "fact.checkValue": "日程・交通・予約",
    "gallery.eyebrow": "Festival Photos",
    "gallery.title": "祭り写真",
    "gallery.desc": "現地の雰囲気を事前に確認できる写真をまとめました。",
    "gallery.alt": "{title} 追加写真 {index}",
    "overview.title": "祭り紹介",
    "overview.extra": "基本紹介だけでなく、訪問前には時間、移動、混雑、雨天時の運営可否も確認すると予定を立てやすくなります。",
    "address": "住所",
    "tel": "問い合わせ",
    "basicInfo": "祭り基本情報",
    "checklist.title": "訪問前チェックリスト",
    "guide.eyebrow": "Visit Guide",
    "guide.title": "訪問前の参考ポイント",
    "guide.desc": "祭りの基本情報をもとに、確認すべき内容を短く補足します。",
    "guide.load": "訪問ヒントを見る",
    "guide.loading": "訪問ヒントを読み込み中",
    "guide.reload": "訪問ヒントを再読み込み",
    "guide.retry": "しばらくして再試行",
    "guide.point": "訪問ポイント",
    "official.link": "公式案内を見る",
    "related.aria": "{title} 詳細を見る"
  },
  zh: {
    "brand.name": "首尔旅行新闻",
    "brand.tagline": "首尔旅行信息新闻",
    "footer.tagline": "帮助规划首尔旅行的新闻门户",
    "footer.description": "以新闻信息流整理首尔文化活动、庆典日程、出行准备、交通和周边信息。",
    "nav.festivals": "节庆信息",
    "nav.booking": "出发前检查",
    "nav.guide": "游览指南",
    "back.list": "返回列表",
    "loading.title": "正在加载节庆信息。",
    "loading.desc": "日程、地点和出发前检查信息即将显示。",
    "related.title": "相关推荐节庆文章",
    "common.all": "查看全部",
    "meta.suffix": "首尔旅行新闻",
    "meta.description": "整理了 {title} 的日程、地点、交通和预订前检查信息。",
    "category.festival": "韩国节庆",
    "summary.fallback": "出发前值得确认的节庆详细信息。",
    "summary.localized": "整理了前往 {title} 前需要确认的日程、地点、交通和预订前检查信息。",
    "read.detail": "节庆详情",
    "date.needCheck": "需要确认日程",
    "place.needCheck": "需要确认地点",
    "official.check": "查看官方说明",
    "fact.schedule": "日程",
    "fact.place": "地点",
    "fact.hours": "运营时间",
    "fact.fee": "费用",
    "fact.category": "分类",
    "fact.updated": "更新",
    "fact.readTime": "阅读时间",
    "fact.checkPoint": "检查重点",
    "fact.checkValue": "日程·交通·预订",
    "gallery.eyebrow": "Festival Photos",
    "gallery.title": "节庆照片",
    "gallery.desc": "整理了相关照片，方便提前了解现场氛围。",
    "gallery.alt": "{title} 附加照片 {index}",
    "overview.title": "节庆介绍",
    "overview.extra": "除了基本介绍，出发前还应确认活动时间、交通路线、现场拥挤程度和雨天运营安排。",
    "address": "地址",
    "tel": "咨询",
    "basicInfo": "节庆基本信息",
    "checklist.title": "出发前检查清单",
    "guide.eyebrow": "Visit Guide",
    "guide.title": "出发前参考要点",
    "guide.desc": "根据节庆基本信息，补充需要提前确认的内容。",
    "guide.load": "查看更多游览提示",
    "guide.loading": "正在加载游览提示",
    "guide.reload": "重新加载游览提示",
    "guide.retry": "稍后再试",
    "guide.point": "游览重点",
    "official.link": "查看官方信息",
    "related.aria": "查看 {title} 详情"
  }
};

const $ = (selector) => document.querySelector(selector);

function getStoredLanguage() {
  try {
    const stored = window.localStorage.getItem("festivalNote.language");
    return supportedLanguages.includes(stored) ? stored : "ko";
  } catch {
    return "ko";
  }
}

function textFor(key, params = {}) {
  const table = DETAIL_I18N[state.language] || DETAIL_I18N.ko;
  const template = table[key] || DETAIL_I18N.ko[key] || key;
  return template.replace(/\{(\w+)\}/g, (_, name) => params[name] ?? "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function stripHtml(value) {
  const div = document.createElement("div");
  div.innerHTML = value || "";
  return div.textContent || div.innerText || "";
}

function compactDate(value) {
  if (!value || String(value).length !== 8) return "";
  const text = String(value);
  return `${text.slice(0, 4)}.${text.slice(4, 6)}.${text.slice(6, 8)}`;
}

function commonParams(extra = {}) {
  return new URLSearchParams({
    serviceKey: data.tourApi.serviceKey,
    MobileOS: data.tourApi.mobileOS || "ETC",
    MobileApp: data.tourApi.mobileApp || "FestivalNoteHub",
    _type: "json",
    ...extra
  });
}

function normalizeImageUrl(value) {
  if (value === null || value === undefined) return "";

  let text = String(value).trim();
  if (!text) return "";

  const embeddedUrl = text.match(/(?:src|href)=["']([^"']+)["']/i)?.[1];
  if (embeddedUrl) text = embeddedUrl.trim();

  text = text
    .replaceAll("&amp;", "&")
    .replaceAll("\\u0026", "&")
    .replace(/^http:/i, "https:");

  if (text.startsWith("//")) text = `https:${text}`;
  if (!/^https:\/\//i.test(text)) return "";

  try {
    return new URL(text).href;
  } catch {
    return "";
  }
}

function collectImageCandidates(value, bucket = [], depth = 0) {
  if (!value || depth > 3) return bucket;

  if (typeof value === "string" || typeof value === "number") {
    bucket.push(value);
    return bucket;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectImageCandidates(item, bucket, depth + 1));
    return bucket;
  }

  if (typeof value === "object") {
    IMAGE_FIELD_NAMES.forEach((key) => collectImageCandidates(value[key], bucket, depth + 1));
    ["images", "galleryImages", "photos", "pictures", "media", "items", "item"].forEach((key) => {
      collectImageCandidates(value[key], bucket, depth + 1);
    });
  }

  return bucket;
}

function imageListForArticle(article = {}) {
  const candidates = [];
  collectImageCandidates(article, candidates);
  return [...new Set(candidates.map(normalizeImageUrl).filter(isApiImageUrl))];
}

function isApiImageUrl(value) {
  const image = normalizeImageUrl(value);
  if (!image) return false;

  try {
    return API_IMAGE_HOSTS.has(new URL(image).hostname);
  } catch {
    return false;
  }
}

function imageUrlForArticle(article = {}, fallback = DEFAULT_DETAIL_IMAGE) {
  return imageListForArticle(article)[0] || (isApiImageUrl(fallback) ? normalizeImageUrl(fallback) : "");
}

function normalizeExternalUrl(value) {
  const html = String(value || "").trim();
  if (!html) return "";

  const div = document.createElement("div");
  div.innerHTML = html;
  const href = div.querySelector("a[href]")?.getAttribute("href") || stripHtml(html);
  const candidate = String(href || "").trim();
  const normalized = candidate.startsWith("//") ? `https:${candidate}` : candidate;

  if (!/^https?:\/\//i.test(normalized)) return "";

  try {
    const url = new URL(normalized);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.href.replace(/^http:/, "https:");
  } catch {
    return "";
  }
}

function firstArrayFrom(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  for (const key of ["items", "item", "data", "list", "result", "results", "content", "productData"]) {
    const found = firstArrayFrom(value[key]);
    if (found.length) return found;
  }

  for (const child of Object.values(value)) {
    const found = firstArrayFrom(child);
    if (found.length) return found;
  }

  return [];
}

function formatWon(value) {
  const number = Number(String(value || "").replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(number) || number <= 0) return "가격 확인";
  return `${number.toLocaleString("ko-KR")}원`;
}

async function fetchTourDetail(contentId, contentTypeId = fallbackContentTypeId || "15") {
  const base = "https://apis.data.go.kr/B551011/KorService2";
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 6500);
  const commonUrl = `${base}/detailCommon2?${commonParams({
    contentId,
    contentTypeId,
    defaultYN: "Y",
    firstImageYN: "Y",
    areacodeYN: "Y",
    catcodeYN: "Y",
    addrinfoYN: "Y",
    mapinfoYN: "Y",
    overviewYN: "Y"
  })}`;
  const introUrl = `${base}/detailIntro2?${commonParams({
    contentId,
    contentTypeId
  })}`;
  const imageUrl = `${base}/detailImage2?${commonParams({
    contentId,
    imageYN: "Y",
    subImageYN: "Y",
    numOfRows: "50",
    pageNo: "1"
  })}`;
  const infoUrl = `${base}/detailInfo2?${commonParams({
    contentId,
    contentTypeId,
    numOfRows: "30",
    pageNo: "1"
  })}`;

  let commonResponse;
  let introResponse;
  let imageResponse;
  let infoResponse;

  try {
    [commonResponse, introResponse, imageResponse, infoResponse] = await Promise.all([
      fetch(commonUrl, { signal: controller.signal }),
      fetch(introUrl, { signal: controller.signal }),
      fetch(imageUrl, { signal: controller.signal }),
      fetch(infoUrl, { signal: controller.signal })
    ]);
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!commonResponse.ok) throw new Error(`detailCommon2 ${commonResponse.status}`);

  const commonPayload = await commonResponse.json();
  const introPayload = introResponse.ok ? await introResponse.json() : {};
  const imagePayload = imageResponse.ok ? await imageResponse.json() : {};
  const infoPayload = infoResponse.ok ? await infoResponse.json() : {};
  const commonItem = normalizeApiItem(commonPayload?.response?.body?.items?.item);
  const introItem = normalizeApiItem(introPayload?.response?.body?.items?.item);
  const detailInfoItems = normalizeApiItems(infoPayload?.response?.body?.items?.item);

  if (!commonItem?.title) throw new Error("Tour detail item missing");

  const start = compactDate(introItem?.eventstartdate);
  const end = compactDate(introItem?.eventenddate);
  const period = start && end ? `${start} - ${end}` : start || "일정 확인 필요";
  const galleryImages = collectGalleryImages(commonItem, imagePayload);
  const firstImage = galleryImages[0] || normalizeImageUrl(commonItem.firstimage || commonItem.firstimage2);
  const overview = stripHtml(commonItem.overview);
  const address = [commonItem.addr1, commonItem.addr2].filter(Boolean).join(" ") || fallbackAddress || extractAddressFromOverview(overview);
  const place = introItem?.eventplace || address || "장소 확인 필요";
  const playTime = stripHtml(introItem?.playtime) || "공식 안내 확인";
  const fee = stripHtml(introItem?.usetimefestival) || "공식 안내 확인";
  const detailInfo = collectOfficialDetails(commonItem, introItem, detailInfoItems);

  return {
    id: `tour-${contentId}`,
    source: "tour",
    contentId,
    contentTypeId,
    category: "서울 축제",
    title: commonItem.title,
    summary: overview || "방문 전 확인하면 좋은 서울 축제 상세 정보입니다.",
    date: period,
    readTime: "축제 상세",
    image: firstImage,
    galleryImages,
    address,
    mapx: commonItem.mapx || fallbackMapx || "",
    mapy: commonItem.mapy || fallbackMapy || "",
    tel: commonItem.tel || "",
    homepage: normalizeExternalUrl(commonItem.homepage),
    overview,
    detailInfo,
    facts: [
      ["일정", period],
      ["장소", place],
      ["운영 시간", playTime],
      ["이용 요금", fee],
      ["주최", stripHtml(introItem?.sponsor1)],
      ["문의", stripHtml(introItem?.sponsor1tel || commonItem.tel)],
      ["행사 프로그램", stripHtml(introItem?.program)],
      ["부대 행사", stripHtml(introItem?.subevent)],
      ["관람 소요시간", stripHtml(introItem?.spendtimefestival)],
      ["참가 연령", stripHtml(introItem?.agelimit)]
    ]
  };
}

function normalizeApiItem(item) {
  return Array.isArray(item) ? item[0] : item || {};
}

function normalizeApiItems(item) {
  if (Array.isArray(item)) return item;
  return item ? [item] : [];
}

function collectGalleryImages(commonItem, imagePayload) {
  const detailImages = normalizeApiItems(imagePayload?.response?.body?.items?.item)
    .flatMap((item) => [item.originimgurl, item.smallimageurl]);
  const urls = [
    commonItem.firstimage,
    commonItem.firstimage2,
    ...detailImages
  ]
    .map(normalizeImageUrl)
    .filter(Boolean);

  return [...new Set(urls)];
}

function collectOfficialDetails(commonItem, introItem, detailInfoItems) {
  const details = [];
  const add = (label, value) => {
    const clean = stripHtml(value);
    if (!clean || clean === "0") return;
    if (details.some((item) => item.label === label && item.value === clean)) return;
    details.push({ label, value: clean });
  };

  add("행사 장소", introItem?.eventplace);
  add("행사 시간", introItem?.playtime);
  add("이용 요금", introItem?.usetimefestival);
  add("주최 기관", introItem?.sponsor1);
  add("주관 기관", introItem?.sponsor2);
  add("문의 전화", introItem?.sponsor1tel || commonItem?.tel);
  add("행사 프로그램", introItem?.program);
  add("부대 행사", introItem?.subevent);
  add("관람 소요시간", introItem?.spendtimefestival);
  add("참가 연령", introItem?.agelimit);
  add("예매처", introItem?.bookingplace);
  add("행사장 위치 안내", introItem?.placeinfo);
  add("할인 정보", introItem?.discountinfofestival);
  add("축제 등급", introItem?.festivalgrade);

  detailInfoItems.forEach((item) => {
    add(item.infoname || item.serialnum || "상세 정보", item.infotext);
  });

  return details;
}

function extractAddressFromOverview(value) {
  const text = stripHtml(value).replace(/\s+/g, " ").trim();
  if (!text) return "";

  const match = text.match(/((?:서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)[^,.。]*?(?:로|길|번길)\s?\d+(?:\s?\([^)]*\))?)/);
  return match ? match[1].trim() : "";
}

function enrichLocalArticle(article = {}) {
  const address = article.address || "서울 전역";
  const time = article.time || "행사별 운영 시간이 다릅니다";
  const fee = article.fee || "행사별 상이";
  const image = imageUrlForArticle(article, "");
  const galleryImages = imageListForArticle(article);
  return {
    ...article,
    source: article.source || "editorial",
    address,
    time,
    fee,
    image,
    galleryImages: galleryImages.length ? galleryImages : image ? [image] : [],
    facts: article.facts || [
      ["일정", article.date || textFor("date.needCheck")],
      ["장소", address],
      ["운영", time],
      ["요금", fee],
      ["분류", article.category || textFor("category.festival")],
      ["읽는 시간", article.readTime || textFor("read.detail")]
    ]
  };
}

function findLocalArticle() {
  const localArticles = [
    ...(Array.isArray(data.editorialPosts) ? data.editorialPosts : []),
    ...(Array.isArray(data.articles) ? data.articles : [])
  ];
  return enrichLocalArticle(localArticles.find((article) => article.id === id) || localArticles[0] || data.articles[0]);
}

function fallbackArticleFromParams() {
  const title = fallbackTitle || "축제 상세 정보";
  const image = imageUrlForArticle({ image: fallbackImage }, "");
  const address = fallbackAddress || "";
  const summary = fallbackSummary || `${title} 방문 전 확인하면 좋은 일정, 장소, 교통, 준비 정보를 정리했습니다.`;

  return {
    id: id ? `tour-fallback-${id}` : "tour-fallback",
    source: "tour",
    contentId: id || "",
    contentTypeId: fallbackContentTypeId,
    category: fallbackCategory || textFor("category.festival"),
    rawCategory: fallbackRawCategory || fallbackSubCategory || fallbackCategory || "",
    subCategory: fallbackSubCategory || fallbackRawCategory || fallbackCategory || "",
    categorySlug: fallbackCategorySlug || "",
    title,
    summary,
    date: fallbackDate || textFor("date.needCheck"),
    readTime: textFor("read.detail"),
    image,
    galleryImages: image ? [image] : [],
    address,
    mapx: fallbackMapx || "",
    mapy: fallbackMapy || "",
    lat: fallbackLat || fallbackMapy || "",
    lng: fallbackLng || fallbackMapx || "",
    tel: fallbackTel || "",
    homepage: normalizeExternalUrl(fallbackHomepage),
    overview: summary,
    detailInfo: [
      { label: "운영 시간", value: fallbackTime },
      { label: "이용 요금", value: fallbackFee },
      { label: "주최 기관", value: fallbackOrg },
      { label: "이용 대상", value: fallbackTarget },
      { label: "유무료", value: fallbackIsFree },
      { label: "정보 기준일", value: fallbackUpdatedAt }
    ].filter((item) => item.value),
    facts: [
      ["일정", fallbackDate || textFor("date.needCheck")],
      ["장소", address || textFor("place.needCheck")],
      ["운영 시간", fallbackTime || textFor("official.check")],
      ["이용 요금", fallbackFee || textFor("official.check")],
      ["문의", fallbackTel || ""]
    ]
  };
}

function detailPostCopy(article) {
  const location = article.address ? `${article.address} ${state.language === "ko" ? "인근" : ""}`.trim() : textFor("place.needCheck");
  const category = article.category || textFor("category.festival");
  const title = article.title;
  const period = factValue(article, "일정", article.date || textFor("official.check"));
  const place = factValue(article, "장소", article.address || textFor("official.check"));
  const time = factValue(article, "운영", textFor("official.check"));
  const fee = factValue(article, "요금", textFor("official.check"));

  if (state.language === "en") {
    return {
      sections: [
        {
          title: "Key Festival Summary",
          body: [
            `${localizedSummary(article)} This article is written as a practical guide, focusing on schedule, route, booking, and on-site checks you should review before visiting.`,
            `${category} events can feel very different depending on crowd level, transport rules, and food booth waiting time. Decide your purpose, companions, and transport first, then match your visit to the main program time.`
          ]
        },
        {
          title: "Who This Festival Fits",
          body: [
            "If you want photos, arrive before sunset and look around the full venue first. For family visits, check restrooms, shade, rest areas, and stroller-friendly routes before moving deep into the venue.",
            "Couples and friends should plan around performance times and food booth hours. Solo visitors usually have a smoother experience by arriving early and starting with exhibitions or hands-on programs."
          ]
        },
        {
          title: "Transport and On-site Route",
          body: [
            `Around ${location}, traffic may increase on the event day. Drivers should check temporary parking and walking distance to the venue; public transport users should plan to return before the final train or bus.`,
            "After arrival, locate the entrance, information booth, restrooms, main stage, and food zone first. Popular performances, fireworks, and parade-style programs can become difficult to approach from about 30 minutes before start."
          ]
        },
        {
          title: "Accommodation and Booking Checks",
          body: [
            "For overnight trips, compare not only hotels near the venue but also places on a convenient route after the festival ends. Check-in time, free cancellation deadline, and parking options matter as much as price.",
            "For ticketed events, confirm whether the ticket is mobile-based or picked up on site. Rain cancellation, partial refund, and time-change rules should be checked before visiting."
          ]
        },
        {
          title: "Food and What to Bring",
          body: [
            "Food festivals and night-market events can have long waits at popular booths. If food is the main purpose, avoid peak meal times and use the window before dinner crowds arrive.",
            "For outdoor festivals, bring a battery pack, water, a light outer layer, wet wipes, a small mat, and a compact umbrella. Seasonal items such as sunscreen in summer or gloves in winter also make the visit easier."
          ]
        },
        {
          title: "Rain or Heavy Crowds",
          body: [
            "If rain is forecast, check the official website or social channels and prepare nearby indoor attractions or cafes as alternatives. Some outdoor booths may change hours even when the main stage continues.",
            "When the venue is crowded, choose one or two priority programs instead of trying to see everything. With children, stay near exits or rest areas for a safer visit."
          ]
        }
      ],
      checklist: [
        "Check opening, closing, and last-entry time.",
        "Check the last public transport service or temporary shuttle.",
        "Review rain cancellation or reduced-operation rules.",
        "Confirm ticket booking, on-site pickup, and refund deadline.",
        "Check parking location and walking distance to the venue.",
        "Locate restrooms, information booths, and rest areas first.",
        "Move to popular performances or parades at least 30 minutes early.",
        "Prepare at least one nearby restaurant or cafe as an alternative."
      ],
      visitPlan: [
        ["Before visiting", "Check the official notice, operating hours, entry method, and rain updates."],
        ["On arrival", "Find the information booth, restrooms, main stage, and food zone first."],
        ["During the visit", "Focus on one or two key programs to reduce unnecessary movement."],
        ["Before leaving", "Check return transport, parking exit route, and nearby crowd points again."]
      ],
      practicalCards: [
        ["Transport", "Check road controls and temporary parking for the event day."],
        ["Stay", "Compare convenience after the festival ends, not only distance from the venue."],
        ["Tickets", "Check mobile ticket, on-site pickup, cancellation deadline, and rain refund rules."],
        ["Packing", "Bring water, a battery pack, a light layer, and rain gear for long stays."]
      ],
      reader: {
        title: "What Visitors Usually Want to Know",
        desc: "These answers cover the questions people most often check before choosing a festival.",
        items: [
          ["When should I go?", `${period} is the main schedule, but performance and experience times may vary. Check the priority program and arrive about 30 minutes early.`],
          ["Where should I go?", `Plan around ${place}. If the festival uses several zones, confirm the main entrance and information booth first.`],
          ["Is there an entry fee?", `The fee is listed as "${fee}". Even free festivals may charge separately for experiences, seats, goods, food, or parking.`],
          ["What are the operating hours?", `${time} is the available guide. Booths and performances may close at different times, so late visitors should check each program.`],
          ["Can I bring a car?", article.address ? "Traffic can be heavy around the venue. Check temporary parking, shuttle service, and final public transport times." : "If the detailed location is not fixed, check official parking and shuttle notices first."],
          ["Is it good for children?", "For family visits, check restrooms, nursing rooms, shade, rest areas, and stroller routes first."],
          ["What if it rains?", "Outdoor programs may be cancelled or moved. Check rain notices and prepare an indoor backup plan."],
          ["What should I bring?", "A battery pack, water, light outerwear, rain gear, wet wipes, and a small mat help during long stays."]
        ]
      },
      rich: {
        planningTitle: "Detailed Checks Before Visiting",
        planningDesc: `Before visiting ${title}, check schedule, place, hours, and fee instead of relying only on photos. The table below lists what to confirm first when planning your trip.`,
        guideRows: [
          ["Schedule", period, "Multi-day festivals may have different programs by date. Check the exact date you plan to visit."],
          ["Place", place, "Venues can be large or split into zones. Confirm the main entrance or parking location before using navigation."],
          ["Hours", time, "Overall festival hours and individual program hours may differ. Popular performances and booths can close earlier."],
          ["Fee", fee, "Even free events may have separate costs for experiences, seats, parking, and food. Check payment methods as well."]
        ],
        companionTitle: "Tips by Travel Type",
        companionDesc: "The best route changes depending on who you visit with. Plan differently for family, friends, couples, or solo visits.",
        companionTips: [
          ["Family", "Check restrooms, nursing rooms, shade, and rest areas first, and reduce long walking routes."],
          ["Couples · Friends", "Choose photo-friendly times and food booth locations first for a better short visit."],
          ["Solo", "Visit at a less crowded time, start with exhibitions or activities, and secure your return transport early."],
          ["Day trip", "Pick only one or two key programs and prepare a nearby meal or cafe backup."]
        ],
        budgetTitle: "Budget and Booking Checks",
        budgetDesc: "Festival costs often include transport, parking, food, activities, and accommodation, not just tickets. Compare day-trip and overnight budgets separately.",
        budgetItems: [
          "Even free festivals can charge for popular experiences, seats, goods, or food.",
          "For overnight trips, compare lodging by return route as well as distance.",
          "For ticketed events, check cancellation deadline, partial refund, and rain rules.",
          "If many booths use on-site payment, check card or mobile payment availability."
        ],
        faqTitle: "Frequently Asked Questions",
        faqs: [
          ["When is the best time to visit?", `${title} should be planned around ${period}, but program schedules can differ. Check the latest notice before visiting.`],
          ["Do I need a ticket or reservation?", `The fee is shown as "${fee}". Reservation, on-site ticketing, or free entry depends on each festival, so confirm with the official guide.`],
          ["What should I do if it rains?", "Outdoor festivals may change programs in rain. Rain gear is often easier than umbrellas, and an indoor backup plan helps."],
          ["Is driving okay?", "Temporary parking and traffic controls may apply. Check public transport and shuttle options, and consider the exit route if driving."]
        ]
      }
    };
  }

  if (state.language === "ja") {
    return {
      sections: [
        { title: "祭りの要点", body: [`${localizedSummary(article)} この記事は、訪問前に確認したい日程、移動、予約、現地利用の基準を中心にまとめた情報ガイドです。`, `${category}は混雑、交通規制、飲食ブースの待ち時間によって満足度が変わります。目的、同行者、移動手段を決めてから時間を合わせると安心です。`] },
        { title: "おすすめの訪問者", body: ["写真を残したい場合は、日没前に到着して会場全体を先に見ておくと良いです。家族連れはトイレ、日陰、休憩場所、ベビーカー動線を先に確認しましょう。", "カップルや友人同士なら公演時間と飲食ブースの営業時間を中心に動くのがおすすめです。一人旅なら混雑の少ない早い時間に展示や体験から回ると効率的です。"] },
        { title: "交通と現地動線", body: [`${location}周辺は当日交通量が増える可能性があります。車の場合は臨時駐車場と会場までの徒歩距離、公共交通の場合は最終便より早めの帰宅計画を確認してください。`, "到着後は入口、案内所、トイレ、主要ステージ、飲食エリアの位置を先に把握しましょう。人気公演やパレードは開始30分前から移動しにくくなることがあります。"] },
        { title: "宿泊と予約前チェック", body: ["宿泊が必要な場合、会場前だけでなく祭り終了後に移動しやすい交通軸の宿も比較しましょう。チェックイン時間、無料キャンセル期限、駐車可否も重要です。", "入場券がある場合はモバイルチケットか現地受け取りかを確認してください。雨天中止、部分返金、時間変更の可否も訪問前に見るべき項目です。"] },
        { title: "飲食と持ち物", body: ["地域グルメや夜市型の祭りは人気ブースの待ち時間が長くなりやすいです。食事目的ならピーク前の時間帯を活用しましょう。", "屋外ではモバイルバッテリー、水、薄手の上着、ウェットティッシュ、小さな敷物、折りたたみ傘があると便利です。季節に合わせて日焼け止めや手袋も準備しましょう。"] },
        { title: "雨や混雑への備え", body: ["雨予報がある場合は公式サイトやSNSで運営告知を確認し、近くの屋内観光地やカフェを代替コースにしましょう。", "混雑時はすべてを見るより、優先プログラムを1〜2個に絞ると動きやすくなります。子ども連れなら出口や休憩所に近い場所が安全です。"] }
      ],
      checklist: ["開始・終了時間と最終入場時間を確認", "最終公共交通または臨時シャトルを確認", "雨天時の中止・縮小運営基準を確認", "チケット予約、現地受け取り、返金期限を確認", "駐車場と会場までの徒歩距離を確認", "トイレ、案内所、休憩場所を先に確認", "人気公演やパレードは30分前に移動", "近くの食堂やカフェを代替候補にする"],
      visitPlan: [["訪問前", "公式案内、運営時間、入場方法、雨天告知を確認します。"], ["到着後", "案内所、トイレ、主要ステージ、飲食エリアを先に確認します。"], ["観覧中", "主要プログラム1〜2個を中心に動線を短くします。"], ["帰宅前", "最終交通、駐車場の出庫動線、周辺混雑を確認します。"]],
      practicalCards: [["交通", "当日の交通規制と臨時駐車場を確認しましょう。"], ["宿泊", "会場との距離だけでなく終了後の移動しやすさも比較しましょう。"], ["入場券", "モバイルチケット、現地受け取り、キャンセル期限、雨天返金を確認しましょう。"], ["持ち物", "水、モバイルバッテリー、薄手の上着、雨具を準備しましょう。"]],
      reader: { title: "訪問者がよく知りたい情報", desc: "祭りを選ぶ時によく確認する質問を基準にまとめました。", items: [["いつ行くのが良い？", `${period}の中でも公演や体験時間は異なる場合があります。優先プログラムを確認し、30分ほど余裕を持って到着しましょう。`], ["どこへ行けば良い？", `${place}を基準に移動計画を立て、複数エリアの場合はメイン入口と案内所を先に確認しましょう。`], ["入場料はある？", `${fee}と案内されています。無料でも体験、座席、グッズ、駐車は別料金の場合があります。`], ["何時まで運営？", `${time}を基準に確認されます。ブースや公演は終了時間が異なる場合があります。`], ["車で行ける？", article.address ? "会場周辺は混雑する可能性があります。臨時駐車場、シャトル、最終交通を確認しましょう。" : "詳細場所が未確定の場合は公式の駐車場・シャトル告知を確認しましょう。"], ["子ども連れでも大丈夫？", "トイレ、授乳室、日陰、休憩所、ベビーカー動線を先に確認しましょう。"], ["雨が降ったら？", "屋外プログラムは中止または場所変更の可能性があります。雨天告知と屋内代替コースを準備しましょう。"], ["何を持って行く？", "モバイルバッテリー、水、上着、雨具、ウェットティッシュ、小さな敷物が便利です。"]] },
      rich: {
        planningTitle: "訪問前の詳細チェック", planningDesc: `${title}を訪問する前に、写真だけでなく日程、場所、運営時間、料金を確認しましょう。`, guideRows: [["日程", period, "複数日にわたる祭りは日付ごとに内容が異なる場合があります。"], ["場所", place, "会場が広い場合はメイン入口や駐車場を基準に確認しましょう。"], ["運営時間", time, "全体時間と個別プログラム時間は異なる場合があります。"], ["料金", fee, "無料でも体験、座席、駐車、飲食は別料金の場合があります。"]],
        companionTitle: "同行者別の訪問ヒント", companionDesc: "誰と訪問するかによって良い動線は変わります。", companionTips: [["家族", "トイレ、休憩所、日陰を先に確認し、長い徒歩動線を減らしましょう。"], ["カップル・友人", "写真に良い時間と飲食ブースを先に決めると短時間でも満足度が上がります。"], ["一人", "混雑の少ない時間に展示や体験から回り、帰宅交通を早めに確保しましょう。"], ["日帰り", "主要プログラムを1〜2個に絞り、近くの食事代替コースも準備しましょう。"]],
        budgetTitle: "予算と予約チェック", budgetDesc: "祭り費用は入場券だけでなく交通、駐車、食事、体験、宿泊まで含めて考えると安心です。", budgetItems: ["無料祭りでも体験、座席、グッズ、飲食は別料金の場合があります。", "宿泊時は距離だけでなく帰宅交通も比較しましょう。", "チケット制の場合はキャンセル、返金、雨天基準を確認しましょう。", "現地決済が多い場合はカードやモバイル決済の可否を確認しましょう。"],
        faqTitle: "よくある質問", faqs: [["いつ行くのが良いですか？", `${title}は${period}を基準に計画し、プログラム別時間表を確認してください。`], ["予約は必要ですか？", `料金情報は「${fee}」です。事前予約や現地発券の有無は公式案内で確認してください。`], ["雨が降る場合は？", "屋外祭りは内容が変わることがあります。雨具と屋内代替コースを準備しましょう。"], ["車で行けますか？", "臨時駐車場や交通規制がある場合があります。公共交通とシャトルも確認しましょう。"]]
      }
    };
  }

  if (state.language === "zh") {
    return {
      sections: [
        { title: "节庆核心摘要", body: [`${localizedSummary(article)} 本文不是简单列出活动名称，而是围绕出发前需要确认的日程、交通、预订和现场使用信息整理的指南。`, `${category} 的体验会受到人流、交通管制和餐饮摊位排队时间影响。先确定出行目的、同行人员和交通方式，再安排到场时间会更稳妥。`] },
        { title: "适合哪些游客", body: ["想拍照的游客建议在日落前到达，先整体浏览会场。家庭游客应先确认洗手间、阴凉处、休息区和婴儿车路线。", "情侣或朋友出行可围绕演出时间和餐饮摊位营业时间安排。独自出行则适合在人少的早些时候先看展览和体验项目。"] },
        { title: "交通与现场动线", body: [`${location} 周边在活动当天可能拥挤。自驾游客要确认临时停车场和步行距离，公共交通游客应提前规划返程。`, "到达后先确认入口、咨询处、洗手间、主舞台和餐饮区位置。热门演出、烟花或巡游开始前约30分钟可能难以移动。"] },
        { title: "住宿与预订前检查", body: ["如需住宿，不要只看会场附近，也要比较活动结束后交通方便的住宿。入住时间、免费取消期限和停车条件同样重要。", "如需门票，请确认是手机票还是现场取票。雨天取消、部分退款和时段变更规则也应提前查看。"] },
        { title: "餐饮与随身物品", body: ["美食节或夜市型活动中，热门摊位排队时间可能较长。如果以用餐为主，建议避开正餐高峰。", "户外节庆建议携带充电宝、水、薄外套、湿巾、小垫子和折叠伞。夏季要准备防晒，冬季可准备手套或暖宝宝。"] },
        { title: "下雨或人多时", body: ["如预报有雨，请查看官网或社交媒体公告，并准备附近室内景点或咖啡馆作为备选。", "人流较大时，与其全部看完，不如选定1到2个重点项目减少移动。带孩子时建议靠近出口和休息区。"] }
      ],
      checklist: ["确认开始、结束和最后入场时间", "确认末班公共交通或临时接驳车", "确认雨天取消或缩小运营规则", "确认门票预订、现场取票和退款期限", "确认停车场位置和步行距离", "先确认洗手间、咨询处和休息区", "热门演出或巡游提前30分钟移动", "准备至少一个附近餐厅或咖啡馆备选"],
      visitPlan: [["出发前", "确认官方公告、运营时间、入场方式和雨天通知。"], ["到达后", "先找到咨询处、洗手间、主舞台和餐饮区。"], ["游览中", "围绕1到2个重点项目减少不必要移动。"], ["离开前", "再次确认返程交通、停车场出车路线和周边拥挤区域。"]],
      practicalCards: [["交通", "确认活动当天交通管制和临时停车场。"], ["住宿", "不仅看距离，也要比较活动结束后的返程便利性。"], ["门票", "确认手机票、现场取票、取消期限和雨天退款规则。"], ["准备物品", "准备水、充电宝、薄外套和雨具，方便长时间停留。"]],
      reader: { title: "游客最关心的信息", desc: "按照选择节庆时常见的问题整理核心内容。", items: [["什么时候去好？", `${period} 期间演出和体验时间可能不同。请先确认重点项目，并提前约30分钟到达。`], ["应该去哪里？", `以 ${place} 为基准规划路线。如果会场分多个区域，请先确认主入口和咨询处。`], ["需要门票吗？", `费用信息为“${fee}”。即使免费，体验、座位、周边、停车也可能另收费。`], ["运营到几点？", `以 ${time} 为基准确认。摊位和演出的结束时间可能不同。`], ["可以开车去吗？", article.address ? "会场周边可能拥挤，请确认临时停车、接驳车和末班交通。" : "如详细地点未确定，请先查看官方停车和接驳公告。"], ["适合带孩子吗？", "家庭出行请先确认洗手间、哺乳室、阴凉处、休息区和婴儿车路线。"], ["下雨怎么办？", "户外项目可能取消或变更地点，请查看雨天公告并准备室内备选路线。"], ["需要带什么？", "充电宝、水、薄外套、雨具、湿巾和小垫子会很实用。"]] },
      rich: {
        planningTitle: "出发前详细检查", planningDesc: `前往 ${title} 前，不要只看照片和氛围，也要确认日程、地点、运营时间和费用。`, guideRows: [["日程", period, "多日节庆每天项目可能不同，请确认计划前往日期的安排。"], ["地点", place, "会场可能较大或分区，请确认主入口或停车场位置。"], ["运营时间", time, "整体运营时间和单个项目时间可能不同。"], ["费用", fee, "免费活动也可能对体验、座位、停车和餐饮另收费。"]],
        companionTitle: "按同行类型的游览建议", companionDesc: "同行对象不同，合适路线也会不同。", companionTips: [["家庭", "先确认洗手间、休息区、阴凉处，减少长距离步行。"], ["情侣·朋友", "先选好适合拍照的时间和餐饮摊位位置。"], ["独自出行", "在人少的时段先看展览或体验，并提前确认返程交通。"], ["一日游", "只选1到2个重点项目，并准备附近餐饮或咖啡馆备选。"]],
        budgetTitle: "预算与预订检查", budgetDesc: "节庆费用通常不只门票，还包括交通、停车、餐饮、体验和住宿。", budgetItems: ["免费节庆也可能对热门体验、座位、周边或餐饮收费。", "需要住宿时，除了距离也要比较返程路线。", "门票制活动要确认取消、退款和雨天规则。", "现场消费较多时，提前确认银行卡或手机支付是否可用。"],
        faqTitle: "常见问题", faqs: [["什么时候去最好？", `${title} 可按 ${period} 规划，但请确认各项目时间表。`], ["需要预约吗？", `费用信息为“${fee}”。是否需要预订或现场购票请以官方说明为准。`], ["下雨怎么办？", "户外节庆可能变更项目，请准备雨具和室内备选路线。"], ["可以自驾吗？", "可能有临时停车和交通管制，请同时确认公共交通和接驳车信息。"]]
      }
    };
  }

  return {
    sections: [
      { title: "축제 핵심 요약", body: [`${article.summary} 이 글은 단순히 행사명을 나열하는 것이 아니라, 실제 방문 전에 확인해야 할 일정, 이동, 예약, 현장 이용 기준을 중심으로 정리한 정보성 가이드입니다.`, `${category} 콘텐츠는 분위기만 보고 결정하면 현장 혼잡, 교통 통제, 식사 대기 때문에 만족도가 떨어질 수 있습니다. 먼저 방문 목적과 동행자, 이동 수단을 정한 뒤 축제 시간을 맞추는 방식이 안정적입니다.`] },
      { title: "이 축제가 잘 맞는 방문자", body: ["사진을 많이 남기고 싶은 여행자라면 해가 지기 전 도착해 행사장 전체를 먼저 둘러보는 동선이 좋습니다. 가족 단위라면 화장실, 그늘, 휴식 공간, 유모차 이동 가능 구간을 먼저 확인해야 합니다.", "커플이나 친구 여행이라면 공연 시간과 먹거리 부스 운영 시간을 중심으로 움직이는 편이 좋고, 혼자 방문한다면 혼잡도가 낮은 이른 시간대에 전시형 콘텐츠부터 보는 흐름이 효율적입니다."] },
      { title: "교통과 현장 동선", body: [`${location}은 행사 당일 교통량이 늘 수 있으므로 자가용 이용자는 임시 주차장 위치와 행사장까지의 도보 거리를 같이 확인해야 합니다. 대중교통 이용자는 막차 시간보다 한두 편 앞선 시간을 기준으로 귀가 계획을 잡는 편이 안전합니다.`, "축제장에 도착하면 입구, 안내 부스, 화장실, 주요 공연장, 먹거리 구역의 위치를 먼저 파악하세요. 인기 공연이나 불꽃·퍼레이드형 프로그램은 시작 30분 전부터 이동이 어려워질 수 있습니다."] },
      { title: "숙소와 예약 전 체크", body: ["숙박이 필요한 축제라면 행사장 바로 앞 숙소만 고집하기보다, 축제 종료 후 이동 가능한 교통축 안에 있는 숙소를 함께 비교하는 것이 좋습니다. 체크인 시간, 무료 취소 마감, 주차 가능 여부도 가격만큼 중요합니다.", "입장권이 있는 행사는 모바일 티켓인지 현장 수령인지 확인해야 합니다. 우천 취소, 부분 환불, 시간대 변경 가능 여부도 방문 전 반드시 봐야 하는 항목입니다."] },
      { title: "먹거리와 준비물", body: ["지역 먹거리 축제나 야시장형 행사는 인기 부스 대기 시간이 길어질 수 있습니다. 식사 목적이라면 점심 직후나 저녁 피크 전처럼 사람이 몰리기 전 시간대를 활용하는 편이 좋습니다.", "야외 축제는 보조배터리, 얇은 겉옷, 작은 돗자리, 물티슈, 휴대용 우산을 준비하면 현장 대응이 편합니다. 여름에는 생수와 자외선 차단, 겨울에는 장갑과 핫팩처럼 계절 준비물도 함께 챙겨야 합니다."] },
      { title: "비가 오거나 사람이 많을 때", body: ["비 예보가 있다면 공식 홈페이지나 SNS에서 우천 운영 공지를 확인하고, 주변 실내 관광지나 카페를 대체 코스로 준비하세요. 야외 무대는 취소되지 않아도 일부 체험 부스는 운영 시간이 바뀔 수 있습니다.", "혼잡도가 높다면 모든 프로그램을 보려 하기보다 핵심 프로그램 1~2개를 정해 이동 동선을 줄이는 편이 좋습니다. 아이와 함께라면 출구와 휴식 공간 가까운 위치에서 관람하는 것이 안전합니다."] }
    ],
    checklist: ["행사 시작·종료 시간과 마지막 입장 시간을 확인하기", "대중교통 막차 또는 임시 셔틀 운행 여부 확인하기", "우천 시 취소·축소 운영 기준 확인하기", "입장권 예매, 현장 수령, 환불 마감 시간 확인하기", "주차장 위치와 행사장까지 도보 이동 거리 확인하기", "화장실, 안내 부스, 휴식 공간 위치를 먼저 확인하기", "인기 공연이나 퍼레이드는 시작 30분 전 이동 완료하기", "주변 식당과 카페 대체 동선을 1곳 이상 준비하기"],
    visitPlan: [["방문 전", "공식 안내, 운영 시간, 입장 방식, 우천 공지를 확인합니다."], ["도착 직후", "안내 부스, 화장실, 주요 무대, 먹거리 구역 위치를 먼저 파악합니다."], ["관람 중", "핵심 프로그램 1~2개를 중심으로 이동 동선을 줄입니다."], ["귀가 전", "막차 시간, 주차장 출차 동선, 주변 혼잡 구간을 다시 확인합니다."]],
    practicalCards: [["교통", "행사 당일 교통 통제와 임시 주차장 운영 여부를 확인하세요."], ["숙소", "행사장과 거리뿐 아니라 축제 종료 후 이동 가능성을 같이 비교하세요."], ["입장권", "모바일 티켓, 현장 수령, 취소 마감, 우천 환불 기준을 확인하세요."], ["준비물", "보조배터리, 생수, 얇은 겉옷, 우산처럼 현장 체류에 필요한 물품을 챙기세요."]],
    reader: { title: "방문자가 가장 궁금해하는 정보", desc: "축제를 고를 때 많이 확인하는 질문을 기준으로 핵심 내용을 정리했습니다.", items: [["언제 가면 좋을까?", `${period} 일정 안에서도 공연과 체험 시간이 다를 수 있습니다. 핵심 프로그램 시간을 먼저 확인하고 그 시간보다 30분 정도 여유 있게 도착하는 편이 좋습니다.`], ["어디로 가야 할까?", `${place} 기준으로 이동 계획을 잡되, 축제장이 여러 구역이면 메인 입구와 안내 부스 위치를 먼저 확인하세요.`], ["입장료가 있을까?", `${fee}로 안내됩니다. 무료 축제라도 체험, 좌석, 굿즈, 주차는 별도 비용이 생길 수 있습니다.`], ["몇 시까지 운영할까?", `${time} 기준으로 확인됩니다. 부스와 공연은 마감 시간이 다를 수 있어 늦게 방문한다면 개별 프로그램 시간을 확인하세요.`], ["차를 가져가도 될까?", article.address ? "행사장 주변은 당일 혼잡할 수 있으므로 임시 주차장, 셔틀, 대중교통 막차 시간을 함께 확인하세요." : "상세 위치가 확정되지 않은 경우 공식 안내의 주차장·셔틀 공지를 먼저 확인하세요."], ["아이와 가도 괜찮을까?", "가족 방문이라면 화장실, 수유실, 그늘, 휴식 공간, 유모차 이동 가능 구간을 먼저 확인하는 것이 좋습니다."], ["비가 오면 어떻게 될까?", "야외 축제는 우천 시 일부 프로그램이 취소되거나 장소가 바뀔 수 있습니다. 우천 공지와 실내 대체 코스를 함께 준비하세요."], ["무엇을 챙기면 좋을까?", "보조배터리, 생수, 얇은 겉옷, 우비 또는 접이식 우산, 물티슈, 작은 돗자리처럼 오래 머무를 때 필요한 물품을 챙기면 편합니다."]] },
    rich: {
      planningTitle: "방문 전 핵심 정보 자세히 보기", planningDesc: `${title}을 방문하기 전에는 사진이나 분위기만 보기보다 일정, 장소, 운영 시간, 요금 정보를 함께 확인해야 합니다. 아래 표는 실제 방문 계획을 세울 때 우선적으로 확인할 항목을 정리한 내용입니다.`, guideRows: [["일정 확인", period, "시작일과 종료일이 여러 날인 축제는 날짜별 프로그램이 다를 수 있습니다. 방문하려는 날짜의 공연·체험 운영 여부를 따로 확인하세요."], ["장소 확인", place, "행사장이 넓거나 여러 구역으로 나뉘는 경우가 있습니다. 내비게이션 목적지는 메인 입구나 임시 주차장 기준으로 다시 확인하는 것이 좋습니다."], ["운영 시간", time, "축제 전체 운영 시간과 개별 프로그램 시간이 다를 수 있습니다. 인기 공연, 퍼레이드, 체험 부스는 마감 시간이 빠를 수 있습니다."], ["요금 정보", fee, "무료 행사라도 일부 체험, 좌석, 주차, 먹거리 이용은 별도 비용이 있을 수 있습니다. 현장 결제 수단도 함께 확인하세요."]],
      companionTitle: "동행자별 추천 방문 팁", companionDesc: "같은 축제라도 누구와 방문하느냐에 따라 좋은 동선이 달라집니다. 가족, 친구, 커플, 혼자 방문하는 경우를 나눠 준비하면 현장 체류 시간이 더 편해집니다.", companionTips: [["가족 방문", "화장실, 수유실, 그늘, 휴식 공간 위치를 먼저 확인하고 오래 걷는 동선을 줄이는 편이 좋습니다."], ["커플·친구", "사진을 남기기 좋은 시간대와 먹거리 부스 위치를 먼저 잡으면 짧은 시간에도 만족도가 높습니다."], ["혼자 방문", "혼잡도가 낮은 시간에 전시·체험형 콘텐츠부터 보고, 귀가 교통을 먼저 확보하는 방식이 안정적입니다."], ["당일치기", "핵심 프로그램 1~2개만 정하고 이동 시간을 줄이세요. 축제장 밖 식사·카페 대체 코스도 함께 준비하면 좋습니다."]],
      budgetTitle: "예산과 예약 체크", budgetDesc: "축제 방문 비용은 입장권만으로 끝나지 않는 경우가 많습니다. 교통비, 주차비, 식사비, 체험비, 숙박비가 함께 발생할 수 있으므로 당일치기와 1박 일정의 예산을 나눠 보는 것이 좋습니다.", budgetItems: ["무료 축제라도 인기 체험, 좌석, 굿즈, 먹거리 구매는 별도 비용이 들 수 있습니다.", "숙박이 필요하다면 행사장과 가까운 숙소보다 귀가 교통이 편한 위치를 함께 비교하세요.", "입장권 예매가 필요한 축제는 취소 마감 시간, 부분 환불, 우천 변경 기준을 먼저 확인하세요.", "현장 결제가 많은 축제는 카드 결제 가능 여부와 모바일 결제 가능 여부를 미리 확인하면 좋습니다."],
      faqTitle: "자주 묻는 질문", faqs: [["이 축제는 언제 가는 것이 좋나요?", `${title}은 공식 일정 기준으로 ${period}에 맞춰 방문 계획을 잡는 것이 좋습니다. 다만 프로그램별 시간표가 다를 수 있으므로 방문 전 최신 공지를 확인하세요.`], ["입장권이나 예약이 필요한가요?", `요금 정보는 "${fee}"로 확인됩니다. 사전 예매, 현장 발권, 무료 입장 여부는 축제별로 다르므로 공식 안내에서 최종 확인하는 것이 안전합니다.`], ["비가 오면 어떻게 해야 하나요?", "야외 축제는 우천 시 일부 프로그램이 변경될 수 있습니다. 우산보다 우비가 이동에 편하고, 실내 대체 코스나 근처 휴식 공간을 미리 정해두면 일정 변경이 쉽습니다."], ["차를 가져가도 괜찮나요?", "축제 당일에는 임시 주차장과 교통 통제가 생길 수 있습니다. 가능하면 대중교통과 셔틀 정보를 함께 확인하고, 자가용 이용 시 출차 동선까지 고려하세요."]]
    }
  };
}

function localFacts(article) {
  return [
    ["분류", article.category],
    ["업데이트", article.date],
    ["읽는 시간", article.readTime],
    ["체크 포인트", "일정·교통·예약"]
  ];
}

function translateFactLabel(label) {
  const map = {
    "일정": "fact.schedule",
    "장소": "fact.place",
    "운영 시간": "fact.hours",
    "이용 요금": "fact.fee",
    "분류": "fact.category",
    "업데이트": "fact.updated",
    "읽는 시간": "fact.readTime",
    "체크 포인트": "fact.checkPoint"
  };
  return map[label] ? textFor(map[label]) : label;
}

function translateFactValue(label, value) {
  if (label === "체크 포인트") return textFor("fact.checkValue");
  if (value === "일정 확인 필요") return textFor("date.needCheck");
  if (value === "장소 확인 필요") return textFor("place.needCheck");
  if (value === "공식 안내 확인") return textFor("official.check");
  return value;
}

function displayArticleCategory(article) {
  return article.source === "tour" || String(article.id || "").startsWith("tour-")
    ? textFor("category.festival")
    : localizedCategoryLabel(article.category);
}

function localizedSummary(article) {
  if (state.language === "ko") return article.summary;
  return textFor("summary.localized", { title: localizedEventReference(article) });
}

function localizedArticleTitle(article) {
  if (state.language === "ko") return article.title;
  const category = String(article.category || article.subCategory || article.rawCategory || "");
  const key = category.includes("전시") ? "exhibition"
    : category.includes("공연") || category.includes("클래식") || category.includes("연극") || category.includes("콘서트") || category.includes("무용") || category.includes("국악") || category.includes("뮤지컬") ? "performance"
    : category.includes("교육") || category.includes("체험") ? "experience"
    : category.includes("영화") ? "movie"
    : category.includes("축제") ? "festival"
    : "event";
  const table = {
    en: {
      exhibition: "Seoul Exhibition Guide",
      performance: "Seoul Performance Guide",
      experience: "Seoul Culture Experience Guide",
      movie: "Seoul Film Event Guide",
      festival: "Seoul Festival Guide",
      event: "Seoul Event Guide"
    },
    ja: {
      exhibition: "ソウル展示ガイド",
      performance: "ソウル公演ガイド",
      experience: "ソウル文化体験ガイド",
      movie: "ソウル映画イベントガイド",
      festival: "ソウル祭りガイド",
      event: "ソウルイベントガイド"
    },
    zh: {
      exhibition: "首尔展览指南",
      performance: "首尔演出指南",
      experience: "首尔文化体验指南",
      movie: "首尔电影活动指南",
      festival: "首尔节庆指南",
      event: "首尔活动指南"
    }
  };
  return (table[state.language] || table.en)[key];
}

function localizedEventReference(article) {
  if (state.language === "ko") return article.title;
  const table = {
    en: "this Seoul event",
    ja: "このソウルイベント",
    zh: "这项首尔活动"
  };
  return table[state.language] || article.title;
}

function localizedCategoryLabel(category = "") {
  const value = String(category || "").trim();
  const key = value.includes("전시") ? "exhibition"
    : value.includes("공연") || value.includes("클래식") || value.includes("연극") || value.includes("콘서트") || value.includes("무용") || value.includes("국악") || value.includes("뮤지컬") ? "performance"
    : value.includes("교육") || value.includes("체험") ? "experience"
    : value.includes("영화") ? "movie"
    : value.includes("축제") ? "festival"
    : "event";
  const table = {
    ko: {
      exhibition: "전시/미술",
      performance: "공연/무대",
      experience: "교육/체험",
      movie: "영화",
      festival: "축제",
      event: value || "서울 행사"
    },
    en: {
      exhibition: "Exhibitions",
      performance: "Performances",
      experience: "Classes & Experiences",
      movie: "Film",
      festival: "Festivals",
      event: "Seoul Events"
    },
    ja: {
      exhibition: "展示・美術",
      performance: "公演・舞台",
      experience: "教育・体験",
      movie: "映画",
      festival: "祭り",
      event: "ソウルイベント"
    },
    zh: {
      exhibition: "展览/美术",
      performance: "演出/舞台",
      experience: "教育/体验",
      movie: "电影",
      festival: "庆典",
      event: "首尔活动"
    }
  };
  return (table[state.language] || table.ko)[key];
}

function detailSections(article) {
  return detailPostCopy(article).sections;
}

function renderFactGrid(facts) {
  return facts
    .filter(([, value]) => value)
    .map(([label, value]) => `
      <div class="fact-card">
        <span>${escapeHtml(translateFactLabel(label))}</span>
        <strong>${escapeHtml(stripHtml(translateFactValue(label, value)))}</strong>
      </div>
    `)
    .join("");
}

function renderImageGallery(article) {
  const images = imageListForArticle(article)
    .filter((image) => image && image !== article.image)
    .slice(0, 24);

  if (!images.length) return "";

  return `
    <section class="api-image-gallery" aria-labelledby="apiImageGalleryTitle">
      <div class="gallery-heading">
        <p class="eyebrow">${escapeHtml(textFor("gallery.eyebrow"))}</p>
        <h2 id="apiImageGalleryTitle">${escapeHtml(textFor("gallery.title"))}</h2>
        <p>${escapeHtml(textFor("gallery.desc"))}</p>
      </div>
      <div class="api-image-grid">
        ${images.map((image, index) => `
          <figure>
            <img src="${escapeHtml(image)}" alt="${escapeHtml(textFor("gallery.alt", { title: article.title, index: index + 1 }))}" loading="lazy" />
          </figure>
        `).join("")}
      </div>
    </section>
  `;
}

function renderChecklist() {
  const items = detailPostCopy(state.article || findLocalArticle()).checklist;

  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderSection(section) {
  const body = Array.isArray(section.body) ? section.body : [section.body];

  return `
    <section>
      <h2>${escapeHtml(section.title)}</h2>
      ${body.map((paragraph) => `<p>${escapeHtml(stripHtml(paragraph))}</p>`).join("")}
    </section>
  `;
}

function renderVisitPlan(article) {
  const items = detailPostCopy(article).visitPlan;

  return `
    <section class="timeline-section">
      <h2>${escapeHtml(state.language === "ko" ? "추천 방문 흐름" : state.language === "ja" ? "おすすめの訪問フロー" : state.language === "zh" ? "推荐游览流程" : "Suggested Visit Flow")}</h2>
      <ol>
        ${items.map(([label, text]) => `
          <li>
            <span>${escapeHtml(label)}</span>
            <p>${escapeHtml(text)}</p>
          </li>
        `).join("")}
      </ol>
    </section>
  `;
}

function renderPracticalCards(article) {
  const cards = detailPostCopy(article).practicalCards;

  return `
    <section class="practical-grid" aria-label="축제 실전 정보">
      ${cards.map(([title, text]) => `
        <article>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(text)}</p>
        </article>
      `).join("")}
    </section>
  `;
}

function factValue(article, keyword, fallback = "") {
  const facts = article.facts || localFacts(article);
  const match = facts.find(([label]) => String(label).includes(keyword));
  return match ? stripHtml(match[1]) : fallback;
}

function renderReaderQuestionSection(article) {
  const reader = detailPostCopy(article).reader;

  return `
    <section class="reader-question-section">
      <p class="eyebrow">Reader Questions</p>
      <h2>${escapeHtml(reader.title)}</h2>
      <p>${escapeHtml(reader.desc)}</p>
      <div class="reader-question-grid">
        ${reader.items.map(([question, answer]) => `
          <article>
            <h3>${escapeHtml(question)}</h3>
            <p>${escapeHtml(answer)}</p>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderRichInfoSection(article) {
  const rich = detailPostCopy(article).rich;

  return `
    <section class="rich-info-section">
      <p class="eyebrow">Planning Notes</p>
      <h2>${escapeHtml(rich.planningTitle)}</h2>
      <p>${escapeHtml(rich.planningDesc)}</p>
      <div class="info-table">
        ${rich.guideRows.map(([label, value, note]) => `
          <article>
            <strong>${escapeHtml(label)}</strong>
            <span>${escapeHtml(value)}</span>
            <p>${escapeHtml(note)}</p>
          </article>
        `).join("")}
      </div>
    </section>

    <section class="rich-info-section">
      <p class="eyebrow">By Traveler</p>
      <h2>${escapeHtml(rich.companionTitle)}</h2>
      <p>${escapeHtml(rich.companionDesc)}</p>
      <div class="companion-grid">
        ${rich.companionTips.map(([label, text]) => `
          <article>
            <h3>${escapeHtml(label)}</h3>
            <p>${escapeHtml(text)}</p>
          </article>
        `).join("")}
      </div>
    </section>

    <section class="rich-info-section">
      <p class="eyebrow">Cost & Booking</p>
      <h2>${escapeHtml(rich.budgetTitle)}</h2>
      <p>${escapeHtml(rich.budgetDesc)}</p>
      <ul class="article-note-list">
        ${rich.budgetItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </section>

    <section class="rich-info-section faq-block">
      <p class="eyebrow">FAQ</p>
      <h2>${escapeHtml(rich.faqTitle)}</h2>
      ${rich.faqs.map(([question, answer]) => `
        <details>
          <summary>${escapeHtml(question)}</summary>
          <p>${escapeHtml(answer)}</p>
        </details>
      `).join("")}
    </section>
  `;
}

function updateDocumentMeta(article) {
  const title = localizedArticleTitle(article);
  document.title = `${title} | ${textFor("meta.suffix")}`;
  const description = document.querySelector('meta[name="description"]');
  if (description) {
    description.setAttribute("content", textFor("meta.description", { title }).slice(0, 150));
  }
}

async function hydrateAiGuide(article) {
  const section = $("#aiGuideSection");
  const content = $("#aiGuideContent");
  if (!section || !content) return false;

  try {
    const response = await fetch("/api/festival-ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contentId: article.contentId || article.id,
        language: state.language,
        title: article.title,
        category: article.category,
        summary: article.summary,
        date: article.date,
        address: article.address || "",
        facts: (article.facts || localFacts(article)).map(([label, value]) => `${label}: ${stripHtml(value)}`)
      })
    });

    if (!response.ok) throw new Error(`AI guide ${response.status}`);

    const payload = await response.json();
    const sections = Array.isArray(payload.sections) ? payload.sections : [];
    const tips = Array.isArray(payload.tips) ? payload.tips : [];
    if (!sections.length && !tips.length) return false;

    content.innerHTML = `
      ${sections.map((item) => `
        <article>
          <h3>${escapeHtml(item.title || "방문 포인트")}</h3>
          <p>${escapeHtml(item.body || "")}</p>
        </article>
      `).join("")}
      ${tips.length ? `
        <ul>
          ${tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}
        </ul>
      ` : ""}
    `;
    section.hidden = false;
    return true;
  } catch (error) {
    console.info("AI guide is not available.", error);
    return false;
  }
}

function bindAiGuide(article) {
  const button = $("#aiGuideButton");
  const content = $("#aiGuideContent");
  if (!button || !content) return;

  button.addEventListener("click", async () => {
    if (button.dataset.loading === "true") return;

    button.dataset.loading = "true";
    button.disabled = true;
    button.textContent = textFor("guide.loading");
    content.textContent = "";

    const loaded = await hydrateAiGuide(article);

    button.dataset.loading = "false";
    button.disabled = false;
    button.textContent = loaded ? textFor("guide.reload") : textFor("guide.retry");
  });
}

function travelRegionName(article) {
  const address = String(article.address || "");
  const first = address.split(" ")[0];
  if (first) {
    return first
      .replace("특별시", "")
      .replace("광역시", "")
      .replace("특별자치시", "")
      .replace("특별자치도", "")
      .replace("도", "");
  }

  const category = String(article.category || "");
  return category.replace("축제", "").trim() || "국내";
}

const DETAIL_DESTINATION_HINTS = [
  "강남", "강남구", "강동", "강동구", "강북", "강북구", "강서", "강서구",
  "관악", "관악구", "광진", "광진구", "구로", "구로구", "금천", "금천구",
  "노원", "노원구", "도봉", "도봉구", "동대문", "동대문구", "동작", "동작구",
  "마포", "마포구", "서대문", "서대문구", "서초", "서초구", "성동", "성동구",
  "성북", "성북구", "송파", "송파구", "양천", "양천구", "영등포", "영등포구",
  "용산", "용산구", "은평", "은평구", "종로", "종로구", "중구", "중랑", "중랑구",
  "코엑스", "잠실", "롯데월드", "한강", "여의도", "홍대", "명동", "광화문",
  "경복궁", "덕수궁", "창경궁", "창덕궁", "남산", "서울숲", "DDP", "동대문",
  "북촌", "서촌", "익선동", "성수", "연남", "이태원", "압구정", "망원",
  "세종문화회관", "예술의전당", "국립중앙박물관", "서울시립미술관", "국립극장"
];

const DETAIL_LANDMARK_HINTS = [
  "세종문화회관", "예술의전당", "국립중앙박물관", "서울시립미술관", "국립극장",
  "코엑스", "롯데월드", "경복궁", "덕수궁", "창경궁", "창덕궁", "한강",
  "여의도", "광화문", "서울숲", "DDP", "북촌", "서촌", "익선동", "남산"
];

function detailDestinationKeyword(article = {}) {
  const text = [
    article.address,
    article.place,
    article.title,
    article.category,
    article.rawCategory,
    article.subCategory
  ].filter(Boolean).join(" ")
    .replace(/서울특별시|서울시|서울/g, " ")
    .replace(/[()[\]{}"'“”‘’]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const landmark = DETAIL_LANDMARK_HINTS.find((item) => text.includes(item));
  if (landmark) return landmark;
  const districtMatch = text.match(/[가-힣]{1,6}구/);
  if (districtMatch) return districtMatch[0];
  const hint = DETAIL_DESTINATION_HINTS.find((item) => text.includes(item));
  return hint || travelRegionName(article) || "서울";
}

function detailTourSearchKeyword(article = {}) {
  const keyword = detailDestinationKeyword(article);
  const text = [
    article.title,
    article.category,
    article.rawCategory,
    article.subCategory,
    article.summary
  ].filter(Boolean).join(" ");
  if (/공연|무대|콘서트|뮤지컬|오페라|연극|국악|클래식|발레|독주/.test(text)) return `${keyword} 공연`;
  if (/전시|미술|박물관|미술관|갤러리|아트/.test(text)) return `${keyword} 전시`;
  if (/궁|궁궐|고궁|전통|역사|덕수궁|경복궁|창덕궁|창경궁/.test(text)) return `${keyword} 궁궐 투어`;
  if (/어린이|키즈|가족|체험|교육/.test(text)) return `${keyword} 키즈 체험`;
  return `${keyword} 입장권`;
}

const SEOUL_NEARBY_TRAVEL_DEFAULTS = [
  ["광화문광장", "도심 산책", "행사 전후로 서울 도심 분위기를 짧게 둘러보기 좋습니다."],
  ["청계천", "가벼운 산책", "이동 시간이 길지 않아 저녁 일정 사이에 넣기 좋습니다."],
  ["덕수궁 돌담길", "사진 코스", "짧은 도보 코스로 분위기 있는 사진을 남기기 좋습니다."]
];

const SEOUL_NEARBY_TRAVEL_BY_DISTRICT = {
  강남구: [
    ["코엑스 별마당도서관", "실내 여행", "전시·공연 전후로 쉬어가기 좋은 대표 실내 코스입니다."],
    ["봉은사", "도심 사찰", "강남 한복판에서 조용히 산책하기 좋은 장소입니다."],
    ["선정릉", "역사 산책", "복잡한 도심 일정 사이에 녹지와 역사 공간을 함께 볼 수 있습니다."]
  ],
  강동구: [
    ["암사동 선사유적지", "역사 여행", "가족 방문객이 함께 둘러보기 좋은 체험형 역사 코스입니다."],
    ["광나루한강공원", "한강 산책", "행사 후 강변 산책이나 야경 코스로 연결하기 좋습니다."],
    ["일자산 허브천문공원", "자연 산책", "가볍게 걷기 좋은 강동권 녹지 코스입니다."]
  ],
  강북구: [
    ["북서울꿈의숲", "공원 산책", "가족과 함께 쉬어가기 좋은 넓은 공원 코스입니다."],
    ["우이동 계곡길", "자연 코스", "여름철 짧은 자연 산책을 곁들이기 좋습니다."],
    ["4.19민주묘지", "역사 여행", "조용한 분위기에서 의미 있는 산책을 하기 좋습니다."]
  ],
  강서구: [
    ["서울식물원", "실내·정원", "날씨 영향을 덜 받아 행사 전후로 방문하기 좋습니다."],
    ["궁산근린공원", "전망 산책", "한강 방향 전망을 함께 볼 수 있는 짧은 산책 코스입니다."],
    ["마곡문화거리", "도심 산책", "식사와 카페까지 함께 묶기 좋은 마곡권 코스입니다."]
  ],
  관악구: [
    ["관악산 둘레길", "자연 산책", "행사 전후로 가볍게 걷기 좋은 관악권 대표 산책 코스입니다."],
    ["샤로수길", "맛집 거리", "공연이나 전시 후 식사와 카페를 함께 고르기 좋습니다."],
    ["서울대학교 미술관", "전시 코스", "관악구 일정에 문화 코스를 하나 더 붙이기 좋습니다."]
  ],
  광진구: [
    ["어린이대공원", "가족 여행", "아이와 함께라면 행사 전후로 들르기 좋은 대표 코스입니다."],
    ["아차산", "전망 산책", "가벼운 등산과 서울 전망을 함께 즐기기 좋습니다."],
    ["뚝섬한강공원", "한강 코스", "저녁 산책이나 자전거 코스로 연결하기 좋습니다."]
  ],
  구로구: [
    ["고척스카이돔", "도심 명소", "행사 일정과 야구·공연 일정을 함께 확인해 볼 만합니다."],
    ["푸른수목원", "자연 산책", "조용하게 걷기 좋은 서남권 수목원 코스입니다."],
    ["안양천 산책로", "가벼운 산책", "대중교통 이동 전후로 짧게 걷기 좋습니다."]
  ],
  금천구: [
    ["금천예술공장", "문화 공간", "전시와 창작 공간을 함께 둘러보기 좋은 코스입니다."],
    ["안양천 산책로", "가벼운 산책", "행사 후 걷기 좋은 하천 산책 코스입니다."],
    ["시흥행궁터", "역사 코스", "짧게 들르기 좋은 지역 역사 여행지입니다."]
  ],
  노원구: [
    ["서울시립과학관", "가족 체험", "아이와 함께라면 체험형 코스로 묶기 좋습니다."],
    ["불암산 힐링타운", "자연 산책", "북서울권에서 가볍게 자연을 느끼기 좋은 코스입니다."],
    ["화랑대 철도공원", "사진 코스", "감성적인 사진을 남기기 좋은 산책 장소입니다."]
  ],
  도봉구: [
    ["도봉산", "자연 여행", "반나절 자연 코스로 확장하기 좋은 대표 명소입니다."],
    ["서울창포원", "정원 산책", "도봉산역 근처에서 짧게 둘러보기 좋습니다."],
    ["평화문화진지", "문화 공간", "전시와 산책을 함께 엮기 좋은 장소입니다."]
  ],
  동대문구: [
    ["서울풍물시장", "전통 시장", "가볍게 구경하고 식사까지 연결하기 좋은 코스입니다."],
    ["청량리역 일대", "교통 거점", "다음 이동을 잡기 좋은 동북권 교통 중심지입니다."],
    ["홍릉숲", "자연 산책", "예약 가능 여부를 확인하고 방문하면 좋은 숲길 코스입니다."]
  ],
  동작구: [
    ["국립서울현충원", "역사 산책", "조용하고 넓은 산책로를 함께 둘러볼 수 있습니다."],
    ["노량진수산시장", "먹거리 코스", "행사 후 식사 일정으로 연결하기 좋습니다."],
    ["사육신공원", "한강 전망", "짧은 역사 산책과 전망을 함께 즐기기 좋습니다."]
  ],
  마포구: [
    ["경의선숲길", "산책 코스", "카페와 식사 동선이 좋아 행사 전후로 걷기 좋습니다."],
    ["홍대 걷고싶은거리", "도심 여행", "공연·전시 후 활기 있는 거리를 둘러보기 좋습니다."],
    ["망원한강공원", "한강 코스", "저녁 산책이나 피크닉 코스로 연결하기 좋습니다."]
  ],
  서대문구: [
    ["서대문형무소역사관", "역사 여행", "의미 있는 역사 코스로 함께 둘러보기 좋습니다."],
    ["안산자락길", "숲길 산책", "무리 없이 걷기 좋은 도심 숲길입니다."],
    ["연희동 카페거리", "카페 코스", "행사 후 쉬어가기 좋은 조용한 동네 코스입니다."]
  ],
  서초구: [
    ["예술의전당", "문화 공간", "전시와 공연 일정을 함께 확인하기 좋은 대표 문화 공간입니다."],
    ["반포한강공원", "야경 코스", "저녁 일정 뒤 한강 야경을 보러 가기 좋습니다."],
    ["서래마을", "식사·카페", "식사와 카페를 함께 고르기 좋은 동네 코스입니다."]
  ],
  성동구: [
    ["서울숲", "공원 산책", "행사 전후로 자연스럽게 걷기 좋은 대표 공원입니다."],
    ["성수 카페거리", "카페 코스", "사진과 카페 방문을 함께 잡기 좋습니다."],
    ["응봉산 팔각정", "전망 코스", "서울 야경을 짧게 보기 좋은 장소입니다."]
  ],
  성북구: [
    ["성북동 문화거리", "동네 여행", "갤러리와 카페를 함께 둘러보기 좋은 코스입니다."],
    ["길상사", "조용한 산책", "복잡한 일정 사이에 쉬어가기 좋은 장소입니다."],
    ["정릉", "역사 산책", "숲길과 조선 왕릉을 함께 볼 수 있습니다."]
  ],
  송파구: [
    ["석촌호수", "호수 산책", "공연·전시 후 가볍게 걷기 좋은 대표 산책 코스입니다."],
    ["롯데월드타워", "전망 명소", "식사, 쇼핑, 전망을 함께 묶기 좋습니다."],
    ["올림픽공원", "공원 여행", "넓은 녹지와 사진 포인트가 많아 여유 일정에 좋습니다."]
  ],
  양천구: [
    ["서서울호수공원", "공원 산책", "가볍게 쉬어가기 좋은 서남권 공원입니다."],
    ["목동 로데오거리", "식사·카페", "행사 후 식사와 카페 동선을 잡기 좋습니다."],
    ["안양천 생태공원", "산책 코스", "자전거와 산책 코스로 연결하기 좋습니다."]
  ],
  영등포구: [
    ["여의도한강공원", "한강 여행", "저녁 산책과 야경을 함께 즐기기 좋은 코스입니다."],
    ["더현대 서울", "실내 여행", "날씨가 좋지 않은 날에도 방문하기 쉬운 실내 코스입니다."],
    ["문래창작촌", "골목 여행", "작은 공방과 카페를 함께 둘러보기 좋습니다."]
  ],
  용산구: [
    ["국립중앙박물관", "전시 여행", "서울 대표 전시 코스로 반나절 일정에 좋습니다."],
    ["용산가족공원", "공원 산책", "박물관 관람 전후로 쉬어가기 좋습니다."],
    ["이촌한강공원", "한강 산책", "가볍게 강변을 걷고 마무리하기 좋은 코스입니다."]
  ],
  은평구: [
    ["은평한옥마을", "한옥 산책", "사진과 산책을 함께 즐기기 좋은 서울 한옥 코스입니다."],
    ["진관사", "전통 사찰", "북한산 자락의 조용한 사찰 코스입니다."],
    ["불광천", "가벼운 산책", "동네 산책과 카페를 함께 잡기 좋습니다."]
  ],
  종로구: [
    ["경복궁", "고궁 여행", "서울 대표 고궁으로 행사 전후에 함께 둘러보기 좋습니다."],
    ["북촌한옥마을", "한옥 산책", "사진을 남기기 좋은 골목 여행 코스입니다."],
    ["인사동", "전통 거리", "전시, 공예, 찻집을 함께 둘러보기 좋습니다."]
  ],
  중구: [
    ["덕수궁", "고궁 산책", "도심 행사 전후로 짧게 들르기 좋은 고궁입니다."],
    ["남산서울타워", "전망 명소", "저녁 일정 뒤 서울 야경을 보기 좋습니다."],
    ["서울시립미술관", "전시 코스", "도심 문화행사와 함께 보기 좋은 전시 공간입니다."]
  ],
  중랑구: [
    ["용마폭포공원", "공원 산책", "사진과 산책을 함께 즐기기 좋은 지역 명소입니다."],
    ["중랑천 산책로", "가벼운 산책", "행사 전후 부담 없이 걷기 좋은 코스입니다."],
    ["망우역사문화공원", "역사 산책", "조용히 걷기 좋은 역사 문화 공간입니다."]
  ]
};

const SEOUL_NEARBY_TRAVEL_BY_LANDMARK = {
  세종문화회관: [
    ["광화문광장", "도심 산책", "공연·전시 전후로 가장 자연스럽게 이어지는 도심 산책 코스입니다."],
    ["경복궁", "고궁 여행", "낮 일정이라면 고궁 관람과 함께 묶기 좋습니다."],
    ["청계천", "가벼운 산책", "저녁 시간에 부담 없이 걷기 좋은 도심 물길입니다."]
  ],
  코엑스: [
    ["별마당도서관", "실내 여행", "코엑스 안에서 바로 이어지는 대표 실내 명소입니다."],
    ["봉은사", "도심 사찰", "행사장과 가까워 짧게 산책하기 좋습니다."],
    ["선정릉", "역사 산책", "강남 도심에서 조용히 걷기 좋은 역사 공간입니다."]
  ],
  예술의전당: [
    ["서래마을", "식사·카페", "공연 전후 식사와 카페를 잡기 좋은 동네 코스입니다."],
    ["반포한강공원", "야경 코스", "저녁 공연 뒤 한강 야경 코스로 연결하기 좋습니다."],
    ["국립국악원", "문화 공간", "전통 공연과 전시 일정을 함께 확인해 볼 만합니다."]
  ],
  국립중앙박물관: [
    ["용산가족공원", "공원 산책", "박물관 바로 옆에서 쉬어가기 좋은 공원입니다."],
    ["이촌한강공원", "한강 산책", "관람 후 강변 산책으로 마무리하기 좋습니다."],
    ["한글박물관", "전시 코스", "같은 권역에서 함께 둘러보기 좋은 전시 공간입니다."]
  ],
  서울시립미술관: [
    ["덕수궁 돌담길", "사진 코스", "미술관 관람 뒤 자연스럽게 이어지는 산책로입니다."],
    ["정동길", "도심 산책", "조용한 카페와 근대 건축 분위기를 함께 볼 수 있습니다."],
    ["서울광장", "도심 명소", "시청 일대 행사나 계절 프로그램과 함께 보기 좋습니다."]
  ],
  국립극장: [
    ["남산서울타워", "전망 명소", "공연 전후 서울 전망과 야경을 함께 볼 수 있습니다."],
    ["남산골한옥마을", "전통 코스", "전통 문화 분위기를 함께 느끼기 좋습니다."],
    ["장충단공원", "가벼운 산책", "공연장 주변에서 짧게 걷기 좋은 코스입니다."]
  ],
  DDP: [
    ["동대문디자인플라자", "도심 명소", "전시와 야경을 함께 보기 좋은 동대문 대표 코스입니다."],
    ["청계천", "가벼운 산책", "동대문에서 도심 방향으로 이어지는 걷기 코스입니다."],
    ["흥인지문", "역사 산책", "짧게 서울 성곽 분위기를 느끼기 좋습니다."]
  ]
};

// Nearby recommendations are editorial place suggestions, not event records.
// Only use an image when the Tourism API search returned that place. Never
// substitute a generic nature, city, or culture image for an unmatched place.
const NEARBY_TRAVEL_IMAGE_BY_NAME = {
  "고척스카이돔": "https://tong.visitkorea.or.kr/cms/resource/29/3082829_image2_1.jpg",
  "푸른수목원": "https://tong.visitkorea.or.kr/cms/resource/46/3545146_image2_1.jpg",
  "안양천 산책로": "https://tong.visitkorea.or.kr/cms/resource/44/3540444_image2_1.jpg",
  "안양천 생태공원": "https://tong.visitkorea.or.kr/cms/resource/44/3540444_image2_1.jpg",
  "안양천": "https://tong.visitkorea.or.kr/cms/resource/44/3540444_image2_1.jpg",
  "청계천": "https://tong.visitkorea.or.kr/cms/resource/64/2794864_image2_1.jpg",
  "경복궁": "https://tong.visitkorea.or.kr/cms/resource/81/1075281_image2_1.jpg",
  "덕수궁": "https://tong.visitkorea.or.kr/cms/resource/91/3384991_image2_1.JPG",
  "어린이대공원": "https://tong.visitkorea.or.kr/cms/resource/61/3355161_image2_1.JPG",
  "국립중앙박물관": "https://tong.visitkorea.or.kr/cms/resource/52/3505552_image2_1.jpg",
  "DDP": "https://tong.visitkorea.or.kr/cms/resource/06/3539606_image2_1.jpg",
  "동대문디자인플라자": "https://tong.visitkorea.or.kr/cms/resource/06/3539606_image2_1.jpg"
};

function nearbyTravelImage(name = "") {
  const exactImage = Object.keys(NEARBY_TRAVEL_IMAGE_BY_NAME).find((key) => name.includes(key));
  return exactImage ? NEARBY_TRAVEL_IMAGE_BY_NAME[exactImage] : "";
}

function nearbyTravelCopy() {
  const table = {
    ko: {
      eyebrow: "Nearby Travel",
      title: "근처 여행지 추천",
      desc: (keyword) => `${keyword} 일정 전후로 함께 보기 좋은 서울 여행지를 정리했습니다. 이동 전에는 운영 시간과 휴무일을 한 번 더 확인하세요.`,
      map: "지도 보기"
    },
    en: {
      eyebrow: "Nearby Travel",
      title: "Nearby places to visit",
      desc: (keyword) => `These Seoul spots work well before or after visiting ${keyword}. Check opening hours before moving.`,
      map: "View map"
    },
    ja: {
      eyebrow: "Nearby Travel",
      title: "周辺のおすすめスポット",
      desc: (keyword) => `${keyword}の前後に立ち寄りやすいソウルのスポットです。移動前に営業時間を確認してください。`,
      map: "地図を見る"
    },
    zh: {
      eyebrow: "Nearby Travel",
      title: "附近推荐景点",
      desc: (keyword) => `这些首尔景点适合在前往 ${keyword} 前后顺路参观。出发前请确认开放时间。`,
      map: "查看地图"
    }
  };
  return table[state.language] || table.ko;
}

function nearbyTravelSearchText(article = {}) {
  return [
    article.address,
    article.place,
    article.title,
    article.category,
    article.rawCategory,
    article.subCategory
  ].filter(Boolean).join(" ");
}

function nearbyTravelDistrict(article = {}) {
  const text = nearbyTravelSearchText(article);
  const match = text.match(/[가-힣]{1,6}구/);
  return match ? match[0] : "";
}

function nearbyTravelPicks(article = {}) {
  const text = nearbyTravelSearchText(article);
  const landmark = Object.keys(SEOUL_NEARBY_TRAVEL_BY_LANDMARK).find((key) => text.includes(key));
  const district = nearbyTravelDistrict(article);
  const picks = SEOUL_NEARBY_TRAVEL_BY_LANDMARK[landmark]
    || SEOUL_NEARBY_TRAVEL_BY_DISTRICT[district]
    || SEOUL_NEARBY_TRAVEL_DEFAULTS;
  const title = String(article.title || "");

  return picks
    .filter(([name]) => !title.includes(name))
    .slice(0, 3);
}

function naverMapSearchUrl(query) {
  return `https://map.naver.com/p/search/${encodeURIComponent(query)}`;
}

function factValueByLabels(article, labels, fallback = "") {
  const facts = article.facts || localFacts(article);
  const list = Array.isArray(labels) ? labels : [labels];
  const match = facts.find(([label]) => list.some((item) => String(label).includes(item)));
  return match ? stripHtml(match[1]) : fallback;
}

function TravelSummaryBox(article) {
  const region = travelRegionName(article);
  const schedule = factValueByLabels(article, "일정", article.date || textFor("date.needCheck"));
  const place = factValueByLabels(article, "장소", article.address || textFor("place.needCheck"));

  return `
    <section class="travel-summary-box" aria-labelledby="travelSummaryTitle">
      <p class="eyebrow">Travel Summary</p>
      <h2 id="travelSummaryTitle">${escapeHtml(region)} 여행 요약</h2>
      <p>${escapeHtml(article.title)}은 ${escapeHtml(region)}에서 일정과 동선을 함께 확인하고 방문하면 좋은 여행 콘텐츠입니다. 사진만 보고 고르기보다 일정, 장소, 이동 방법, 현장 운영 정보를 함께 확인하면 당일 계획이 더 안정적입니다.</p>
      <div class="summary-point-grid">
        <article><span>지역</span><strong>${escapeHtml(region)}</strong></article>
        <article><span>일정</span><strong>${escapeHtml(schedule)}</strong></article>
        <article><span>장소</span><strong>${escapeHtml(place)}</strong></article>
      </div>
    </section>
  `;
}

function CourseTimeline(article) {
  const place = factValueByLabels(article, "장소", article.address || textFor("place.needCheck"));
  const schedule = factValueByLabels(article, "일정", article.date || textFor("date.needCheck"));
  const time = factValueByLabels(article, "운영", textFor("official.check"));
  const region = travelRegionName(article);
  const steps = [
    ["방문 전", `${schedule} 기준으로 날짜와 운영 여부를 먼저 확인합니다.`],
    ["도착", `${place} 주변 교통과 주차 가능 여부를 확인한 뒤 이동합니다.`],
    ["현장 관람", `${article.title}의 주요 프로그램과 사진 포인트를 먼저 둘러봅니다.`],
    ["마무리", `${region} 주변 맛집·카페나 가까운 산책 코스로 일정을 정리합니다.`]
  ];

  return `
    <section class="course-timeline" aria-labelledby="courseTimelineTitle">
      <p class="eyebrow">Course</p>
      <h2 id="courseTimelineTitle">코스 한눈에 보기</h2>
      <ol>
        ${steps.map(([label, text], index) => `
          <li>
            <span>${String(index + 1).padStart(2, "0")}</span>
            <div>
              <h3>${escapeHtml(label)}</h3>
              <p>${escapeHtml(text)}</p>
            </div>
          </li>
        `).join("")}
      </ol>
      <p class="timeline-note">운영 시간은 ${escapeHtml(time)} 기준으로 확인되며, 현장 상황에 따라 달라질 수 있습니다.</p>
    </section>
  `;
}

function TravelSummaryBox(article) {
  const region = travelRegionName(article);
  const schedule = article.date || textFor("date.needCheck");
  const place = article.address || textFor("place.needCheck");

  return `
    <section class="travel-summary-box" aria-labelledby="travelSummaryTitle">
      <p class="eyebrow">Travel Summary</p>
      <h2 id="travelSummaryTitle">${escapeHtml(region)} 여행 요약</h2>
      <p>방문 전에는 일정, 장소, 이동 방법을 먼저 확인하는 것이 좋습니다. 현장 운영 정보와 주변 교통을 함께 보면 일정 관리가 더 편합니다.</p>
      <div class="summary-point-grid">
        <article><span>지역</span><strong>${escapeHtml(region)}</strong></article>
        <article><span>일정</span><strong>${escapeHtml(schedule)}</strong></article>
        <article><span>장소</span><strong>${escapeHtml(place)}</strong></article>
      </div>
    </section>
  `;
}

function CourseTimeline(article) {
  const time = factValueByLabels(article, "운영", textFor("official.check"));
  const steps = [
    ["방문 전", "날짜와 운영 여부를 먼저 확인합니다."],
    ["이동", "대중교통과 주변 주차 정보를 확인합니다."],
    ["현장 관람", "현장 안내와 주요 프로그램을 확인합니다."],
    ["마무리", "주변 맛집이나 카페를 함께 둘러보면 좋습니다."]
  ];

  return `
    <section class="course-timeline" aria-labelledby="courseTimelineTitle">
      <p class="eyebrow">Course</p>
      <h2 id="courseTimelineTitle">코스 한눈에 보기</h2>
      <ol>
        ${steps.map(([label, text], index) => `
          <li>
            <span>${String(index + 1).padStart(2, "0")}</span>
            <div>
              <h3>${escapeHtml(label)}</h3>
              <p>${escapeHtml(text)}</p>
            </div>
          </li>
        `).join("")}
      </ol>
      <p class="timeline-note">운영 시간은 ${escapeHtml(time)} 기준으로 확인되며, 현장 상황에 따라 달라질 수 있습니다.</p>
    </section>
  `;
}

function SpotInfoCard(article) {
  const schedule = factValueByLabels(article, "일정", article.date || textFor("date.needCheck"));
  const place = factValueByLabels(article, "장소", article.address || textFor("place.needCheck"));
  const time = factValueByLabels(article, "운영", textFor("official.check"));
  const fee = factValueByLabels(article, "요금", textFor("official.check"));
  const parking = article.address ? "행사장 주변 공영주차장, 임시 주차장, 대중교통 공지를 함께 확인하세요." : textFor("official.check");

  return `
    <section class="spot-info-card" aria-labelledby="spotInfoTitle">
      <p class="eyebrow">Basic Info</p>
      <h2 id="spotInfoTitle">주소·주차·운영시간·입장료</h2>
      <dl>
        <div><dt>주소</dt><dd>${escapeHtml(place)}</dd></div>
        <div><dt>주차</dt><dd>${escapeHtml(parking)}</dd></div>
        <div><dt>운영시간</dt><dd>${escapeHtml(time)}</dd></div>
        <div><dt>입장료</dt><dd>${escapeHtml(fee)}</dd></div>
        <div><dt>일정</dt><dd>${escapeHtml(schedule)}</dd></div>
        ${article.tel ? `<div><dt>문의</dt><dd>${escapeHtml(article.tel)}</dd></div>` : ""}
      </dl>
      ${article.homepage ? `<a class="official-link-inline" href="${escapeHtml(article.homepage)}" target="_blank" rel="noopener noreferrer">${escapeHtml(textFor("official.link"))}</a>` : ""}
    </section>
  `;
}

function OfficialDetailList(article) {
  const details = Array.isArray(article.detailInfo) ? article.detailInfo : [];
  if (!details.length) return "";

  return `
    <section class="official-detail-list" aria-labelledby="officialDetailTitle">
      <p class="eyebrow">Official Info</p>
      <h2 id="officialDetailTitle">공식 제공 상세 정보</h2>
      <div class="official-detail-grid">
        ${details.map((item) => `
          <article>
            <span>${escapeHtml(item.label)}</span>
            <p>${escapeHtml(item.value)}</p>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function NearbyParkingSection(article) {
  const lat = article.lat || article.mapy;
  const lng = article.lng || article.mapx;
  const hasPoint = lat && lng;
  const copy = parkingCopy();

  return `
    <section class="nearby-parking-section" id="nearbyParkingSection" aria-labelledby="nearbyParkingTitle" ${hasPoint ? "" : "hidden"}>
      <p class="eyebrow">Parking</p>
      <h2 id="nearbyParkingTitle">${escapeHtml(copy.title)}</h2>
      <p class="parking-notice">${escapeHtml(copy.notice)}</p>
      <div class="parking-list" id="nearbyParkingList">
        <p class="parking-loading">${escapeHtml(copy.loading)}</p>
      </div>
    </section>
  `;
}

function parkingMapLinks(item) {
  const copy = parkingCopy();
  const query = [item.name, item.address].filter(Boolean).join(" ").trim();
  const encodedQuery = encodeURIComponent(query || item.name || copy.fallbackQuery);
  const hasPoint = Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lng));
  const googleQuery = hasPoint
    ? `${Number(item.lat)},${Number(item.lng)}`
    : (query || item.name || copy.fallbackQuery);

  return [
    {
      label: copy.maps[0],
      url: `https://map.naver.com/p/search/${encodedQuery}`
    },
    {
      label: copy.maps[1],
      url: `https://map.kakao.com/link/search/${encodedQuery}`
    },
    {
      label: copy.maps[2],
      url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(googleQuery)}`
    }
  ];
}

function parkingMapLinkMarkup(item) {
  const copy = parkingCopy();
  return `
    <div class="parking-map-links" aria-label="${escapeHtml(`${item.name} ${copy.mapAria}`)}">
      ${parkingMapLinks(item).map((link) => `
        <a class="parking-map-link" href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">
          ${escapeHtml(link.label)}
        </a>
      `).join("")}
    </div>
  `;
}

async function hydrateNearbyParking(article) {
  const section = $("#nearbyParkingSection");
  const target = $("#nearbyParkingList");
  const copy = parkingCopy();
  if (!section || !target) return;

  const lat = article.lat || article.mapy;
  const lng = article.lng || article.mapx;
  if (!lat || !lng) {
    section.hidden = true;
    return;
  }

  try {
    const query = new URLSearchParams({ lat, lng, limit: "1000" });
    const response = await fetch(`/api/seoul-parking?${query.toString()}`, {
      headers: { Accept: "application/json" }
    });
    const payload = await response.json();
    if (!response.ok || payload?.ok === false) {
      throw new Error(payload?.message || `Parking API ${response.status}`);
    }

    const items = Array.isArray(payload.items) ? payload.items.slice(0, 5) : [];
    if (!items.length) {
      target.innerHTML = `<p class="parking-loading">${escapeHtml(copy.empty)}</p>`;
      return;
    }

    target.innerHTML = items.map((item) => `
      <article class="parking-card">
        <h3>${escapeHtml(item.name)}</h3>
        <p>${escapeHtml(item.address || copy.addressFallback)}</p>
        <dl>
          ${item.distanceM != null ? `<div><dt>${escapeHtml(copy.labels.distance)}</dt><dd>${escapeHtml(formatDistance(item.distanceM))}</dd></div>` : ""}
          ${item.baseRate ? `<div><dt>${escapeHtml(copy.labels.baseRate)}</dt><dd>${escapeHtml(item.baseRate)}</dd></div>` : ""}
          ${item.addRate ? `<div><dt>${escapeHtml(copy.labels.addRate)}</dt><dd>${escapeHtml(item.addRate)}</dd></div>` : ""}
          ${item.weekday ? `<div><dt>${escapeHtml(copy.labels.weekday)}</dt><dd>${escapeHtml(item.weekday)}</dd></div>` : ""}
          ${item.weekend ? `<div><dt>${escapeHtml(copy.labels.weekend)}</dt><dd>${escapeHtml(item.weekend)}</dd></div>` : ""}
          ${item.payType ? `<div><dt>${escapeHtml(copy.labels.payType)}</dt><dd>${escapeHtml(item.payType)}</dd></div>` : ""}
          ${item.tel ? `<div><dt>${escapeHtml(copy.labels.tel)}</dt><dd>${escapeHtml(item.tel)}</dd></div>` : ""}
        </dl>
        ${parkingMapLinkMarkup(item)}
      </article>
    `).join("");
  } catch (error) {
    console.info("Nearby parking is not available.", error);
    target.innerHTML = `<p class="parking-loading">${escapeHtml(copy.error)}</p>`;
  }
}

function formatDistance(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  return number >= 1000 ? `${(number / 1000).toFixed(1)}km` : `${number}m`;
}

function AdBox(position = "본문 중간") {
  return `
    <aside class="detail-ad-box" aria-label="${escapeHtml(position)} 광고 영역">
      <span>Advertisement</span>
      <p>${escapeHtml(position)} 광고가 들어갈 수 있는 자리입니다.</p>
    </aside>
  `;
}

function NearbySpotCard(article) {
  const region = travelRegionName(article);
  const cards = [
    ["맛집", `${region} 로컬 식당`, "현장 방문 전후로 식사 시간을 넉넉히 잡고, 주말에는 대기 가능성을 고려하세요."],
    ["카페", `${region} 전망 카페`, "사진을 정리하거나 다음 동선을 확인하기 좋은 휴식 지점으로 활용할 수 있습니다."],
    ["숙소", `${region} 숙소 체크`, "늦은 시간까지 머문다면 행사장과 대중교통 접근성을 함께 비교하세요."]
  ];

  return `
    <section class="nearby-spot-section" aria-labelledby="nearbySpotTitle">
      <p class="eyebrow">Nearby</p>
      <h2 id="nearbySpotTitle">주변 맛집·카페 추천</h2>
      <div class="nearby-spot-grid">
        ${cards.map(([type, title, body]) => `
          <article>
            <span>${escapeHtml(type)}</span>
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(body)}</p>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function TravelTipBox(article) {
  const schedule = factValueByLabels(article, "일정", article.date || textFor("date.needCheck"));
  const place = factValueByLabels(article, "장소", article.address || textFor("place.needCheck"));
  const tips = [
    `${schedule} 안에서도 프로그램별 시간이 다를 수 있으니 방문 당일 공지를 확인하세요.`,
    `${place} 주변은 주말과 성수기에 혼잡할 수 있어 이동 시간을 여유 있게 잡으세요.`,
    "야외 일정이라면 우산보다 이동이 편한 우비, 생수, 보조배터리를 준비하는 것이 좋습니다.",
    "아이와 함께 방문한다면 화장실, 휴식 공간, 유모차 이동 가능 구간을 먼저 확인하세요."
  ];

  return `
    <section class="travel-tip-box" aria-labelledby="travelTipTitle">
      <p class="eyebrow">Check Point</p>
      <h2 id="travelTipTitle">여행 전 체크 포인트</h2>
      <ul>
        ${tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}
      </ul>
    </section>
  `;
}

function renderSpotDetailSections(article, sections) {
  const region = travelRegionName(article);
  const detailSections = sections.slice(0, 3);

  return `
    <section class="spot-detail-section" aria-labelledby="spotDetailTitle">
      <p class="eyebrow">Travel Notes</p>
      <h2 id="spotDetailTitle">여행지별 상세 설명</h2>
      ${detailSections.map((section, index) => `
        <article>
          <h3>${escapeHtml(section.title || `${region} 여행 포인트 ${index + 1}`)}</h3>
          ${(Array.isArray(section.body) ? section.body : [section.body])
            .slice(0, 2)
            .map((paragraph) => `<p>${escapeHtml(stripHtml(paragraph))}</p>`)
            .join("")}
        </article>
      `).join("")}
      ${renderImageGallery(article)}
    </section>
  `;
}

function renderClosingNote(article) {
  const region = travelRegionName(article);

  return `
    <section class="closing-note">
      <h2>${escapeHtml(region)} 여행을 마무리하며</h2>
      <p>${escapeHtml(article.title)}은 일정과 현장 정보를 함께 확인할수록 만족도가 높아지는 여행지입니다. 방문 전 공식 안내를 한 번 더 확인하고, 이동 시간과 휴식 시간을 넉넉히 잡으면 더 편안한 하루를 만들 수 있습니다.</p>
    </section>
  `;
}

function renderClosingNote(article) {
  const region = travelRegionName(article);

  return `
    <section class="closing-note">
      <h2>${escapeHtml(region)} 여행을 마무리하며</h2>
      <p>방문 전 공식 안내를 한 번 더 확인하고, 이동 시간과 휴식 시간을 넉넉히 잡으면 더 편안한 하루를 만들 수 있습니다.</p>
    </section>
  `;
}

function SpotInfoCard(article) {
  const schedule = factValueByLabels(article, "일정", article.date || textFor("date.needCheck"));
  const place = factValueByLabels(article, "장소", article.address || textFor("place.needCheck"));
  const time = factValueByLabels(article, "운영", textFor("official.check"));
  const fee = factValueByLabels(article, "요금", textFor("official.check"));
  const parking = article.address
    ? "방문 전 행사장 주변 공영주차장과 임시 주차장 운영 여부를 확인하세요."
    : textFor("official.check");
  const rows = [
    ["주소", place],
    ["일정", schedule],
    ["운영시간", time],
    ["입장료", fee],
    ["주차", parking],
    ...(article.tel ? [["문의", article.tel]] : [])
  ].filter(([, value]) => value);

  return `
    <section class="spot-info-card compact-info-card" aria-labelledby="spotInfoTitle">
      <h2 id="spotInfoTitle">기본 정보</h2>
      <div class="compact-info-list">
        ${rows.map(([label, value]) => `
          <div class="compact-info-row">
            <span>${escapeHtml(label)}</span>
            <p>${escapeHtml(stripHtml(value))}</p>
          </div>
        `).join("")}
      </div>
      ${article.homepage ? `<a class="official-link-inline" href="${escapeHtml(article.homepage)}" target="_blank" rel="noopener noreferrer">${escapeHtml(textFor("official.link"))}</a>` : ""}
    </section>
  `;
}

function renderTravelDetailBody(article, sections) {
  return `
    ${TravelSummaryBox(article)}
    ${CourseTimeline(article)}
    ${SpotInfoCard(article)}
    ${OfficialDetailList(article)}
    ${NearbyParkingSection(article)}
    ${AdBox("본문 중간")}
    ${NearbySpotCard(article)}
    ${TravelTipBox(article)}
    ${renderClosingNote(article)}
  `;
}

function renderArticle(article) {
  updateDocumentMeta(article);
  const displayTitle = localizedArticleTitle(article);
  const heroImage = imageUrlForArticle(article, "");
  const sections = article.overview && state.language === "ko"
    ? [
        {
          title: textFor("overview.title"),
          body: [
            article.overview,
            textFor("overview.extra")
          ]
        },
        ...detailSections(article).slice(1)
      ]
    : detailSections(article);

  $("#detailArticle").innerHTML = `
    <header class="blog-header">
      <p class="eyebrow">${escapeHtml(displayArticleCategory(article))}</p>
      <h1>${escapeHtml(displayTitle)}</h1>
      <p class="blog-lede">${escapeHtml(localizedSummary(article))}</p>
      <div class="article-meta">
        <span>${escapeHtml(article.date)}</span>
        <span>${escapeHtml(article.readTime)}</span>
      </div>
    </header>
    ${heroImage ? `
      <div class="detail-hero-image">
        <img src="${escapeHtml(heroImage)}" alt="${escapeHtml(displayTitle)}" onerror="this.closest('.detail-hero-image').remove()" />
      </div>
    ` : ""}
    <div class="blog-body">
      ${renderTravelDetailBody(article, sections)}
    </div>
  `;
  hydrateNearbyParking(article);
  hydrateDetailCoupangProducts(article);
}

function applyStaticLanguage() {
  document.documentElement.lang = state.language === "zh" ? "zh-Hans" : state.language;

  document.querySelectorAll("[data-detail-i18n]").forEach((element) => {
    element.textContent = textFor(element.dataset.detailI18n);
  });

  document.querySelectorAll("[data-lang]").forEach((button) => {
    const isActive = button.dataset.lang === state.language;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function bindLanguageSwitch() {
  const switcher = $("#detailLanguageSwitch");
  if (!switcher) return;

  switcher.addEventListener("click", (event) => {
    const button = event.target.closest("[data-lang]");
    if (!button) return;

    const lang = button.getAttribute("data-lang");
    if (!supportedLanguages.includes(lang) || lang === state.language) return;

    state.language = lang;
    try {
      window.localStorage.setItem("festivalNote.language", lang);
    } catch {
      // The selected language still applies during the current session.
    }

    applyStaticLanguage();
    if (state.article) {
      renderArticle(state.article);
      renderRelated(state.article.id);
    }
  });
}

function renderRelated(currentId) {
  const section = document.querySelector(".related-section");
  if (section) section.hidden = true;
}

function cleanValue(value) {
  return stripHtml(value)
    .replace(/\s+/g, " ")
    .trim();
}

function usefulValue(value) {
  const clean = cleanValue(value);
  if (!clean) return "";
  if (["0", "-", "null", "undefined"].includes(clean.toLowerCase())) return "";
  return clean;
}

function getFactByLabels(article, labels, fallback = "") {
  const facts = article.facts || localFacts(article);
  const list = Array.isArray(labels) ? labels : [labels];
  const match = facts.find(([label]) => list.some((item) => String(label).includes(item)));
  return usefulValue(match?.[1]) || usefulValue(fallback);
}

function cleanCopy() {
  const table = {
    ko: {
      eventContent: "행사 내용",
      basicInfo: "기본 정보",
      highlightTitle: "관람 포인트",
      officialTitle: "상세 안내",
      visitCheck: "방문 전 체크",
      closingTitle: "마무리",
      defaultTarget: "가족, 친구, 연인, 혼자 방문하는 여행자",
      rowNotes: {
        date: "방문 날짜와 종료일을 먼저 확인하세요.",
        place: "지도 앱에서 정확한 입구와 이동 경로를 확인하세요.",
        time: "프로그램별 시간이 다를 수 있습니다.",
        fee: "무료 행사도 일부 체험은 유료일 수 있습니다.",
        target: "동행자 연령 제한 여부를 확인하세요.",
        subCategory: "서울 문화행사 원본 분류 기준입니다.",
        contact: "변경 사항은 공식 문의처가 가장 정확합니다."
      },
      labels: {
        date: "일정",
        place: "장소",
        time: "운영시간",
        fee: "입장료",
        target: "이용대상",
        subCategory: "세부 분류",
        contact: "문의"
      },
      defaultOverview: (title) => `${title}은 방문 전 일정과 장소, 운영 정보를 함께 확인하면 좋은 서울 여행 콘텐츠입니다. 현장 상황은 날짜와 시간대에 따라 달라질 수 있으니 이동 전 공식 안내를 한 번 더 확인하는 것이 좋습니다.`,
      intro: (title, category, place) => `${title}은 ${category || "서울 행사"} 분야의 행사로, ${place ? `${place}에서 진행됩니다` : "서울 지역에서 진행됩니다"}. 방문자는 행사 성격과 운영 정보를 먼저 확인한 뒤 이동 동선, 관람 시간, 주변 교통을 함께 계획하면 더 편하게 즐길 수 있습니다.`,
      highlights: (article, context, feeText, targetText, scheduleText) => [
        ["무엇을 볼 수 있나요?", `${article.title}은 ${context.category || "서울 행사"} 정보를 찾는 방문자가 일정과 장소를 기준으로 검토하기 좋은 콘텐츠입니다. 행사 성격에 따라 전시, 공연, 체험, 야외 프로그램이 운영될 수 있으므로 현장 안내와 프로그램 시간을 함께 확인하는 것이 좋습니다.`],
        ["언제 방문하면 좋나요?", `${scheduleText} 일정에 맞춰 운영됩니다. 주말이나 저녁 시간대에는 방문객이 몰릴 수 있어, 사진 촬영이나 여유로운 관람을 원한다면 비교적 이른 시간에 도착하는 편이 좋습니다.`],
        ["누구에게 잘 맞나요?", `${targetText}에게 참고하기 좋은 행사입니다. 입장료는 ${feeText} 기준으로 확인되며, 일부 프로그램은 별도 예약이나 현장 접수가 필요할 수 있습니다.`]
      ],
      tips: (place, time, fee) => [
        time ? `방문 전 ${time} 기준 운영 여부를 한 번 더 확인하세요.` : "방문 전 공식 안내에서 당일 운영 여부를 확인하세요.",
        place ? `${place} 주변은 행사 시간대에 혼잡할 수 있으므로 대중교통과 주차 동선을 함께 확인하세요.` : "행사장 위치와 이동 동선을 먼저 확인하세요.",
        fee ? `요금은 ${fee} 기준으로 확인되지만, 체험·예약·좌석·주차 비용은 별도로 운영될 수 있습니다.` : "무료 여부와 사전 예약 필요 여부를 확인하세요.",
        "야외 행사라면 날씨, 우산이나 우비, 보조배터리, 물을 준비하면 현장 체류가 더 편합니다."
      ],
      closing: (title) => `${title}은 일정, 장소, 요금, 이동 정보를 함께 확인하고 방문하면 더 안정적으로 즐길 수 있습니다. 특히 주말이나 방학 기간에는 혼잡도가 높아질 수 있으니 방문 시간을 여유 있게 잡는 것이 좋습니다.`
    },
    en: {
      eventContent: "Event Overview",
      basicInfo: "Basic Information",
      highlightTitle: "What to Know",
      officialTitle: "Additional Details",
      visitCheck: "Before You Visit",
      closingTitle: "Final Note",
      defaultTarget: "families, friends, couples, and solo travelers",
      rowNotes: {
        date: "Check both the start and end date before visiting.",
        place: "Confirm the entrance and route in a map app.",
        time: "Program times may differ from the main event hours.",
        fee: "Some activities may require separate payment.",
        target: "Check whether age or companion restrictions apply.",
        subCategory: "Original category from the Seoul cultural event data.",
        contact: "Official contact channels are the safest source for updates."
      },
      labels: {
        date: "Date",
        place: "Place",
        time: "Hours",
        fee: "Fee",
        target: "Audience",
        subCategory: "Subcategory",
        contact: "Contact"
      },
      defaultOverview: (title) => `${title} is a Seoul event worth checking with its schedule, place, and operating details before you go. Conditions may change by date and time, so review the official notice before leaving.`,
      intro: (title, category, place) => `${title} is grouped under ${category || "Seoul events"} and ${place ? `takes place at ${place}` : "takes place in Seoul"}. Plan your route, visit time, and nearby transport after checking the event type and operating information.`,
      highlights: (article, context, feeText, targetText, scheduleText) => [
        ["What can you expect?", `${article.title} is useful for visitors comparing Seoul events by date and location. Depending on the event type, exhibitions, performances, workshops, or outdoor programs may be available.`],
        ["When is a good time to visit?", `The event is scheduled for ${scheduleText}. Weekends and evenings can be crowded, so arrive earlier if you want photos or a slower visit.`],
        ["Who is it suitable for?", `This event can work well for ${targetText}. Fees are listed as ${feeText}, but some programs may require separate booking or on-site registration.`]
      ],
      tips: (place, time, fee) => [
        time ? `Check same-day operation based on ${time}.` : "Check the official notice before visiting.",
        place ? `Around ${place}, traffic may increase during event hours. Check public transport and parking routes together.` : "Confirm the venue and route before leaving.",
        fee ? `The listed fee is ${fee}, but activities, seats, bookings, or parking may cost extra.` : "Check whether admission is free and whether booking is required.",
        "For outdoor events, check the weather and bring rain gear, a battery pack, and water."
      ],
      closing: (title) => `${title} is easier to enjoy when schedule, place, fee, and transport are checked together. Allow extra time on weekends or during school holidays.`
    },
    ja: {
      eventContent: "イベント内容",
      basicInfo: "基本情報",
      highlightTitle: "見どころ",
      officialTitle: "詳細案内",
      visitCheck: "訪問前チェック",
      closingTitle: "まとめ",
      defaultTarget: "家族、友人、カップル、一人旅の旅行者",
      rowNotes: {
        date: "開始日と終了日を確認してください。",
        place: "地図アプリで入口と移動経路を確認してください。",
        time: "プログラムごとに時間が異なる場合があります。",
        fee: "一部体験は別料金の場合があります。",
        target: "年齢制限や同伴条件を確認してください。",
        subCategory: "ソウル文化行事データの元分類です。",
        contact: "変更事項は公式問い合わせ先で確認するのが安全です。"
      },
      labels: {
        date: "日程",
        place: "場所",
        time: "運営時間",
        fee: "料金",
        target: "対象",
        subCategory: "詳細分類",
        contact: "問い合わせ"
      },
      defaultOverview: (title) => `${title}は、訪問前に日程、場所、運営情報を確認しておきたいソウルのイベントです。日付や時間帯によって状況が変わることがあるため、出発前に公式案内を確認してください。`,
      intro: (title, category, place) => `${title}は${category || "ソウルイベント"}分野の行事で、${place ? `${place}で開催されます` : "ソウル市内で開催されます"}。イベントの性格と運営情報を確認したうえで、移動経路、観覧時間、周辺交通を一緒に計画すると便利です。`,
      highlights: (article, context, feeText, targetText, scheduleText) => [
        ["何が見られますか？", `${article.title}は、日程と場所を基準にソウルのイベントを比較したい人に役立つ情報です。分類によって展示、公演、体験、屋外プログラムなどが運営される場合があります。`],
        ["いつ訪問するとよいですか？", `${scheduleText}の日程で運営されます。週末や夜の時間帯は混雑しやすいため、写真撮影やゆっくり観覧したい場合は早めの到着がおすすめです。`],
        ["誰に向いていますか？", `${targetText}に参考になるイベントです。料金は${feeText}基準で確認されますが、一部プログラムは別途予約や現場受付が必要な場合があります。`]
      ],
      tips: (place, time, fee) => [
        time ? `訪問前に${time}基準の運営可否を確認してください。` : "訪問前に公式案内で当日の運営可否を確認してください。",
        place ? `${place}周辺はイベント時間帯に混雑することがあります。公共交通と駐車動線を一緒に確認してください。` : "会場の位置と移動経路を先に確認してください。",
        fee ? `料金は${fee}基準ですが、体験・予約・座席・駐車料金は別途発生する場合があります。` : "無料かどうか、事前予約が必要かを確認してください。",
        "屋外イベントの場合は天気、雨具、補助バッテリー、水を準備すると安心です。"
      ],
      closing: (title) => `${title}は、日程、場所、料金、移動情報を一緒に確認して訪問するとより安心して楽しめます。週末や休暇期間は時間に余裕を持って計画してください。`
    },
    zh: {
      eventContent: "活动内容",
      basicInfo: "基本信息",
      highlightTitle: "参观重点",
      officialTitle: "详细说明",
      visitCheck: "出发前确认",
      closingTitle: "总结",
      defaultTarget: "家庭、朋友、情侣和独自旅行者",
      rowNotes: {
        date: "请先确认开始和结束日期。",
        place: "请在地图应用中确认入口和路线。",
        time: "不同项目的时间可能不同。",
        fee: "部分体验可能需要另行付费。",
        target: "请确认年龄或同行限制。",
        subCategory: "首尔文化活动数据中的原始分类。",
        contact: "官方联系方式是确认变更信息的可靠渠道。"
      },
      labels: {
        date: "日期",
        place: "地点",
        time: "运营时间",
        fee: "费用",
        target: "对象",
        subCategory: "详细分类",
        contact: "咨询"
      },
      defaultOverview: (title) => `${title}是出发前值得确认日程、地点和运营信息的首尔活动。现场情况可能因日期和时间而变化，建议出发前查看官方公告。`,
      intro: (title, category, place) => `${title}属于${category || "首尔活动"}类别，${place ? `在${place}举行` : "在首尔举行"}。建议先确认活动类型和运营信息，再规划路线、参观时间和周边交通。`,
      highlights: (article, context, feeText, targetText, scheduleText) => [
        ["可以看到什么？", `${article.title}适合想按日期和地点比较首尔活动的访客参考。根据活动类型，可能包含展览、演出、体验或户外项目。`],
        ["什么时候去比较好？", `活动日程为${scheduleText}。周末和晚间可能较拥挤，如果想拍照或从容参观，建议较早到达。`],
        ["适合哪些人？", `该活动可供${targetText}参考。费用以${feeText}为准，但部分项目可能需要另行预约或现场登记。`]
      ],
      tips: (place, time, fee) => [
        time ? `出发前请按${time}确认当天是否正常运营。` : "出发前请查看官方公告确认当天运营情况。",
        place ? `${place}周边在活动时段可能拥挤，请同时确认公共交通和停车路线。` : "请先确认会场位置和移动路线。",
        fee ? `费用以${fee}为准，但体验、预约、座位或停车可能另收费。` : "请确认是否免费以及是否需要提前预约。",
        "户外活动请提前查看天气，并准备雨具、充电宝和饮用水。"
      ],
      closing: (title) => `${title}在确认日程、地点、费用和交通后访问会更安心。周末或假期建议预留更充足的时间。`
    }
  };

  return table[state.language] || table.ko;
}

function detailCopy() {
  const table = {
    ko: {
      eventContent: "행사 내용",
      basicInfo: "기본 정보",
      highlightTitle: "관람 포인트",
      officialTitle: "상세 안내",
      officialNoticeTitle: "공식 안내 확인",
      officialNoticeBody: "세부 프로그램, 예약 방식, 운영 변경 사항은 행사 주최 측 공지가 가장 정확합니다. 방문 전 공식 안내 페이지를 한 번 더 확인하세요.",
      visitCheck: "방문 전 체크",
      closingTitle: "마무리",
      defaultTarget: "가족, 친구, 연인, 혼자 방문하는 여행자",
      fallbacks: {
        date: "공식 안내에서 일정을 확인하세요",
        place: "공식 안내에서 장소를 확인하세요",
        time: "방문 전 공식 운영시간을 확인하세요",
        fee: "방문 전 공식 안내에서 확인하세요",
        target: "방문 전 대상 연령을 확인하세요",
        category: "서울 문화행사"
      },
      rowNotes: {
        date: "시작일과 종료일을 함께 확인하세요.",
        place: "지도 앱에서 정확한 입구와 이동 경로를 확인하세요.",
        time: "프로그램별 시간이 다를 수 있습니다.",
        fee: "무료 행사도 일부 체험은 유료일 수 있습니다.",
        target: "동행자 연령 제한 여부를 확인하세요.",
        subCategory: "서울 문화행사 분류 기준입니다.",
        contact: "변경 사항은 공식 문의처가 가장 정확합니다."
      },
      labels: {
        date: "일정",
        place: "장소",
        time: "운영시간",
        fee: "입장료",
        target: "이용대상",
        subCategory: "분류",
        contact: "문의"
      },
      defaultOverview: (title) => `${title}은 방문 전 일정과 장소, 운영 정보를 함께 확인하면 좋은 서울 여행 콘텐츠입니다. 현장 상황은 날짜와 시간대에 따라 달라질 수 있으니 이동 전 공식 안내를 한 번 더 확인하는 것이 좋습니다.`,
      intro: (title, category, place) => `${title}은 ${category || "서울 행사"} 분야의 행사입니다. ${place ? `${place}에서 진행되며,` : "서울 지역에서 진행되며,"} 행사 성격과 운영 정보를 먼저 확인한 뒤 이동 동선, 관람 시간, 주변 교통을 함께 계획하면 더 편하게 즐길 수 있습니다.`,
      highlights: (article, context, feeText, targetText, scheduleText) => [
        ["무엇을 볼 수 있나요?", `${context.eventName}은 ${context.category || "서울 행사"} 정보를 찾는 방문자가 일정과 장소를 기준으로 검토하기 좋은 콘텐츠입니다. 행사 성격에 따라 전시, 공연, 체험, 야외 프로그램이 운영될 수 있으므로 현장 안내와 프로그램 시간을 함께 확인하는 것이 좋습니다.`],
        ["언제 방문하면 좋나요?", `${scheduleText} 일정에 맞춰 운영됩니다. 주말이나 저녁 시간대에는 방문객이 몰릴 수 있어, 사진 촬영이나 여유로운 관람을 원한다면 비교적 이른 시간에 도착하는 편이 좋습니다.`],
        ["누구에게 잘 맞나요?", `${targetText}에게 참고하기 좋은 행사입니다. 입장료와 예약 방식은 ${feeText}. 일부 프로그램은 별도 예약이나 현장 접수가 필요할 수 있습니다.`]
      ],
      tips: (place, time, fee) => [
        time ? `방문 전 ${time} 기준 운영 여부를 한 번 더 확인하세요.` : "방문 전 공식 안내에서 당일 운영 여부를 확인하세요.",
        place ? `${place} 주변은 행사 시간대에 혼잡할 수 있으므로 대중교통과 주차 동선을 함께 확인하세요.` : "행사장 위치와 이동 동선을 먼저 확인하세요.",
        fee ? `요금은 ${fee} 기준으로 확인되지만, 체험·예약·좌석·주차 비용은 별도로 운영될 수 있습니다.` : "무료 여부와 사전 예약 필요 여부를 확인하세요.",
        "야외 행사라면 날씨, 우산이나 우비, 보조배터리, 물을 준비하면 현장 체류가 더 편합니다."
      ],
      closing: (title) => `${title}은 일정, 장소, 요금, 이동 정보를 함께 확인하고 방문하면 더 안정적으로 즐길 수 있습니다. 특히 주말이나 방학 기간에는 혼잡도가 높아질 수 있으니 방문 시간을 여유 있게 잡는 것이 좋습니다.`
    },
    en: {
      eventContent: "Event Overview",
      basicInfo: "Basic Information",
      highlightTitle: "Visitor Guide",
      officialTitle: "Official Details",
      officialNoticeTitle: "Check the latest notice",
      officialNoticeBody: "Program details, booking rules, and operating changes are best confirmed through the organizer's official notice before you visit.",
      visitCheck: "Before You Visit",
      closingTitle: "Final Note",
      defaultTarget: "families, friends, couples, and solo travelers",
      fallbacks: {
        date: "Check the official schedule",
        place: "Confirm the event venue",
        time: "Check hours before visiting",
        fee: "Check admission and booking rules",
        target: "Check audience or age limits",
        category: "Seoul event"
      },
      rowNotes: {
        date: "Check both the start and end date.",
        place: "Confirm the exact entrance and route in a map app.",
        time: "Program times may differ by session.",
        fee: "Some free events may still charge for selected activities.",
        target: "Check age limits or companion rules.",
        subCategory: "Based on Seoul cultural event classification.",
        contact: "Official contact channels are the safest source for updates."
      },
      labels: {
        date: "Date",
        place: "Place",
        time: "Hours",
        fee: "Fee",
        target: "Audience",
        subCategory: "Category",
        contact: "Contact"
      },
      defaultOverview: (title) => `${title} is a Seoul travel event worth checking with its schedule, venue, and operating details before you go. Conditions may change by date and time, so review the official notice before leaving.`,
      intro: (title, category, place) => `${title} is listed under ${category || "Seoul events"}. ${place ? `It takes place at ${place},` : "It takes place in Seoul,"} so plan your route, visit time, and nearby transport after checking the event type and operating information.`,
      highlights: (article, context, feeText, targetText, scheduleText) => [
        ["What can you expect?", `${context.eventName} is useful for visitors comparing Seoul events by date and location. Depending on the event type, exhibitions, performances, workshops, or outdoor programs may be available.`],
        ["When is a good time to visit?", `The event is scheduled for ${scheduleText}. Weekends and evenings can be crowded, so arrive earlier if you want photos or a slower visit.`],
        ["Who is it suitable for?", `This event can work well for ${targetText}. Fees are listed as ${feeText}, but some programs may require separate booking or on-site registration.`]
      ],
      tips: (place, time, fee) => [
        time ? `Check same-day operation based on ${time}.` : "Check the official notice before visiting.",
        place ? `Around ${place}, traffic may increase during event hours. Check public transport and parking routes together.` : "Confirm the venue and route before leaving.",
        fee ? `The listed fee is ${fee}, but activities, seats, bookings, or parking may cost extra.` : "Check whether admission is free and whether booking is required.",
        "For outdoor events, check the weather and bring rain gear, a battery pack, and water."
      ],
      closing: (title) => `${title} is easier to enjoy when schedule, place, fee, and transport are checked together. Allow extra time on weekends or during school holidays.`
    },
    ja: {
      eventContent: "イベント概要",
      basicInfo: "基本情報",
      highlightTitle: "見どころ",
      officialTitle: "公式詳細",
      officialNoticeTitle: "最新案内の確認",
      officialNoticeBody: "詳細プログラム、予約方法、運営変更は主催者の公式案内が最も正確です。訪問前に公式ページを確認してください。",
      visitCheck: "訪問前チェック",
      closingTitle: "まとめ",
      defaultTarget: "家族、友人、カップル、一人旅の旅行者",
      fallbacks: {
        date: "公式日程の確認が必要",
        place: "会場確認が必要",
        time: "訪問前に運営時間を確認",
        fee: "料金と予約方法を確認",
        target: "観覧可能年齢を確認",
        category: "ソウル文化イベント"
      },
      rowNotes: {
        date: "開始日と終了日を確認してください。",
        place: "地図アプリで入口と移動経路を確認してください。",
        time: "プログラムごとに時間が異なる場合があります。",
        fee: "無料イベントでも一部体験は有料の場合があります。",
        target: "年齢制限や同伴条件を確認してください。",
        subCategory: "ソウル文化イベント分類に基づきます。",
        contact: "変更事項は公式問い合わせ先が最も正確です。"
      },
      labels: {
        date: "日程",
        place: "場所",
        time: "時間",
        fee: "料金",
        target: "対象",
        subCategory: "分類",
        contact: "問い合わせ"
      },
      defaultOverview: (title) => `${title}は、訪問前に日程、会場、運営情報を確認しておきたいソウルの旅行イベントです。状況は日付や時間帯によって変わることがあるため、出発前に公式案内を確認してください。`,
      intro: (title, category, place) => `${title}は${category || "ソウルイベント"}に分類されます。${place ? `${place}で開催され、` : "ソウル市内で開催され、"}イベントの性格と運営情報を確認したうえで、移動経路、観覧時間、周辺交通を計画すると便利です。`,
      highlights: (article, context, feeText, targetText, scheduleText) => [
        ["何が見られますか？", `${context.eventName}は、日程と場所を基準にソウルのイベントを比較したい人に役立つ情報です。分類によって展示、公演、体験、屋外プログラムなどが運営される場合があります。`],
        ["いつ訪問するとよいですか？", `${scheduleText}の日程で運営されます。週末や夜の時間帯は混雑しやすいため、写真撮影やゆっくり観覧したい場合は早めの到着がおすすめです。`],
        ["誰に向いていますか？", `${targetText}に参考になるイベントです。料金は${feeText}を基準に確認されますが、一部プログラムは別途予約や現地受付が必要な場合があります。`]
      ],
      tips: (place, time, fee) => [
        time ? `訪問前に${time}基準の運営状況を確認してください。` : "訪問前に公式案内で当日の運営状況を確認してください。",
        place ? `${place}周辺はイベント時間帯に混雑する場合があります。公共交通と駐車動線を一緒に確認してください。` : "会場の位置と移動経路を先に確認してください。",
        fee ? `料金は${fee}を基準に確認されますが、体験、予約、座席、駐車料金は別途発生する場合があります。` : "無料かどうか、事前予約が必要かを確認してください。",
        "屋外イベントの場合は天気、雨具、補助バッテリー、水を準備すると安心です。"
      ],
      closing: (title) => `${title}は、日程、場所、料金、移動情報を一緒に確認して訪問するとより安心して楽しめます。週末や休暇期間は混雑しやすいため、時間に余裕を持って訪問してください。`
    },
    zh: {
      eventContent: "活动介绍",
      basicInfo: "基本信息",
      highlightTitle: "参观重点",
      officialTitle: "官方详情",
      officialNoticeTitle: "确认最新公告",
      officialNoticeBody: "详细节目、预约方式和运营变更以主办方官方公告为准。出发前建议再次查看官方页面。",
      visitCheck: "出发前确认",
      closingTitle: "总结",
      defaultTarget: "家庭、朋友、情侣和独自旅行者",
      fallbacks: {
        date: "需要确认官方日程",
        place: "需要确认活动地点",
        time: "出发前确认运营时间",
        fee: "确认门票和预约规则",
        target: "确认适用年龄或对象",
        category: "首尔文化活动"
      },
      rowNotes: {
        date: "请同时确认开始日期和结束日期。",
        place: "请在地图应用中确认入口和路线。",
        time: "不同节目时间可能不同。",
        fee: "免费活动中部分体验也可能收费。",
        target: "请确认年龄限制或同行条件。",
        subCategory: "基于首尔文化活动分类。",
        contact: "变更信息以官方咨询渠道为准。"
      },
      labels: {
        date: "日期",
        place: "地点",
        time: "时间",
        fee: "费用",
        target: "对象",
        subCategory: "分类",
        contact: "咨询"
      },
      defaultOverview: (title) => `${title}是出发前值得确认日程、地点和运营信息的首尔旅行活动。现场情况可能因日期和时间而变化，建议出发前查看官方公告。`,
      intro: (title, category, place) => `${title}属于${category || "首尔活动"}类别。${place ? `活动在${place}举行，` : "活动在首尔举行，"}建议先确认活动类型和运营信息，再规划路线、参观时间和周边交通。`,
      highlights: (article, context, feeText, targetText, scheduleText) => [
        ["可以看到什么？", `${context.eventName}适合想按日期和地点比较首尔活动的访客参考。根据活动类型，可能包含展览、演出、体验或户外项目。`],
        ["什么时候去比较好？", `活动日程为${scheduleText}。周末和晚间可能较拥挤，如果想拍照或从容参观，建议较早到达。`],
        ["适合谁？", `该活动适合${targetText}参考。费用显示为${feeText}，但部分项目可能需要另行预约或现场报名。`]
      ],
      tips: (place, time, fee) => [
        time ? `出发前请按${time}确认当天运营情况。` : "出发前请查看官方公告确认当天运营情况。",
        place ? `${place}周边在活动时段可能拥挤，请同时确认公共交通和停车路线。` : "请先确认场地位置和移动路线。",
        fee ? `费用以${fee}为准，但体验、预约、座位或停车可能另行收费。` : "请确认是否免费以及是否需要提前预约。",
        "如果是户外活动，请确认天气，并准备雨具、充电宝和饮用水。"
      ],
      closing: (title) => `${title}在确认日程、地点、费用和交通信息后再前往，会更容易安心游览。周末或假期可能较拥挤，建议预留充足时间。`
    }
  };

  return table[state.language] || table.ko;
}

function weakDetailValue(value = "") {
  const text = usefulValue(stripHtml(value));
  if (!text) return true;
  return [
    "공식 안내 확인",
    "Check official notice",
    "公式案内を確認",
    "查看官方说明",
    "일정 확인 필요",
    "장소 확인 필요"
  ].some((weak) => text === weak || text.includes(weak));
}

function detailFallback(type) {
  const copy = detailCopy();
  return copy.fallbacks?.[type] || textFor("official.check");
}

function cleanDetailValue(value, type) {
  const text = usefulValue(stripHtml(value));
  return weakDetailValue(text) ? detailFallback(type) : text;
}

function parkingCopy() {
  const table = {
    ko: {
      title: "주변 공영주차장",
      notice: "서울시 공영주차장 안내 정보를 기준으로 가까운 주차장을 확인합니다. 실제 요금과 운영시간은 현장 또는 공식 안내와 다를 수 있습니다.",
      loading: "주변 주차장 정보를 불러오는 중입니다.",
      empty: "표시할 주변 공영주차장 정보를 찾지 못했습니다.",
      error: "주변 공영주차장 정보를 불러오지 못했습니다. 서울시 주차 안내 또는 현장 공지를 확인해 주세요.",
      fallbackQuery: "서울 공영주차장",
      mapAria: "지도 링크",
      addressFallback: "주소 확인 필요",
      labels: {
        distance: "거리",
        baseRate: "기본요금",
        addRate: "추가요금",
        weekday: "평일",
        weekend: "주말",
        payType: "요금구분",
        tel: "문의"
      },
      maps: ["네이버지도", "카카오맵", "구글지도"]
    },
    en: {
      title: "Nearby Public Parking",
      notice: "Nearby public parking is shown using Seoul parking information. Actual fees and hours may differ, so confirm before parking.",
      loading: "Loading nearby parking information.",
      empty: "No nearby public parking information was found.",
      error: "Nearby parking information could not be loaded. Check Seoul parking notices or on-site guidance.",
      fallbackQuery: "Seoul public parking",
      mapAria: "map links",
      addressFallback: "Address needs confirmation",
      labels: {
        distance: "Distance",
        baseRate: "Base fee",
        addRate: "Additional fee",
        weekday: "Weekday",
        weekend: "Weekend",
        payType: "Fee type",
        tel: "Contact"
      },
      maps: ["Naver Map", "Kakao Map", "Google Maps"]
    },
    ja: {
      title: "周辺公営駐車場",
      notice: "ソウル市の駐車場情報をもとに近くの公営駐車場を表示します。実際の料金や時間は現地案内と異なる場合があります。",
      loading: "周辺駐車場情報を読み込んでいます。",
      empty: "表示できる周辺公営駐車場情報が見つかりませんでした。",
      error: "周辺公営駐車場情報を読み込めませんでした。ソウル市の駐車案内または現地案内を確認してください。",
      fallbackQuery: "ソウル 公営駐車場",
      mapAria: "地図リンク",
      addressFallback: "住所確認が必要",
      labels: {
        distance: "距離",
        baseRate: "基本料金",
        addRate: "追加料金",
        weekday: "平日",
        weekend: "週末",
        payType: "料金区分",
        tel: "問い合わせ"
      },
      maps: ["Naver Map", "Kakao Map", "Google Maps"]
    },
    zh: {
      title: "附近公共停车场",
      notice: "根据首尔市停车信息显示附近公共停车场。实际费用和时间可能不同，请停车前确认。",
      loading: "正在加载附近停车信息。",
      empty: "未找到可显示的附近公共停车场信息。",
      error: "无法加载附近公共停车场信息。请查看首尔市停车公告或现场指引。",
      fallbackQuery: "首尔公共停车场",
      mapAria: "地图链接",
      addressFallback: "需要确认地址",
      labels: {
        distance: "距离",
        baseRate: "基本费用",
        addRate: "追加费用",
        weekday: "平日",
        weekend: "周末",
        payType: "收费类型",
        tel: "咨询"
      },
      maps: ["Naver Map", "Kakao Map", "Google Maps"]
    }
  };

  return table[state.language] || table.ko;
}

function cleanBodyOverview(article) {
  const copy = detailCopy();
  if (state.language !== "ko") return copy.defaultOverview(localizedEventReference(article));
  const overview = usefulValue(article.overview);
  const summary = usefulValue(article.summary);
  if (overview && overview !== summary) return overview;
  return copy.defaultOverview(localizedEventReference(article));
}

function cleanEventContext(article) {
  const category = localizedCategoryLabel(usefulValue(article.category) || displayArticleCategory(article));
  const subCategory = usefulValue(article.subCategory) || usefulValue(article.rawCategory);
  const place = cleanDetailValue(getFactByLabels(article, "장소", article.address || ""), "place");
  const schedule = cleanDetailValue(getFactByLabels(article, "일정", article.date || ""), "date");
  const fee = cleanDetailValue(getFactByLabels(article, ["요금", "이용 요금"], fallbackFee || ""), "fee");
  const target = cleanDetailValue(usefulValue(fallbackTarget) || getFactByLabels(article, ["이용 대상", "참가 연령"], ""), "target");

  return {
    eventName: localizedEventReference(article),
    category: cleanDetailValue(category, "category"),
    subCategory,
    place,
    schedule,
    fee,
    target
  };
}

function CleanIntroSection(article) {
  const copy = detailCopy();
  const context = cleanEventContext(article);

  return `
    <section class="clean-article-section">
      <h2>${escapeHtml(copy.eventContent)}</h2>
      <p>${escapeHtml(cleanBodyOverview(article))}</p>
      <p>${escapeHtml(copy.intro(context.eventName, context.category, context.place))}</p>
    </section>
  `;
}

function CleanInfoSection(article) {
  const copy = detailCopy();
  const rows = [
    [copy.labels.date, cleanDetailValue(getFactByLabels(article, "일정", article.date || ""), "date"), copy.rowNotes.date],
    [copy.labels.place, cleanDetailValue(getFactByLabels(article, "장소", article.address || ""), "place"), copy.rowNotes.place],
    [copy.labels.time, cleanDetailValue(getFactByLabels(article, ["운영", "행사 시간"], fallbackTime || ""), "time"), copy.rowNotes.time],
    [copy.labels.fee, cleanDetailValue(getFactByLabels(article, ["요금", "이용 요금"], fallbackFee || ""), "fee"), copy.rowNotes.fee],
    [copy.labels.target, cleanDetailValue(usefulValue(fallbackTarget) || getFactByLabels(article, ["이용 대상", "참가 연령"], ""), "target"), copy.rowNotes.target],
    [copy.labels.subCategory, cleanDetailValue(localizedCategoryLabel(usefulValue(article.subCategory) || usefulValue(article.rawCategory) || usefulValue(article.category)), "category"), copy.rowNotes.subCategory],
    [copy.labels.contact, usefulValue(article.tel) || getFactByLabels(article, "문의", ""), copy.rowNotes.contact]
  ].filter(([, value]) => usefulValue(value));

  return `
    <section class="clean-article-section clean-info-section">
      <h2>${escapeHtml(copy.basicInfo)}</h2>
      <div class="clean-info-table-wrap">
        <table class="clean-info-table">
          <caption>${escapeHtml(`${localizedEventReference(article)} ${copy.basicInfo}`)}</caption>
          <tbody>
            ${rows.map(([label, value, note]) => `
              <tr>
                <th scope="row">${escapeHtml(label)}</th>
                <td>${escapeHtml(value)}</td>
                <td>${escapeHtml(note)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      ${article.homepage ? `<a class="official-link-inline" href="${escapeHtml(article.homepage)}" target="_blank" rel="noopener noreferrer">${escapeHtml(textFor("official.link"))}</a>` : ""}
    </section>
  `;
}

function CleanHighlightSection(article) {
  const copy = detailCopy();
  const context = cleanEventContext(article);
  const feeText = context.fee || detailFallback("fee");
  const targetText = context.target || copy.defaultTarget;
  const scheduleText = context.schedule || detailFallback("date");
  const highlights = copy.highlights(article, context, feeText, targetText, scheduleText);

  return `
    <section class="clean-article-section clean-highlight-section">
      <h2>${escapeHtml(copy.highlightTitle)}</h2>
      ${highlights.map(([title, body]) => `
        <article>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(body)}</p>
        </article>
        `).join("")}
    </section>
  `;
}

function CleanOfficialInfoSection(article) {
  const copy = detailCopy();
  const hiddenLabels = ["행사 장소", "행사 시간", "운영 시간", "이용 요금", "문의 전화", "이용 대상", "참가 연령", "정보 기준일", "유무료"];
  const details = (Array.isArray(article.detailInfo) ? article.detailInfo : [])
    .map((item) => ({
      label: usefulValue(item.label),
      value: usefulValue(item.value)
    }))
    .filter((item) => item.label && item.value)
    .filter((item) => !hiddenLabels.some((label) => item.label.includes(label)));

  const seen = new Set();
  const unique = details.filter((item) => {
    const key = `${item.label}:${item.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 6);

  if (state.language !== "ko") {
    return `
      <section class="clean-article-section clean-official-section">
        <h2>${escapeHtml(copy.officialTitle)}</h2>
        <article>
          <h3>${escapeHtml(copy.officialNoticeTitle)}</h3>
          <p>${escapeHtml(copy.officialNoticeBody)}</p>
        </article>
        ${article.homepage ? `<a class="official-link-inline" href="${escapeHtml(article.homepage)}" target="_blank" rel="noopener noreferrer">${escapeHtml(textFor("official.link"))}</a>` : ""}
      </section>
    `;
  }

  if (!unique.length) return "";

  return `
    <section class="clean-article-section clean-official-section">
      <h2>${escapeHtml(copy.officialTitle)}</h2>
      ${unique.map((item) => `
        <article>
          <h3>${escapeHtml(item.label)}</h3>
          <p>${escapeHtml(item.value)}</p>
        </article>
      `).join("")}
    </section>
  `;
}

function CleanVisitTipSection(article) {
  const copy = detailCopy();
  const place = getFactByLabels(article, "장소", article.address || "");
  const time = getFactByLabels(article, ["운영", "행사 시간"], "");
  const fee = getFactByLabels(article, ["요금", "이용 요금"], fallbackFee || "");
  const tips = copy.tips(place, time, fee);

  return `
    <section class="clean-article-section clean-tip-section">
      <h2>${escapeHtml(copy.visitCheck)}</h2>
      <ul>
        ${tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}
      </ul>
    </section>
  `;
}

function NearbyTravelSection(article) {
  const copy = nearbyTravelCopy();
  const keyword = detailDestinationKeyword(article);
  const picks = nearbyTravelPicks(article);
  if (!picks.length) return "";

  return `
    <section class="clean-article-section clean-nearby-travel-section" aria-labelledby="nearbyTravelTitle">
      <p class="eyebrow">${escapeHtml(copy.eyebrow)}</p>
      <h2 id="nearbyTravelTitle">${escapeHtml(copy.title)}</h2>
      <p>${escapeHtml(copy.desc(keyword))}</p>
      <div class="nearby-travel-list">
        ${picks.map(([name, type, body]) => {
          const query = `${keyword} ${name}`;
          const image = nearbyTravelImage(name);
          const imageMarkup = image ? `
            <figure class="nearby-travel-image">
              <img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" loading="lazy" onerror="this.parentElement.remove()" />
            </figure>
          ` : "";
          return `
            <article class="nearby-travel-card${image ? "" : " no-image"}">
              ${imageMarkup}
              <div class="nearby-travel-content">
                <span>${escapeHtml(type)}</span>
                <h3>${escapeHtml(name)}</h3>
                <p>${escapeHtml(body)}</p>
                <a href="${escapeHtml(naverMapSearchUrl(query))}" target="_blank" rel="noopener noreferrer">${escapeHtml(copy.map)}</a>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function coupangTravelKeyword() {
  return "여행용품";
}

function coupangTravelCopy(article = {}) {
  const keyword = coupangTravelKeyword(article);
  const table = {
    ko: {
      eyebrow: "TRAVEL ESSENTIALS",
      title: "방문 전 챙기면 좋은 여행 준비물",
      desc: `${localizedEventReference(article)} 일정에 맞춰 함께 챙기기 좋은 상품을 골라볼 수 있습니다. 오래 걷는 일정이라면 가벼운 가방, 보조배터리, 휴대용 정리용품처럼 현장에서 바로 도움이 되는 물건부터 확인해 보세요.`,
      loading: `${keyword} 상품을 불러오는 중입니다.`,
      empty: "표시할 여행 준비물 상품을 찾지 못했습니다.",
      more: "관련 상품 더보기",
      badgeRocket: "로켓",
      badgeShipping: "무료배송",
      disclosure: "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다."
    },
    en: {
      eyebrow: "TRAVEL ESSENTIALS",
      title: "Useful Items Before You Go",
      desc: "Browse practical travel items that can help with a smoother day out, such as compact bags, battery packs, and small organizers.",
      loading: `Loading ${keyword} products.`,
      empty: "No related travel products are available right now.",
      more: "See more products",
      badgeRocket: "Rocket",
      badgeShipping: "Free shipping",
      disclosure: "As a Coupang Partners participant, this site may earn a commission from qualifying purchases."
    },
    ja: {
      eyebrow: "TRAVEL ESSENTIALS",
      title: "訪問前に準備したい持ち物",
      desc: "移動や観覧が少し楽になるバッグ、補助バッテリー、小物整理用品などを確認できます。",
      loading: `${keyword}商品を読み込んでいます。`,
      empty: "関連する旅行用品を表示できませんでした。",
      more: "関連商品をもっと見る",
      badgeRocket: "ロケット",
      badgeShipping: "送料無料",
      disclosure: "この投稿はCoupang Partners活動の一環であり、一定額の手数料を受け取る場合があります。"
    },
    zh: {
      eyebrow: "TRAVEL ESSENTIALS",
      title: "出发前可准备的旅行用品",
      desc: "可查看背包、充电宝、小物收纳等有助于当天行程的实用商品。",
      loading: `正在加载${keyword}商品。`,
      empty: "暂时无法显示相关旅行用品。",
      more: "查看更多相关商品",
      badgeRocket: "Rocket",
      badgeShipping: "包邮",
      disclosure: "本文包含Coupang Partners推广链接，可能会获得一定佣金。"
    }
  };

  return table[state.language] || table.ko;
}

function CoupangTravelProductsSection(article) {
  const copy = coupangTravelCopy(article);
  const keyword = coupangTravelKeyword(article);

  return `
    <section class="clean-article-section coupang-products-section" data-coupang-products data-coupang-keyword="${escapeHtml(keyword)}" aria-labelledby="coupangProductsTitle">
      <div class="coupang-products-head">
        <p class="eyebrow">${escapeHtml(copy.eyebrow)}</p>
        <h2 id="coupangProductsTitle">${escapeHtml(copy.title)}</h2>
        <p>${escapeHtml(copy.desc)}</p>
      </div>
      <div class="coupang-products-grid" data-coupang-products-grid>
        <article class="coupang-product-card coupang-product-card--loading">${escapeHtml(copy.loading)}</article>
      </div>
      <a class="coupang-products-more" data-coupang-products-more href="https://www.coupang.com/np/search?q=${encodeURIComponent(keyword)}" target="_blank" rel="sponsored noopener noreferrer">${escapeHtml(copy.more)}</a>
      <p class="coupang-products-disclosure">${escapeHtml(copy.disclosure)}</p>
    </section>
  `;
}

async function fetchDetailCoupangProducts(keyword = "여행용품", limit = 4) {
  const query = new URLSearchParams({
    keyword,
    limit: String(limit)
  });
  const response = await fetch(`/api/coupang?${query.toString()}`, {
    headers: { Accept: "application/json" }
  });
  const payload = await response.json();
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.message || `Coupang request failed ${response.status}`);
  }
  return payload;
}

function normalizeDetailCoupangProducts(payload = {}) {
  const data = payload.data || payload;
  const productData = Array.isArray(data.productData) ? data.productData : [];
  const items = productData.length ? productData : firstArrayFrom(data);

  return items
    .map((item = {}) => {
      const title = item.productName || item.title || item.name || "";
      const url = normalizeExternalUrl(item.productUrl || item.url || item.link || "");
      return {
        id: item.productId || item.itemId || title,
        title,
        image: normalizeImageUrl(item.productImage || item.imageUrl || item.thumbnailUrl || item.image || ""),
        url,
        price: item.productPrice || item.price || item.salePrice || 0,
        category: item.categoryName || item.category || "여행용품",
        isRocket: Boolean(item.isRocket),
        isFreeShipping: Boolean(item.isFreeShipping)
      };
    })
    .filter((item) => item.title && item.url)
    .slice(0, 4);
}

function renderDetailCoupangProducts(items, payload = {}) {
  const section = document.querySelector("[data-coupang-products]");
  const grid = section?.querySelector("[data-coupang-products-grid]");
  const moreLink = section?.querySelector("[data-coupang-products-more]");
  if (!section || !grid) return;

  const copy = coupangTravelCopy(state.article || {});
  if (!items.length) {
    section.hidden = true;
    grid.innerHTML = "";
    return;
  }

  section.hidden = false;
  const landingUrl = normalizeExternalUrl(payload?.data?.landingUrl || payload?.landingUrl || "");
  if (moreLink && landingUrl) moreLink.href = landingUrl;

  grid.innerHTML = items.map((item) => {
    const badges = [
      item.isRocket ? copy.badgeRocket : "",
      item.isFreeShipping ? copy.badgeShipping : ""
    ].filter(Boolean);

    return `
      <article class="coupang-product-card">
        <a href="${escapeHtml(item.url)}" target="_blank" rel="sponsored noopener noreferrer" aria-label="${escapeHtml(`${item.title} 상품 보기`)}">
          ${item.image
            ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy" />`
            : `<div class="coupang-product-placeholder" aria-hidden="true">CP</div>`}
          <span>${escapeHtml(item.category)}</span>
          <strong>${escapeHtml(item.title)}</strong>
          <small>${escapeHtml(formatWon(item.price))}${badges.length ? ` · ${escapeHtml(badges.join(" · "))}` : ""}</small>
        </a>
      </article>
    `;
  }).join("");
}

async function hydrateDetailCoupangProducts(article = state.article) {
  const section = document.querySelector("[data-coupang-products]");
  if (!section) return;

  const keyword = section.dataset.coupangKeyword || coupangTravelKeyword(article);

  try {
    const payload = await fetchDetailCoupangProducts(keyword, 4);
    const items = normalizeDetailCoupangProducts(payload);
    state.coupang = {
      items,
      loaded: true,
      error: false,
      landingUrl: normalizeExternalUrl(payload?.data?.landingUrl || payload?.landingUrl || "")
    };
    renderDetailCoupangProducts(items, payload);
  } catch (error) {
    console.warn("Coupang travel products could not be loaded.", error);
    state.coupang = {
      items: [],
      loaded: true,
      error: true,
      landingUrl: ""
    };
    section.hidden = true;
  }
}

function CleanClosingSection(article) {
  const copy = detailCopy();
  const eventName = localizedEventReference(article);
  const destination = detailDestinationKeyword(article);
  const category = usefulValue(article.category) || displayArticleCategory(article);
  const schedule = usefulValue(article.date) || copy.fallbacks.date;

  if (state.language !== "ko") {
    return `
      <section class="clean-article-section clean-closing-section">
        <h2>${escapeHtml(copy.closingTitle)}</h2>
        <p>${escapeHtml(copy.closing(eventName))}</p>
      </section>
    `;
  }

  return `
    <section class="clean-article-section clean-closing-section">
      <h2>방문을 마치며</h2>
      <p>${escapeHtml(eventName)}은 ${destination} 일대에서 일정과 동선을 함께 보고 계획하면 만족도가 높아지는 ${category} 콘텐츠입니다. 단순히 행사 하나만 보고 이동하기보다, 근처 여행지와 식사·카페 시간을 같이 묶으면 하루 코스가 훨씬 자연스럽습니다.</p>
      <p>${escapeHtml(schedule)} 일정 기준으로 안내되지만, 현장 운영 시간과 예약 방식은 변경될 수 있습니다. 출발 전 공식 안내, 지도 앱의 이동 시간, 주변 주차 가능 여부를 한 번 더 확인해 주세요.</p>
      <div class="closing-check-list" aria-label="마지막 체크 포인트">
        <strong>마지막 체크 포인트</strong>
        <ul>
          <li>운영 시간과 입장 마감 시간을 확인하기</li>
          <li>대중교통 막차 시간이나 주차장 위치를 미리 저장하기</li>
          <li>걷는 시간이 길다면 보조배터리, 물, 가벼운 가방을 챙기기</li>
        </ul>
      </div>
    </section>
  `;
}

function bookingSearchUrl(kind, article) {
  const params = new URLSearchParams({ booking: kind });
  const destination = detailDestinationKeyword(article);

  if (kind === "stay") params.set("keyword", destination);
  if (kind === "tour") params.set("keyword", detailTourSearchKeyword(article));
  if (kind === "flight") {
    params.set("depCityCd", "ICN");
    params.set("arrCityCds", "CJU,BKK,NRT");
  }

  return `index.html?${params.toString()}#bookingSearch`;
}

function bookingCheckCopy(article) {
  const eventName = localizedEventReference(article);
  const region = travelRegionName(article) || "서울";
  const table = {
    ko: {
      eyebrow: "Before You Go",
      title: "방문 전 예약 체크",
      desc: `${eventName} 방문 전에는 일정뿐 아니라 숙소, 입장권, 이동 계획까지 함께 확인하면 동선이 훨씬 안정적입니다.`,
      cards: [
        ["stay", "근처 숙소 찾기", `${region} 주변 숙소 위치와 가격을 비교해 보세요.`, "숙소 검색"],
        ["tour", "관련 티켓 보기", "전시, 공연, 체험 상품을 함께 확인해 보세요.", "티켓 검색"],
        ["flight", "항공권 확인", "서울 출발 항공권 흐름을 빠르게 비교해 보세요.", "항공권 검색"]
      ]
    },
    en: {
      eyebrow: "Before You Go",
      title: "Check bookings before your visit",
      desc: `Before visiting ${eventName}, compare nearby stays, tickets, and transport options so the day is easier to plan.`,
      cards: [
        ["stay", "Nearby stays", `Compare places to stay around ${region}.`, "Search stays"],
        ["tour", "Tickets and activities", "Check related exhibitions, shows, and activities.", "Search tickets"],
        ["flight", "Flights", "Compare flight price trends from Seoul.", "Search flights"]
      ]
    },
    ja: {
      eyebrow: "Before You Go",
      title: "訪問前の予約チェック",
      desc: `${eventName}へ行く前に、周辺宿泊、チケット、移動手段を一緒に確認すると計画しやすくなります。`,
      cards: [
        ["stay", "周辺宿泊を探す", `${region}周辺の宿泊先を比較できます。`, "宿泊検索"],
        ["tour", "関連チケットを見る", "展示、公演、体験商品を確認できます。", "チケット検索"],
        ["flight", "航空券を確認", "ソウル発の航空券の流れを比較できます。", "航空券検索"]
      ]
    },
    zh: {
      eyebrow: "Before You Go",
      title: "出发前预约确认",
      desc: `前往 ${eventName} 之前，建议同时查看附近住宿、门票和交通安排。`,
      cards: [
        ["stay", "查找附近住宿", `比较 ${region} 周边住宿。`, "搜索住宿"],
        ["tour", "查看相关门票", "查看展览、演出和体验商品。", "搜索门票"],
        ["flight", "查看机票", "比较首尔出发机票价格趋势。", "搜索机票"]
      ]
    }
  };

  return table[state.language] || table.ko;
}

function BookingCheckSection(article) {
  const copy = bookingCheckCopy(article);
  return `
    <section class="booking-check-section" aria-labelledby="bookingCheckTitle">
      <p class="eyebrow">${escapeHtml(copy.eyebrow)}</p>
      <h2 id="bookingCheckTitle">${escapeHtml(copy.title)}</h2>
      <p>${escapeHtml(copy.desc)}</p>
      <div class="booking-check-grid">
        ${copy.cards.map(([kind, title, body, cta]) => `
          <a class="booking-check-card" href="${escapeHtml(bookingSearchUrl(kind, article))}">
            <span>${escapeHtml(kind === "stay" ? "STAY" : kind === "tour" ? "TICKET" : "AIR")}</span>
            <strong>${escapeHtml(title)}</strong>
            <small>${escapeHtml(body)}</small>
            <em>${escapeHtml(cta)}</em>
          </a>
        `).join("")}
      </div>
    </section>
  `;
}

function renderTravelDetailBody(article, sections) {
  return `
    ${CleanIntroSection(article)}
    ${CleanInfoSection(article)}
    ${CleanHighlightSection(article)}
    ${renderImageGallery(article)}
    ${CleanOfficialInfoSection(article)}
    ${NearbyParkingSection(article)}
    ${NearbyTravelSection(article)}
    ${CleanVisitTipSection(article)}
    ${BookingCheckSection(article)}
    ${CoupangTravelProductsSection(article)}
    ${CleanClosingSection(article)}
  `;
}

async function init() {
  applyStaticLanguage();
  bindLanguageSwitch();
  renderRelated();

  try {
    if (source === "seoul" && id) {
      const article = fallbackArticleFromParams();
      state.article = article;
      renderArticle(article);
      renderRelated(article.id);
      return;
    }

    if (source === "tour" && id) {
      const fallbackArticle = fallbackArticleFromParams();
      state.article = fallbackArticle;
      renderArticle(fallbackArticle);
      renderRelated(fallbackArticle.id);
    }

    const article = source === "tour" && id ? await fetchTourDetail(id) : findLocalArticle();

    state.article = article;
    renderArticle(article);
    renderRelated(article.id);
  } catch (error) {
    console.warn("Detail load failed. Fallback article is displayed.", error);
    const article = source === "tour" && id ? fallbackArticleFromParams() : findLocalArticle();
    state.article = article;
    renderArticle(article);
    renderRelated(article.id);
  }
}

document.addEventListener("DOMContentLoaded", init);
