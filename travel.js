const data = window.TRAVEL_PORTAL_DATA;
const supportedLanguages = ["ko", "en", "ja", "zh"];
const MRT_FETCH_TIMEOUT_MS = 12000;
const state = {
  apiArticles: [],
  julyArticles: [],
  myrealtrip: {
    tours: [],
    stays: [],
    flights: [],
    loaded: false,
    error: false
  },
  coupang: {
    items: [],
    loaded: false,
    error: false,
    keyword: "여행 준비물"
  },
  activeMrtTab: "stay",
  apiLoaded: false,
  apiError: false,
  activeRegionId: "seoul",
  activeCategoryFilter: "all",
  newsLoading: true,
  language: getStoredLanguage()
};

const MRT_SEARCH_COPY = {
  stay: {
    title: "여행지 선택",
    description: "지역이나 숙소명을 입력하거나 인기 지역을 선택하세요."
  },
  tour: {
    title: "상품 선택",
    description: "입장권, 전시, 공연, 체험 상품을 빠르게 찾아보세요."
  },
  flight: {
    title: "출발지 선택",
    description: "출발지와 도착지를 선택하고 최저가 흐름을 확인하세요."
  }
};

const I18N = {
  ko: {
    "meta.title": "서울여행뉴스 | 서울 여행 정보 뉴스",
    "brand.name": "서울여행뉴스",
    "brand.tagline": "서울 여행 정보 뉴스",
    "footer.tagline": "서울 여행 선택을 돕는 뉴스 포털",
    "footer.description": "서울 문화행사, 축제 일정, 방문 준비, 교통과 주변 여행 정보를 뉴스 피드로 정리합니다.",
    "nav.menu": "메뉴 열기",
    "nav.home": "홈",
    "nav.july": "여행뉴스",
    "nav.places": "가볼만한 곳",
    "nav.booking": "여행검색",
    "july.title": "오늘 볼 만한 서울 여행 뉴스",
    "july.description": "서울 축제, 계절 행사, 산책 코스와 방문 전 체크 정보를 뉴스 피드 형식으로 정리했습니다.",
    "july.loading": "서울 축제 정보를 불러오는 중입니다.",
    "july.count": "총 {count}개의 서울 여행 기사를 불러왔습니다.",
    "july.error": "서울 축제 정보를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.",
    "places.title": "서울 축제 찾기",
    "places.title.all": "서울 축제 찾기",
    "places.title.region": "서울 축제 정보",
    "places.description": "서울에서 열리는 축제와 여행 정보를 일정·장소·요금·교통 정보와 함께 살펴보세요.",
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
    "summary.festival": "{address}에서 열리는 서울 축제입니다. 방문 전 운영 시간, 교통 통제, 주차와 우천 운영 여부를 확인해 보세요.",
    "summary.festivalFallback": "방문 전 행사 시간, 장소, 교통과 우천 운영 여부를 확인하면 더 편하게 즐길 수 있는 서울 축제 정보입니다.",
    "summary.july": "{address}에서 열리는 서울 7월 축제입니다. 운영 시간, 입장 방식, 교통과 우천 운영 여부를 함께 확인해 보세요.",
    "summary.julyFallback": "7월 일정이 포함된 서울 축제입니다. 방문 전 일정, 장소, 요금, 교통 정보를 확인해 보세요."
  },
  en: {
    "meta.title": "Seoul Travel News | Seoul Travel Information",
    "brand.name": "Seoul Travel News",
    "brand.tagline": "Seoul travel information",
    "footer.tagline": "A news guide for Seoul trips",
    "footer.description": "A Seoul travel news feed covering cultural events, festivals, visit preparation, transport, and nearby information.",
    "nav.menu": "Open menu",
    "nav.home": "Home",
    "nav.july": "Travel News",
    "nav.places": "Places",
    "nav.booking": "Search",
    "july.title": "Festival News to Read Today",
    "july.description": "Browse Seoul festival and travel information in a mobile news feed with one featured story, recommended cards, and the latest list.",
    "july.loading": "Loading July festivals.",
    "july.count": "{count} festival stories loaded.",
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
    "meta.title": "ソウル旅行ニュース | ソウル旅行情報",
    "brand.name": "ソウル旅行ニュース",
    "brand.tagline": "ソウル旅行情報ニュース",
    "footer.tagline": "ソウル旅行選びを助けるニュースポータル",
    "footer.description": "ソウルの文化行事、祭りの日程、訪問準備、交通情報をニュース形式で整理します。",
    "nav.menu": "メニューを開く",
    "nav.home": "ホーム",
    "nav.july": "旅行ニュース",
    "nav.places": "見どころ",
    "nav.booking": "検索",
    "july.title": "今日読みたいフェスニュース",
    "july.description": "注目記事、推薦カード、最新リストの順に韓国フェス情報を確認できます。",
    "july.loading": "7月のフェス一覧を読み込んでいます。",
    "july.count": "{count}件のフェス記事を読み込みました。",
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
    "meta.title": "首尔旅行新闻 | 首尔旅行信息",
    "brand.name": "首尔旅行新闻",
    "brand.tagline": "首尔旅行信息新闻",
    "footer.tagline": "帮助规划首尔旅行的新闻门户",
    "footer.description": "以新闻信息流整理首尔文化活动、庆典日程、出行准备、交通和周边信息。",
    "nav.menu": "打开菜单",
    "nav.home": "首页",
    "nav.july": "旅行新闻",
    "nav.places": "推荐地点",
    "nav.booking": "搜索",
    "july.title": "今日值得关注的庆典新闻",
    "july.description": "按重点报道、推荐卡片和最新列表的顺序浏览韩国庆典信息。",
    "july.loading": "正在加载7月庆典列表。",
    "july.count": "已加载{count}篇庆典文章。",
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
  renderPlaces();
  renderBooking();
  renderCuration();
  renderEditorialPosts();
  renderMyRealTripProducts();
  renderJulyFestivals();
  renderCategoryNewsSections();
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

function safeExternalUrl(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  const normalized = text.startsWith("//") ? `https:${text}` : text;
  if (!/^https:\/\//i.test(normalized)) return "";

  try {
    return new URL(normalized).href;
  } catch {
    return "";
  }
}

function imageMarkup(item, size = "card") {
  const title = displayArticleTitle(item);
  return `
    <div class="image-frame image-frame--${size}">
      <img src="${escapeHtml(item.image)}" alt="${escapeHtml(title)}" loading="lazy" />
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

function categoryKeyFor(item = {}) {
  const value = String(item.categorySlug || item.category || item.rawCategory || item.subCategory || "");
  if (value.includes("exhibition") || value.includes("전시")) return "exhibition";
  if (value.includes("performance") || value.includes("공연") || value.includes("클래식") || value.includes("연극") || value.includes("콘서트") || value.includes("무용") || value.includes("국악") || value.includes("뮤지컬")) return "performance";
  if (value.includes("experience") || value.includes("교육") || value.includes("체험")) return "experience";
  if (value.includes("movie") || value.includes("영화")) return "movie";
  if (value.includes("festival") || value.includes("축제")) return "festival";
  return "event";
}

function articleDateValue(item = {}) {
  const match = String(item.date || "").match(/\d{4}[-.]\d{1,2}[-.]\d{1,2}/);
  if (!match) return 0;
  const compact = match[0].replace(/\D/g, "");
  return Number(compact) || 0;
}

function articleQualityScore(item = {}) {
  let score = 0;
  if (item.image && !String(item.image).includes("unsplash.com")) score += 4;
  if (item.address || item.place) score += 4;
  if (item.date) score += 3;
  if (item.fee || item.isFree) score += 2;
  if (item.time) score += 2;
  if (item.tel) score += 2;
  if (item.homepage) score += 2;
  if (item.lat && item.lng) score += 2;
  if (item.summary && String(item.summary).length > 80) score += 1;
  return score;
}

function sortByQualityAndDate(items = []) {
  return [...items].sort((a, b) => {
    const qualityDiff = articleQualityScore(b) - articleQualityScore(a);
    if (qualityDiff) return qualityDiff;
    return articleDateValue(b) - articleDateValue(a);
  });
}

function primaryNewsItems() {
  const source = state.apiArticles.length ? state.apiArticles : state.julyArticles;
  return sortByQualityAndDate(uniqueArticles((source || []).map(withGroupedCategory)));
}

function filteredNewsItems(items = primaryNewsItems()) {
  const filter = state.activeCategoryFilter || "all";
  if (filter === "all") return items;
  return items.filter((item) => categoryKeyFor(item) === filter);
}

function categoryCountMap(items = primaryNewsItems()) {
  return items.reduce((map, item) => {
    const key = categoryKeyFor(item);
    map.set(key, (map.get(key) || 0) + 1);
    return map;
  }, new Map());
}

function displayCategoryLabel(item = {}) {
  if (state.language === "ko") return item.category || "서울 행사";
  const labels = {
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
  return (labels[state.language] || labels.en)[categoryKeyFor(item)];
}

function displayEventDate(item = {}) {
  const match = String(item.date || "").match(/(\d{4})[-.](\d{1,2})[-.](\d{1,2})/);
  if (!match) {
    return {
      en: "Latest",
      ja: "最新",
      zh: "最新"
    }[state.language] || "";
  }
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (state.language === "en") {
    const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${names[month - 1] || match[2]} ${day}`;
  }
  if (state.language === "ja") return `${month}月${day}日`;
  if (state.language === "zh") return `${month}月${day}日`;
  return item.date || "";
}

function displayArticleTitle(item = {}) {
  if (state.language === "ko") return item.title || "";
  const category = displayCategoryLabel(item);
  const date = displayEventDate(item);
  const templates = {
    en: `${date} Seoul ${category} Guide`,
    ja: `${date}の${category}ガイド`,
    zh: `${date}${category}指南`
  };
  return templates[state.language] || item.title || "";
}

function mapSeoulCategory(category = "") {
  const value = String(category || "").trim();
  const directMap = {
    "전시/미술": { category: "전시/미술", categorySlug: "exhibition" },
    "교육/체험": { category: "교육/체험", categorySlug: "experience" },
    "영화": { category: "영화", categorySlug: "movie" },
    "클래식": { category: "공연/무대", categorySlug: "performance" },
    "연극": { category: "공연/무대", categorySlug: "performance" },
    "콘서트": { category: "공연/무대", categorySlug: "performance" },
    "무용": { category: "공연/무대", categorySlug: "performance" },
    "국악": { category: "공연/무대", categorySlug: "performance" },
    "뮤지컬/오페라": { category: "공연/무대", categorySlug: "performance" },
    "독주/독창회": { category: "공연/무대", categorySlug: "performance" },
    "축제-문화/예술": { category: "축제", categorySlug: "festival" },
    "축제-관광/체육": { category: "축제", categorySlug: "festival" },
    "축제-전통/역사": { category: "축제", categorySlug: "festival" }
  };
  const mapped = directMap[value] || { category: "서울 행사", categorySlug: "seoul-event" };
  return {
    rawCategory: value || "서울 문화행사",
    subCategory: value || "서울 문화행사",
    category: mapped.category,
    categorySlug: mapped.categorySlug
  };
}

function withGroupedCategory(item) {
  const mapped = mapSeoulCategory(item.rawCategory || item.subCategory || item.category || "서울 문화행사");
  return {
    ...item,
    ...mapped
  };
}

function articleMeta(item) {
  return `<span>${escapeHtml(item.date)}</span><span>${escapeHtml(displayReadTime(item))}</span>`;
}

function detailUrl(item) {
  if (item.source === "seoul") {
    const params = new URLSearchParams({
      source: "seoul",
      id: item.id || "",
      title: item.title || "",
      category: item.category || "",
      rawCategory: item.rawCategory || item.subCategory || "",
      subCategory: item.subCategory || item.rawCategory || "",
      categorySlug: item.categorySlug || "",
      date: item.date || "",
      image: item.image || "",
      address: item.address || item.place || "",
      summary: displaySummary(item) || "",
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
    return `festival-detail?${params.toString()}`;
  }

  if (item.source === "tour" && item.contentId) {
    const params = new URLSearchParams({
      source: "tour",
      id: item.contentId,
      contentTypeId: item.contentTypeId || "",
      title: item.title || "",
      category: item.category || "",
      rawCategory: item.rawCategory || item.subCategory || "",
      subCategory: item.subCategory || item.rawCategory || "",
      categorySlug: item.categorySlug || "",
      date: item.date || "",
      image: item.image || "",
      address: item.address || item.summaryParams?.address || "",
      mapx: item.mapx || "",
      mapy: item.mapy || "",
      summary: displaySummary(item) || ""
    });
    return `festival-detail?${params.toString()}`;
  }

  return `festival-detail?id=${encodeURIComponent(item.id)}`;
}

function articleCard(item, variant = "") {
  const title = displayArticleTitle(item);
  const category = displayCategoryLabel(item);
  return `
    <article class="article-card ${variant}">
      <a href="${escapeHtml(detailUrl(item))}" aria-label="${escapeHtml(`${title} ${textFor("card.detail")}`)}">
        ${imageMarkup(item)}
        <span class="category-label">${escapeHtml(category)}</span>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(displaySummary(item))}</p>
        <div class="article-meta">${articleMeta(item)}</div>
      </a>
    </article>
  `;
}

function normalizeSeoulCultureItems(items) {
  const list = Array.isArray(items) ? items : items ? [items] : [];
  const normalized = list
    .filter((item) => item && item.title)
    .filter((item) => overlapsCurrentMonthByDateText(item.date))
    .map((item, index) => {
      const mapped = mapSeoulCategory(item.category || "서울 문화행사");
      return {
        id: item.id || `seoul-culture-${index}`,
        source: "seoul",
        ...mapped,
        title: item.title,
        summary: item.summary || `${item.address || "서울"}에서 진행되는 문화행사입니다.`,
        date: item.date || "일정 확인 필요",
        readTime: item.readTime || "서울 행사 정보",
        image: String(item.image || "https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=900&q=80").replace(/^http:/, "https:"),
        address: item.address || item.place || "",
        place: item.place || "",
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
      };
    });

  return uniqueArticles(normalized);
}

function newsFeaturedCard(item) {
  const title = displayArticleTitle(item);
  const category = displayCategoryLabel(item);
  return `
    <article class="news-feature-card">
      <a href="${escapeHtml(detailUrl(item))}" aria-label="${escapeHtml(`${title} ${textFor("card.detail")}`)}">
        ${imageMarkup(item, "hero")}
        <div class="news-feature-body">
          <span class="category-label">${escapeHtml(category)}</span>
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(displaySummary(item))}</p>
          <div class="article-meta">${articleMeta(item)}</div>
        </div>
      </a>
    </article>
  `;
}

function newsRecommendCard(item) {
  const title = displayArticleTitle(item);
  return `
    <article class="news-recommend-card">
      <a href="${escapeHtml(detailUrl(item))}" aria-label="${escapeHtml(`${title} ${textFor("card.detail")}`)}">
        ${imageMarkup(item, "recommend")}
        <strong>${escapeHtml(title)}</strong>
      </a>
    </article>
  `;
}

function newsListCard(item) {
  const title = displayArticleTitle(item);
  const category = displayCategoryLabel(item);
  return `
    <article class="news-list-card">
      <a href="${escapeHtml(detailUrl(item))}" aria-label="${escapeHtml(`${title} ${textFor("card.detail")}`)}">
        ${imageMarkup(item, "feed")}
        <span>
          <em>${escapeHtml(category)}</em>
          <strong>${escapeHtml(title)}</strong>
          <small>${escapeHtml(item.date)} · ${escapeHtml(displayReadTime(item))}</small>
        </span>
      </a>
    </article>
  `;
}

function formatWon(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number <= 0) return "가격 확인";
  return `${number.toLocaleString("ko-KR")}원`;
}

function formatMrtDate(value) {
  if (!value) return "일정 확인";
  const text = String(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  return `${text.slice(5, 7)}.${text.slice(8, 10)}`;
}

function dateOffsetIso(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function myRealTripUrl(type, params = {}) {
  const query = new URLSearchParams({ type });
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, value);
  });
  return `/api/myrealtrip?${query.toString()}`;
}

async function fetchMyRealTrip(type, params = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), MRT_FETCH_TIMEOUT_MS);
  let response;
  let payload;

  try {
    response = await fetch(myRealTripUrl(type, params), {
      headers: { Accept: "application/json" },
      signal: controller.signal
    });

    const contentType = response.headers.get("content-type") || "";
    payload = contentType.includes("application/json")
      ? await response.json()
      : { message: (await response.text()).slice(0, 200) };
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("MyRealTrip request timed out");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }

  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.message || `MyRealTrip ${type} request failed`);
  }
  return payload?.data?.data || payload?.data || {};
}

function firstArrayFrom(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  const preferredKeys = ["items", "products", "list", "contents", "results", "regions", "airfares", "data"];
  for (const key of preferredKeys) {
    const found = firstArrayFrom(value[key]);
    if (found.length) return found;
  }

  for (const child of Object.values(value)) {
    const found = firstArrayFrom(child);
    if (found.length) return found;
  }

  return [];
}

function normalizeMrtProductItem(item = {}, kind = "tour") {
  const title = item.itemName || item.title || item.name || item.productName || item.accommodationName || item.hotelName || "";
  const imageUrl = item.imageUrl || item.thumbnailUrl || item.thumbnail || item.mainImageUrl || item.image || item.representativeImageUrl || "";
  const productUrl = safeExternalUrl(item.productUrl || item.url || item.webUrl || item.deepLink || item.link || "");
  const salePrice = item.salePrice || item.price || item.priceAmount || item.minPrice || item.discountedPrice || item.lowestPrice || 0;

  return {
    ...item,
    itemName: title || (kind === "stay" ? "서울 숙소" : "서울 투어·티켓"),
    imageUrl,
    productUrl,
    salePrice,
    originalPrice: item.originalPrice || item.normalPrice || salePrice,
    priceDisplay: item.priceDisplay || item.displayPrice || item.priceText || "",
    reviewScore: item.reviewScore || item.rating || item.score || "",
    reviewCount: item.reviewCount || item.reviewCnt || item.reviewsCount || 0,
    category: item.category || item.categoryName || item.productType || (kind === "stay" ? "숙소" : "투어·티켓"),
    description: item.description || item.summary || item.shortDescription || item.subtitle || ""
  };
}

function normalizeMrtProducts(payload, kind) {
  return firstArrayFrom(payload).map((item) => normalizeMrtProductItem(item, kind));
}

function normalizeMrtFlightItem(item = {}) {
  const totalPrice = item.totalPrice || item.price || item.lowestPrice || item.amount || item.fare || 0;
  return {
    ...item,
    fromCity: item.fromCity || item.depCityName || item.depCityCd || item.departureAirport || "ICN",
    toCity: item.toCity || item.arrCityName || item.arrCityCd || item.arrivalAirport || "",
    departureDate: item.departureDate || item.depDate || item.startDate || "",
    returnDate: item.returnDate || item.arrivalDate || item.endDate || "",
    totalPrice,
    airline: item.airline || item.airlineName || item.carrier || ""
  };
}

function normalizeMrtFlights(payload) {
  return firstArrayFrom(payload).map(normalizeMrtFlightItem);
}

async function fetchCoupangProducts(keyword = "여행 준비물", limit = 6) {
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

function normalizeCoupangProducts(payload = {}) {
  const data = payload.data || payload;
  const productData = Array.isArray(data.productData) ? data.productData : [];
  const items = productData.length ? productData : firstArrayFrom(data);

  return items
    .map((item = {}) => {
      const title = item.productName || item.title || item.name || "";
      const url = safeExternalUrl(item.productUrl || item.url || item.link || "");
      return {
        id: item.productId || item.itemId || title,
        title,
        image: item.productImage || item.imageUrl || item.image || "",
        url,
        price: item.productPrice || item.price || item.salePrice || 0,
        category: item.categoryName || item.category || "여행 준비물",
        isRocket: Boolean(item.isRocket),
        isFreeShipping: Boolean(item.isFreeShipping)
      };
    })
    .filter((item) => item.title && item.url)
    .slice(0, 6);
}

function renderCoupangProducts() {
  const section = $("#coupangEssentials");
  const grid = $("#coupangGrid");
  const status = $("#coupangStatus");
  const moreLink = $("#coupangMoreLink");
  if (!section || !grid || !status) return;

  const items = state.coupang.items || [];
  if (!items.length) {
    section.hidden = true;
    grid.innerHTML = "";
    status.textContent = "";
    return;
  }

  section.hidden = false;
  status.textContent = "";
  if (moreLink && items[0]?.url) moreLink.href = items[0].url;
  grid.innerHTML = items.map((item) => {
    const badges = [
      item.isRocket ? "로켓" : "",
      item.isFreeShipping ? "무료배송" : ""
    ].filter(Boolean);

    return `
      <article class="coupang-card">
        <a href="${escapeHtml(item.url)}" target="_blank" rel="sponsored noopener noreferrer" aria-label="${escapeHtml(`${item.title} 상품 보기`)}">
          ${item.image
            ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy" />`
            : `<div class="coupang-placeholder" aria-hidden="true">CP</div>`}
          <span>
            <em>${escapeHtml(item.category)}</em>
            <strong>${escapeHtml(item.title)}</strong>
            <small>${escapeHtml(formatWon(item.price))}${badges.length ? ` · ${escapeHtml(badges.join(" · "))}` : ""}</small>
          </span>
        </a>
      </article>
    `;
  }).join("");
}

async function loadCoupangProducts() {
  try {
    const payload = await fetchCoupangProducts(state.coupang.keyword, 6);
    state.coupang = {
      ...state.coupang,
      items: normalizeCoupangProducts(payload),
      loaded: true,
      error: false
    };
  } catch (error) {
    console.warn("Coupang products could not be loaded.", error);
    state.coupang = {
      ...state.coupang,
      items: [],
      loaded: true,
      error: true
    };
  }
  renderCoupangProducts();
}

function mrtExternalLink(url, label) {
  const safeUrl = safeExternalUrl(url);
  if (!safeUrl) return "";
  return `
    <a class="mrt-link" href="${escapeHtml(safeUrl)}" target="_blank" rel="sponsored noopener noreferrer">
      ${escapeHtml(label)}
    </a>
  `;
}

function mrtImage(url, title) {
  if (!url) {
    return `<div class="mrt-placeholder" aria-hidden="true">SN</div>`;
  }
  return `<img src="${escapeHtml(url)}" alt="${escapeHtml(title)}" loading="lazy" />`;
}

function renderMrtTourCard(item) {
  const title = item.itemName || "서울 투어 상품";
  return `
    <article class="mrt-product-card">
      ${mrtImage(item.imageUrl, title)}
      <div>
        <em>${escapeHtml(item.category || "투어")}</em>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(item.description || "서울에서 즐길 수 있는 투어/티켓 상품입니다.")}</p>
        <small>${escapeHtml(item.priceDisplay || formatWon(item.salePrice))} · 평점 ${escapeHtml(item.reviewScore || "확인")}</small>
        ${mrtExternalLink(item.productUrl, "상품 보기")}
      </div>
    </article>
  `;
}

function renderMrtStayCard(item) {
  const title = item.itemName || "서울 숙소";
  return `
    <article class="mrt-product-card">
      ${mrtImage(item.imageUrl, title)}
      <div>
        <em>${Number(item.starRating || 0) ? `${item.starRating}성급` : "숙소"}</em>
        <h3>${escapeHtml(title)}</h3>
        <p>리뷰 ${escapeHtml(item.reviewCount || 0)}개 · 평점 ${escapeHtml(item.reviewScore || "확인")}</p>
        <small>${escapeHtml(formatWon(item.salePrice || item.originalPrice))}</small>
        ${mrtExternalLink(item.productUrl, "숙소 보기")}
      </div>
    </article>
  `;
}

function renderMrtFlightCard(item) {
  const title = `${item.fromCity || "ICN"} → ${item.toCity || "BKK"}`;
  const schedule = `${formatMrtDate(item.departureDate)} 출발${item.returnDate ? ` · ${formatMrtDate(item.returnDate)} 귀국` : ""}`;
  return `
    <article class="mrt-flight-card">
      <span>${escapeHtml(title)}</span>
      <strong>${escapeHtml(formatWon(item.totalPrice))}</strong>
      <small>${escapeHtml(schedule)} · ${escapeHtml(item.airline || "항공사 확인")}</small>
    </article>
  `;
}

function flightDestinationName(code = "") {
  const table = {
    NRT: "도쿄",
    HND: "도쿄",
    KIX: "오사카",
    FUK: "후쿠오카",
    CJU: "제주",
    BKK: "방콕",
    TPE: "타이베이",
    SIN: "싱가포르",
    DAD: "다낭",
    CEB: "세부"
  };
  const key = String(code || "").toUpperCase();
  return table[key] || key || "추천 도시";
}

function renderMrtFlightDestination(item = {}) {
  const code = String(item.arrCityCd || item.toCity || item.arrivalAirport || "").toUpperCase();
  const city = flightDestinationName(code);
  const price = formatWon(item.totalPrice || item.price || item.lowestPrice);
  const schedule = [
    item.departureDate ? `${formatMrtDate(item.departureDate)} 출발` : "",
    item.returnDate ? `${formatMrtDate(item.returnDate)} 귀국` : "",
    item.airline || ""
  ].filter(Boolean).join(" · ");

  return `
    <a class="mrt-flight-destination" href="#bookingSearch" data-mrt-open="flight" data-mrt-dep-city="${escapeHtml(String(item.depCityCd || item.fromCity || "ICN").toUpperCase())}" data-mrt-arr-cities="${escapeHtml(code || "NRT")}" aria-label="${escapeHtml(`${city} 항공권 검색`)}">
      <span aria-hidden="true">${escapeHtml(code ? code.slice(0, 2) : "AIR")}</span>
      <strong>${escapeHtml(city)} <em>${escapeHtml(price)} ~</em></strong>
      <small>${escapeHtml(schedule || "서울 출발 추천 노선")}</small>
      <b aria-hidden="true">›</b>
    </a>
  `;
}

function renderMrtFlightDiscovery(items = []) {
  const fallback = [
    { depCityCd: "ICN", arrCityCd: "NRT", totalPrice: 190500, departureDate: dateOffsetIso(44), returnDate: dateOffsetIso(47), airline: "3일" },
    { depCityCd: "ICN", arrCityCd: "KIX", totalPrice: 204870, departureDate: dateOffsetIso(18), returnDate: dateOffsetIso(21), airline: "3일" },
    { depCityCd: "ICN", arrCityCd: "FUK", totalPrice: 283400, departureDate: dateOffsetIso(31), returnDate: dateOffsetIso(34), airline: "3일" }
  ];
  const list = (items.length ? items : fallback).slice(0, 6);

  return `
    <section class="mrt-flight-discovery" aria-labelledby="mrtFlightDiscoveryTitle">
      <div class="mrt-flight-destination-head">
        <h3 id="mrtFlightDiscoveryTitle">언제, 어디로 떠날까요?</h3>
        <p>인천 출발 기준으로 확인 가능한 추천 노선을 보여드립니다.</p>
      </div>
      <div class="mrt-flight-region-tabs" aria-label="항공권 추천 지역">
        <span class="is-active">추천</span>
        <span>동아시아</span>
        <span>동남아시아</span>
        <span>미주</span>
        <span>유럽</span>
      </div>
      <div class="mrt-flight-destination-list">
        ${list.map(renderMrtFlightDestination).join("")}
      </div>
    </section>
  `;
}

function mrtFeedImage(url, title) {
  return `
    <div class="image-frame image-frame--feed mrt-feed-thumb">
      ${url
        ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(title)}" loading="lazy" />`
        : `<span aria-hidden="true">SN</span>`}
    </div>
  `;
}

function renderMrtFeedProduct(kind, item) {
  if (!item) return "";
  const isStay = kind === "stay";
  const title = item.itemName || (isStay ? "서울 숙소" : "서울 투어·티켓");
  const label = isStay ? "서울 숙소 추천" : "서울 투어·티켓";
  const meta = isStay
    ? `${formatWon(item.salePrice || item.originalPrice)} · 평점 ${item.reviewScore || "확인"}`
    : `${item.priceDisplay || formatWon(item.salePrice)} · 평점 ${item.reviewScore || "확인"}`;
  const url = item.productUrl || "#";
  return `
    <article class="news-list-card mrt-feed-card">
      <a href="${escapeHtml(url)}" target="_blank" rel="sponsored noopener noreferrer" aria-label="${escapeHtml(`${title} 상품 보기`)}">
        ${mrtFeedImage(item.imageUrl, title)}
        <span>
          <em>${escapeHtml(label)}</em>
          <strong>${escapeHtml(title)}</strong>
          <small>${escapeHtml(meta)} · 상품 보기</small>
        </span>
      </a>
    </article>
  `;
}

function renderMrtFeedFlight(item) {
  if (!item) return "";
  const title = `${item.fromCity || "ICN"} → ${item.toCity || "BKK"} 항공 최저가`;
  const schedule = `${formatMrtDate(item.departureDate)} 출발${item.returnDate ? ` · ${formatMrtDate(item.returnDate)} 귀국` : ""}`;
  return `
    <article class="news-list-card mrt-feed-card mrt-feed-card--flight">
      <a href="#bookingSearch" data-mrt-open="flight" data-mrt-dep-city="${escapeHtml(String(item.depCityCd || item.fromCity || "ICN").toUpperCase())}" data-mrt-arr-cities="${escapeHtml(String(item.arrCityCd || item.toCity || item.arrivalAirport || "").toUpperCase())}" aria-label="${escapeHtml(title)}">
        <div class="image-frame image-frame--feed mrt-feed-thumb mrt-feed-thumb--flight" aria-hidden="true">
          <span>AIR</span>
        </div>
        <span>
          <em>항공 최저가</em>
          <strong>${escapeHtml(title)}</strong>
          <small>${escapeHtml(formatWon(item.totalPrice))} · ${escapeHtml(schedule)} · ${escapeHtml(item.airline || "항공사 확인")}</small>
        </span>
      </a>
    </article>
  `;
}

function renderMrtSearchAdCard(kind) {
  const configs = {
    stay: {
      label: "방문 전 체크 · 숙소",
      title: "행사장 근처 숙소 다시 찾기",
      meta: "체크인, 지역, 인원 기준으로 비교",
      thumb: "STAY"
    },
    tour: {
      label: "방문 전 체크 · 티켓",
      title: "관련 입장권과 체험 상품 보기",
      meta: "공연, 전시, 체험, 투어 상품 확인",
      thumb: "TICKET"
    },
    flight: {
      label: "방문 전 체크 · 항공권",
      title: "서울 출발 항공권 흐름 확인",
      meta: "도착지와 여행 기간 기준으로 비교",
      thumb: "AIR"
    }
  };
  const config = configs[kind] || configs.tour;

  return `
    <article class="news-list-card mrt-feed-card mrt-feed-card--cta">
      <a href="#bookingSearch" data-mrt-open="${escapeHtml(kind)}" aria-label="${escapeHtml(config.title)}">
        <div class="image-frame image-frame--feed mrt-feed-thumb" aria-hidden="true">
          <span>${escapeHtml(config.thumb)}</span>
        </div>
        <span>
          <em>${escapeHtml(config.label)}</em>
          <strong>${escapeHtml(config.title)}</strong>
          <small>${escapeHtml(config.meta)}</small>
        </span>
      </a>
    </article>
  `;
}

const MRT_FEED_INTERVAL = 6;

function mrtProductLinkAttrs(kind, item = {}) {
  const safeUrl = safeExternalUrl(item.productUrl);
  if (safeUrl) {
    return `href="${escapeHtml(safeUrl)}" target="_blank" rel="sponsored noopener noreferrer"`;
  }
  const tab = kind === "stay" ? "stay" : "tour";
  const keyword = kind === "stay" ? "서울" : "서울 입장권";
  return `href="#bookingSearch" data-mrt-open="${tab}" data-mrt-keyword="${escapeHtml(keyword)}"`;
}

function mrtRailFilterKind(kind, item = {}) {
  if (kind === "stay") return "stay";
  const text = [
    item.itemName,
    item.title,
    item.category,
    item.categoryName,
    item.description
  ].filter(Boolean).join(" ");
  return /입장|티켓|전시|미술관|박물관|아쿠아리움|전망대|테마파크|궁궐/.test(text)
    ? "ticket"
    : "tour";
}

function renderMrtRailProduct(kind, item = {}) {
  const isStay = kind === "stay";
  const filterKind = mrtRailFilterKind(kind, item);
  const title = item.itemName || (isStay ? "서울 숙소 검색" : "서울 투어·티켓 검색");
  const category = isStay ? "국내숙소" : item.category || "투어·티켓";
  const price = item.priceDisplay || formatWon(item.salePrice || item.originalPrice);
  const rating = item.reviewScore ? `★ ${item.reviewScore}` : "";
  const meta = [rating, price].filter(Boolean).join(" · ");

  return `
    <article class="mrt-rail-card" data-mrt-rail-card data-filter="${escapeHtml(filterKind)}">
      <a ${mrtProductLinkAttrs(kind, item)} aria-label="${escapeHtml(title)}">
        <div class="mrt-rail-image">
          ${item.imageUrl
            ? `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(title)}" loading="lazy" />`
            : `<span aria-hidden="true">${escapeHtml(isStay ? "STAY" : "TICKET")}</span>`}
        </div>
        <div class="mrt-rail-copy">
          <em>${escapeHtml(category)}</em>
          <strong>${escapeHtml(title)}</strong>
          <small>${escapeHtml(meta || "조건별로 상품 보기")}</small>
        </div>
      </a>
    </article>
  `;
}

function renderMrtRailSearchCard(kind) {
  const isStay = kind === "stay";
  const isTicket = kind === "ticket";
  const title = isStay ? "서울 숙소 조건별 검색" : "서울 입장권·체험 검색";
  const label = isStay ? "국내숙소" : (isTicket ? "입장권" : "투어·티켓");
  const body = isStay ? "지역, 체크인, 인원 기준으로 비교" : "전시, 공연, 체험 상품 한 번에 확인";
  const filterKind = isStay ? "stay" : (isTicket ? "ticket" : "tour");

  return `
    <article class="mrt-rail-card mrt-rail-card--cta" data-mrt-rail-card data-filter="${escapeHtml(filterKind)}">
      <a href="#bookingSearch" data-mrt-open="${isStay ? "stay" : "tour"}" data-mrt-keyword="${escapeHtml(isStay ? "서울" : "서울 입장권")}" aria-label="${escapeHtml(title)}">
        <div class="mrt-rail-image" aria-hidden="true">
          <span>${escapeHtml(isStay ? "STAY" : "TICKET")}</span>
        </div>
        <div class="mrt-rail-copy">
          <em>${escapeHtml(label)}</em>
          <strong>${escapeHtml(title)}</strong>
          <small>${escapeHtml(body)}</small>
        </div>
      </a>
    </article>
  `;
}

function myRealTripFeedRailItems() {
  if (!state.myrealtrip.loaded) return [];
  const items = [];
  const tours = state.myrealtrip.tours.slice(0, 6);
  const stays = state.myrealtrip.stays.slice(0, 4);
  const maxLength = Math.max(tours.length, stays.length);

  for (let index = 0; index < maxLength; index += 1) {
    if (tours[index]) items.push(renderMrtRailProduct("tour", tours[index]));
    if (index % 2 === 0 && stays[index]) items.push(renderMrtRailProduct("stay", stays[index]));
  }

  items.push(
    renderMrtRailSearchCard("tour"),
    renderMrtRailSearchCard("ticket"),
    renderMrtRailSearchCard("stay")
  );

  return items.filter(Boolean);
}

function renderMrtFeedModule(seed = "main", position = 0) {
  const items = myRealTripFeedRailItems();
  if (!items.length) return "";

  const offset = (adRotationOffset(seed) + position) % items.length;
  const rotated = [...items.slice(offset), ...items.slice(0, offset)];

  return `
    <section class="mrt-feed-module" data-active-filter="tour" aria-label="서울 여행 예약 추천">
      <div class="mrt-feed-module-head">
        <div>
          <p class="eyebrow">Travel Pick</p>
          <h3>서울에서 주목할 만한 상품</h3>
        </div>
        <a href="#bookingSearch" data-mrt-open="tour" data-mrt-keyword="서울 입장권">더보기</a>
      </div>
      <div class="mrt-feed-tabs" aria-label="상품 종류">
        <button class="is-active" type="button" data-mrt-rail-filter="tour" aria-pressed="true">투어·티켓</button>
        <button type="button" data-mrt-rail-filter="stay" aria-pressed="false">국내숙소</button>
        <button type="button" data-mrt-rail-filter="ticket" aria-pressed="false">입장권</button>
      </div>
      <div class="mrt-rail">
        ${rotated.join("")}
      </div>
    </section>
  `;
}

function mrtProductLinkAttrsV2(kind, item = {}) {
  const safeUrl = safeExternalUrl(item.productUrl);
  if (safeUrl) {
    return `href="${escapeHtml(safeUrl)}" target="_blank" rel="sponsored noopener noreferrer"`;
  }

  if (kind === "stay") {
    return `href="#bookingSearch" data-mrt-open="stay" data-mrt-keyword="서울"`;
  }

  if (kind === "flight") {
    const depCity = String(item.depCityCd || item.fromCity || "ICN").toUpperCase();
    const arrCity = String(item.arrCityCd || item.toCity || item.arrivalAirport || "TYO").toUpperCase();
    return `href="#bookingSearch" data-mrt-open="flight" data-mrt-dep-city="${escapeHtml(depCity)}" data-mrt-arr-cities="${escapeHtml(arrCity)}"`;
  }

  return `href="#bookingSearch" data-mrt-open="tour" data-mrt-keyword="서울 입장권"`;
}

function renderMrtRailProductV2(kind, item = {}) {
  const isStay = kind === "stay";
  const title = item.itemName || (isStay ? "서울 숙소 검색" : "서울 입장권·체험 검색");
  const category = isStay ? "국내숙소" : item.category || "입장권";
  const price = item.priceDisplay || formatWon(item.salePrice || item.originalPrice);
  const rating = item.reviewScore ? `★ ${item.reviewScore}` : "";
  const meta = [rating, price].filter(Boolean).join(" · ");

  return `
    <article class="mrt-rail-card" data-mrt-rail-card data-filter="${escapeHtml(isStay ? "stay" : "tour")}">
      <a ${mrtProductLinkAttrsV2(kind, item)} aria-label="${escapeHtml(title)}">
        <div class="mrt-rail-image">
          ${item.imageUrl
            ? `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(title)}" loading="lazy" />`
            : `<span aria-hidden="true">${escapeHtml(isStay ? "STAY" : "TICKET")}</span>`}
        </div>
        <div class="mrt-rail-copy">
          <em>${escapeHtml(category)}</em>
          <strong>${escapeHtml(title)}</strong>
          <small>${escapeHtml(meta || "조건별 상품 보기")}</small>
        </div>
      </a>
    </article>
  `;
}

function renderMrtRailFlightCardV2(item = {}) {
  const depCity = String(item.depCityCd || item.fromCity || "ICN").toUpperCase();
  const arrCity = String(item.arrCityCd || item.toCity || item.arrivalAirport || "TYO").toUpperCase();
  const title = `${depCity} → ${arrCity} 항공 최저가`;
  const schedule = [
    item.departureDate ? `${formatMrtDate(item.departureDate)} 출발` : "",
    item.returnDate ? `${formatMrtDate(item.returnDate)} 귀국` : "",
    item.airline || ""
  ].filter(Boolean).join(" · ");

  return `
    <article class="mrt-rail-card mrt-rail-card--flight" data-mrt-rail-card data-filter="flight">
      <a ${mrtProductLinkAttrsV2("flight", item)} aria-label="${escapeHtml(title)}">
        <div class="mrt-rail-image" aria-hidden="true">
          <span>AIR</span>
        </div>
        <div class="mrt-rail-copy">
          <em>항공 최저가</em>
          <strong>${escapeHtml(title)}</strong>
          <small>${escapeHtml(formatWon(item.totalPrice))} · ${escapeHtml(schedule || "출발지와 도착지 선택")}</small>
        </div>
      </a>
    </article>
  `;
}

function renderMrtRailSearchCardV2(kind) {
  const configs = {
    tour: {
      filter: "tour",
      tab: "tour",
      keyword: "서울 입장권",
      thumb: "TICKET",
      label: "입장권",
      title: "서울 입장권·체험 검색",
      body: "전시, 공연, 체험 상품을 한 번에 확인"
    },
    stay: {
      filter: "stay",
      tab: "stay",
      keyword: "서울",
      thumb: "STAY",
      label: "국내숙소",
      title: "서울 숙소 조건별 검색",
      body: "지역, 날짜, 인원 기준으로 비교"
    },
    flight: {
      filter: "flight",
      tab: "flight",
      keyword: "",
      thumb: "AIR",
      label: "항공권",
      title: "서울 출발 항공권 검색",
      body: "도착지와 여행 기간 기준으로 확인"
    }
  };
  const config = configs[kind] || configs.tour;
  const keywordAttr = config.keyword ? ` data-mrt-keyword="${escapeHtml(config.keyword)}"` : "";

  return `
    <article class="mrt-rail-card mrt-rail-card--cta" data-mrt-rail-card data-filter="${escapeHtml(config.filter)}">
      <a href="#bookingSearch" data-mrt-open="${escapeHtml(config.tab)}"${keywordAttr} aria-label="${escapeHtml(config.title)}">
        <div class="mrt-rail-image" aria-hidden="true">
          <span>${escapeHtml(config.thumb)}</span>
        </div>
        <div class="mrt-rail-copy">
          <em>${escapeHtml(config.label)}</em>
          <strong>${escapeHtml(config.title)}</strong>
          <small>${escapeHtml(config.body)}</small>
        </div>
      </a>
    </article>
  `;
}

function myRealTripFeedRailItemsV2() {
  if (!state.myrealtrip.loaded) return [];

  const items = [];
  const tours = state.myrealtrip.tours.slice(0, 9);
  const stays = state.myrealtrip.stays.slice(0, 9);
  const flights = state.myrealtrip.flights.slice(0, 9);
  const maxLength = Math.max(tours.length, stays.length, flights.length);

  for (let index = 0; index < maxLength; index += 1) {
    if (tours[index]) items.push(renderMrtRailProductV2("tour", tours[index]));
    if (stays[index]) items.push(renderMrtRailProductV2("stay", stays[index]));
    if (flights[index]) items.push(renderMrtRailFlightCardV2(flights[index]));
  }

  items.push(
    renderMrtRailSearchCardV2("tour"),
    renderMrtRailSearchCardV2("stay"),
    renderMrtRailSearchCardV2("flight")
  );

  return items.filter(Boolean);
}

function renderMrtFeedModuleV2(seed = "main", position = 0) {
  const items = myRealTripFeedRailItemsV2();
  if (!items.length) return "";

  const variants = [
    {
      filter: "tour",
      title: "서울 입장권과 체험 상품",
      linkTab: "tour",
      linkText: "입장권 검색",
      keyword: "서울 입장권"
    },
    {
      filter: "stay",
      title: "방문 전 함께 볼 숙소",
      linkTab: "stay",
      linkText: "숙소 검색",
      keyword: "서울"
    },
    {
      filter: "flight",
      title: "서울 출발 항공권 흐름",
      linkTab: "flight",
      linkText: "항공권 검색",
      keyword: ""
    }
  ];
  const variant = variants[Math.abs(position - 1) % variants.length];
  const offset = (adRotationOffset(seed) + position) % items.length;
  const rotated = [...items.slice(offset), ...items.slice(0, offset)];
  const keywordAttr = variant.keyword ? ` data-mrt-keyword="${escapeHtml(variant.keyword)}"` : "";

  return `
    <section class="mrt-feed-module" data-active-filter="${escapeHtml(variant.filter)}" aria-label="마이리얼트립 추천 상품">
      <div class="mrt-feed-module-head">
        <div>
          <p class="eyebrow">Travel Pick</p>
          <h3>${escapeHtml(variant.title)}</h3>
        </div>
        <a href="#bookingSearch" data-mrt-open="${escapeHtml(variant.linkTab)}"${keywordAttr}>${escapeHtml(variant.linkText)}</a>
      </div>
      <div class="mrt-feed-tabs" aria-label="상품 종류">
        <button class="${variant.filter === "tour" ? "is-active" : ""}" type="button" data-mrt-rail-filter="tour" aria-pressed="${variant.filter === "tour" ? "true" : "false"}">입장권</button>
        <button class="${variant.filter === "stay" ? "is-active" : ""}" type="button" data-mrt-rail-filter="stay" aria-pressed="${variant.filter === "stay" ? "true" : "false"}">숙소</button>
        <button class="${variant.filter === "flight" ? "is-active" : ""}" type="button" data-mrt-rail-filter="flight" aria-pressed="${variant.filter === "flight" ? "true" : "false"}">항공권</button>
      </div>
      <div class="mrt-rail">
        ${rotated.join("")}
      </div>
    </section>
  `;
}

function adRotationOffset(seed = "") {
  return String(seed)
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);
}

function buildNewsFeedMarkup(feedItems, seed = "main") {
  const blocks = [];
  let hasInsertedMrt = false;

  feedItems.forEach((item, index) => {
    const articleNumber = index + 1;
    blocks.push(newsListCard(item));

    if (!hasInsertedMrt && articleNumber === MRT_FEED_INTERVAL && articleNumber < feedItems.length) {
      blocks.push(renderMrtFeedModuleV2(seed, 1));
      hasInsertedMrt = true;
    }
  });

  return blocks.filter(Boolean).join("");
}

function buildCategoryListMarkup(items) {
  const blocks = [];

  items.forEach((item) => {
    blocks.push(categoryListCard(item));
  });

  return blocks.filter(Boolean).join("");
}

function loadingCardMarkup(type = "list") {
  return `
    <article class="news-loading-card news-loading-card--${escapeHtml(type)}" aria-hidden="true">
      <div class="news-loading-thumb"></div>
      <div class="news-loading-lines">
        <span></span>
        <strong></strong>
        <small></small>
      </div>
    </article>
  `;
}

function renderNewsLoadingSkeleton() {
  const featured = $("#featuredArticle");
  const recommended = $("#recommendedArticles");
  const feed = $("#newsFeedList");
  if (featured) {
    featured.innerHTML = loadingCardMarkup("feature");
  }
  if (recommended) {
    recommended.innerHTML = Array.from({ length: 3 }, () => loadingCardMarkup("recommend")).join("");
  }
  if (feed) {
    feed.innerHTML = Array.from({ length: 7 }, () => loadingCardMarkup("list")).join("");
  }
}

function setNewsLoading(isLoading) {
  state.newsLoading = Boolean(isLoading);
  document.body.classList.toggle("is-loading-news", state.newsLoading);
}

function renderMrtPanel(title, subtitle, items, renderer, emptyText) {
  return `
    <section class="mrt-panel">
      <div class="mrt-panel-heading">
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(subtitle)}</p>
      </div>
      <div class="mrt-card-list">
        ${items.length ? items.map(renderer).join("") : `<p class="mrt-empty">${escapeHtml(emptyText)}</p>`}
      </div>
    </section>
  `;
}

function activeMrtPanelConfig() {
  const tab = state.activeMrtTab || "stay";
  if (tab === "tour") {
    return {
      title: "투어·티켓 검색 결과",
      subtitle: "입장권, 체험, 공연, 투어 상품을 검색 조건에 맞춰 보여드립니다.",
      items: state.myrealtrip.tours.slice(0, 9),
      renderer: renderMrtTourCard,
      emptyText: "표시할 투어·티켓 상품이 없습니다. 검색어를 바꿔 다시 시도해 주세요."
    };
  }
  if (tab === "flight") {
    return {
      title: "항공권 검색 결과",
      subtitle: "출발지와 도착지 기준으로 확인 가능한 최저가 흐름을 보여드립니다.",
      items: state.myrealtrip.flights.slice(0, 9),
      renderer: renderMrtFlightCard,
      emptyText: "표시할 항공권 정보가 없습니다. 도착 공항 코드를 바꿔 다시 검색해 주세요."
    };
  }
  return {
    title: "숙소 검색 결과",
    subtitle: "지역, 체크인 날짜, 인원 조건에 맞는 숙소를 보여드립니다.",
    items: state.myrealtrip.stays.slice(0, 9),
    renderer: renderMrtStayCard,
    emptyText: "표시할 숙소 상품이 없습니다. 지역이나 날짜를 바꿔 다시 검색해 주세요."
  };
}

function renderMyRealTripProducts() {
  const grid = $("#myrealtripGrid");
  const status = $("#myrealtripStatus");
  if (!grid || !status) return;

  if (!state.myrealtrip.loaded && !state.myrealtrip.error) {
    status.textContent = "마이리얼트립 정보를 불러오는 중입니다.";
    status.hidden = false;
    grid.innerHTML = "";
    return;
  }

  if (state.myrealtrip.error && !state.myrealtrip.tours.length && !state.myrealtrip.stays.length && !state.myrealtrip.flights.length) {
    status.textContent = "예약 정보를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.";
    status.hidden = false;
    grid.innerHTML = "";
    return;
  }

  status.textContent = "";
  status.hidden = true;
  grid.classList.add("is-single");
  const activePanel = activeMrtPanelConfig();
  if ((state.activeMrtTab || "stay") === "flight") {
    grid.classList.add("is-flight");
    grid.innerHTML = renderMrtFlightDiscovery(activePanel.items);
    return;
  }

  grid.classList.remove("is-flight");
  grid.innerHTML = renderMrtPanel(
    activePanel.title,
    activePanel.subtitle,
    activePanel.items,
    activePanel.renderer,
    activePanel.emptyText
  );
  return;

  grid.innerHTML = [
    renderMrtPanel(
      "서울 투어·티켓",
      "후기와 가격을 기준으로 서울 체험 상품을 확인하세요.",
      state.myrealtrip.tours.slice(0, 3),
      renderMrtTourCard,
      "표시할 투어 상품이 없습니다."
    ),
    renderMrtPanel(
      "서울 숙소",
      "축제와 공연 방문 전 숙소 위치와 리뷰를 함께 비교하세요.",
      state.myrealtrip.stays.slice(0, 3),
      renderMrtStayCard,
      "표시할 숙소 상품이 없습니다."
    ),
    renderMrtPanel(
      "항공 최저가",
      "서울 출발 인기 노선의 최저가 흐름을 빠르게 확인하세요.",
      state.myrealtrip.flights.slice(0, 4),
      renderMrtFlightCard,
      "표시할 항공권 정보가 없습니다."
    )
  ].join("");
}

function setMrtSearchStatus(message, isError = false) {
  const status = $("#myrealtripStatus");
  if (!status) return;
  status.textContent = message;
  status.hidden = !message;
  status.classList.toggle("is-error", isError);
}

function formValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function setDefaultMrtDates() {
  const stayForm = $("#mrtStayForm");
  if (!stayForm) return;
  const checkIn = stayForm.elements.checkIn;
  const checkOut = stayForm.elements.checkOut;
  if (checkIn && !checkIn.value) checkIn.value = dateOffsetIso(1);
  if (checkOut && !checkOut.value) checkOut.value = dateOffsetIso(2);
}

function updateMrtSearchHeading(tab) {
  const copy = MRT_SEARCH_COPY[tab] || MRT_SEARCH_COPY.stay;
  const title = $("#bookingSearchTitle");
  const description = $("#bookingSearchDesc");

  if (title) title.textContent = copy.title;
  if (description) description.textContent = copy.description;
}

function setActiveMrtTab(tab) {
  state.activeMrtTab = tab || "stay";
  updateMrtSearchHeading(state.activeMrtTab);
  document.querySelectorAll("[data-mrt-tab]").forEach((button) => {
    const isActive = button.dataset.mrtTab === state.activeMrtTab;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
  document.querySelectorAll("[data-mrt-form]").forEach((form) => {
    form.classList.toggle("is-active", form.dataset.mrtForm === state.activeMrtTab);
  });
  $("#bookingSearch .mrt-search-box")?.classList.toggle("is-flight-mode", state.activeMrtTab === "flight");
  setCouponPanelVisible(false);
  setBookingResultsVisible(false);
  renderMyRealTripProducts();
}

function setCouponPanelVisible(show) {
  const panel = $("#mrtCouponPanel");
  const box = $("#bookingSearch .mrt-search-box");
  if (!panel) return;
  panel.hidden = !show;
  box?.classList.toggle("is-coupon-mode", Boolean(show));
}

function setBookingResultsVisible(show) {
  $("#bookingSearch")?.classList.toggle("has-results", Boolean(show));
}

function openBookingSearch(tab = state.activeMrtTab || "stay", options = {}) {
  const panel = $("#bookingSearch");
  if (!panel) return;
  setActiveMrtTab(tab);
  setCouponPanelVisible(Boolean(options.showCoupon));
  setBookingResultsVisible(Boolean(options.showResults));
  panel.classList.add("is-open");
  panel.setAttribute("aria-hidden", "false");
  document.body.classList.add("booking-search-open");
}

function closeBookingSearch() {
  const panel = $("#bookingSearch");
  if (!panel) return;
  panel.classList.remove("is-open");
  panel.classList.remove("has-results");
  panel.setAttribute("aria-hidden", "true");
  document.body.classList.remove("booking-search-open");
}

function regionIdFromAutocomplete(payload) {
  const region = firstArrayFrom(payload)[0] || {};
  return region.regionId || region.id || region.code || region.regionCode || 2573;
}

async function searchMrtStay(form) {
  state.activeMrtTab = "stay";
  const values = formValues(form);
  setBookingResultsVisible(true);
  setMrtSearchStatus("숙소를 검색하는 중입니다.");
  const regionPayload = await fetchMyRealTrip("accommodation-region-autocomplete", {
    keyword: values.keyword || "서울",
    isDomestic: true
  });
  const stayPayload = await fetchMyRealTrip("accommodation-search", {
    regionId: regionIdFromAutocomplete(regionPayload),
    checkIn: values.checkIn || dateOffsetIso(1),
    checkOut: values.checkOut || dateOffsetIso(2),
    adultCount: values.adultCount || 2,
    childCount: 0,
    size: 9
  });
  state.myrealtrip = {
    ...state.myrealtrip,
    stays: normalizeMrtProducts(stayPayload, "stay"),
    loaded: true,
    error: false
  };
  renderMyRealTripProducts();
  setMrtSearchStatus("");
}

async function searchMrtTour(form) {
  state.activeMrtTab = "tour";
  const values = formValues(form);
  setBookingResultsVisible(true);
  setMrtSearchStatus("투어·티켓을 검색하는 중입니다.");
  const payload = await fetchMyRealTrip("tna-search", {
    keyword: values.keyword || "서울",
    sort: values.sort || "review_score_desc",
    page: 1,
    size: 9
  });
  state.myrealtrip = {
    ...state.myrealtrip,
    tours: normalizeMrtProducts(payload, "tour"),
    loaded: true,
    error: false
  };
  renderMyRealTripProducts();
  setMrtSearchStatus("");
}

async function searchMrtFlight(form) {
  state.activeMrtTab = "flight";
  const values = formValues(form);
  setBookingResultsVisible(true);
  setMrtSearchStatus("항공권 최저가를 검색하는 중입니다.");
  const payload = await fetchMyRealTrip("flight-calendar-lowest", {
    depCityCd: values.depCityCd || "ICN",
    arrCityCds: values.arrCityCds || "CJU,BKK,NRT",
    period: values.period || 5
  });
  state.myrealtrip = {
    ...state.myrealtrip,
    flights: normalizeMrtFlights(payload),
    loaded: true,
    error: false
  };
  renderMyRealTripProducts();
  setMrtSearchStatus("");
}

function bindMyRealTripSearch() {
  setDefaultMrtDates();
  updateMrtSearchHeading(state.activeMrtTab);

  document.querySelectorAll("[data-mrt-tab]").forEach((button) => {
    button.addEventListener("click", () => setActiveMrtTab(button.dataset.mrtTab));
  });

  const handlers = {
    stay: searchMrtStay,
    tour: searchMrtTour,
    flight: searchMrtFlight
  };

  document.querySelectorAll("[data-mrt-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const handler = handlers[form.dataset.mrtForm];
      if (!handler) return;

      try {
        await handler(form);
      } catch (error) {
        console.warn("MyRealTrip search failed.", error);
        setBookingResultsVisible(true);
        setMrtSearchStatus("검색 결과를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.", true);
      }
    });
  });
}

function bindMrtQuickSearch() {
  document.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-mrt-chip]");
    if (!chip) return;

    const form = chip.closest("[data-mrt-form]");
    const targetName = chip.getAttribute("data-mrt-target");
    const value = chip.getAttribute("data-mrt-value") || chip.textContent.trim();
    const target = form?.elements?.[targetName];
    if (!form || !target) return;

    event.preventDefault();
    target.value = value;

    form.querySelectorAll(`[data-mrt-chip][data-mrt-target="${targetName}"]`).forEach((item) => {
      item.classList.toggle("is-selected", item === chip);
    });

    if (targetName === "arrCityCds") {
      const helper = form.querySelector("[data-mrt-flight-helper]");
      if (helper) helper.value = chip.textContent.trim();
    }
  });

  document.addEventListener("keydown", (event) => {
    const helper = event.target.closest("[data-mrt-flight-helper]");
    if (!helper || event.key !== "Enter") return;

    const form = helper.closest("[data-mrt-form]");
    const value = helper.value.trim().toUpperCase();
    if (!form || !value) return;

    event.preventDefault();
    const target = form.elements.arrCityCds;
    if (target) target.value = value;
  });
}

async function loadMyRealTripProducts() {
  renderMyRealTripProducts();
  const checkIn = dateOffsetIso(1);
  const checkOut = dateOffsetIso(2);

  try {
    const [tourResult, stayResult, flightResult] = await Promise.allSettled([
      fetchMyRealTrip("tna-search", {
        keyword: "서울 투어",
        page: 1,
        size: 9,
        sort: "review_score_desc"
      }),
      fetchMyRealTrip("accommodation-search", {
        checkIn,
        checkOut,
        adultCount: 2,
        childCount: 0,
        size: 9
      }),
      fetchMyRealTrip("flight-calendar-lowest", {
        depCityCd: "ICN",
        arrCityCds: "CJU,BKK,NRT,TYO",
        period: 5
      })
    ]);

    state.myrealtrip = {
      tours: tourResult.status === "fulfilled" ? normalizeMrtProducts(tourResult.value, "tour") : [],
      stays: stayResult.status === "fulfilled" ? normalizeMrtProducts(stayResult.value, "stay") : [],
      flights: flightResult.status === "fulfilled" ? normalizeMrtFlights(flightResult.value) : [],
      loaded: true,
      error: [tourResult, stayResult, flightResult].some((result) => result.status === "rejected")
    };
  } catch (error) {
    console.warn("MyRealTrip products could not be loaded.", error);
    state.myrealtrip = {
      tours: [],
      stays: [],
      flights: [],
      loaded: true,
      error: true
    };
  }

  renderMyRealTripProducts();
  renderJulyFestivals();
  renderCategoryNewsSections();
}

function categoryFeaturedCard(item) {
  const title = displayArticleTitle(item);
  return `
    <article class="category-feature-card">
      <a href="${escapeHtml(detailUrl(item))}" aria-label="${escapeHtml(`${title} ${textFor("card.detail")}`)}">
        ${imageMarkup(item, "categoryHero")}
        <strong>${escapeHtml(title)}</strong>
      </a>
    </article>
  `;
}

function categoryMiniCard(item) {
  const title = displayArticleTitle(item);
  return `
    <article class="category-mini-card">
      <a href="${escapeHtml(detailUrl(item))}" aria-label="${escapeHtml(`${title} ${textFor("card.detail")}`)}">
        ${imageMarkup(item, "mini")}
        <strong>${escapeHtml(title)}</strong>
      </a>
    </article>
  `;
}

function categoryListCard(item) {
  const title = displayArticleTitle(item);
  return `
    <article class="category-list-card">
      <a href="${escapeHtml(detailUrl(item))}" aria-label="${escapeHtml(`${title} ${textFor("card.detail")}`)}">
        ${imageMarkup(item, "feed")}
        <strong>${escapeHtml(title)}</strong>
      </a>
    </article>
  `;
}

function categoryMagazineCard(item) {
  const title = displayArticleTitle(item);
  const category = displayCategoryLabel(item);
  return `
    <article class="category-magazine-card">
      <a href="${escapeHtml(detailUrl(item))}" aria-label="${escapeHtml(`${title} ${textFor("card.detail")}`)}">
        ${imageMarkup(item, "magazine")}
        <span class="category-label">${escapeHtml(category)}</span>
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(displaySummary(item))}</p>
        <small>${escapeHtml(item.date)} · ${escapeHtml(displayReadTime(item))}</small>
      </a>
    </article>
  `;
}

function normalizeArticleKeyPart(value = "") {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function articleIdentityKey(item, index = 0) {
  const title = normalizeArticleKeyPart(item.title);
  const place = normalizeArticleKeyPart(item.place || item.address);
  const category = normalizeArticleKeyPart(item.category);

  if (title && place) return `${title}|${place}|${category}`;
  return item.contentId || item.id || `${title || "article"}-${index}`;
}

function articleSpecificityScore(item = {}) {
  const date = String(item.date || "");
  let score = date.length;
  if (/[~-]/.test(date)) score += 20;
  score += articleDateSpanScore(date);
  if (item.image) score += 2;
  if (item.homepage) score += 2;
  if (item.tel) score += 1;
  return score;
}

function articleDateSpanScore(date = "") {
  const tokens = String(date).match(/\d{4}[-.]\d{2}[-.]\d{2}|\d{8}/g) || [];
  if (tokens.length < 2) return 0;

  const normalizeDate = (value) => {
    const compact = String(value).replace(/\D/g, "");
    if (compact.length !== 8) return null;
    return Date.UTC(Number(compact.slice(0, 4)), Number(compact.slice(4, 6)) - 1, Number(compact.slice(6, 8)));
  };
  const start = normalizeDate(tokens[0]);
  const end = normalizeDate(tokens[tokens.length - 1]);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 0;
  return Math.round((end - start) / 86400000);
}

function uniqueArticles(items) {
  const map = new Map();

  items.filter(Boolean).forEach((item, index) => {
    const key = articleIdentityKey(item, index);
    const current = map.get(key);
    if (!current || articleSpecificityScore(item) > articleSpecificityScore(current)) {
      map.set(key, item);
    }
  });

  return [...map.values()];
}

function categoryItems(seedItems, fallbackItems, offset = 0, limit = 8) {
  const source = uniqueArticles([...seedItems, ...fallbackItems]);
  if (!source.length) return [];
  const rotated = [...source.slice(offset), ...source.slice(0, offset)];
  return rotated.slice(0, limit);
}

function buildCategoryNewsGroups() {
  const apiItems = (state.apiArticles || []).map(withGroupedCategory);
  const julyItems = state.julyArticles || [];
  const localItems = (julyItems || []).map(withGroupedCategory);
  const allItems = uniqueArticles([...apiItems, ...localItems]);
  const groupText = {
    ko: [
      { id: "exhibition", title: "전시/미술", subtitle: "미술관, 갤러리, 전시 공간에서 열리는 서울 문화행사" },
      { id: "performance", title: "공연/무대", subtitle: "클래식, 연극, 콘서트, 무용, 국악, 뮤지컬 공연" },
      { id: "experience", title: "교육/체험", subtitle: "어린이, 가족, 성인 대상 체험과 강좌 프로그램" },
      { id: "movie", title: "영화", subtitle: "영화 상영, 영화제, 영상 관련 문화행사" },
      { id: "festival", title: "축제", subtitle: "문화예술, 관광, 전통, 체육 성격의 서울 축제" }
    ],
    en: [
      { id: "exhibition", title: "Exhibitions", subtitle: "Museums, galleries, and art events in Seoul" },
      { id: "performance", title: "Performances", subtitle: "Classical music, theater, concerts, dance, gugak, and musicals" },
      { id: "experience", title: "Classes & Experiences", subtitle: "Hands-on programs for children, families, and adults" },
      { id: "movie", title: "Film", subtitle: "Film screenings, festivals, and media events" },
      { id: "festival", title: "Festivals", subtitle: "Culture, tourism, tradition, and sports festivals in Seoul" }
    ],
    ja: [
      { id: "exhibition", title: "展示・美術", subtitle: "美術館、ギャラリー、展示空間で開かれるソウルの文化行事" },
      { id: "performance", title: "公演・舞台", subtitle: "クラシック、演劇、コンサート、舞踊、国楽、ミュージカル" },
      { id: "experience", title: "教育・体験", subtitle: "子ども、家族、大人向けの体験プログラム" },
      { id: "movie", title: "映画", subtitle: "映画上映、映画祭、映像関連イベント" },
      { id: "festival", title: "祭り", subtitle: "文化芸術、観光、伝統、スポーツ系のソウルの祭り" }
    ],
    zh: [
      { id: "exhibition", title: "展览/美术", subtitle: "首尔美术馆、画廊和展览空间的文化活动" },
      { id: "performance", title: "演出/舞台", subtitle: "古典音乐、戏剧、演唱会、舞蹈、国乐和音乐剧" },
      { id: "experience", title: "教育/体验", subtitle: "儿童、家庭和成人可参加的体验项目" },
      { id: "movie", title: "电影", subtitle: "电影放映、电影节和影像相关活动" },
      { id: "festival", title: "庆典", subtitle: "文化艺术、旅游、传统和体育类首尔庆典" }
    ]
  };
  const groupMeta = groupText[state.language] || groupText.ko;
  const categoryById = {
    exhibition: "전시/미술",
    performance: "공연/무대",
    experience: "교육/체험",
    movie: "영화",
    festival: "축제"
  };

  return groupMeta
    .map((group, index) => ({
      ...group,
      items: categoryItems(
        allItems.filter((item) => item.category === categoryById[group.id]),
        [],
        index,
        8
      )
    }))
    .filter((group) => group.items.length);
}

function renderTopCategoryTabs(groups = buildCategoryNewsGroups()) {
  const target = $("#topCategoryTabs");
  if (!target) return;

  const items = primaryNewsItems();
  const counts = categoryCountMap(items);
  const tabs = groups.map((group) => ({
    ...group,
    count: counts.get(group.id) || 0
  }));

  target.innerHTML = tabs.map((group) => {
    const isActive = state.activeCategoryFilter === group.id;
    return `
    <button class="category-tab ${isActive ? "is-active" : ""}" type="button" data-category-filter="${escapeHtml(group.id)}" aria-pressed="${isActive ? "true" : "false"}">
      <span>${escapeHtml(group.title)}</span>
      <strong>${Number(group.count || 0).toLocaleString("ko-KR")}</strong>
    </button>
  `;
  }).join("");
}

function bindTopCategoryTabs() {
  const target = $("#topCategoryTabs");
  if (!target) return;

  target.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category-filter]");
    if (!button) return;
    state.activeCategoryFilter = button.getAttribute("data-category-filter") || "all";
    target.querySelectorAll(".category-tab").forEach((item) => {
      const isActive = item === button;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
    renderJulyFestivals();
  });
}

function bindCategoryResetLinks() {
  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-category-reset]");
    if (!link) return;
    state.activeCategoryFilter = "all";
    renderJulyFestivals();
  });
}

function renderCategoryNewsBlock(group) {
  const cards = group.items.slice(0, 6);

  return `
    <section class="category-news-block" id="${escapeHtml(group.id)}" aria-labelledby="${escapeHtml(group.id)}Title">
      <div class="category-news-heading">
        <div>
          <p class="eyebrow">${escapeHtml(group.eyebrow || "Travel")}</p>
          <h2 id="${escapeHtml(group.id)}Title">${escapeHtml(group.title)}</h2>
        </div>
        <a href="#allArticles" data-category-reset>${state.language === "ko" ? "더보기" : "More"} ›</a>
      </div>
      <div class="category-magazine-grid">
        ${cards.map((item) => categoryMagazineCard(item)).join("")}
      </div>
    </section>
  `;
}

function takeMagazineItems(candidates, usedKeys, limit = 6) {
  const picked = [];

  candidates.forEach((item, index) => {
    if (picked.length >= limit) return;
    const key = articleIdentityKey(item, index);
    if (usedKeys.has(key)) return;
    usedKeys.add(key);
    picked.push(item);
  });

  return picked;
}

function buildMagazineNewsSections() {
  const items = primaryNewsItems();
  const used = new Set();
  const latest = [...items].sort((a, b) => articleDateValue(b) - articleDateValue(a));
  const byCategory = (keys) => items.filter((item) => keys.includes(categoryKeyFor(item)));
  const fallback = (picked, offset = 0) => picked.length ? picked : items.slice(offset, offset + 6);

  return [
    {
      id: "latest-news",
      eyebrow: "Latest",
      title: "최신 여행뉴스",
      items: fallback(takeMagazineItems(latest, used, 6), 6)
    },
    {
      id: "scene",
      eyebrow: "Scene",
      title: "생생한 문화",
      items: fallback(takeMagazineItems(byCategory(["exhibition", "performance", "movie"]), used, 6), 12)
    },
    {
      id: "before-trip",
      eyebrow: "Read Before",
      title: "여행 전 체크할 거리",
      items: fallback(takeMagazineItems(byCategory(["experience", "festival", "event"]), used, 6), 18)
    }
  ].filter((group) => group.items.length);
}

function renderCategoryNewsSections() {
  const target = $("#categoryNewsSections");
  if (!target) return;

  const groups = buildCategoryNewsGroups();
  const magazineGroups = buildMagazineNewsSections();
  const section = $("#categoryNews");
  renderTopCategoryTabs(groups);
  if (section) section.hidden = !magazineGroups.length;
  target.innerHTML = magazineGroups.map((group) => renderCategoryNewsBlock(group)).join("");
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
  const month = currentSeoulMonth();
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    day: "2-digit"
  }).formatToParts(new Date()).find((part) => part.type === "day")?.value || "01";
  return `${month.year}${month.month}${day}`;
}

function currentSeoulMonth() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit"
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value || String(new Date().getFullYear());
  const month = parts.find((part) => part.type === "month")?.value || String(new Date().getMonth() + 1).padStart(2, "0");
  const lastDay = String(new Date(Number(year), Number(month), 0).getDate()).padStart(2, "0");
  return {
    year,
    month,
    key: `${year}${month}`,
    start: `${year}${month}01`,
    end: `${year}${month}${lastDay}`,
    label: `${Number(month)}월`
  };
}

function festivalSearchStartCompact() {
  return currentSeoulMonth().start;
}

function monthFromDateRange(value) {
  const text = String(value || "");
  const compactDates = text.match(/\d{8}/g) || [];
  const dashedDates = text.match(/\d{4}[.-]\d{2}[.-]\d{2}/g) || [];
  const normalized = [
    ...compactDates,
    ...dashedDates.map((date) => date.replace(/\D/g, ""))
  ].filter((date) => date.length === 8);
  return normalized;
}

function overlapsCurrentMonthByDateText(value) {
  const dates = monthFromDateRange(value);
  if (!dates.length) return true;
  const month = currentSeoulMonth();
  const start = dates[0];
  const end = dates[1] || start;
  return start <= month.end && end >= month.start;
}

function activeRegion() {
  const regions = data.regions || [];
  return regions.find((region) => region.id === state.activeRegionId) || regions[0] || { id: "seoul", label: "서울", areaCode: "1" };
}

function regionIdFromText(value) {
  const text = String(value || "").replace(/\s+/g, "").replace(/축제|여행|주말|이번주/g, "");
  const aliases = {
    전국: "all",
    서울: "seoul",
    경기: "gyeonggi",
    경기도: "gyeonggi",
    인천: "incheon",
    부산: "busan",
    대구: "daegu",
    대전: "daejeon",
    광주: "gwangju",
    울산: "ulsan",
    세종: "sejong",
    강원: "gangwon",
    강원도: "gangwon",
    충청: "chungcheong",
    충청도: "chungcheong",
    충북: "chungbuk",
    충남: "chungnam",
    전라: "jeolla",
    전라도: "jeolla",
    전북: "jeonbuk",
    전남: "jeonnam",
    경상: "gyeongsang",
    경상도: "gyeongsang",
    경북: "gyeongbuk",
    경남: "gyeongnam",
    제주: "jeju",
    제주도: "jeju"
  };

  return aliases[text] || "";
}

function regionLinkMarkup(label) {
  const regionId = regionIdFromText(label);
  const dataAttr = regionId ? ` data-region-id="${escapeHtml(regionId)}"` : "";
  return `<a href="${regionId ? "#allArticles" : "#"}"${dataAttr}>${escapeHtml(label)}</a>`;
}

function footerMrtTarget(tab, keyword = "", options = {}) {
  const attrs = [`data-mrt-open="${escapeHtml(tab)}"`];
  if (keyword) attrs.push(`data-mrt-keyword="${escapeHtml(keyword)}"`);
  if (options.coupon) attrs.push('data-mrt-coupon="true"');
  return { href: "#bookingSearch", attrs: ` ${attrs.join(" ")}` };
}

function footerLinkTarget(label = "", groupTitle = "") {
  if (`${groupTitle} ${label}`.replace(/\s+/g, "").includes("할인")) {
    return footerMrtTarget("tour", "서울 할인", { coupon: true });
  }

  const text = `${groupTitle} ${label}`;
  const normalized = text.replace(/\s+/g, "");

  if (normalized.includes("숙소")) {
    return footerMrtTarget("stay");
  }
  if (normalized.includes("입장권") || normalized.includes("예매") || normalized.includes("티켓")) {
    return footerMrtTarget("tour", "서울 입장권");
  }
  if (normalized.includes("교통") || normalized.includes("항공")) {
    return footerMrtTarget("flight");
  }
  if (normalized.includes("축제정보") || normalized.includes("서울축제")) {
    return { href: "#july", attrs: "" };
  }
  if (normalized.includes("예약전체크")) {
    return { href: "#bookingSearch", attrs: "" };
  }
  if (normalized.includes("방문가이드")) {
    return { href: "#faqTitle", attrs: "" };
  }
  if (normalized.includes("큐레이션") || normalized.includes("매거진")) {
    return { href: "#categoryNews", attrs: "" };
  }

  const regionId = regionIdFromText(label);
  if (regionId) {
    return { href: "#allArticles", attrs: ` data-region-id="${escapeHtml(regionId)}"` };
  }

  return { href: "#top", attrs: "" };
}

function footerLinkMarkup(label, groupTitle = "") {
  const target = footerLinkTarget(label, groupTitle);
  return `<a href="${escapeHtml(target.href)}"${target.attrs}>${escapeHtml(label)}</a>`;
}

function selectRegion(regionId) {
  if (!regionId || regionId === state.activeRegionId) return;

  const regionExists = (data.regions || []).some((region) => region.id === regionId);
  if (!regionExists) return;

  state.activeRegionId = regionId;
  state.apiArticles = [];
  state.apiLoaded = false;
  state.apiError = false;
  renderRegionChips();
  updateRegionHeading();
  updatePlacesStatus(`${activeRegion().label} 축제 정보를 불러오는 중입니다.`);
  renderJulyFestivals();
  renderCategoryNewsSections();
  renderPlaces();
  renderCuration();
  renderEditorialPosts();
  loadTourApiPlaces();
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
        address,
        mapx: item.mapx || "",
        mapy: item.mapy || "",
        href: "#allArticles"
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
    MobileApp: config.mobileApp || "SeoulTravelNote",
    _type: "json",
    arrange: config.arrange || "O"
  });

  if (config.mode === "festival") {
    params.set("eventStartDate", config.eventStartDate || festivalSearchStartCompact());
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
  const month = currentSeoulMonth();
  const params = new URLSearchParams({
    serviceKey: config.serviceKey,
    numOfRows: String(numOfRows),
    pageNo: String(pageNo),
    MobileOS: config.mobileOS || "ETC",
    MobileApp: config.mobileApp || "SeoulTravelNote",
    _type: "json",
    arrange: config.arrange || "O",
    eventStartDate: month.start,
    areaCode: config.areaCode || "1"
  });

  return `${config.endpoint}?${params.toString()}`;
}

function buildSeoulCultureUrl() {
  const config = data.seoulCultureApi || {};
  const month = currentSeoulMonth();
  const params = new URLSearchParams({
    limit: String(config.limit || 300),
    month: month.key
  });
  return `${config.endpoint || "/api/seoul-events"}?${params.toString()}`;
}

function overlapsJulyFestival(item) {
  const month = currentSeoulMonth();
  const start = String(item.eventstartdate || "");
  const end = String(item.eventenddate || start);
  return start <= month.end && end >= month.start;
}

function regionLabelFromAddress(address) {
  const first = String(address || "").split(" ")[0] || "서울";
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
        image: String(image).replace(/^http:/, "https:"),
        address,
        mapx: item.mapx || "",
        mapy: item.mapy || ""
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
  state.apiError = false;

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

    state.apiArticles = apiArticles;
    state.apiLoaded = true;
    state.apiError = false;

    if (apiArticles.length) {
      updatePlacesStatus(`서울 축제 ${apiArticles.length}개를 불러왔습니다.`);
    } else {
      updatePlacesStatus("서울에 표시할 축제 정보가 아직 등록되어 있지 않습니다.");
    }

    renderPlaces();
    renderCuration();
    renderEditorialPosts();
    renderJulyFestivals();
    renderCategoryNewsSections();
  } catch (error) {
    console.warn("TourAPI request failed. Fallback content is displayed.", error);
    state.apiArticles = [];
    state.apiLoaded = true;
    state.apiError = true;
    updatePlacesStatus("서울 축제 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
    renderPlaces();
    renderCuration();
    renderEditorialPosts();
    renderJulyFestivals();
    renderCategoryNewsSections();
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function renderJulyFestivals() {
  const status = $("#julyStatus");
  const featured = $("#featuredArticle");
  const recommended = $("#recommendedArticles");
  const feed = $("#newsFeedList");
  const countTarget = $("#allArticleCount");
  if (!status || !featured || !recommended || !feed) return;

  const month = currentSeoulMonth();
  const allItems = primaryNewsItems();
  const items = filteredNewsItems(allItems);
  renderTopCategoryTabs();

  if (countTarget) {
    countTarget.textContent = `${items.length.toLocaleString("ko-KR")}개`;
  }

  if (!items.length) {
    if (state.newsLoading && !state.apiLoaded && !state.apiError) {
      status.textContent = "";
      status.hidden = true;
      featured.innerHTML = "";
      renderNewsLoadingSkeleton();
      return;
    }

    setNewsLoading(false);
    status.textContent = state.activeCategoryFilter === "all"
      ? `${month.label}에 표시할 서울 여행 정보를 불러오는 중입니다.`
      : "선택한 분류에 표시할 서울 여행 정보가 없습니다.";
    status.hidden = false;
    featured.innerHTML = "";
    recommended.innerHTML = "";
    feed.innerHTML = "";
    return;
  }

  setNewsLoading(false);
  status.textContent = "";
  status.hidden = true;

  featured.innerHTML = newsFeaturedCard(items[0]);
  recommended.innerHTML = items.slice(1, 5).map((item) => newsRecommendCard(item)).join("");
  feed.innerHTML = buildNewsFeedMarkup(items.slice(5, 65));
}

async function loadSeoulCultureEvents() {
  if (!data.seoulCultureApi?.endpoint) {
    loadTourApiPlaces();
    return;
  }

  state.apiError = false;
  updatePlacesStatus("서울 문화행사 정보를 불러오는 중입니다.");

  try {
    const response = await fetch(buildSeoulCultureUrl(), {
      headers: { Accept: "application/json" }
    });
    const payload = await response.json();
    if (!response.ok || payload?.ok === false) {
      throw new Error(payload?.message || `Seoul events HTTP ${response.status}`);
    }

    const seoulArticles = normalizeSeoulCultureItems(payload.items);
    state.apiArticles = seoulArticles;
    state.apiLoaded = true;
    state.apiError = false;

    if (seoulArticles.length) {
      updatePlacesStatus(`서울 문화행사 ${seoulArticles.length}개를 불러왔습니다.`);
    } else {
      updatePlacesStatus("서울 문화행사 정보가 아직 등록되어 있지 않습니다.");
    }

    renderPlaces();
    renderCuration();
    renderEditorialPosts();
    renderJulyFestivals();
    renderCategoryNewsSections();
  } catch (error) {
    console.warn("Seoul cultural events could not be loaded. TourAPI fallback is requested.", error);
    state.apiArticles = [];
    state.apiLoaded = false;
    state.apiError = true;
    updatePlacesStatus("서울 문화행사 정보를 불러오지 못했습니다. 관광공사 축제 정보로 다시 확인합니다.");
    loadTourApiPlaces();
  }
}

function readJulyFestivalCache() {
  try {
    const cached = window.sessionStorage.getItem(`festivalNote.monthArticles.${currentSeoulMonth().key}.v1`);
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
      `festivalNote.monthArticles.${currentSeoulMonth().key}.v1`,
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
    renderCuration();
    renderEditorialPosts();
    renderCategoryNewsSections();
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
    renderCuration();
    renderEditorialPosts();
    renderCategoryNewsSections();
  } catch (error) {
    console.warn("July festival posts could not be loaded.", error);
    const status = $("#julyStatus");
    if (status) {
      status.textContent = textFor("july.error");
      status.hidden = false;
    }
  }
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
    selectRegion(regionId);
  });
}

function renderPlaces() {
  const grid = $("#placesGrid");
  if (!grid) return;
  const region = activeRegion();
  const items = state.apiArticles.length
    ? state.apiArticles.slice(0, 12)
    : [];

  if (!items.length) {
    const title = state.apiError
      ? "축제 정보를 불러오지 못했습니다"
      : state.apiLoaded
        ? `${region.label} 축제 정보가 아직 없습니다`
        : "축제 정보를 불러오는 중입니다";
    const description = state.apiError
      ? "네트워크 상태를 확인한 뒤 다시 시도해 주세요. 다른 지역을 선택하면 등록된 축제를 확인할 수 있습니다."
      : state.apiLoaded
        ? "공공 관광 데이터에 지역 축제가 등록되면 이곳에 표시됩니다."
        : "잠시만 기다려 주세요. 등록된 지역 축제를 확인하고 있습니다.";

    grid.innerHTML = `
      <div class="empty-state">
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(description)}</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = items
    .map((item) => articleCard(item))
    .join("");
}

function updatePlacesStatus(message = "") {
  const target = $("#placesStatus");
  if (!target) return;
  target.textContent = message;
}

function renderBooking() {
  const target = $("#bookingGrid");
  if (!target) return;

  target.innerHTML = data.bookingChecks.map((item) => `
    <article class="booking-card">
      <span>${escapeHtml(item.label)}</span>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.summary)}</p>
      <a href="${escapeHtml(item.href)}">${escapeHtml(textFor("booking.link"))}</a>
    </article>
  `).join("");
}

function renderCuration() {
  const target = $("#curationList");
  if (!target) return;

  const items = [...state.apiArticles.slice(0, 2), ...state.julyArticles.slice(0, 4)]
    .filter((item, index, list) => list.findIndex((target) => target.contentId === item.contentId) === index)
    .slice(0, 6);

  if (!items.length) {
    target.innerHTML = `
      <div class="empty-state">
        <h3>추천 축제를 불러오는 중입니다</h3>
        <p>축제 목록이 준비되면 실제 상세 정보로 연결되는 추천 카드가 표시됩니다.</p>
      </div>
    `;
    return;
  }

  target.innerHTML = items
    .map((item) => {
      const title = displayArticleTitle(item);
      const category = displayCategoryLabel(item);
      return `
      <article class="curation-card">
        <a href="${escapeHtml(detailUrl(item))}" aria-label="${escapeHtml(`${title} ${textFor("card.detail")}`)}">
          ${imageMarkup(item, "thumb")}
          <span>
            <em>${escapeHtml(category)}</em>
            <strong>${escapeHtml(title)}</strong>
            <small>${escapeHtml(displaySummary(item))}</small>
          </span>
        </a>
      </article>
    `;
    })
    .join("");
}

function renderEditorialPosts() {
  const target = $("#editorialList");
  if (!target) return;

  const posts = Array.isArray(data.editorialPosts) && data.editorialPosts.length
    ? data.editorialPosts
    : data.articles || [];

  target.innerHTML = posts.slice(0, 20).map((item, index) => {
    const href = item.href || detailUrl(item);
    return `
      <article class="editorial-card ${index === 0 ? "editorial-card--lead" : ""}">
        <a href="${escapeHtml(href)}" aria-label="${escapeHtml(`${item.title} 자세히 보기`)}">
          ${imageMarkup(item, index === 0 ? "hero" : "thumb")}
          <span>
            <em>${escapeHtml(item.category || "서울 여행")}</em>
            <strong>${escapeHtml(item.title)}</strong>
            <small>${escapeHtml(item.summary || "")}</small>
            <b>${escapeHtml(item.date || "")} · ${escapeHtml(item.readTime || "정보 글")}</b>
          </span>
        </a>
      </article>
    `;
  }).join("");
}

function renderCategoryGroups() {
  const target = $("#categoryGroups");
  if (!target) return;

  target.innerHTML = data.categoryGroups.map((group) => `
    <article class="category-group">
      <h3>${escapeHtml(group.title)}</h3>
      <p>${escapeHtml(group.summary)}</p>
      <div>
        ${group.links.map((link) => regionLinkMarkup(link)).join("")}
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
      ${group.links.map((link) => footerLinkMarkup(link, group.title)).join("")}
    </nav>
  `).join("");
}

function bindMrtRailFilters() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-mrt-rail-filter]");
    if (!button) return;

    const module = button.closest(".mrt-feed-module");
    if (!module) return;

    event.preventDefault();
    const filter = button.getAttribute("data-mrt-rail-filter") || "tour";
    module.setAttribute("data-active-filter", filter);
    module.querySelectorAll("[data-mrt-rail-filter]").forEach((item) => {
      const isActive = item === button;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });
  });
}

function bindFooterLinks() {
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-mrt-open]");
    if (!link) return;

    const tab = link.getAttribute("data-mrt-open");
    event.preventDefault();

    const keyword = link.getAttribute("data-mrt-keyword");
    if (keyword && tab === "stay") {
      const input = $("#mrtStayForm")?.elements.keyword;
      if (input) input.value = keyword;
    }

    if (keyword && tab === "tour") {
      const input = $("#mrtTourForm")?.elements.keyword;
      if (input) input.value = keyword;
    }

    if (tab === "flight") {
      const flightForm = $("#mrtFlightForm");
      const depCity = link.getAttribute("data-mrt-dep-city");
      const arrCities = link.getAttribute("data-mrt-arr-cities");
      if (flightForm?.elements.depCityCd && depCity) flightForm.elements.depCityCd.value = depCity;
      if (flightForm?.elements.arrCityCds && arrCities) flightForm.elements.arrCityCds.value = arrCities;
    }

    openBookingSearch(tab, { showCoupon: link.hasAttribute("data-mrt-coupon") });
  });
}

function bindBookingSearchPanel() {
  document.addEventListener("click", (event) => {
    const closeButton = event.target.closest("[data-booking-close]");
    if (closeButton) {
      event.preventDefault();
      closeBookingSearch();
      return;
    }

    const bookingLink = event.target.closest('a[href="#bookingSearch"]:not([data-mrt-open])');
    if (!bookingLink) return;

    event.preventDefault();
    openBookingSearch(state.activeMrtTab || "stay");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeBookingSearch();
  });
}

function applyBookingSearchQuery() {
  const params = new URLSearchParams(window.location.search);
  const requestedTab = params.get("booking") || params.get("mrt");
  const showCoupon = params.get("coupon") === "1" || params.get("coupon") === "true";
  const shouldOpen = window.location.hash === "#bookingSearch" || Boolean(requestedTab);
  if (!shouldOpen) return;

  const allowedTabs = ["stay", "tour", "flight"];
  const tab = allowedTabs.includes(requestedTab) ? requestedTab : state.activeMrtTab || "stay";
  const keyword = params.get("keyword");

  if (keyword && tab === "stay") {
    const input = $("#mrtStayForm")?.elements.keyword;
    if (input) input.value = keyword;
  }

  if (keyword && tab === "tour") {
    const input = $("#mrtTourForm")?.elements.keyword;
    if (input) input.value = keyword;
  }

  if (tab === "flight") {
    const flightForm = $("#mrtFlightForm");
    const depCity = params.get("depCityCd");
    const arrCities = params.get("arrCityCds");
    if (flightForm?.elements.depCityCd && depCity) flightForm.elements.depCityCd.value = depCity;
    if (flightForm?.elements.arrCityCds && arrCities) flightForm.elements.arrCityCds.value = arrCities;
  }

  window.setTimeout(() => openBookingSearch(tab, { showCoupon }), 120);
}

function bindRegionLinks() {
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-region-id]");
    if (!link) return;

    const regionId = link.getAttribute("data-region-id");
    if (!regionId) return;

    event.preventDefault();
    selectRegion(regionId);
    $("#allArticles")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
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
  setNewsLoading(true);
  renderRegionChips();
  updateRegionHeading();
  renderJulyFestivals();
  renderPlaces();
  renderBooking();
  renderCuration();
  renderEditorialPosts();
  renderMyRealTripProducts();
  renderCoupangProducts();
  renderCategoryNewsSections();
  renderCategoryGroups();
  renderFaq();
  renderFooter();
  bindMenu();
  bindRegionChips();
  bindRegionLinks();
  bindFooterLinks();
  bindMrtRailFilters();
  bindBookingSearchPanel();
  bindMyRealTripSearch();
  bindMrtQuickSearch();
  bindTopCategoryTabs();
  bindCategoryResetLinks();
  bindLanguageSwitch();
  applyLanguage();
  applyBookingSearchQuery();
  loadSeoulCultureEvents();
  loadJulyFestivalPosts();
  loadMyRealTripProducts();
  loadCoupangProducts();
}

document.addEventListener("DOMContentLoaded", init);
