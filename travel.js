const data = window.TRAVEL_PORTAL_DATA;
const state = {
  apiArticles: [],
  apiLoaded: false
};

const $ = (selector) => document.querySelector(selector);

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

function articleMeta(item) {
  return `<span>${escapeHtml(item.date)}</span><span>${escapeHtml(item.readTime)}</span>`;
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
      <a href="${escapeHtml(detailUrl(item))}" aria-label="${escapeHtml(item.title)} 자세히 보기">
        ${imageMarkup(item)}
        <span class="category-label">${escapeHtml(item.category)}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.summary)}</p>
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

function normalizeTourItems(items) {
  const list = Array.isArray(items) ? items : items ? [items] : [];
  const fallbackImage = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80";

  return list
    .filter((item) => item && item.title)
    .map((item, index) => {
      const image = item.firstimage || item.firstimage2 || fallbackImage;
      const address = [item.addr1, item.addr2].filter(Boolean).join(" ");
      const category = data.tourApi?.mode === "festival" ? "전국 축제" : contentTypeName(item.contenttypeid);
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
        summary: address
          ? `${address}에서 열리는 축제 정보입니다. 방문 전 행사 시간, 교통 통제, 주차와 우천 운영 여부를 함께 확인하세요.`
          : "공공데이터에서 불러온 전국 축제 정보입니다. 방문 전 행사 시간, 교통과 우천 운영 여부를 확인하세요.",
        date: period,
        readTime: "축제 정보",
        image: String(image).replace(/^http:/, "https:"),
        href: "#places"
      };
    });
}

function buildTourApiUrl() {
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

  return `${config.endpoint}?${params.toString()}`;
}

async function loadTourApiPlaces() {
  if (!data.tourApi?.serviceKey || !data.tourApi?.endpoint) return;

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 6500);

  try {
    const response = await fetch(buildTourApiUrl(), { signal: controller.signal });
    if (!response.ok) throw new Error(`TourAPI HTTP ${response.status}`);

    const payload = await response.json();
    const items = payload?.response?.body?.items?.item;
    const apiArticles = normalizeTourItems(items);

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

function renderTodayKeywords() {
  $("#todayKeywords").innerHTML = data.todayKeywords
    .map((keyword) => `<a href="#" aria-label="${escapeHtml(keyword)} 키워드 보기">${escapeHtml(keyword)}</a>`)
    .join("");
}

function renderHero() {
  const [featured, ...latest] = data.articles;
  const sideItems = latest.slice(0, 4);

  $("#heroGrid").innerHTML = `
    <article class="hero-featured">
      <a href="${escapeHtml(detailUrl(featured))}" aria-label="${escapeHtml(featured.title)} 자세히 보기">
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
      <a href="${escapeHtml(item.href)}">체크 페이지로 이동</a>
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
            <small>${escapeHtml(item.summary)}</small>
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
  renderHero();
  renderPlaces();
  renderBooking();
  renderCuration();
  renderCategoryGroups();
  renderFaq();
  renderFooter();
  bindMenu();
  loadTourApiPlaces();
}

document.addEventListener("DOMContentLoaded", init);
