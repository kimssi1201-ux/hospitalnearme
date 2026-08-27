const SEARCH_PAGE_SIZE = 18;
const portalData = window.TRAVEL_PORTAL_DATA || {};
const state = {
  records: [],
  query: "",
  visible: SEARCH_PAGE_SIZE
};

const $ = (selector) => document.querySelector(selector);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeQuery(value = "") {
  return String(value || "").trim().toLocaleLowerCase();
}

function imageUrlFor(record = {}) {
  const direct = record.image || record.mainImage || record.thumbnail || "";
  if (direct) return String(direct);
  return Array.isArray(record.galleryImages) ? record.galleryImages.find(Boolean) || "" : "";
}

function recordUrl(record = {}) {
  if (record.kind === "article") return `/articles/${encodeURIComponent(record.id)}/`;
  return `/seoul-events/${encodeURIComponent(record.id)}/`;
}

function dateValue(record = {}) {
  const match = String(record.date || "").match(/\d{4}[-.]\d{1,2}[-.]\d{1,2}|\d{8}/);
  if (!match) return 0;
  return Number(match[0].replace(/\D/g, "")) || 0;
}

function currentMonthKey() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit"
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value || "";
  const month = parts.find((part) => part.type === "month")?.value || "";
  return `${year}${month}`;
}

function searchText(record = {}) {
  return [
    record.title,
    record.category,
    record.summary,
    record.date,
    record.address,
    record.place,
    record.org,
    record.target,
    record.fee,
    record.time
  ].filter(Boolean).join(" ").toLocaleLowerCase();
}

function normalizeEventRecords(items = []) {
  return items
    .filter((item) => item && item.id && item.title)
    .map((item) => ({
      kind: "event",
      id: item.id,
      title: item.title,
      category: item.category || "축제 정보",
      summary: item.summary || "방문 전 일정, 장소, 교통 정보를 확인해 보세요.",
      date: item.date || "일정 확인 필요",
      readTime: item.readTime || "축제 정보",
      image: imageUrlFor(item),
      galleryImages: item.galleryImages || [],
      address: item.address || "",
      place: item.place || "",
      org: item.org || "",
      target: item.target || "",
      fee: item.fee || "",
      time: item.time || ""
    }));
}

function editorialRecords() {
  const posts = Array.isArray(portalData.editorialPosts) ? portalData.editorialPosts : [];
  return posts
    .filter((item) => item && item.id && item.title)
    .map((item) => ({
      kind: "article",
      id: item.id,
      title: item.title,
      category: item.category || "기획 기사",
      summary: item.summary || "",
      date: item.date || "",
      readTime: item.readTime || "기획 기사",
      image: ""
    }));
}

function filterRecords(records = state.records) {
  const query = normalizeQuery(state.query);
  if (!query) return records;
  const tokens = query.split(/\s+/).filter(Boolean);
  return records.filter((record) => {
    const text = searchText(record);
    return tokens.every((token) => text.includes(token));
  });
}

function resultImage(record = {}) {
  const image = imageUrlFor(record);
  if (!image) {
    return '<div class="image-frame image-frame--feed is-empty"><span>대한축제뉴스</span></div>';
  }

  return `
    <div class="image-frame image-frame--feed image-frame--api">
      <span class="image-fallback-text" aria-hidden="true">대한축제뉴스</span>
      <img src="${escapeHtml(image)}" alt="${escapeHtml(record.title)}" loading="lazy" width="640" height="480" onerror="this.onerror=null;this.closest('.image-frame').classList.add('is-empty');this.remove()" />
    </div>
  `;
}

function resultCard(record = {}) {
  return `
    <article class="news-list-card search-result-card">
      <a href="${escapeHtml(recordUrl(record))}" aria-label="${escapeHtml(`${record.title} 자세히 보기`)}">
        ${resultImage(record)}
        <span>
          <em>${escapeHtml(record.category)}</em>
          <strong>${escapeHtml(record.title)}</strong>
          <small>${escapeHtml([record.date, record.readTime].filter(Boolean).join(" · "))}</small>
          <b>${escapeHtml(record.summary || "")}</b>
        </span>
      </a>
    </article>
  `;
}

function updateTitle(results) {
  const title = $("#searchResultsTitle");
  const status = $("#searchResultsStatus");
  const query = String(state.query || "").trim();

  if (title) title.textContent = query ? `"${query}" 검색 결과` : "최신 축제와 기획 글";
  if (!status) return;

  if (!state.records.length) {
    status.textContent = "검색 데이터를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.";
    return;
  }

  status.textContent = query
    ? `${results.length.toLocaleString("ko-KR")}개 결과를 찾았습니다.`
    : `${state.records.length.toLocaleString("ko-KR")}개 축제와 기획 글을 검색할 수 있습니다.`;
}

function renderResults() {
  const list = $("#searchResultsList");
  const loadMore = $("#searchLoadMore");
  const results = filterRecords();
  const visibleResults = results.slice(0, state.visible);

  updateTitle(results);

  if (list) {
    list.innerHTML = visibleResults.length
      ? visibleResults.map(resultCard).join("")
      : `
        <div class="empty-state">
          <h3>검색 결과가 없습니다</h3>
          <p>지역명, 축제명, 주제를 조금 다르게 입력해 보세요.</p>
        </div>
      `;
  }

  if (loadMore) {
    const remaining = Math.max(0, results.length - state.visible);
    loadMore.textContent = `결과 더보기 (${remaining.toLocaleString("ko-KR")}개 남음)`;
    loadMore.hidden = remaining === 0;
  }
}

function syncQueryFromUrl() {
  const params = new URLSearchParams(window.location.search);
  state.query = params.get("q") || "";
  const input = $("#searchPageInput");
  if (input) input.value = state.query;
}

async function loadRecords() {
  let events = [];
  try {
    const response = await fetch(`/generated/seoul-events.json?v=${currentMonthKey()}`, {
      headers: { Accept: "application/json" }
    });
    const payload = response.ok ? await response.json() : {};
    events = normalizeEventRecords(Array.isArray(payload.items) ? payload.items : []);
  } catch {
    events = [];
  }

  state.records = [...events, ...editorialRecords()]
    .sort((a, b) => dateValue(b) - dateValue(a));
}

function bindSearchPage() {
  const form = $("#searchPageForm");
  const input = $("#searchPageInput");
  const loadMore = $("#searchLoadMore");

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    state.query = input?.value || "";
    state.visible = SEARCH_PAGE_SIZE;
    const params = new URLSearchParams();
    if (state.query.trim()) params.set("q", state.query.trim());
    const next = params.toString() ? `/search?${params}` : "/search";
    window.history.pushState({}, "", next);
    renderResults();
  });

  loadMore?.addEventListener("click", () => {
    state.visible += SEARCH_PAGE_SIZE;
    renderResults();
  });

  window.addEventListener("popstate", () => {
    syncQueryFromUrl();
    state.visible = SEARCH_PAGE_SIZE;
    renderResults();
  });
}

async function init() {
  syncQueryFromUrl();
  bindSearchPage();
  await loadRecords();
  renderResults();
}

document.addEventListener("DOMContentLoaded", init);
