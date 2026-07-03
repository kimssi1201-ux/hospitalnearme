const data = window.TRAVEL_PORTAL_DATA;
const params = new URLSearchParams(window.location.search);
const source = params.get("source");
const id = params.get("id");

const $ = (selector) => document.querySelector(selector);

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

async function fetchTourDetail(contentId) {
  const base = "https://apis.data.go.kr/B551011/KorService2";
  const commonUrl = `${base}/detailCommon2?${commonParams({
    contentId,
    contentTypeId: "15",
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
    contentTypeId: "15"
  })}`;

  const [commonResponse, introResponse] = await Promise.all([
    fetch(commonUrl),
    fetch(introUrl)
  ]);

  if (!commonResponse.ok) throw new Error(`detailCommon2 ${commonResponse.status}`);

  const commonPayload = await commonResponse.json();
  const introPayload = introResponse.ok ? await introResponse.json() : {};
  const commonItem = normalizeApiItem(commonPayload?.response?.body?.items?.item);
  const introItem = normalizeApiItem(introPayload?.response?.body?.items?.item);

  if (!commonItem?.title) throw new Error("Tour detail item missing");

  const start = compactDate(introItem?.eventstartdate);
  const end = compactDate(introItem?.eventenddate);
  const period = start && end ? `${start} - ${end}` : start || "일정 확인 필요";

  return {
    id: `tour-${contentId}`,
    category: "전국 축제",
    title: commonItem.title,
    summary: stripHtml(commonItem.overview) || "공공데이터에서 불러온 전국 축제 상세 정보입니다.",
    date: period,
    readTime: "축제 상세",
    image: (commonItem.firstimage || commonItem.firstimage2 || data.articles[0].image).replace(/^http:/, "https:"),
    address: [commonItem.addr1, commonItem.addr2].filter(Boolean).join(" "),
    tel: commonItem.tel || "",
    homepage: commonItem.homepage || "",
    overview: stripHtml(commonItem.overview),
    facts: [
      ["일정", period],
      ["장소", introItem?.eventplace || commonItem.addr1 || "장소 확인 필요"],
      ["운영 시간", introItem?.playtime || "공식 안내 확인"],
      ["이용 요금", stripHtml(introItem?.usetimefestival) || "공식 안내 확인"]
    ]
  };
}

function normalizeApiItem(item) {
  return Array.isArray(item) ? item[0] : item || {};
}

function findLocalArticle() {
  return data.articles.find((article) => article.id === id) || data.articles[0];
}

function localFacts(article) {
  return [
    ["분류", article.category],
    ["업데이트", article.date],
    ["읽는 시간", article.readTime],
    ["체크 포인트", "일정·교통·예약"]
  ];
}

function detailSections(article) {
  return [
    {
      title: "먼저 확인할 핵심",
      body: `${article.summary} 축제는 이동 시간과 현장 혼잡도가 만족도를 크게 좌우하므로, 행사장 도착 시간과 귀가 동선을 먼저 잡는 편이 좋습니다.`
    },
    {
      title: "방문 전 체크포인트",
      body: "공식 운영 시간, 우천 시 진행 여부, 입장 방식, 주변 주차장과 대중교통 막차 시간을 함께 확인하세요. 인기 행사는 식음료 부스 대기 시간이 길어질 수 있으므로 식사 시간을 분산하는 것도 좋습니다."
    },
    {
      title: "예약과 동선 연결",
      body: "숙소가 필요한 일정이라면 행사장과 가까운 숙소만 보지 말고, 축제 종료 후 이동할 수 있는 교통편과 체크인 시간을 같이 비교하세요. 입장권이 있는 행사는 현장 수령 여부와 취소 마감 시간을 먼저 확인해야 합니다."
    }
  ];
}

function renderFactGrid(facts) {
  return facts
    .filter(([, value]) => value)
    .map(([label, value]) => `
      <div class="fact-card">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(stripHtml(value))}</strong>
      </div>
    `)
    .join("");
}

function renderChecklist() {
  const items = [
    "행사 시작·종료 시간과 마지막 입장 시간을 확인하기",
    "대중교통 막차 또는 임시 셔틀 운행 여부 확인하기",
    "우천 시 취소·축소 운영 기준 확인하기",
    "입장권 예매, 현장 수령, 환불 마감 시간 확인하기",
    "주차장 위치와 행사장까지 도보 이동 거리 확인하기"
  ];

  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function updateDocumentMeta(article) {
  document.title = `${article.title} | 페스티벌 노트`;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute("content", article.summary.slice(0, 150));
}

function renderArticle(article) {
  updateDocumentMeta(article);
  const facts = article.facts || localFacts(article);
  const sections = article.overview
    ? [
        { title: "축제 소개", body: article.overview },
        { title: "방문 전 체크포인트", body: "방문 전 공식 홈페이지와 현장 안내를 확인하고, 행사장 주변 교통 통제와 주차 가능 여부를 함께 점검하세요." },
        { title: "예약과 동선 연결", body: "숙소나 입장권이 필요한 일정이라면 취소 규정, 현장 수령 여부, 이동 시간을 함께 비교하는 것이 좋습니다." }
      ]
    : detailSections(article);

  $("#detailArticle").innerHTML = `
    <header class="blog-header">
      <p class="eyebrow">${escapeHtml(article.category)}</p>
      <h1>${escapeHtml(article.title)}</h1>
      <p class="blog-lede">${escapeHtml(article.summary)}</p>
      <div class="article-meta">
        <span>${escapeHtml(article.date)}</span>
        <span>${escapeHtml(article.readTime)}</span>
      </div>
    </header>
    <div class="detail-hero-image">
      <img src="${escapeHtml(article.image)}" alt="${escapeHtml(article.title)}" />
    </div>
    <section class="fact-grid" aria-label="축제 기본 정보">
      ${renderFactGrid(facts)}
    </section>
    ${article.address ? `<p class="detail-address"><strong>주소</strong> ${escapeHtml(article.address)}</p>` : ""}
    ${article.tel ? `<p class="detail-address"><strong>문의</strong> ${escapeHtml(article.tel)}</p>` : ""}
    <div class="blog-body">
      ${sections.map((section) => `
        <section>
          <h2>${escapeHtml(section.title)}</h2>
          <p>${escapeHtml(stripHtml(section.body))}</p>
        </section>
      `).join("")}
      <section class="checklist-section">
        <h2>방문 전 체크리스트</h2>
        <ul>${renderChecklist()}</ul>
      </section>
      ${article.homepage ? `<a class="primary-button official-link" href="${article.homepage}" target="_blank" rel="noopener noreferrer">공식 안내 보기</a>` : ""}
    </div>
  `;
}

function renderRelated(currentId) {
  const related = data.articles
    .filter((article) => article.id !== currentId)
    .slice(0, 3);

  $("#relatedGrid").innerHTML = related.map((article) => `
    <article class="related-card">
      <a href="festival-detail?id=${encodeURIComponent(article.id)}">
        <img src="${escapeHtml(article.image)}" alt="${escapeHtml(article.title)}" />
        <span>
          <em>${escapeHtml(article.category)}</em>
          <strong>${escapeHtml(article.title)}</strong>
        </span>
      </a>
    </article>
  `).join("");
}

async function init() {
  try {
    const article = source === "tour" && id
      ? await fetchTourDetail(id)
      : findLocalArticle();

    renderArticle(article);
    renderRelated(article.id);
  } catch (error) {
    console.warn("Detail load failed. Local article is displayed.", error);
    const article = findLocalArticle();
    renderArticle(article);
    renderRelated(article.id);
  }
}

document.addEventListener("DOMContentLoaded", init);
