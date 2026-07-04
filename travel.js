const blogData = window.TRAVEL_BLOG_DATA;
const posts = blogData.posts;
const state = {
  visibleCount: 6,
  search: "",
  region: "전체",
  season: "전체",
  category: "전체"
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function postUrl(post) {
  return `/travel/${encodeURIComponent(post.slug)}`;
}

function formatCourse(course) {
  return course.map((item) => `<span>${escapeHtml(item)}</span>`).join("");
}

function setMeta(title, description) {
  document.title = title;
  const descriptionMeta = document.querySelector('meta[name="description"]');
  if (descriptionMeta) descriptionMeta.setAttribute("content", description);
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute("content", title);
  const ogDescription = document.querySelector('meta[property="og:description"]');
  if (ogDescription) ogDescription.setAttribute("content", description);
}

function PostCard(post, variant = "") {
  return `
    <article class="post-card ${variant}">
      <a href="${escapeHtml(postUrl(post))}">
        <div class="post-thumb">
          <img src="${escapeHtml(post.thumbnail)}" alt="${escapeHtml(post.title)}" loading="lazy" />
        </div>
        <div class="post-card-body">
          <span class="chip">${escapeHtml(post.region)} · ${escapeHtml(post.category)}</span>
          <h3>${escapeHtml(post.title)}</h3>
          <p>${escapeHtml(post.summary)}</p>
          <div class="post-meta">
            <span>${escapeHtml(post.date)}</span>
            <span>${escapeHtml(post.readingTime)}</span>
          </div>
        </div>
      </a>
    </article>
  `;
}

function AdBox(position) {
  return `
    <aside class="ad-box" aria-label="${escapeHtml(position)} 광고 영역">
      <span>Advertisement</span>
      <p>${escapeHtml(position)} 광고 영역입니다. 나중에 AdSense 코드를 이 컴포넌트 안에 삽입할 수 있습니다.</p>
    </aside>
  `;
}

function RegionSection() {
  return `
    <div class="shortcut-grid">
      ${blogData.regions.map((region) => `
        <a class="shortcut-card" href="regions.html?region=${encodeURIComponent(region)}">
          <strong>${escapeHtml(region)}</strong>
          <span>${posts.filter((post) => post.region === region).length}개 여행 글</span>
        </a>
      `).join("")}
    </div>
  `;
}

function SeasonSection() {
  const label = {
    "봄": "봄꽃 여행",
    "여름": "바다·계곡",
    "가을": "단풍 코스",
    "겨울": "눈꽃·온천"
  };

  return `
    <div class="season-grid">
      ${blogData.seasons.map((season) => {
        const first = posts.find((post) => post.season === season) || posts[0];
        return `
          <a class="season-card" href="seasons.html?season=${encodeURIComponent(season)}">
            <img src="${escapeHtml(first.thumbnail)}" alt="${escapeHtml(label[season])}" loading="lazy" />
            <span>${escapeHtml(season)}</span>
            <strong>${escapeHtml(label[season])}</strong>
          </a>
        `;
      }).join("")}
    </div>
  `;
}

function optionList(values, selected) {
  return ["전체", ...values].map((value) => `
    <option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(value)}</option>
  `).join("");
}

function SearchFilter() {
  return `
    <form class="filter-panel" id="filterForm">
      <label>
        <span>검색</span>
        <input type="search" name="search" placeholder="태안, 제주, 당일치기처럼 검색" value="${escapeHtml(state.search)}" />
      </label>
      <label>
        <span>지역</span>
        <select name="region">${optionList(blogData.regions, state.region)}</select>
      </label>
      <label>
        <span>계절</span>
        <select name="season">${optionList(blogData.seasons, state.season)}</select>
      </label>
      <label>
        <span>카테고리</span>
        <select name="category">${optionList(blogData.categories, state.category)}</select>
      </label>
    </form>
  `;
}

function filteredPosts(basePosts = posts) {
  const keyword = state.search.trim().toLowerCase();

  return basePosts.filter((post) => {
    const matchesSearch = !keyword || [
      post.title,
      post.summary,
      post.region,
      post.category,
      post.season,
      post.course.join(" ")
    ].join(" ").toLowerCase().includes(keyword);
    const matchesRegion = state.region === "전체" || post.region === state.region;
    const matchesSeason = state.season === "전체" || post.season === state.season;
    const matchesCategory = state.category === "전체" || post.category === state.category;

    return matchesSearch && matchesRegion && matchesSeason && matchesCategory;
  });
}

function bindFilters(onChange) {
  const form = $("#filterForm");
  if (!form) return;

  form.addEventListener("input", () => {
    const values = new FormData(form);
    state.search = String(values.get("search") || "");
    state.region = String(values.get("region") || "전체");
    state.season = String(values.get("season") || "전체");
    state.category = String(values.get("category") || "전체");
    state.visibleCount = 6;
    onChange();
  });
}

function renderPostList(target, list, emptyText = "표시할 여행 글이 없습니다.") {
  const visible = list.slice(0, state.visibleCount);
  target.innerHTML = visible.length
    ? visible.map((post) => PostCard(post)).join("")
    : `<div class="empty-state"><h3>${escapeHtml(emptyText)}</h3><p>검색어와 필터를 조정해 보세요.</p></div>`;

  const more = $("#loadMore");
  if (more) {
    more.hidden = state.visibleCount >= list.length;
    more.onclick = () => {
      state.visibleCount += 6;
      renderPostList(target, list, emptyText);
    };
  }
}

function renderHome() {
  const popular = posts.slice(0, 3);
  const latest = [...posts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  $("#brandName").textContent = blogData.site.name;
  $("#heroTitle").textContent = blogData.site.heroCopies[0];
  $("#heroDescription").textContent = "국내 여행지, 당일치기 코스, 계절별 추천 여행, 맛집·카페·숙소 정보를 모바일에서 읽기 좋게 정리했습니다.";
  $("#heroCards").innerHTML = popular.map((post) => PostCard(post, "compact")).join("");
  $("#popularGrid").innerHTML = popular.map((post) => PostCard(post)).join("");
  $("#latestGrid").innerHTML = latest.map((post) => PostCard(post)).join("");
  $("#seasonSection").innerHTML = SeasonSection();
  $("#regionSection").innerHTML = RegionSection();
  $("#blogNameIdeas").innerHTML = blogData.site.nameIdeas.map((name) => `<li>${escapeHtml(name)}</li>`).join("");
}

function renderListPage() {
  const filterMount = $("#filterMount");
  const grid = $("#postGrid");
  filterMount.innerHTML = SearchFilter();

  const refresh = () => {
    const list = filteredPosts();
    $("#resultCount").textContent = `${list.length}개의 여행 글`;
    renderPostList(grid, list);
  };

  bindFilters(refresh);
  refresh();
}

function renderRegionsPage() {
  const params = new URLSearchParams(window.location.search);
  const selectedRegion = params.get("region");
  if (selectedRegion && blogData.regions.includes(selectedRegion)) state.region = selectedRegion;

  $("#regionLinks").innerHTML = RegionSection();
  $("#filterMount").innerHTML = SearchFilter();

  const refresh = () => {
    const list = filteredPosts();
    $("#regionTitle").textContent = state.region === "전체" ? "지역별 여행지" : `${state.region} 여행지`;
    $("#resultCount").textContent = `${list.length}개의 여행 글`;
    renderPostList($("#postGrid"), list, "해당 지역의 여행 글이 없습니다.");
  };

  bindFilters(refresh);
  refresh();
}

function renderSeasonsPage() {
  const params = new URLSearchParams(window.location.search);
  const selectedSeason = params.get("season");
  if (selectedSeason && blogData.seasons.includes(selectedSeason)) state.season = selectedSeason;

  $("#seasonLinks").innerHTML = SeasonSection();
  $("#filterMount").innerHTML = SearchFilter();

  const refresh = () => {
    const list = filteredPosts();
    $("#seasonTitle").textContent = state.season === "전체" ? "계절별 추천 여행" : `${state.season} 추천 여행`;
    $("#resultCount").textContent = `${list.length}개의 여행 글`;
    renderPostList($("#postGrid"), list, "해당 계절의 여행 글이 없습니다.");
  };

  bindFilters(refresh);
  refresh();
}

function slugFromLocation() {
  const pathMatch = decodeURIComponent(window.location.pathname).match(/^\/travel\/([^/]+)\/?$/);
  if (pathMatch) return pathMatch[1];
  return new URLSearchParams(window.location.search).get("slug") || "";
}

function PostDetail(post) {
  const related = posts
    .filter((item) => item.slug !== post.slug && (item.region === post.region || item.season === post.season))
    .slice(0, 3);

  return `
    <article class="post-detail">
      <header class="detail-hero">
        <span class="chip">${escapeHtml(post.region)} · ${escapeHtml(post.category)} · ${escapeHtml(post.season)}</span>
        <h1>${escapeHtml(post.title)}</h1>
        <p>${escapeHtml(post.summary)}</p>
        <div class="post-meta">
          <span>${escapeHtml(post.date)}</span>
          <span>${escapeHtml(post.readingTime)}</span>
        </div>
      </header>
      <figure class="detail-image">
        <img src="${escapeHtml(post.thumbnail)}" alt="${escapeHtml(post.title)}" />
      </figure>
      ${AdBox("본문 상단")}
      <section class="summary-box" aria-labelledby="courseSummaryTitle">
        <h2 id="courseSummaryTitle">여행 코스 요약</h2>
        <div class="course-flow">${formatCourse(post.course)}</div>
      </section>
      <section class="article-section">
        <h2>추천 일정</h2>
        <ol class="schedule-list">
          ${post.course.map((place, index) => `
            <li>
              <strong>${index + 1}. ${escapeHtml(place)}</strong>
              <p>${index === 0 ? "첫 방문지는 이동 부담이 적은 곳으로 잡아 여행 흐름을 안정적으로 시작하세요." : "앞 코스와 이동 시간을 고려해 여유 있게 머무르는 것을 추천합니다."}</p>
            </li>
          `).join("")}
        </ol>
      </section>
      ${post.content.map((section, index) => `
        <section class="article-section">
          <h2>${escapeHtml(section.heading)}</h2>
          <p>${escapeHtml(section.body)}</p>
        </section>
        ${index === 0 ? AdBox("본문 중간") : ""}
      `).join("")}
      <section class="info-box" aria-labelledby="infoTitle">
        <h2 id="infoTitle">방문 전 기본 정보</h2>
        <dl>
          <div><dt>주소</dt><dd>${escapeHtml(post.address)}</dd></div>
          <div><dt>주차</dt><dd>${escapeHtml(post.parking)}</dd></div>
          <div><dt>입장료</dt><dd>${escapeHtml(post.fee)}</dd></div>
          <div><dt>운영시간</dt><dd>${escapeHtml(post.operatingHours)}</dd></div>
        </dl>
      </section>
      <section class="article-section">
        <h2>이동 동선</h2>
        <p>${escapeHtml(post.course.join(" → "))} 순서로 이동하면 되돌아가는 시간이 적고, 식사와 카페 휴식 시간을 중간에 넣기 좋습니다.</p>
      </section>
      <section class="nearby-section">
        <h2>주변 맛집·카페·숙소 추천</h2>
        <div class="nearby-grid">
          ${post.nearbySpots.map((spot) => `
            <article>
              <span>${escapeHtml(spot.type)}</span>
              <h3>${escapeHtml(spot.name)}</h3>
              <p>${escapeHtml(spot.note)}</p>
            </article>
          `).join("")}
        </div>
      </section>
      ${AdBox("본문 하단")}
      <section class="related-section-detail">
        <h2>관련 글 추천</h2>
        <div class="post-grid">
          ${related.map((item) => PostCard(item)).join("")}
        </div>
      </section>
    </article>
  `;
}

function renderDetailPage() {
  const slug = slugFromLocation();
  const post = posts.find((item) => item.slug === slug) || posts[0];

  setMeta(
    `${post.title} | ${blogData.site.name}`,
    `${post.summary} ${post.region} ${post.category} 여행 코스와 주소, 주차, 운영시간 정보를 정리했습니다.`
  );

  $("#detailMount").innerHTML = PostDetail(post);
}

function bindMenu() {
  const button = $("#menuToggle");
  const nav = $("#primaryNav");
  if (!button || !nav) return;

  button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!open));
    nav.classList.toggle("is-open", !open);
  });
}

function initPage() {
  bindMenu();
  if ($("#homePage")) renderHome();
  if ($("#listPage")) renderListPage();
  if ($("#regionPage")) renderRegionsPage();
  if ($("#seasonPage")) renderSeasonsPage();
  if ($("#detailPage")) renderDetailPage();
}

document.addEventListener("DOMContentLoaded", initPage);
