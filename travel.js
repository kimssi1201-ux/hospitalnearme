const data = window.TRAVEL_PORTAL_DATA;
const supportedLanguages = ["ko", "en", "ja", "zh"];
const state = {
  apiArticles: [],
  julyArticles: [],
  apiLoaded: false,
  apiError: false,
  activeRegionId: "seoul",
  language: getStoredLanguage()
};

const I18N = {
  ko: {
    "meta.title": "서울여행노트 | 서울 여행 정보 매거진",
    "brand.name": "서울여행노트",
    "brand.tagline": "서울 여행 정보 매거진",
    "footer.tagline": "서울 여행 선택을 돕는 정보 포털",
    "footer.description": "서울 축제 일정, 방문 준비, 교통과 주변 여행 정보를 한 흐름으로 연결하는 서울 여행 매거진입니다.",
    "nav.menu": "메뉴 열기",
    "nav.july": "서울 여행 뉴스",
    "nav.places": "서울 축제",
    "nav.booking": "방문 전 체크",
    "nav.guide": "방문 가이드",
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
    "meta.title": "Seoul Travel Note | Seoul Travel Magazine",
    "brand.name": "Seoul Travel Note",
    "brand.tagline": "Seoul travel magazine",
    "footer.tagline": "A guide for choosing festivals",
    "footer.description": "A festival magazine that connects schedules, travel preparation, transport, and lodging checks in one flow.",
    "nav.menu": "Open menu",
    "nav.july": "Festival News",
    "nav.places": "By Region",
    "nav.booking": "Before You Go",
    "nav.guide": "Visit Guide",
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
    "meta.title": "フェスティバルノート | 韓国フェスティバルマガジン",
    "brand.name": "フェスティバルノート",
    "brand.tagline": "韓国フェスティバル情報マガジン",
    "footer.tagline": "フェス選びを助ける情報ポータル",
    "footer.description": "全国のフェス日程、訪問準備、交通、宿泊チェックをひとつの流れで確認できるマガジンです。",
    "nav.menu": "メニューを開く",
    "nav.july": "フェスニュース",
    "nav.places": "地域別",
    "nav.booking": "訪問前チェック",
    "nav.guide": "訪問ガイド",
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
    "meta.title": "Seoul Travel Note | 首尔旅行信息杂志",
    "brand.name": "Seoul Travel Note",
    "brand.tagline": "韩国庆典信息杂志",
    "footer.tagline": "帮助选择庆典的信息门户",
    "footer.description": "这里把全国庆典日程、出行准备、交通和住宿确认事项整理成一个清晰的浏览流程。",
    "nav.menu": "打开菜单",
    "nav.july": "庆典新闻",
    "nav.places": "按地区查找",
    "nav.booking": "出发前确认",
    "nav.guide": "参观指南",
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

function groupedCategoryName(category = "") {
  const value = String(category || "").trim();
  if (!value) return "기타";
  if (value === "전시/미술") return "전시/미술";
  if (value === "교육/체험") return "교육/체험";
  if (value === "영화") return "영화";
  if (value.startsWith("축제-")) return "축제";
  if (["클래식", "연극", "콘서트", "무용", "국악", "뮤지컬/오페라", "독주/독창회"].includes(value)) {
    return "공연/무대";
  }
  return "기타";
}

function withGroupedCategory(item) {
  const rawCategory = item.category || "서울 문화행사";
  return {
    ...item,
    rawCategory,
    category: groupedCategoryName(rawCategory)
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

function normalizeSeoulCultureItems(items) {
  const list = Array.isArray(items) ? items : items ? [items] : [];
  return list
    .filter((item) => item && item.title)
    .filter((item) => overlapsCurrentMonthByDateText(item.date))
    .map((item, index) => ({
      id: item.id || `seoul-culture-${index}`,
      source: "seoul",
      rawCategory: item.category || "서울 문화행사",
      category: groupedCategoryName(item.category || "서울 문화행사"),
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
    }));
}

function newsFeaturedCard(item) {
  return `
    <article class="news-feature-card">
      <a href="${escapeHtml(detailUrl(item))}" aria-label="${escapeHtml(`${item.title} ${textFor("card.detail")}`)}">
        ${imageMarkup(item, "hero")}
        <div class="news-feature-body">
          <span class="category-label">${escapeHtml(item.category)}</span>
          <h2>${escapeHtml(item.title)}</h2>
          <p>${escapeHtml(displaySummary(item))}</p>
          <div class="article-meta">${articleMeta(item)}</div>
        </div>
      </a>
    </article>
  `;
}

function newsRecommendCard(item) {
  return `
    <article class="news-recommend-card">
      <a href="${escapeHtml(detailUrl(item))}" aria-label="${escapeHtml(`${item.title} ${textFor("card.detail")}`)}">
        ${imageMarkup(item, "recommend")}
        <strong>${escapeHtml(item.title)}</strong>
      </a>
    </article>
  `;
}

function newsListCard(item) {
  return `
    <article class="news-list-card">
      <a href="${escapeHtml(detailUrl(item))}" aria-label="${escapeHtml(`${item.title} ${textFor("card.detail")}`)}">
        ${imageMarkup(item, "feed")}
        <span>
          <em>${escapeHtml(item.category)}</em>
          <strong>${escapeHtml(item.title)}</strong>
          <small>${escapeHtml(item.date)} · ${escapeHtml(displayReadTime(item))}</small>
        </span>
      </a>
    </article>
  `;
}

function categoryFeaturedCard(item) {
  return `
    <article class="category-feature-card">
      <a href="${escapeHtml(detailUrl(item))}" aria-label="${escapeHtml(`${item.title} ${textFor("card.detail")}`)}">
        ${imageMarkup(item, "categoryHero")}
        <strong>${escapeHtml(item.title)}</strong>
      </a>
    </article>
  `;
}

function categoryMiniCard(item) {
  return `
    <article class="category-mini-card">
      <a href="${escapeHtml(detailUrl(item))}" aria-label="${escapeHtml(`${item.title} ${textFor("card.detail")}`)}">
        ${imageMarkup(item, "mini")}
        <strong>${escapeHtml(item.title)}</strong>
      </a>
    </article>
  `;
}

function categoryListCard(item) {
  return `
    <article class="category-list-card">
      <a href="${escapeHtml(detailUrl(item))}" aria-label="${escapeHtml(`${item.title} ${textFor("card.detail")}`)}">
        ${imageMarkup(item, "feed")}
        <strong>${escapeHtml(item.title)}</strong>
      </a>
    </article>
  `;
}

function uniqueArticles(items) {
  return [...new Map(
    items
      .filter(Boolean)
      .map((item, index) => [item.contentId || item.id || `${item.title}-${index}`, item])
  ).values()];
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
  const groupMeta = [
    { id: "exhibition", title: "전시/미술", subtitle: "미술관, 갤러리, 전시 공간에서 열리는 서울 문화행사" },
    { id: "performance", title: "공연/무대", subtitle: "클래식, 연극, 콘서트, 무용, 국악, 뮤지컬 공연" },
    { id: "experience", title: "교육/체험", subtitle: "어린이, 가족, 성인 대상 체험과 강좌 프로그램" },
    { id: "movie", title: "영화", subtitle: "영화 상영, 영화제, 영상 관련 문화행사" },
    { id: "festival", title: "축제", subtitle: "문화예술, 관광, 전통, 체육 성격의 서울 축제" },
    { id: "etc", title: "기타", subtitle: "그 외 서울에서 진행되는 문화행사와 방문 정보" }
  ];

  return groupMeta
    .map((group, index) => ({
      ...group,
      items: categoryItems(
        allItems.filter((item) => item.category === group.title),
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

  target.innerHTML = groups.map((group, index) => `
    <a class="category-tab ${index === 0 ? "is-active" : ""}" href="#${escapeHtml(group.id)}">
      ${escapeHtml(group.title)}
    </a>
  `).join("");
}

function bindTopCategoryTabs() {
  const target = $("#topCategoryTabs");
  if (!target) return;

  target.addEventListener("click", (event) => {
    const link = event.target.closest(".category-tab");
    if (!link) return;
    target.querySelectorAll(".category-tab").forEach((item) => {
      item.classList.toggle("is-active", item === link);
    });
  });
}

function renderCategoryNewsBlock(group) {
  const [featured, ...rest] = group.items;
  const recommended = rest.slice(0, 3);
  const list = rest.slice(3, 8);

  return `
    <section class="category-news-block" id="${escapeHtml(group.id)}" aria-labelledby="${escapeHtml(group.id)}Title">
      <div class="category-news-heading">
        <h2 id="${escapeHtml(group.id)}Title">${escapeHtml(group.title)}</h2>
        <p>${escapeHtml(group.subtitle)}</p>
      </div>
      ${featured ? categoryFeaturedCard(featured) : ""}
      ${recommended.length ? `
        <div class="category-mini-row">
          ${recommended.map((item) => categoryMiniCard(item)).join("")}
        </div>
      ` : ""}
      ${list.length ? `
        <div class="category-list-feed">
          ${list.map((item) => categoryListCard(item)).join("")}
        </div>
      ` : ""}
    </section>
  `;
}

function renderCategoryNewsSections() {
  const target = $("#categoryNewsSections");
  if (!target) return;

  const groups = buildCategoryNewsGroups();
  renderTopCategoryTabs(groups);
  target.innerHTML = groups.map((group) => renderCategoryNewsBlock(group)).join("");
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
  return `<a href="${regionId ? "#places" : "#"}"${dataAttr}>${escapeHtml(label)}</a>`;
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
  if (!status || !featured || !recommended || !feed) return;

  const month = currentSeoulMonth();
  const items = state.apiArticles.length ? state.apiArticles : state.julyArticles;

  if (!items.length) {
    status.textContent = `${month.label}에 표시할 서울 축제 정보를 불러오는 중입니다.`;
    featured.innerHTML = "";
    recommended.innerHTML = "";
    feed.innerHTML = "";
    return;
  }

  status.textContent = items.length && (state.julyArticles.length || state.apiArticles.length)
    ? `서울 기준 ${items.length}개의 여행 기사를 보여드립니다.`
    : "서울 추천 여행 기사를 준비했습니다. 실제 서울 축제 정보가 불러와지면 자동으로 교체됩니다.";

  const [main, ...rest] = items;
  featured.innerHTML = newsFeaturedCard(main);
  recommended.innerHTML = rest.slice(0, 3).map((item) => newsRecommendCard(item)).join("");
  feed.innerHTML = rest.slice(3, 15).map((item) => newsListCard(item)).join("");
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
    renderCategoryNewsSections();
  } catch (error) {
    console.warn("July festival posts could not be loaded.", error);
    const status = $("#julyStatus");
    if (status) status.textContent = textFor("july.error");
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
      ${group.links.map((link) => regionLinkMarkup(link)).join("")}
    </nav>
  `).join("");
}

function bindRegionLinks() {
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-region-id]");
    if (!link) return;

    const regionId = link.getAttribute("data-region-id");
    if (!regionId) return;

    event.preventDefault();
    selectRegion(regionId);
    $("#places")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
  renderRegionChips();
  updateRegionHeading();
  renderJulyFestivals();
  renderPlaces();
  renderBooking();
  renderCuration();
  renderCategoryNewsSections();
  renderCategoryGroups();
  renderFaq();
  renderFooter();
  bindMenu();
  bindRegionChips();
  bindRegionLinks();
  bindTopCategoryTabs();
  bindLanguageSwitch();
  applyLanguage();
  loadSeoulCultureEvents();
  loadJulyFestivalPosts();
}

document.addEventListener("DOMContentLoaded", init);
