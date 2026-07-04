const data = window.TRAVEL_PORTAL_DATA;
const supportedLanguages = ["ko", "en", "ja", "zh"];
const state = {
  apiArticles: [],
  julyArticles: [],
  apiLoaded: false,
  activeRegionId: "all",
  language: getStoredLanguage()
};

const I18N = {
  ko: {
    "meta.title": "페스티벌 노트 | 전국 축제 정보 매거진",
    "brand.name": "페스티벌 노트",
    "brand.tagline": "전국 축제 정보 매거진",
    "footer.tagline": "축제 선택을 돕는 정보 포털",
    "footer.description": "전국 축제 일정, 방문 준비, 교통과 숙소 체크 정보를 한 흐름으로 연결하는 축제 매거진입니다.",
    "nav.menu": "메뉴 열기",
    "nav.july": "7월 축제",
    "nav.places": "지역별 축제",
    "nav.booking": "방문 전 체크",
    "nav.guide": "방문 가이드",
    "july.title": "2026년 7월 축제 모아보기",
    "july.description": "7월에 열리거나 7월 일정이 포함된 축제를 한곳에 모았습니다. 마음에 드는 축제를 누르면 일정, 장소, 사진, 방문 전 체크사항을 자세히 볼 수 있습니다.",
    "july.loading": "7월 축제 목록을 불러오는 중입니다.",
    "july.count": "총 {count}개의 7월 축제를 모았습니다.",
    "july.error": "7월 축제 목록을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.",
    "places.title": "지역별 축제 찾기",
    "places.title.all": "지역별 축제 찾기",
    "places.title.region": "{region} 축제 정보",
    "places.description": "서울, 경기, 인천부터 제주까지 지역별 축제 정보를 확인하고, 일정·장소·요금·교통 정보를 함께 살펴보세요.",
    "booking.title": "가기 전에 확인하면 좋은 것들",
    "booking.description": "축제장은 날짜와 시간에 따라 혼잡도와 이동 동선이 달라집니다. 숙소, 교통, 입장권, 우천 운영 기준을 미리 확인해 두세요.",
    "booking.link": "체크하기",
    "curation.title": "함께 보면 좋은 축제 글",
    "info.title": "축제 방문 준비",
    "info.description": "축제 일정, 준비물, 교통, 예약 전 체크 정보를 목적별로 나누어 정리했습니다.",
    "faq.title": "이용 가이드",
    "common.more": "더보기",
    "common.all": "전체 보기",
    "card.detail": "자세히 보기",
    "read.festival": "축제 정보",
    "read.detail": "상세 보기",
    "summary.festival": "{address}에서 열리는 축제입니다. 방문 전 운영 시간, 교통 통제, 주차와 우천 운영 여부를 확인해 보세요.",
    "summary.festivalFallback": "방문 전 행사 시간, 장소, 교통과 우천 운영 여부를 확인하면 더 편하게 즐길 수 있는 축제 정보입니다.",
    "summary.july": "{address}에서 열리는 7월 축제입니다. 운영 시간, 입장 방식, 교통과 우천 운영 여부를 함께 확인해 보세요.",
    "summary.julyFallback": "7월 일정이 포함된 축제입니다. 방문 전 일정, 장소, 요금, 교통 정보를 확인해 보세요."
  },
  en: {
    "meta.title": "Festival Note | Korea Festival Magazine",
    "brand.name": "Festival Note",
    "brand.tagline": "Korea festival magazine",
    "footer.tagline": "A guide for choosing festivals",
    "footer.description": "A festival magazine that connects schedules, travel preparation, transport, and lodging checks in one flow.",
    "nav.menu": "Open menu",
    "nav.july": "July Festivals",
    "nav.places": "By Region",
    "nav.booking": "Before You Go",
    "nav.guide": "Visit Guide",
    "july.title": "July 2026 Festivals",
    "july.description": "Browse festivals taking place in July or including July dates. Open a card to see schedule, location, photos, and visit checks.",
    "july.loading": "Loading July festivals.",
    "july.count": "{count} July festivals collected.",
    "july.error": "Could not load July festivals. Please try again later.",
    "places.title": "Find Festivals by Region",
    "places.title.all": "Find Festivals by Region",
    "places.title.region": "{region} Festival Guide",
    "places.description": "Check festivals by region, from Seoul and Gyeonggi to Jeju, with schedule, place, fee, and transport notes.",
    "booking.title": "What to Check Before You Go",
    "booking.description": "Festival crowd levels and routes vary by date and time. Check lodging, transport, tickets, and rain policy before visiting.",
    "booking.link": "Check",
    "curation.title": "Festival Articles to Read Next",
    "info.title": "Festival Visit Prep",
    "info.description": "Festival schedules, packing tips, transport, and booking checks are grouped by visitor intent.",
    "faq.title": "User Guide",
    "common.more": "More",
    "common.all": "View all",
    "card.detail": "View details",
    "read.festival": "Festival info",
    "read.detail": "Details",
    "summary.festival": "A festival held at {address}. Before visiting, check operating hours, transport restrictions, parking, and rain policy.",
    "summary.festivalFallback": "Festival information to review before visiting, including time, location, transport, and rain policy.",
    "summary.july": "A July festival held at {address}. Check operating hours, entry method, transport, and rain policy before visiting.",
    "summary.julyFallback": "A festival that includes July dates. Check schedule, location, fees, and transport before visiting."
  },
  ja: {
    "meta.title": "フェスティバルノート | 韓国フェスティバルマガジン",
    "brand.name": "フェスティバルノート",
    "brand.tagline": "韓国フェスティバル情報マガジン",
    "footer.tagline": "フェス選びを助ける情報ポータル",
    "footer.description": "全国のフェス日程、訪問準備、交通、宿泊チェックをひとつの流れで確認できるマガジンです。",
    "nav.menu": "メニューを開く",
    "nav.july": "7月のフェス",
    "nav.places": "地域別",
    "nav.booking": "訪問前チェック",
    "nav.guide": "訪問ガイド",
    "july.title": "2026年7月のフェス一覧",
    "july.description": "7月に開催される、または7月の日程を含むフェスをまとめました。カードを開くと日程、場所、写真、訪問前チェックを確認できます。",
    "july.loading": "7月のフェス一覧を読み込んでいます。",
    "july.count": "7月のフェスを{count}件まとめました。",
    "july.error": "7月のフェス一覧を読み込めませんでした。時間をおいてもう一度確認してください。",
    "places.title": "地域別フェスを探す",
    "places.title.all": "地域別フェスを探す",
    "places.title.region": "{region}のフェス情報",
    "places.description": "ソウル、京畿、仁川から済州まで、地域別フェスの日程・場所・料金・交通情報を確認できます。",
    "booking.title": "訪問前に確認したいこと",
    "booking.description": "フェス会場は日時によって混雑や動線が変わります。宿泊、交通、チケット、雨天時の運営基準を事前に確認しましょう。",
    "booking.link": "確認する",
    "curation.title": "あわせて読みたいフェス記事",
    "info.title": "フェス訪問準備",
    "info.description": "日程、持ち物、交通、予約前チェックを目的別に整理しました。",
    "faq.title": "利用ガイド",
    "common.more": "もっと見る",
    "common.all": "すべて見る",
    "card.detail": "詳しく見る",
    "read.festival": "フェス情報",
    "read.detail": "詳細",
    "summary.festival": "{address}で開催されるフェスです。訪問前に運営時間、交通規制、駐車、雨天時の案内を確認しましょう。",
    "summary.festivalFallback": "訪問前に時間、場所、交通、雨天時の案内を確認したいフェス情報です。",
    "summary.july": "{address}で開催される7月のフェスです。運営時間、入場方法、交通、雨天時の案内を確認しましょう。",
    "summary.julyFallback": "7月の日程を含むフェスです。訪問前に日程、場所、料金、交通情報を確認しましょう。"
  },
  zh: {
    "meta.title": "Festival Note | 韩国庆典信息杂志",
    "brand.name": "Festival Note",
    "brand.tagline": "韩国庆典信息杂志",
    "footer.tagline": "帮助选择庆典的信息门户",
    "footer.description": "这里把全国庆典日程、出行准备、交通和住宿确认事项整理成一个清晰的浏览流程。",
    "nav.menu": "打开菜单",
    "nav.july": "7月庆典",
    "nav.places": "按地区查找",
    "nav.booking": "出发前确认",
    "nav.guide": "参观指南",
    "july.title": "2026年7月庆典汇总",
    "july.description": "这里汇总了7月举办或日程包含7月的庆典。点击卡片可查看日程、地点、照片和出发前确认事项。",
    "july.loading": "正在加载7月庆典列表。",
    "july.count": "已汇总{count}个7月庆典。",
    "july.error": "无法加载7月庆典列表，请稍后再试。",
    "places.title": "按地区查找庆典",
    "places.title.all": "按地区查找庆典",
    "places.title.region": "{region}庆典信息",
    "places.description": "从首尔、京畿、仁川到济州，按地区查看庆典日程、地点、费用和交通信息。",
    "booking.title": "出发前建议确认",
    "booking.description": "庆典现场会因日期和时间而有不同的人流和动线。请提前确认住宿、交通、门票和雨天安排。",
    "booking.link": "查看",
    "curation.title": "推荐一起阅读的庆典文章",
    "info.title": "庆典出行准备",
    "info.description": "按目的整理庆典日程、携带物品、交通和预约前确认事项。",
    "faq.title": "使用指南",
    "common.more": "查看更多",
    "common.all": "查看全部",
    "card.detail": "查看详情",
    "read.festival": "庆典信息",
    "read.detail": "详情",
    "summary.festival": "这是在{address}举行的庆典。出发前请确认开放时间、交通管制、停车和雨天安排。",
    "summary.festivalFallback": "出发前建议确认时间、地点、交通和雨天安排的庆典信息。",
    "summary.july": "这是在{address}举行的7月庆典。请提前确认开放时间、入场方式、交通和雨天安排。",
    "summary.julyFallback": "这是日程包含7月的庆典。出发前请确认日程、地点、费用和交通信息。"
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
  const table = I18N[state.language] || I18N.ko;
  const template = table[key] || I18N.ko[key] || key;
  return template.replace(/\{(\w+)\}/g, (_, name) => params[name] ?? "");
}

function applyLanguage() {
  document.documentElement.lang = state.language === "zh" ? "zh-Hans" : state.language;
  document.title = textFor("meta.title");

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = textFor(element.dataset.i18n);
  });

  document.querySelectorAll("[data-lang]").forEach((button) => {
    const isActive = button.dataset.lang === state.language;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  updateRegionHeading();
  renderHero();
  renderPlaces();
  renderBooking();
  renderCuration();
  renderJulyFestivals();
}

function bindLanguageSwitch() {
  const switcher = $("#languageSwitch");
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
      // Ignore storage failures; the language still changes for this session.
    }
    applyLanguage();
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function imageMarkup(item, size = "card") {
  return `
    <div class="image-frame image-frame--${size}">
      <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy" />
    </div>
  `;
}

function displaySummary(item) {
  if (item.summaryKey) return textFor(item.summaryKey, item.summaryParams || {});
  return item.summary || "";
}

function displayReadTime(item) {
  if (item.readTimeKey) return textFor(item.readTimeKey);
  return item.readTime || "";
}

function articleMeta(item) {
  return `<span>${escapeHtml(item.date)}</span><span>${escapeHtml(displayReadTime(item))}</span>`;
}

function detailUrl(item) {
  if (item.source === "tour" && item.contentId) {
    return `festival-detail?source=tour&id=${encodeURIComponent(item.contentId)}`;
  }

  return `festival-detail?id=${encodeURIComponent(item.id)}`;
}

function articleCard(item, variant = "") {
  return `
    <article class="article-card ${variant}">
      <a href="${escapeHtml(detailUrl(item))}" aria-label="${escapeHtml(`${item.title} ${textFor("card.detail")}`)}">
        ${imageMarkup(item)}
        <span class="category-label">${escapeHtml(item.category)}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(displaySummary(item))}</p>
        <div class="article-meta">${articleMeta(item)}</div>
      </a>
    </article>
  `;
}

function contentTypeName(contentTypeId) {
  const map = {
    12: "관광지",
    14: "문화시설",
    15: "축제",
    25: "여행코스",
    28: "레포츠",
    32: "숙소",
    38: "쇼핑",
    39: "음식점"
  };
  return map[Number(contentTypeId)] || "여행 정보";
}

function compactDate(value) {
  if (!value || String(value).length !== 8) return "";
  const text = String(value);
  return `${text.slice(0, 4)}.${text.slice(4, 6)}.${text.slice(6, 8)}`;
}

function todayCompact() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

function activeRegion() {
  const regions = data.regions || [];
  return regions.find((region) => region.id === state.activeRegionId) || regions[0] || { id: "all", label: "전국", areaCode: "" };
}

function normalizeTourItems(items, regionOverride = activeRegion()) {
  const list = Array.isArray(items) ? items : items ? [items] : [];
  const fallbackImage = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80";

  return list
    .filter((item) => item && item.title)
    .map((item, index) => {
      const image = item.firstimage || item.firstimage2 || fallbackImage;
      const address = [item.addr1, item.addr2].filter(Boolean).join(" ");
      const region = regionOverride || activeRegion();
      const category = data.tourApi?.mode === "festival" ? `${region.label} 축제` : contentTypeName(item.contenttypeid);
      const startDate = compactDate(item.eventstartdate);
      const endDate = compactDate(item.eventenddate);
      const period = startDate && endDate ? `${startDate} - ${endDate}` : startDate || "축제 일정";

      return {
        id: `tour-api-${item.contentid || index}`,
        source: "tour",
        contentId: item.contentid,
        contentTypeId: item.contenttypeid || 15,
        category,
        title: item.title,
        summaryKey: address ? "summary.festival" : "summary.festivalFallback",
        summaryParams: { address },
        date: period,
        readTimeKey: "read.festival",
        image: String(image).replace(/^http:/, "https:"),
        href: "#places"
      };
    });
}

function buildTourApiUrl(areaCode = activeRegion().areaCode) {
  const config = data.tourApi;
  const params = new URLSearchParams({
    serviceKey: config.serviceKey,
    numOfRows: String(config.numOfRows || 8),
    pageNo: String(config.pageNo || 1),
    MobileOS: config.mobileOS || "ETC",
    MobileApp: config.mobileApp || "TravelNoteHub",
    _type: "json",
    arrange: config.arrange || "O"
  });

  if (config.mode === "festival") {
    params.set("eventStartDate", config.eventStartDate || todayCompact());
  }

  if (config.contentTypeId) {
    params.set("contentTypeId", config.contentTypeId);
  }

  if (areaCode) {
    params.set("areaCode", areaCode);
  }

  return `${config.endpoint}?${params.toString()}`;
}

function regionAreaCodes(region) {
  if (Array.isArray(region.areaCodes)) return region.areaCodes.filter(Boolean);
  return region.areaCode ? [region.areaCode] : [""];
}

function buildJulyFestivalUrl(pageNo = 1, numOfRows = 100) {
  const config = data.tourApi;
  const params = new URLSearchParams({
    serviceKey: config.serviceKey,
    numOfRows: String(numOfRows),
    pageNo: String(pageNo),
    MobileOS: config.mobileOS || "ETC",
    MobileApp: config.mobileApp || "FestivalNoteHub",
    _type: "json",
    arrange: config.arrange || "O",
    eventStartDate: "20260701"
  });

  return `${config.endpoint}?${params.toString()}`;
}

function overlapsJulyFestival(item) {
  const start = String(item.eventstartdate || "");
  const end = String(item.eventenddate || start);
  return start <= "20260731" && end >= "20260701";
}

function regionLabelFromAddress(address) {
  const first = String(address || "").split(" ")[0] || "전국";
  return first
    .replace("특별시", "")
    .replace("광역시", "")
    .replace("특별자치시", "")
    .replace("특별자치도", "")
    .replace("도", "")
    .replace("북", "북")
    .replace("남", "남");
}

function normalizeJulyFestivalItems(items) {
  const list = Array.isArray(items) ? items : items ? [items] : [];
  const fallbackImage = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80";

  return list
    .filter((item) => item && item.title && overlapsJulyFestival(item))
    .sort((a, b) => String(a.eventstartdate || "").localeCompare(String(b.eventstartdate || "")))
    .map((item, index) => {
      const image = item.firstimage || item.firstimage2 || fallbackImage;
      const address = [item.addr1, item.addr2].filter(Boolean).join(" ");
      const startDate = compactDate(item.eventstartdate);
      const endDate = compactDate(item.eventenddate);
      const period = startDate && endDate ? `${startDate} - ${endDate}` : startDate || "7월 진행";
      const region = regionLabelFromAddress(item.addr1);

      return {
        id: `july-festival-${item.contentid || index}`,
        source: "tour",
        contentId: item.contentid,
        contentTypeId: item.contenttypeid || 15,
        category: `${region} 7월 축제`,
        title: item.title,
        summaryKey: address ? "summary.july" : "summary.julyFallback",
        summaryParams: { address },
        date: period,
        readTimeKey: "read.detail",
        image: String(image).replace(/^http:/, "https:")
      };
    });
}

async function loadTourApiPlaces() {
  if (!data.tourApi?.serviceKey || !data.tourApi?.endpoint) return;

  const requestRegionId = state.activeRegionId;
  const region = activeRegion();
  const areaCodes = regionAreaCodes(region);
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 6500);

  try {
    const responses = await Promise.all(
      areaCodes.map(async (areaCode) => {
        const response = await fetch(buildTourApiUrl(areaCode), { signal: controller.signal });
        if (!response.ok) throw new Error(`TourAPI HTTP ${response.status}`);
        return response.json();
      })
    );

    const items = responses.flatMap((payload) => {
      const rawItems = payload?.response?.body?.items?.item;
      return Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];
    });
    const dedupedItems = [...new Map(items.map((item, index) => [item.contentid || `${item.title}-${index}`, item])).values()];
    const apiArticles = normalizeTourItems(dedupedItems, region);

    if (requestRegionId !== state.activeRegionId) return;

    if (apiArticles.length) {
      state.apiArticles = apiArticles;
      state.apiLoaded = true;
      renderPlaces();
      renderCuration();
    }
  } catch (error) {
    console.warn("TourAPI request failed. Fallback content is displayed.", error);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function renderJulyFestivals() {
  const status = $("#julyStatus");
  const grid = $("#julyGrid");
  if (!status || !grid) return;

  if (!state.julyArticles.length) {
    status.textContent = textFor("july.loading");
    grid.innerHTML = "";
    return;
  }

  status.textContent = textFor("july.count", { count: state.julyArticles.length });
  grid.innerHTML = state.julyArticles
    .map((item) => articleCard(item))
    .join("");
}

function readJulyFestivalCache() {
  try {
    const cached = window.sessionStorage.getItem("festivalNote.julyArticles.v1");
    if (!cached) return [];

    const parsed = JSON.parse(cached);
    if (!Array.isArray(parsed.items)) return [];
    if (Date.now() - Number(parsed.savedAt || 0) > 6 * 60 * 60 * 1000) return [];

    return parsed.items;
  } catch {
    return [];
  }
}

function writeJulyFestivalCache(items) {
  try {
    window.sessionStorage.setItem(
      "festivalNote.julyArticles.v1",
      JSON.stringify({ savedAt: Date.now(), items })
    );
  } catch {
    // Cache failures should not block rendering.
  }
}

async function loadJulyFestivalPosts() {
  if (!data.tourApi?.serviceKey || !data.tourApi?.endpoint) return;

  const cached = readJulyFestivalCache();
  if (cached.length) {
    state.julyArticles = cached;
    renderJulyFestivals();
    return;
  }

  const numOfRows = 100;
  const collected = [];

  try {
    for (let pageNo = 1; pageNo <= 6; pageNo += 1) {
      const response = await fetch(buildJulyFestivalUrl(pageNo, numOfRows));
      if (!response.ok) throw new Error(`July festival HTTP ${response.status}`);

      const payload = await response.json();
      const body = payload?.response?.body || {};
      const items = body?.items?.item;
      const totalCount = Number(body.totalCount || body.total_count || 0);
      const list = Array.isArray(items) ? items : items ? [items] : [];
      collected.push(...list);

      if (!list.length || pageNo * numOfRows >= totalCount) break;
    }

    const deduped = [...new Map(
      normalizeJulyFestivalItems(collected).map((item) => [item.contentId || item.id, item])
    ).values()];

    state.julyArticles = deduped;
    writeJulyFestivalCache(deduped);
    renderJulyFestivals();
  } catch (error) {
    console.warn("July festival posts could not be loaded.", error);
    const status = $("#julyStatus");
    if (status) status.textContent = textFor("july.error");
  }
}

function renderTodayKeywords() {
  $("#todayKeywords").innerHTML = data.todayKeywords
    .map((keyword) => `<a href="#" aria-label="${escapeHtml(keyword)} 키워드 보기">${escapeHtml(keyword)}</a>`)
    .join("");
}

function updateRegionHeading() {
  const region = activeRegion();
  const title = $("#placesTitle");
  if (title) {
    title.textContent = region.id === "all"
      ? textFor("places.title.all")
      : textFor("places.title.region", { region: region.label });
  }
}

function renderRegionChips() {
  const target = $("#regionList");
  if (!target) return;

  target.innerHTML = (data.regions || [])
    .map((region) => `
      <button
        class="region-button ${region.id === state.activeRegionId ? "is-active" : ""}"
        type="button"
        data-region-id="${escapeHtml(region.id)}"
        aria-pressed="${region.id === state.activeRegionId ? "true" : "false"}"
      >
        ${escapeHtml(region.label)}
      </button>
    `)
    .join("");
}

function bindRegionChips() {
  const target = $("#regionList");
  if (!target) return;

  target.addEventListener("click", (event) => {
    const button = event.target.closest("[data-region-id]");
    if (!button) return;

    const regionId = button.getAttribute("data-region-id");
    if (!regionId || regionId === state.activeRegionId) return;

    state.activeRegionId = regionId;
    state.apiArticles = [];
    state.apiLoaded = false;
    renderRegionChips();
    updateRegionHeading();
    renderPlaces();
    renderCuration();
    loadTourApiPlaces();
  });
}

function renderHero() {
  const [featured, ...latest] = data.articles;
  const sideItems = latest.slice(0, 4);

  $("#heroGrid").innerHTML = `
    <article class="hero-featured">
      <a href="${escapeHtml(detailUrl(featured))}" aria-label="${escapeHtml(`${featured.title} ${textFor("card.detail")}`)}">
        ${imageMarkup(featured, "hero")}
        <div class="hero-featured__body">
          <span class="category-label">${escapeHtml(featured.category)}</span>
          <h2>${escapeHtml(featured.title)}</h2>
          <p>${escapeHtml(featured.summary)}</p>
          <div class="article-meta">${articleMeta(featured)}</div>
        </div>
      </a>
    </article>
    <div class="hero-side">
      ${sideItems.map((item) => `
        <article class="side-card">
          <a href="${escapeHtml(detailUrl(item))}">
            ${imageMarkup(item, "thumb")}
            <span>
              <em>${escapeHtml(item.category)}</em>
              <strong>${escapeHtml(item.title)}</strong>
              <small>${escapeHtml(item.date)} · ${escapeHtml(item.readTime)}</small>
            </span>
          </a>
        </article>
      `).join("")}
    </div>
  `;
}

function renderPlaces() {
  const items = [...state.apiArticles, ...data.articles.slice(1)].slice(0, 12);

  $("#placesGrid").innerHTML = items
    .map((item) => articleCard(item))
    .join("");
}

function renderBooking() {
  $("#bookingGrid").innerHTML = data.bookingChecks.map((item) => `
    <article class="booking-card">
      <span>${escapeHtml(item.label)}</span>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.summary)}</p>
      <a href="${escapeHtml(item.href)}">${escapeHtml(textFor("booking.link"))}</a>
    </article>
  `).join("");
}

function renderCuration() {
  const items = [...state.apiArticles.slice(0, 2), ...data.articles.slice(2, 8)].slice(0, 6);

  $("#curationList").innerHTML = items
    .map((item) => `
      <article class="curation-card">
        <a href="${escapeHtml(detailUrl(item))}">
          ${imageMarkup(item, "thumb")}
          <span>
            <em>${escapeHtml(item.category)}</em>
            <strong>${escapeHtml(item.title)}</strong>
            <small>${escapeHtml(displaySummary(item))}</small>
          </span>
        </a>
      </article>
    `)
    .join("");
}

function renderCategoryGroups() {
  $("#categoryGroups").innerHTML = data.categoryGroups.map((group) => `
    <article class="category-group">
      <h3>${escapeHtml(group.title)}</h3>
      <p>${escapeHtml(group.summary)}</p>
      <div>
        ${group.links.map((link) => `<a href="#">${escapeHtml(link)}</a>`).join("")}
      </div>
    </article>
  `).join("");
}

function renderFaq() {
  $("#faqList").innerHTML = data.faq.map((item, index) => `
    <details ${index === 0 ? "open" : ""}>
      <summary>${escapeHtml(item.question)}</summary>
      <p>${escapeHtml(item.answer)}</p>
    </details>
  `).join("");
}

function renderFooter() {
  $("#footerLinks").innerHTML = data.footerGroups.map((group) => `
    <nav aria-label="${escapeHtml(group.title)}">
      <h2>${escapeHtml(group.title)}</h2>
      ${group.links.map((link) => `<a href="#">${escapeHtml(link)}</a>`).join("")}
    </nav>
  `).join("");
}

function bindMenu() {
  const button = $("#menuToggle");
  const nav = $("#primaryNav");

  button.addEventListener("click", () => {
    const isOpen = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!isOpen));
    nav.classList.toggle("is-open", !isOpen);
  });
}

function init() {
  renderTodayKeywords();
  renderRegionChips();
  updateRegionHeading();
  renderHero();
  renderJulyFestivals();
  renderPlaces();
  renderBooking();
  renderCuration();
  renderCategoryGroups();
  renderFaq();
  renderFooter();
  bindMenu();
  bindRegionChips();
  bindLanguageSwitch();
  applyLanguage();
  loadTourApiPlaces();
  loadJulyFestivalPosts();
}

document.addEventListener("DOMContentLoaded", init);
