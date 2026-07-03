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
  const location = article.address ? `${article.address} 인근` : "행사장 주변";
  const category = article.category || "축제";

  return [
    {
      title: "축제 핵심 요약",
      body: [
        `${article.summary} 이 글은 단순히 행사명을 나열하는 것이 아니라, 실제 방문 전에 확인해야 할 일정, 이동, 예약, 현장 이용 기준을 중심으로 정리한 정보성 가이드입니다.`,
        `${category} 콘텐츠는 분위기만 보고 결정하면 현장 혼잡, 교통 통제, 식사 대기 때문에 만족도가 떨어질 수 있습니다. 먼저 방문 목적과 동행자, 이동 수단을 정한 뒤 축제 시간을 맞추는 방식이 안정적입니다.`
      ]
    },
    {
      title: "이 축제가 잘 맞는 방문자",
      body: [
        "사진을 많이 남기고 싶은 여행자라면 해가 지기 전 도착해 행사장 전체를 먼저 둘러보는 동선이 좋습니다. 가족 단위라면 화장실, 그늘, 휴식 공간, 유모차 이동 가능 구간을 먼저 확인해야 합니다.",
        "커플이나 친구 여행이라면 공연 시간과 먹거리 부스 운영 시간을 중심으로 움직이는 편이 좋고, 혼자 방문한다면 혼잡도가 낮은 이른 시간대에 전시형 콘텐츠부터 보는 흐름이 효율적입니다."
      ]
    },
    {
      title: "교통과 현장 동선",
      body: [
        `${location}은 행사 당일 교통량이 늘 수 있으므로 자가용 이용자는 임시 주차장 위치와 행사장까지의 도보 거리를 같이 확인해야 합니다. 대중교통 이용자는 막차 시간보다 한두 편 앞선 시간을 기준으로 귀가 계획을 잡는 편이 안전합니다.`,
        "축제장에 도착하면 입구, 안내 부스, 화장실, 주요 공연장, 먹거리 구역의 위치를 먼저 파악하세요. 인기 공연이나 불꽃·퍼레이드형 프로그램은 시작 30분 전부터 이동이 어려워질 수 있습니다."
      ]
    },
    {
      title: "숙소와 예약 전 체크",
      body: [
        "숙박이 필요한 축제라면 행사장 바로 앞 숙소만 고집하기보다, 축제 종료 후 이동 가능한 교통축 안에 있는 숙소를 함께 비교하는 것이 좋습니다. 체크인 시간, 무료 취소 마감, 주차 가능 여부도 가격만큼 중요합니다.",
        "입장권이 있는 행사는 모바일 티켓인지 현장 수령인지 확인해야 합니다. 우천 취소, 부분 환불, 시간대 변경 가능 여부도 방문 전 반드시 봐야 하는 항목입니다."
      ]
    },
    {
      title: "먹거리와 준비물",
      body: [
        "지역 먹거리 축제나 야시장형 행사는 인기 부스 대기 시간이 길어질 수 있습니다. 식사 목적이라면 점심 직후나 저녁 피크 전처럼 사람이 몰리기 전 시간대를 활용하는 편이 좋습니다.",
        "야외 축제는 보조배터리, 얇은 겉옷, 작은 돗자리, 물티슈, 휴대용 우산을 준비하면 현장 대응이 편합니다. 여름에는 생수와 자외선 차단, 겨울에는 장갑과 핫팩처럼 계절 준비물도 함께 챙겨야 합니다."
      ]
    },
    {
      title: "비가 오거나 사람이 많을 때",
      body: [
        "비 예보가 있다면 공식 홈페이지나 SNS에서 우천 운영 공지를 확인하고, 주변 실내 관광지나 카페를 대체 코스로 준비하세요. 야외 무대는 취소되지 않아도 일부 체험 부스는 운영 시간이 바뀔 수 있습니다.",
        "혼잡도가 높다면 모든 프로그램을 보려 하기보다 핵심 프로그램 1~2개를 정해 이동 동선을 줄이는 편이 좋습니다. 아이와 함께라면 출구와 휴식 공간 가까운 위치에서 관람하는 것이 안전합니다."
      ]
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
    "주차장 위치와 행사장까지 도보 이동 거리 확인하기",
    "화장실, 안내 부스, 휴식 공간 위치를 먼저 확인하기",
    "인기 공연이나 퍼레이드는 시작 30분 전 이동 완료하기",
    "주변 식당과 카페 대체 동선을 1곳 이상 준비하기"
  ];

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
  const items = [
    ["방문 전", "공식 안내, 운영 시간, 입장 방식, 우천 공지를 확인합니다."],
    ["도착 직후", "안내 부스, 화장실, 주요 무대, 먹거리 구역 위치를 먼저 파악합니다."],
    ["관람 중", "핵심 프로그램 1~2개를 중심으로 이동 동선을 줄입니다."],
    ["귀가 전", "막차 시간, 주차장 출차 동선, 주변 혼잡 구간을 다시 확인합니다."]
  ];

  return `
    <section class="timeline-section">
      <h2>추천 방문 흐름</h2>
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
  const cards = [
    ["교통", "행사 당일 교통 통제와 임시 주차장 운영 여부를 확인하세요."],
    ["숙소", "행사장과 거리뿐 아니라 축제 종료 후 이동 가능성을 같이 비교하세요."],
    ["입장권", "모바일 티켓, 현장 수령, 취소 마감, 우천 환불 기준을 확인하세요."],
    ["준비물", "보조배터리, 생수, 얇은 겉옷, 우산처럼 현장 체류에 필요한 물품을 챙기세요."]
  ];

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

function updateDocumentMeta(article) {
  document.title = `${article.title} | 페스티벌 노트`;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute("content", article.summary.slice(0, 150));
}

async function hydrateAiGuide(article) {
  const section = $("#aiGuideSection");
  const content = $("#aiGuideContent");
  if (!section || !content) return;

  try {
    const response = await fetch("/api/festival-ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
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
    if (!sections.length && !tips.length) return;

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
  } catch (error) {
    console.info("AI guide is not available.", error);
  }
}

function renderArticle(article) {
  updateDocumentMeta(article);
  const facts = article.facts || localFacts(article);
  const sections = article.overview
    ? [
        {
          title: "축제 소개",
          body: [
            article.overview,
            "공공데이터에서 제공되는 기본 소개 외에도 방문 전에는 행사 시간, 장소 이동, 현장 혼잡, 우천 운영 여부를 함께 확인해야 실제 일정 관리가 쉽습니다."
          ]
        },
        ...detailSections(article).slice(1)
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
      ${sections.map((section) => renderSection(section)).join("")}
      ${renderVisitPlan(article)}
      ${renderPracticalCards(article)}
      <section class="checklist-section">
        <h2>방문 전 체크리스트</h2>
        <ul>${renderChecklist()}</ul>
      </section>
      <section class="ai-guide-section" id="aiGuideSection" hidden>
        <div>
          <p class="eyebrow">AI Visit Guide</p>
          <h2>AI가 정리한 방문 포인트</h2>
          <p>축제 기본 정보를 바탕으로 방문 전 확인할 내용을 짧게 보강합니다.</p>
        </div>
        <div class="ai-guide-content" id="aiGuideContent"></div>
      </section>
      ${article.homepage ? `<a class="primary-button official-link" href="${article.homepage}" target="_blank" rel="noopener noreferrer">공식 안내 보기</a>` : ""}
    </div>
  `;
  hydrateAiGuide(article);
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
