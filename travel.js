const data = window.TRAVEL_PORTAL_DATA;
const supportedLanguages = ["ko", "en", "ja", "zh"];
const MRT_FETCH_TIMEOUT_MS = 12000;
const COUPANG_WIDGET_SCRIPT = "https://ads-partners.coupang.com/g.js";
const COUPANG_WIDGET_CONFIG = {
  id: 1003200,
  trackingCode: "AF1488183",
  subId: null,
  template: "carousel",
  width: "680",
  height: "140"
};
const DEFAULT_EVENT_IMAGE = "";
const DEFAULT_FESTIVAL_IMAGE = "";
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

function seasonalTravelProductKeyword(date = new Date()) {
  const month = Number(new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    month: "numeric"
  }).format(date));

  if (month >= 3 && month <= 5) return "봄 여행 필수품";
  if (month >= 6 && month <= 8) return "여름 여행 필수품";
  if (month >= 9 && month <= 11) return "가을 여행 필수품";
  return "겨울 여행 필수품";
}

const state = {
  apiArticles: [],
  placesArticles: [],
  placesLoaded: false,
  placesError: false,
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
    keyword: seasonalTravelProductKeyword()
  },
  activeMrtTab: "stay",
  apiLoaded: false,
  apiError: false,
  activeRegionId: "seoul",
  activeCategoryFilter: "all",
  visibleFeedCount: 12,
  newsLoading: true,
  language: getStoredLanguage()
};
let coupangWidgetScriptPromise = null;
let affiliateLoadPromise = null;
const FEED_PAGE_SIZE = 12;

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
    "meta.title": "대한축제뉴스 | 전국 축제 정보 뉴스",
    "brand.name": "대한축제뉴스",
    "brand.tagline": "전국 축제 정보 뉴스",
    "footer.tagline": "전국 축제 선택을 돕는 뉴스 포털",
    "footer.description": "전국 축제, 문화행사 일정, 방문 준비, 교통과 주변 여행 정보를 뉴스 피드로 정리합니다.",
    "nav.menu": "메뉴 열기",
    "nav.home": "홈",
    "nav.july": "여행뉴스",
    "nav.places": "가볼만한 곳",
    "nav.booking": "여행검색",
    "nav.group.explore": "둘러보기",
    "nav.group.booking": "예약",
    "nav.group.reading": "읽을거리",
    "nav.categoryNews": "분야별 축제",
    "nav.stay": "숙소 검색",
    "nav.tour": "투어·입장권",
    "nav.flight": "항공권",
    "nav.latest": "최신 뉴스",
    "nav.rss": "RSS 피드",
    "nav.about": "사이트 소개",
    "july.title": "오늘 볼 만한 전국 축제 뉴스",
    "july.description": "전국 축제, 계절 행사, 방문 코스와 방문 전 체크 정보를 뉴스 피드 형식으로 정리했습니다.",
    "july.loading": "이번 달 전국 축제 정보를 불러오는 중입니다.",
    "july.count": "총 {count}개의 축제 기사를 불러왔습니다.",
    "july.error": "축제 정보를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.",
    "places.title": "지역별 축제 찾기",
    "places.title.all": "지역별 축제 찾기",
    "places.title.region": "{region} 축제 정보",
    "places.description": "서울부터 부산, 제주까지 지역별로 열리는 축제와 여행 정보를 일정·장소·요금·교통 정보와 함께 살펴보세요.",
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
    "summary.july": "{address}에서 열리는 이번 달 축제입니다. 운영 시간, 입장 방식, 교통과 우천 운영 여부를 함께 확인해 보세요.",
    "summary.julyFallback": "이번 달 일정이 포함된 축제입니다. 방문 전 일정, 장소, 요금, 교통 정보를 확인해 보세요."
  },
  en: {
    "meta.title": "Korea Festival News | Nationwide Festival Information",
    "brand.name": "Korea Festival News",
    "brand.tagline": "Nationwide festival information",
    "footer.tagline": "A news guide for festivals across Korea",
    "footer.description": "A festival news feed covering cultural events nationwide, visit preparation, transport, and nearby information.",
    "nav.menu": "Open menu",
    "nav.home": "Home",
    "nav.july": "Travel News",
    "nav.places": "Places",
    "nav.booking": "Search",
    "nav.group.explore": "Explore",
    "nav.group.booking": "Book",
    "nav.group.reading": "Read",
    "nav.categoryNews": "By Category",
    "nav.stay": "Stays",
    "nav.tour": "Tours & Tickets",
    "nav.flight": "Flights",
    "nav.latest": "Latest News",
    "nav.rss": "RSS Feed",
    "nav.about": "About",
    "july.title": "Festival News to Read Today",
    "july.description": "Browse festival and travel information from across Korea in a mobile news feed with one featured story, recommended cards, and the latest list.",
    "july.loading": "Loading this month's festivals nationwide.",
    "july.count": "{count} festival stories loaded.",
    "july.error": "Could not load this month's festivals. Please try again later.",
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
    "summary.july": "A festival held at {address} this month. Check operating hours, entry method, transport, and rain policy before visiting.",
    "summary.julyFallback": "A festival scheduled for this month. Check schedule, location, fees, and transport before visiting."
  },
  ja: {
    "meta.title": "韓国フェスニュース | 全国フェス情報",
    "brand.name": "韓国フェスニュース",
    "brand.tagline": "全国フェス情報ニュース",
    "footer.tagline": "全国のフェス選びを助けるニュースポータル",
    "footer.description": "全国の文化行事、フェスの日程、訪問準備、交通情報をニュース形式で整理します。",
    "nav.menu": "メニューを開く",
    "nav.home": "ホーム",
    "nav.july": "旅行ニュース",
    "nav.places": "見どころ",
    "nav.booking": "検索",
    "nav.group.explore": "見どころ",
    "nav.group.booking": "予約",
    "nav.group.reading": "読み物",
    "nav.categoryNews": "分野別フェス",
    "nav.stay": "宿泊施設",
    "nav.tour": "ツアー・チケット",
    "nav.flight": "航空券",
    "nav.latest": "最新ニュース",
    "nav.rss": "RSSフィード",
    "nav.about": "サイト概要",
    "july.title": "今日読みたいフェスニュース",
    "july.description": "注目記事、推薦カード、最新リストの順に韓国全国のフェス情報を確認できます。",
    "july.loading": "今月の全国フェス一覧を読み込んでいます。",
    "july.count": "{count}件のフェス記事を読み込みました。",
    "july.error": "今月のフェス一覧を読み込めませんでした。時間をおいてもう一度確認してください。",
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
    "summary.july": "{address}で今月開催されるフェスです。運営時間、入場方法、交通、雨天時の案内を確認しましょう。",
    "summary.julyFallback": "今月の日程を含むフェスです。訪問前に日程、場所、料金、交通情報を確認しましょう。"
  },
  zh: {
    "meta.title": "韩国庆典新闻 | 全国庆典信息",
    "brand.name": "韩国庆典新闻",
    "brand.tagline": "全国庆典信息新闻",
    "footer.tagline": "帮助规划全国庆典行程的新闻门户",
    "footer.description": "以新闻信息流整理全国文化活动、庆典日程、出行准备、交通和周边信息。",
    "nav.menu": "打开菜单",
    "nav.home": "首页",
    "nav.july": "旅行新闻",
    "nav.places": "推荐地点",
    "nav.booking": "搜索",
    "nav.group.explore": "探索",
    "nav.group.booking": "预订",
    "nav.group.reading": "阅读",
    "nav.categoryNews": "分类庆典",
    "nav.stay": "住宿",
    "nav.tour": "旅游·门票",
    "nav.flight": "机票",
    "nav.latest": "最新新闻",
    "nav.rss": "RSS订阅",
    "nav.about": "关于我们",
    "july.title": "今日值得关注的庆典新闻",
    "july.description": "按重点报道、推荐卡片和最新列表的顺序浏览韩国全国庆典信息。",
    "july.loading": "正在加载本月全国庆典列表。",
    "july.count": "已加载{count}篇庆典文章。",
    "july.error": "无法加载本月庆典列表，请稍后再试。",
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
    "summary.july": "这是本月在{address}举行的庆典。请提前确认开放时间、入场方式、交通和雨天安排。",
    "summary.julyFallback": "这是本月举行的庆典。出发前请确认日程、地点、费用和交通信息。"
  }
};

const EDITORIAL_I18N = {
  ko: {
    "nav.editorial": "서울 기획",
    "editorial.title": "서울을 더 잘 여행하는 방법",
    "editorial.description": "전시와 공연, 동네 산책과 교통 정보를 직접 읽고 고른 서울 여행 기획입니다.",
    "editorial.link": "최신 행사 보기",
    "latest.title": "지금 전국에서 열리는 축제",
    "latest.description": "전국 축제·문화행사 정보를 바탕으로 일정·장소·요금·문의처를 확인하고, 방문 동선과 주변 교통까지 함께 정리합니다.",
    "latest.list": "최신 전국 축제"
  },
  en: {
    "nav.editorial": "Seoul Guides",
    "editorial.title": "A better way to explore Seoul",
    "editorial.description": "Editor-selected Seoul itineraries covering exhibitions, performances, neighborhood walks, and practical transport tips.",
    "editorial.link": "See the latest events",
    "latest.title": "What is on across Korea now",
    "latest.description": "Check official festival schedules, venues, prices, contacts, nearby routes, and transport information from across Korea in one place.",
    "latest.list": "Latest festivals nationwide"
  },
  ja: {
    "nav.editorial": "ソウル特集",
    "editorial.title": "ソウルをもっと楽しむ旅の方法",
    "editorial.description": "展示、公演、街歩き、交通情報を編集部が選び、旅の流れに合わせて紹介します。",
    "editorial.link": "最新イベントを見る",
    "latest.title": "今全国で開催中のフェス",
    "latest.description": "全国のフェス・文化イベント情報をもとに、日程、会場、料金、問い合わせ先、周辺交通をまとめました。",
    "latest.list": "全国の最新フェス"
  },
  zh: {
    "nav.editorial": "首尔专题",
    "editorial.title": "用更好的方式探索首尔",
    "editorial.description": "精选展览、演出、街区漫步和交通信息，帮助你轻松规划首尔行程。",
    "editorial.link": "查看最新活动",
    "latest.title": "全国正在举行的庆典",
    "latest.description": "根据全国庆典/文化活动信息，整理日程、地点、票价、联系方式、游览动线和交通。",
    "latest.list": "全国最新庆典"
  }
};

const EDITORIAL_POST_I18N = {
  en: {
    "seoul-weekend-exhibition-guide": {
      category: "Seoul Exhibitions",
      title: "This week's Seoul exhibitions: museums and indoor culture in one route",
      summary: "A weather-friendly itinerary with practical notes on routes, reservations, and viewing times."
    },
    "seoul-family-free-events": {
      category: "Family Travel",
      title: "Free and affordable Seoul cultural events for families",
      summary: "Compare age limits, operating hours, and reservation rules before visiting with children."
    },
    "jongno-junggu-culture-route": {
      category: "Seoul Route",
      title: "A one-day Jongno and Jung-gu route for exhibitions and performances",
      summary: "Plan central Seoul venues as one practical route with enough time for meals and transfers."
    },
    "seoul-night-event-safety-route": {
      category: "Night Events",
      title: "Check your return route before Seoul night performances and festivals",
      summary: "Review the last train, taxi points, lighting, and exit routes before an evening visit."
    },
    "seoul-rainy-day-culture-course": {
      category: "Indoor Seoul",
      title: "How to choose Seoul exhibitions, performances, and experiences on a rainy day",
      summary: "Compare cancellation policies, travel distance, and waiting time for a reliable indoor itinerary."
    }
  },
  ja: {
    "seoul-weekend-exhibition-guide": {
      category: "ソウル展示",
      title: "今週のソウル展示おすすめ、美術館と屋内文化施設を巡るコース",
      summary: "天候に左右されにくい展示を中心に、移動、予約、観覧時間をまとめました。"
    },
    "seoul-family-free-events": {
      category: "家族旅行",
      title: "子どもと楽しむソウルの無料・低料金文化イベント",
      summary: "対象年齢、運営時間、予約条件を比べてから家族の予定を組みましょう。"
    },
    "jongno-junggu-culture-route": {
      category: "ソウルコース",
      title: "鍾路・中区の展示と公演を一日で巡る文化コース",
      summary: "都心の会場を食事時間と移動時間まで含めて効率よくつなぎます。"
    },
    "seoul-night-event-safety-route": {
      category: "夜イベント",
      title: "ソウルの夜公演・祭りは帰宅ルートから確認",
      summary: "終電、タクシー乗り場、照明、会場出口を訪問前に確認しましょう。"
    },
    "seoul-rainy-day-culture-course": {
      category: "室内旅行",
      title: "雨の日のソウル、展示・公演・体験の選び方",
      summary: "取消条件、移動距離、待ち時間を比べて安定した室内コースを選びます。"
    }
  },
  zh: {
    "seoul-weekend-exhibition-guide": {
      category: "首尔展览",
      title: "本周首尔展览推荐：美术馆与室内文化空间路线",
      summary: "以不受天气影响的场馆为主，整理交通、预约和参观时间。"
    },
    "seoul-family-free-events": {
      category: "亲子旅行",
      title: "适合亲子的首尔免费及平价文化活动",
      summary: "带孩子出发前，先比较年龄限制、开放时间和预约规则。"
    },
    "jongno-junggu-culture-route": {
      category: "首尔路线",
      title: "钟路与中区展览、演出一日文化路线",
      summary: "把市中心场馆、用餐和换乘时间整理成顺畅的一日行程。"
    },
    "seoul-night-event-safety-route": {
      category: "夜间活动",
      title: "参加首尔夜间演出和庆典前先确认返程路线",
      summary: "提前查看末班车、出租车点、照明和会场出口。"
    },
    "seoul-rainy-day-culture-course": {
      category: "室内旅行",
      title: "雨天首尔：展览、演出和体验项目的选择方法",
      summary: "比较取消规则、移动距离和等候时间，安排更稳妥的室内行程。"
    }
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
  const editorialTable = EDITORIAL_I18N[state.language] || EDITORIAL_I18N.ko;
  const template = editorialTable[key] || table[key] || EDITORIAL_I18N.ko[key] || I18N.ko[key] || key;
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

function imageListForItem(item = {}) {
  const candidates = [];
  collectImageCandidates(item, candidates);
  return [...new Set(candidates.map(normalizeImageUrl).filter((url) => url && !url.includes("images.unsplash.com")))];
}

function imageUrlForItem(item = {}, fallback = DEFAULT_EVENT_IMAGE) {
  return imageListForItem(item)[0] || fallback;
}

function hasApiImage(item = {}) {
  const image = imageUrlForItem(item, "");
  return Boolean(image && !image.includes("images.unsplash.com"));
}

function imageMarkup(item, size = "card") {
  const title = displayArticleTitle(item);
  const image = imageUrlForItem(item);
  if (!image) {
    return `
      <div class="image-frame image-frame--${escapeHtml(size)} is-empty" aria-label="${escapeHtml(`${title} 이미지 준비 중`)}">
        <span>대한축제뉴스</span>
      </div>
    `;
  }
  const isApi = hasApiImage(item);
  const onError = ` onerror="this.onerror=null;this.closest('.image-frame').classList.add('is-empty');this.remove()"`;
  const apiBackground = isApi
    ? ` style="--api-image: url(&quot;${escapeHtml(image)}&quot;)"`
    : "";
  return `
    <div class="image-frame image-frame--${size}${isApi ? " image-frame--api" : ""}"${apiBackground}>
      <span class="image-fallback-text" aria-hidden="true">대한축제뉴스</span>
      <img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" loading="lazy" width="640" height="480"${onError} />
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

function articleDateRange(item = {}) {
  const tokens = String(item.date || "").match(/\d{4}[-.]\d{1,2}[-.]\d{1,2}|\d{8}/g) || [];
  const values = tokens
    .map((token) => Number(String(token).replace(/\D/g, "")))
    .filter((value) => Number.isFinite(value) && value > 0);
  const start = values[0] || 0;
  return { start, end: values[values.length - 1] || start };
}

function articleTimingGroup(item, today) {
  const { start, end } = articleDateRange(item);
  if (!start) return 3;
  if (start <= today && end >= today) return 0;
  if (start > today) return 1;
  return 2;
}

function articleQualityScore(item = {}) {
  let score = 0;
  if (hasApiImage(item)) score += 4;
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
  const today = Number(todayCompact());
  return [...items].sort((a, b) => {
    const aTiming = articleTimingGroup(a, today);
    const bTiming = articleTimingGroup(b, today);
    if (aTiming !== bTiming) return aTiming - bTiming;

    const aRange = articleDateRange(a);
    const bRange = articleDateRange(b);
    if (aTiming === 1 && aRange.start !== bRange.start) return aRange.start - bRange.start;

    const qualityDiff = articleQualityScore(b) - articleQualityScore(a);
    if (qualityDiff) return qualityDiff;

    if (aTiming === 0 && aRange.end !== bRange.end) return aRange.end - bRange.end;
    if (aTiming === 2 && aRange.end !== bRange.end) return bRange.end - aRange.end;
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
  if (state.language === "ko") return item.category || "축제 소식";
  const labels = {
    en: {
      exhibition: "Exhibitions",
      performance: "Performances",
      experience: "Classes & Experiences",
      movie: "Film",
      festival: "Festivals",
      event: "Festival News"
    },
    ja: {
      exhibition: "展示・美術",
      performance: "公演・舞台",
      experience: "教育・体験",
      movie: "映画",
      festival: "祭り",
      event: "フェスニュース"
    },
    zh: {
      exhibition: "展览/美术",
      performance: "演出/舞台",
      experience: "教育/体验",
      movie: "电影",
      festival: "庆典",
      event: "庆典新闻"
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
    en: `${date} Korea ${category} Guide`,
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
  const mapped = directMap[value] || { category: "축제 소식", categorySlug: "festival" };
  return {
    rawCategory: value || "축제 소식",
    subCategory: value || "축제 소식",
    category: mapped.category,
    categorySlug: mapped.categorySlug
  };
}

function withGroupedCategory(item) {
  const mapped = mapSeoulCategory(item.rawCategory || item.subCategory || item.category || "축제 소식");
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
    const id = String(item.id || "").replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-");
    return `/seoul-events/${encodeURIComponent(id)}/`;
  }

  if (item.source === "tour" && item.contentId) {
    const params = new URLSearchParams({
      source: "tour",
      id: item.contentId,
      contentTypeId: item.contentTypeId || ""
    });
    return `festival-detail?${params.toString()}`;
  }

  return `/articles/${encodeURIComponent(item.id)}/`;
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
      const mapped = item.categorySlug
        ? {
            rawCategory: item.rawCategory || item.category,
            subCategory: item.subCategory || item.category,
            category: item.category || "축제 소식",
            categorySlug: item.categorySlug
          }
        : mapSeoulCategory(item.category || "축제 소식");
      return {
        id: item.id || `seoul-culture-${index}`,
        source: "seoul",
        ...mapped,
        title: item.title,
        summary: item.summary || `${item.address || "현지"}에서 진행되는 문화행사입니다.`,
        date: item.date || "일정 확인 필요",
        readTime: item.readTime || "축제 정보",
        image: imageUrlForItem(item, DEFAULT_EVENT_IMAGE),
        galleryImages: imageListForItem(item),
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

function newsRecommendCard(item) {
  const title = displayArticleTitle(item);
  const category = displayCategoryLabel(item);
  return `
    <article class="news-recommend-card">
      <a href="${escapeHtml(detailUrl(item))}" aria-label="${escapeHtml(`${title} ${textFor("card.detail")}`)}">
        ${imageMarkup(item, "recommend")}
        <div class="news-recommend-body">
          <span class="category-label">${escapeHtml(category)}</span>
          <strong>${escapeHtml(title)}</strong>
        </div>
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
  const imageUrl = normalizeImageUrl(
    item.imageUrl ||
    item.thumbnailUrl ||
    item.thumbnail ||
    item.mainImageUrl ||
    item.image ||
    item.representativeImageUrl ||
    item.productImage ||
    ""
  );
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

async function readApiPayload(response) {
  const text = await response.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: `Invalid API response (${response.status})` };
  }
}

async function fetchCoupangProducts(keyword = "여행 준비물", limit = 6) {
  const query = new URLSearchParams({
    keyword,
    limit: String(limit)
  });
  const response = await fetch(`/api/coupang?${query.toString()}`, {
    headers: { Accept: "application/json" }
  });
  const payload = await readApiPayload(response);
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
        image: normalizeImageUrl(item.productImage || item.imageUrl || item.thumbnailUrl || item.image || ""),
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

function coupangWidgetMarkup(slot = "feed") {
  const safeSlot = String(slot).replace(/[^a-z0-9_-]/gi, "-").toLowerCase();
  return `
    <aside class="coupang-widget-ad" aria-label="쿠팡 파트너스 광고">
      <div class="coupang-widget-label">Advertisement</div>
      <div class="coupang-widget-frame" id="coupangWidget-${escapeHtml(safeSlot)}" data-coupang-widget></div>
      <p class="coupang-widget-disclosure">이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</p>
    </aside>
  `;
}

function loadCoupangWidgetScript() {
  if (window.PartnersCoupang?.G) return Promise.resolve();
  if (coupangWidgetScriptPromise) return coupangWidgetScriptPromise;

  coupangWidgetScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = COUPANG_WIDGET_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Coupang widget script failed to load."));
    document.head.appendChild(script);
  });

  return coupangWidgetScriptPromise;
}

async function hydrateCoupangWidgets() {
  const targets = [...document.querySelectorAll("[data-coupang-widget]:not([data-coupang-loaded])")];
  if (!targets.length) return;

  try {
    await loadCoupangWidgetScript();
    targets.forEach((target) => {
      target.dataset.coupangLoaded = "true";
      const width = Math.max(300, Math.min(680, Math.floor(target.clientWidth || target.parentElement?.clientWidth || window.innerWidth - 36)));
      new window.PartnersCoupang.G({
        ...COUPANG_WIDGET_CONFIG,
        width: String(width),
        height: "140",
        container: target
      });
    });
  } catch (error) {
    console.warn("Coupang widget could not be loaded.", error);
    targets.forEach((target) => {
      target.dataset.coupangLoaded = "error";
      target.innerHTML = "";
    });
  }
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

const SEOUL_DESTINATION_HINTS = [
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

const SEOUL_LANDMARK_HINTS = [
  "세종문화회관", "예술의전당", "국립중앙박물관", "서울시립미술관", "국립극장",
  "코엑스", "롯데월드", "경복궁", "덕수궁", "창경궁", "창덕궁", "한강",
  "여의도", "광화문", "서울숲", "DDP", "북촌", "서촌", "익선동", "남산"
];

function compactDestinationText(value = "") {
  return String(value)
    .replace(/서울특별시|서울시|서울/g, " ")
    .replace(/[()[\]{}"'“”‘’]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function destinationKeywordFromArticle(article = {}, fallback = "서울") {
  const text = compactDestinationText([
    article.address,
    article.place,
    article.title,
    article.category,
    article.rawCategory,
    article.subCategory
  ].filter(Boolean).join(" "));

  const landmark = SEOUL_LANDMARK_HINTS.find((item) => text.includes(item));
  if (landmark) return landmark;

  const districtMatch = text.match(/[가-힣]{1,6}구/);
  if (districtMatch) return districtMatch[0];

  const hint = SEOUL_DESTINATION_HINTS.find((item) => text.includes(item));
  if (hint) return hint;

  return fallback;
}

function mrtContextFromArticle(article = {}) {
  const keyword = destinationKeywordFromArticle(article);
  const text = [
    article.title,
    article.category,
    article.rawCategory,
    article.subCategory,
    article.summary
  ].filter(Boolean).join(" ");
  const isPerformance = /공연|무대|콘서트|뮤지컬|오페라|연극|국악|클래식|발레|독주/.test(text);
  const isExhibition = /전시|미술|박물관|미술관|갤러리|아트/.test(text);
  const isPalace = /궁|궁궐|고궁|전통|역사|덕수궁|경복궁|창덕궁|창경궁/.test(text);
  const isFamily = /어린이|키즈|가족|체험|교육/.test(text);
  const isFestival = /축제|페스티벌|야시장|마켓/.test(text);
  const isNight = /야간|밤|나이트|저녁|심야/.test(text);
  const isFlightRelated = /항공|공항|비행|출국|입국|제주|부산|해외|도쿄|오사카|방콕|다낭/.test(text);
  const tourSuffix = isPerformance ? "공연"
    : isExhibition ? "전시"
    : isPalace ? "궁궐 투어"
    : isFamily ? "키즈 체험"
    : isFestival ? "축제 체험"
    : "입장권";
  const primaryFilter = isNight && !isExhibition ? "stay" : "tour";
  const enabledFilters = [
    "tour",
    ...(isNight || isFestival || isPerformance || keyword !== "서울" ? ["stay"] : []),
    ...(isFlightRelated ? ["flight"] : [])
  ];

  return {
    keyword,
    stayKeyword: keyword,
    tourKeyword: `${keyword} ${tourSuffix}`,
    tourSuffix,
    primaryFilter,
    enabledFilters: [...new Set(enabledFilters)],
    flightDepCity: "ICN",
    flightArrCities: "CJU,BKK,NRT,TYO"
  };
}

function rankMrtItemsByContext(items = [], context = {}) {
  const keyword = compactDestinationText(context.keyword || "서울");
  const intentTokens = compactDestinationText(context.tourKeyword || "")
    .split(" ")
    .filter((token) => token.length >= 2 && token !== "서울" && token !== keyword);
  if ((!keyword || keyword === "서울") && !intentTokens.length) return items;

  return [...items].sort((a, b) => {
    const score = (item) => {
      const haystack = compactDestinationText([
        item.itemName,
        item.title,
        item.category,
        item.categoryName,
        item.description,
        item.address,
        item.location
      ].filter(Boolean).join(" "));
      const destinationScore = keyword && keyword !== "서울" && haystack.includes(keyword)
        ? 4
        : SEOUL_DESTINATION_HINTS.some((hint) => haystack.includes(hint) && keyword.includes(hint)) ? 2 : 0;
      const intentScore = intentTokens.reduce((total, token) => total + (haystack.includes(token) ? 1 : 0), 0);
      return destinationScore + intentScore;
    };
    return score(b) - score(a);
  });
}

function mrtProductLinkAttrsV2(kind, item = {}, context = {}) {
  const safeUrl = safeExternalUrl(item.productUrl);
  if (safeUrl) {
    return `href="${escapeHtml(safeUrl)}" target="_blank" rel="sponsored noopener noreferrer"`;
  }

  if (kind === "stay") {
    return `href="#bookingSearch" data-mrt-open="stay" data-mrt-keyword="${escapeHtml(context.stayKeyword || context.keyword || "서울")}"`;
  }

  if (kind === "flight") {
    const depCity = String(item.depCityCd || item.fromCity || context.flightDepCity || "ICN").toUpperCase();
    const arrCity = String(item.arrCityCd || item.toCity || item.arrivalAirport || context.flightArrCities || "TYO").toUpperCase();
    return `href="#bookingSearch" data-mrt-open="flight" data-mrt-dep-city="${escapeHtml(depCity)}" data-mrt-arr-cities="${escapeHtml(arrCity)}"`;
  }

  return `href="#bookingSearch" data-mrt-open="tour" data-mrt-keyword="${escapeHtml(context.tourKeyword || "서울 입장권")}"`;
}

function renderMrtRailProductV2(kind, item = {}, context = {}) {
  const isStay = kind === "stay";
  const keyword = context.keyword || "서울";
  const title = item.itemName || (isStay ? `${keyword} 근처 숙소 검색` : `${keyword} 입장권·체험 검색`);
  const category = isStay ? "국내숙소" : item.category || "입장권";
  const price = item.priceDisplay || formatWon(item.salePrice || item.originalPrice);
  const rating = item.reviewScore ? `★ ${item.reviewScore}` : "";
  const meta = [rating, price].filter(Boolean).join(" · ");

  return `
    <article class="mrt-rail-card" data-mrt-rail-card data-filter="${escapeHtml(isStay ? "stay" : "tour")}">
      <a ${mrtProductLinkAttrsV2(kind, item, context)} aria-label="${escapeHtml(title)}">
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

function renderMrtRailFlightCardV2(item = {}, context = {}) {
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
      <a ${mrtProductLinkAttrsV2("flight", item, context)} aria-label="${escapeHtml(title)}">
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

function renderMrtRailSearchCardV2(kind, context = {}) {
  const keyword = context.keyword || "서울";
  const configs = {
    tour: {
      filter: "tour",
      tab: "tour",
      keyword: context.tourKeyword || `${keyword} 입장권`,
      thumb: "TICKET",
      label: "입장권",
      title: `${keyword} 입장권·체험 검색`,
      body: "전시, 공연, 체험 상품을 한 번에 확인"
    },
    stay: {
      filter: "stay",
      tab: "stay",
      keyword: context.stayKeyword || keyword,
      thumb: "STAY",
      label: "국내숙소",
      title: `${keyword} 근처 숙소 검색`,
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

function myRealTripFeedRailItemsV2(context = {}) {
  if (!state.myrealtrip.loaded) return [];

  const items = [];
  const enabledFilters = context.enabledFilters?.length ? context.enabledFilters : ["tour"];
  const tours = enabledFilters.includes("tour")
    ? rankMrtItemsByContext(state.myrealtrip.tours, context).slice(0, 9)
    : [];
  const stays = enabledFilters.includes("stay")
    ? rankMrtItemsByContext(state.myrealtrip.stays, context).slice(0, 9)
    : [];
  const flights = enabledFilters.includes("flight") ? state.myrealtrip.flights.slice(0, 9) : [];
  const maxLength = Math.max(tours.length, stays.length, flights.length);

  for (let index = 0; index < maxLength; index += 1) {
    if (tours[index]) items.push(renderMrtRailProductV2("tour", tours[index], context));
    if (stays[index]) items.push(renderMrtRailProductV2("stay", stays[index], context));
    if (flights[index]) items.push(renderMrtRailFlightCardV2(flights[index], context));
  }

  enabledFilters.forEach((kind) => items.push(renderMrtRailSearchCardV2(kind, context)));

  return items.filter(Boolean);
}

function renderMrtFeedModuleV2(seed = "main", position = 0, article = null) {
  const context = mrtContextFromArticle(article || {});
  const items = myRealTripFeedRailItemsV2(context);
  if (!items.length) return "";

  const variants = {
    tour: {
      filter: "tour",
      title: `${context.keyword} ${context.tourSuffix || "입장권"}과 체험`,
      linkTab: "tour",
      linkText: "입장권 검색",
      keyword: context.tourKeyword
    },
    stay: {
      filter: "stay",
      title: `${context.keyword} 일정 전후 근처 숙소`,
      linkTab: "stay",
      linkText: "숙소 검색",
      keyword: context.stayKeyword
    },
    flight: {
      filter: "flight",
      title: "서울 출발 연계 항공권",
      linkTab: "flight",
      linkText: "항공권 검색",
      keyword: "",
      depCity: context.flightDepCity,
      arrCities: context.flightArrCities
    }
  };
  const enabledFilters = context.enabledFilters?.length ? context.enabledFilters : ["tour"];
  const primaryFilter = enabledFilters.includes(context.primaryFilter) ? context.primaryFilter : enabledFilters[0];
  const variant = variants[primaryFilter] || variants.tour;
  const offset = (adRotationOffset(seed) + position) % items.length;
  const rotated = [...items.slice(offset), ...items.slice(0, offset)];
  const keywordAttr = variant.keyword ? ` data-mrt-keyword="${escapeHtml(variant.keyword)}"` : "";
  const flightAttrs = variant.filter === "flight"
    ? ` data-mrt-dep-city="${escapeHtml(variant.depCity || "ICN")}" data-mrt-arr-cities="${escapeHtml(variant.arrCities || "CJU,BKK,NRT,TYO")}"`
    : "";
  const disclosure = {
    ko: "기사의 장소와 방문 목적을 기준으로 연결한 여행 예약 제휴 상품이며, 예약 시 수수료를 받을 수 있습니다.",
    en: "These affiliate booking suggestions are matched to the article location and visit type; the site may earn a commission.",
    ja: "記事の場所と訪問目的に合わせた旅行予約のアフィリエイト商品で、予約時に手数料を受け取る場合があります。",
    zh: "这些旅行预订推广商品根据文章地点和出行目的匹配，预订后本站可能获得佣金。"
  }[state.language] || "";
  const tabLabels = {
    tour: "입장권·체험",
    stay: "근처 숙소",
    flight: "항공권"
  };

  return `
    <section class="mrt-feed-module" data-active-filter="${escapeHtml(variant.filter)}" aria-label="기사 맞춤 여행 상품">
      <div class="mrt-feed-module-head">
        <div>
          <p class="eyebrow">Travel Pick</p>
          <h3>${escapeHtml(variant.title)}</h3>
        </div>
        <a href="#bookingSearch" data-mrt-open="${escapeHtml(variant.linkTab)}"${keywordAttr}${flightAttrs}>${escapeHtml(variant.linkText)}</a>
      </div>
      <div class="mrt-feed-tabs" aria-label="상품 종류">
        ${enabledFilters.map((filter) => `
          <button class="${variant.filter === filter ? "is-active" : ""}" type="button" data-mrt-rail-filter="${escapeHtml(filter)}" aria-pressed="${variant.filter === filter ? "true" : "false"}">${escapeHtml(tabLabels[filter] || filter)}</button>
        `).join("")}
      </div>
      <div class="mrt-rail">
        ${rotated.join("")}
      </div>
      <p class="mrt-feed-disclosure">${escapeHtml(disclosure)}</p>
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
      blocks.push(renderMrtFeedModuleV2(seed, 1, item));
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
  const recommended = $("#recommendedArticles");
  const feed = $("#newsFeedList");
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
  loadAffiliateDataOnce();
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

function loadAffiliateDataOnce() {
  if (affiliateLoadPromise) return affiliateLoadPromise;
  affiliateLoadPromise = Promise.allSettled([
    loadMyRealTripProducts(),
    loadCoupangProducts()
  ]);
  return affiliateLoadPromise;
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
      { id: "exhibition", title: "전시/미술", subtitle: "미술관, 갤러리, 전시 공간에서 열리는 문화행사" },
      { id: "performance", title: "공연/무대", subtitle: "클래식, 연극, 콘서트, 무용, 국악, 뮤지컬 공연" },
      { id: "experience", title: "교육/체험", subtitle: "어린이, 가족, 성인 대상 체험과 강좌 프로그램" },
      { id: "movie", title: "영화", subtitle: "영화 상영, 영화제, 영상 관련 문화행사" },
      { id: "festival", title: "축제", subtitle: "문화예술, 관광, 전통, 체육 성격의 전국 축제" }
    ],
    en: [
      { id: "exhibition", title: "Exhibitions", subtitle: "Museums, galleries, and art events" },
      { id: "performance", title: "Performances", subtitle: "Classical music, theater, concerts, dance, gugak, and musicals" },
      { id: "experience", title: "Classes & Experiences", subtitle: "Hands-on programs for children, families, and adults" },
      { id: "movie", title: "Film", subtitle: "Film screenings, festivals, and media events" },
      { id: "festival", title: "Festivals", subtitle: "Culture, tourism, tradition, and sports festivals nationwide" }
    ],
    ja: [
      { id: "exhibition", title: "展示・美術", subtitle: "美術館、ギャラリー、展示空間で開かれる文化行事" },
      { id: "performance", title: "公演・舞台", subtitle: "クラシック、演劇、コンサート、舞踊、国楽、ミュージカル" },
      { id: "experience", title: "教育・体験", subtitle: "子ども、家族、大人向けの体験プログラム" },
      { id: "movie", title: "映画", subtitle: "映画上映、映画祭、映像関連イベント" },
      { id: "festival", title: "祭り", subtitle: "文化芸術、観光、伝統、スポーツ系の全国のフェス" }
    ],
    zh: [
      { id: "exhibition", title: "展览/美术", subtitle: "美术馆、画廊和展览空间的文化活动" },
      { id: "performance", title: "演出/舞台", subtitle: "古典音乐、戏剧、演唱会、舞蹈、国乐和音乐剧" },
      { id: "experience", title: "教育/体验", subtitle: "儿童、家庭和成人可参加的体验项目" },
      { id: "movie", title: "电影", subtitle: "电影放映、电影节和影像相关活动" },
      { id: "festival", title: "庆典", subtitle: "文化艺术、旅游、传统和体育类全国庆典" }
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
  const tabs = [
    {
      id: "all",
      title: state.language === "ko" ? "전체" : state.language === "ja" ? "すべて" : state.language === "zh" ? "全部" : "All",
      count: items.length
    },
    ...groups.map((group) => ({
      ...group,
      count: counts.get(group.id) || 0
    }))
  ];

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
    state.visibleFeedCount = FEED_PAGE_SIZE;
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
    state.visibleFeedCount = FEED_PAGE_SIZE;
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
  const items = primaryNewsItems().slice(29);
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
  state.placesArticles = [];
  state.placesLoaded = false;
  state.placesError = false;
  renderRegionChips();
  renderQuickRegions();
  updateRegionHeading();
  updatePlacesStatus(`${activeRegion().label} 축제 정보를 불러오는 중입니다.`);
  renderPlaces();
  loadTourApiPlaces();
}

function normalizeTourItems(items, regionOverride = activeRegion()) {
  const list = Array.isArray(items) ? items : items ? [items] : [];

  return list
    .filter((item) => item && item.title)
    .map((item, index) => {
      const image = imageUrlForItem(item, DEFAULT_EVENT_IMAGE);
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
        image,
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
    numOfRows: String(config.numOfRows || 8),
    pageNo: String(config.pageNo || 1),
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
    numOfRows: String(numOfRows),
    pageNo: String(pageNo),
    arrange: config.arrange || "O",
    eventStartDate: month.start,
    eventEndDate: month.end,
    month: month.key,
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
  const month = currentSeoulMonth();

  return list
    .filter((item) => item && item.title && overlapsJulyFestival(item))
    .sort((a, b) => String(a.eventstartdate || "").localeCompare(String(b.eventstartdate || "")))
    .map((item, index) => {
      const image = imageUrlForItem(item, DEFAULT_FESTIVAL_IMAGE);
      const address = [item.addr1, item.addr2].filter(Boolean).join(" ");
      const startDate = compactDate(item.eventstartdate);
      const endDate = compactDate(item.eventenddate);
      const period = startDate && endDate ? `${startDate} - ${endDate}` : startDate || `${month.label} 진행`;
      const region = regionLabelFromAddress(item.addr1);

      return {
        id: `july-festival-${item.contentid || index}`,
        source: "tour",
        contentId: item.contentid,
        contentTypeId: item.contenttypeid || 15,
        category: `${region} ${month.label} 축제`,
        title: item.title,
        summaryKey: address ? "summary.july" : "summary.julyFallback",
        summaryParams: { address },
        date: period,
        readTimeKey: "read.detail",
        image,
        address,
        mapx: item.mapx || "",
        mapy: item.mapy || ""
      };
    });
}

async function loadTourApiPlaces() {
  if (!data.tourApi?.endpoint) return;

  const requestRegionId = state.activeRegionId;
  const region = activeRegion();
  const areaCodes = regionAreaCodes(region);
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 6500);
  state.placesError = false;

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
    const placesArticles = normalizeTourItems(dedupedItems, region);

    if (requestRegionId !== state.activeRegionId) return;

    state.placesArticles = placesArticles;
    state.placesLoaded = true;
    state.placesError = false;

    if (placesArticles.length) {
      updatePlacesStatus(`${region.label} 축제 ${placesArticles.length}개를 불러왔습니다.`);
    } else {
      updatePlacesStatus(`${region.label}에 표시할 축제 정보가 아직 등록되어 있지 않습니다.`);
    }

    renderPlaces();
  } catch (error) {
    console.warn("TourAPI request failed. Fallback content is displayed.", error);
    state.placesArticles = [];
    state.placesLoaded = true;
    state.placesError = true;
    updatePlacesStatus(`${region.label} 축제 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.`);
    renderPlaces();
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function renderJulyFestivals() {
  const status = $("#julyStatus");
  const recommended = $("#recommendedArticles");
  const feed = $("#newsFeedList");
  const loadMore = $("#loadMoreArticles");
  const countTarget = $("#allArticleCount");
  if (!status || !recommended || !feed) return;

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
      renderNewsLoadingSkeleton();
      return;
    }

    setNewsLoading(false);
    status.textContent = state.activeCategoryFilter === "all"
      ? `${month.label}에 표시할 축제 정보를 불러오는 중입니다.`
      : "선택한 분류에 표시할 축제 정보가 없습니다.";
    status.hidden = false;
    recommended.innerHTML = "";
    feed.innerHTML = "";
    if (loadMore) loadMore.hidden = true;
    return;
  }

  setNewsLoading(false);
  status.textContent = "";
  status.hidden = true;

  recommended.innerHTML = items.slice(1, 5).map((item) => newsRecommendCard(item)).join("");
  const feedItems = items.slice(5);
  const visibleCount = Math.min(state.visibleFeedCount, feedItems.length);
  feed.innerHTML = buildNewsFeedMarkup(feedItems.slice(0, visibleCount));
  if (loadMore) {
    const remaining = Math.max(0, feedItems.length - visibleCount);
    const labels = {
      ko: `기사 더보기 (${remaining.toLocaleString("ko-KR")}개 남음)`,
      en: `Load more (${remaining} left)`,
      ja: `記事をもっと見る（残り${remaining}件）`,
      zh: `加载更多（剩余${remaining}篇）`
    };
    loadMore.textContent = labels[state.language] || labels.ko;
    loadMore.hidden = remaining === 0;
  }
  hydrateCoupangWidgets();
}

function bindLoadMoreArticles() {
  const button = $("#loadMoreArticles");
  if (!button) return;
  button.addEventListener("click", () => {
    state.visibleFeedCount += FEED_PAGE_SIZE;
    renderJulyFestivals();
  });
}

function renderSeoulArticleState() {
  renderPlaces();
  renderCuration();
  renderEditorialPosts();
  renderJulyFestivals();
  renderCategoryNewsSections();
}

function applySeoulCultureArticles(seoulArticles) {
  state.apiArticles = seoulArticles;
  state.apiLoaded = true;
  state.apiError = false;

  renderSeoulArticleState();
}

function buildGeneratedSeoulEventsUrl() {
  return `generated/seoul-events.json?v=${currentSeoulMonth().key}`;
}

async function loadGeneratedSeoulCultureArticles() {
  const response = await fetch(buildGeneratedSeoulEventsUrl(), {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) throw new Error(`Generated Seoul events HTTP ${response.status}`);

  const payload = await readApiPayload(response);
  if (!Array.isArray(payload?.items)) return [];
  return normalizeSeoulCultureItems(payload.items);
}

async function loadSeoulCultureEvents() {
  if (!data.seoulCultureApi?.endpoint) {
    loadTourApiPlaces();
    return;
  }

  state.apiError = false;
  let generatedArticles = [];

  try {
    generatedArticles = await loadGeneratedSeoulCultureArticles();
    if (generatedArticles.length) {
      applySeoulCultureArticles(generatedArticles);
      return;
    }
  } catch (error) {
    console.warn("Generated festival events could not be loaded. Live API will be used.", error);
  }

  try {
    const response = await fetch(buildSeoulCultureUrl(), {
      headers: { Accept: "application/json" }
    });
    const payload = await readApiPayload(response);
    if (!response.ok || payload?.ok === false) {
      throw new Error(payload?.message || `Seoul events HTTP ${response.status}`);
    }

    const seoulArticles = normalizeSeoulCultureItems(payload.items);
    applySeoulCultureArticles(seoulArticles);
  } catch (error) {
    console.warn("Seoul cultural events could not be loaded. TourAPI fallback is requested.", error);
    if (generatedArticles.length) {
      return;
    }
    state.apiArticles = [];
    state.apiLoaded = false;
    state.apiError = true;
    loadJulyFestivalPosts();
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
  if (!data.tourApi?.endpoint) return;

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
      if (!response.ok) throw new Error(`Monthly festival HTTP ${response.status}`);

      const payload = await readApiPayload(response);
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
    console.warn("Monthly festival posts could not be loaded.", error);
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

// Renders the "TODAY" quick region shortcuts under the header. Each chip is
// a plain data-region-id link, so the existing document-level
// bindRegionLinks() delegate handles clicks — no separate binding needed.
function renderQuickRegions() {
  const target = $("#todayKeywords");
  if (!target) return;

  const regionsById = new Map((data.regions || []).map((region) => [region.id, region]));
  const ids = data.quickRegionIds || [];

  target.innerHTML = ids
    .map((id) => regionsById.get(id))
    .filter(Boolean)
    .map((region) => `
      <a
        href="#allArticles"
        class="${region.id === state.activeRegionId ? "is-active" : ""}"
        data-region-id="${escapeHtml(region.id)}"
      >${escapeHtml(region.label)}</a>
    `)
    .join("");
}

function renderPlaces() {
  const grid = $("#placesGrid");
  if (!grid) return;
  const region = activeRegion();
  const items = state.placesArticles.length
    ? state.placesArticles.slice(0, 12)
    : [];

  if (!items.length) {
    const title = state.placesError
      ? "축제 정보를 불러오지 못했습니다"
      : state.placesLoaded
        ? `${region.label} 축제 정보가 아직 없습니다`
        : "축제 정보를 불러오는 중입니다";
    const description = state.placesError
      ? "네트워크 상태를 확인한 뒤 다시 시도해 주세요. 다른 지역을 선택하면 등록된 축제를 확인할 수 있습니다."
      : state.placesLoaded
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

function editorialCategoryKey(item = {}) {
  const text = `${item.category || ""} ${item.title || ""}`;
  if (/전시|미술|박물관|갤러리/.test(text)) return "exhibition";
  if (/공연|야간|데이트|콘서트|무대/.test(text)) return "performance";
  if (/가족|아이|체험|교육|도서관/.test(text)) return "experience";
  if (/축제|전통|궁궐/.test(text)) return "festival";
  return "event";
}

function editorialPostsWithApiImages(posts = []) {
  const pool = primaryNewsItems().filter(hasApiImage);
  const used = new Set();

  return posts.map((post) => {
    const wanted = editorialCategoryKey(post);
    const match = pool.find((item) => !used.has(item.id) && categoryKeyFor(item) === wanted)
      || pool.find((item) => !used.has(item.id));
    if (!match) return { ...post, image: "" };
    used.add(match.id);
    return { ...post, image: imageUrlForItem(match, "") };
  });
}

function localizedEditorialPost(item = {}) {
  if (state.language === "ko") return item;

  const copy = EDITORIAL_POST_I18N[state.language]?.[item.id];
  if (!copy) return item;

  const minutes = String(item.readTime || "").match(/\d+/)?.[0] || "";
  const readTime = minutes
    ? {
        en: `${minutes} min read`,
        ja: `${minutes}分で読めます`,
        zh: `${minutes}分钟阅读`
      }[state.language]
    : item.readTime;

  return { ...item, ...copy, readTime };
}

function renderEditorialPosts() {
  const target = $("#editorialList");
  if (!target) return;

  const posts = Array.isArray(data.editorialPosts) && data.editorialPosts.length
    ? data.editorialPosts
    : data.articles || [];

  if (!primaryNewsItems().some(hasApiImage) && state.newsLoading) {
    target.innerHTML = [
      loadingCardMarkup("feature"),
      ...Array.from({ length: 4 }, () => loadingCardMarkup("recommend"))
    ].join("");
    return;
  }

  const displayPosts = posts.slice(0, 5).map((post) => ({ ...post, image: "" }));

  target.innerHTML = displayPosts.map((item, index) => {
    const localizedItem = localizedEditorialPost(item);
    const href = detailUrl(localizedItem);
    return `
      <article class="editorial-card ${index === 0 ? "editorial-card--lead" : ""}">
        <a href="${escapeHtml(href)}" aria-label="${escapeHtml(`${localizedItem.title} ${textFor("card.detail")}`)}">
          ${imageMarkup(localizedItem, index === 0 ? "hero" : "thumb")}
          <span>
            <em>${escapeHtml(localizedItem.category || displayCategoryLabel(localizedItem))}</em>
            <strong>${escapeHtml(localizedItem.title)}</strong>
            <small>${escapeHtml(localizedItem.summary || "")}</small>
            <b>${escapeHtml(localizedItem.date || "")} · ${escapeHtml(localizedItem.readTime || textFor("read.detail"))}</b>
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
  if (!button || !nav) return;

  const closeMenu = () => {
    button.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
  };

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!isOpen));
    nav.classList.toggle("is-open", !isOpen);
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  document.addEventListener("click", (event) => {
    if (!nav.classList.contains("is-open")) return;
    if (button.contains(event.target) || nav.contains(event.target)) return;
    closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

function init() {
  setNewsLoading(true);
  renderRegionChips();
  renderQuickRegions();
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
  bindLoadMoreArticles();
  bindLanguageSwitch();
  applyLanguage();
  applyBookingSearchQuery();
  loadSeoulCultureEvents();
  loadTourApiPlaces();
}

document.addEventListener("DOMContentLoaded", init);
