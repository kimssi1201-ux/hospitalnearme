const data = window.TRAVEL_PORTAL_DATA;

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

function articleCard(item, variant = "") {
  return `
    <article class="article-card ${variant}">
      <a href="${escapeHtml(item.href)}" aria-label="${escapeHtml(item.title)} 자세히 보기">
        ${imageMarkup(item)}
        <span class="category-label">${escapeHtml(item.category)}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.summary)}</p>
        <div class="article-meta">${articleMeta(item)}</div>
      </a>
    </article>
  `;
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
      <a href="${escapeHtml(featured.href)}" aria-label="${escapeHtml(featured.title)} 자세히 보기">
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
          <a href="${escapeHtml(item.href)}">
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
  $("#placesGrid").innerHTML = data.articles
    .slice(1)
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
  $("#curationList").innerHTML = data.articles
    .slice(2, 8)
    .map((item) => `
      <article class="curation-card">
        <a href="${escapeHtml(item.href)}">
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
}

document.addEventListener("DOMContentLoaded", init);
