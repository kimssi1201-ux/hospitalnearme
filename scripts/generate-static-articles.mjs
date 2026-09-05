import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = path.join(rootDir, "travel-data.js");
const eventDataPath = path.join(rootDir, "generated", "seoul-events.json");
const articleDir = path.join(rootDir, "articles");
const eventDir = path.join(rootDir, "seoul-events");
const siteOrigin = String(process.env.PUBLIC_SITE_URL || "https://view1.kr").replace(/\/+$/, "");
const publisherId = "ca-pub-5751319666030430";

const guideProfiles = {
  "seoul-august-indoor-exhibition-course": ["8월 실내 전시", "한낮 이동을 줄일 수 있도록 지하철역과 가까운 전시 공간을 먼저 고르세요.", "냉방이 되는 공간이라도 인기 전시는 대기 시간이 길 수 있어 예약과 마지막 입장 시간을 함께 확인해야 합니다."],
  "seoul-after-work-performance-route": ["퇴근 후 공연", "공연 시작 시각에서 티켓 수령, 저녁 식사, 이동 시간을 거꾸로 계산하세요.", "평일 저녁에는 지하철 혼잡과 공연장 입장 마감이 겹칠 수 있어 도착 목표 시간을 넉넉히 잡는 편이 좋습니다."],
  "seoul-public-transport-culture-day": ["대중교통 문화 코스", "환승이 적은 노선보다 행사장 출구와 도보 시간이 짧은 동선을 우선하세요.", "막차 시간과 버스 배차 간격은 날짜와 요일에 따라 달라질 수 있어 방문 당일 다시 확인해야 합니다."],
  "seoul-weekend-exhibition-guide": ["전시 관람", "관심 전시를 한 곳 먼저 고른 뒤 도보권의 실내 문화공간을 한 곳만 더 연결하세요.", "작품 수보다 관람에 쓸 수 있는 시간과 이동 거리를 먼저 비교하는 편이 좋습니다."],
  "seoul-family-free-events": ["가족 나들이", "아이의 연령과 집중 시간을 기준으로 오전 또는 오후 한 구간만 예약하세요.", "무료 행사도 사전 신청, 보호자 동반, 재입장 가능 여부가 서로 다릅니다."],
  "jongno-junggu-culture-route": ["도심 문화 코스", "종로와 중구를 한 번에 넓게 돌기보다 광화문권 또는 시청권 중 한 축을 정하세요.", "공연 시작 시간이 정해져 있다면 전시와 식사 일정을 그 시간에서 거꾸로 계산해야 합니다."],
  "seoul-night-event-safety-route": ["야간 행사", "행사 종료 시각과 마지막 대중교통 시간을 먼저 확인한 뒤 귀가 경로를 저장하세요.", "조명이 밝은 큰길과 공식 출입구를 기준으로 이동하고 일행과 만날 장소도 미리 정하는 것이 좋습니다."],
  "seoul-rainy-day-culture-course": ["비 오는 날 실내 코스", "지하철역에서 행사장까지 실외 이동이 짧은 장소를 우선 고르세요.", "우산 보관, 물품 보관함, 현장 대기 공간처럼 비 오는 날 체감 만족도를 좌우하는 조건을 확인해야 합니다."],
  "seoul-ticket-parking-check": ["방문 준비", "공식 안내에서 날짜, 회차, 입장 방식, 취소 규정을 한 화면씩 확인하세요.", "주차 가능이라는 문구만 보지 말고 운영 시간과 요금, 만차 시 대체 주차장까지 살펴야 합니다."],
  "seoul-subway-culture-route": ["지하철 문화 코스", "환승 횟수보다 행사장과 연결되는 출구 및 도보 구간을 함께 보세요.", "같은 역이라도 출구에 따라 이동 시간이 크게 달라지므로 공식 주소를 지도에 다시 입력하는 것이 안전합니다."],
  "seoul-free-exhibition-monthly": ["무료 전시", "무료 여부와 별개로 예약 인원, 휴관일, 마지막 입장 시각을 확인하세요.", "짧은 전시는 주변 공공 문화공간이나 산책 코스와 묶으면 이동 대비 만족도가 높아집니다."],
  "seoul-couple-evening-course": ["저녁 데이트", "예약 시간이 있는 공연을 중심에 두고 식사와 야경 구간을 앞뒤로 배치하세요.", "주말 저녁에는 식당 대기와 귀가 시간을 넉넉히 잡아 일정 사이에 최소 30분의 여유를 두는 편이 좋습니다."],
  "seoul-kids-museum-experience": ["어린이 체험", "참여 가능 연령, 보호자 동반 여부, 한 회차의 체류 시간을 먼저 확인하세요.", "유모차 이동, 수유실, 화장실, 쉬는 공간은 프로그램 내용만큼 실제 방문 만족도에 영향을 줍니다."],
  "seoul-gangnam-coex-event-guide": ["강남·코엑스 방문", "대형 행사는 전시장 홀과 입구가 나뉘므로 정확한 홀 번호를 저장하세요.", "주말 차량 이동은 혼잡이 잦아 대중교통과 주변 공영주차장을 함께 비교하는 것이 좋습니다."],
  "seoul-hongdae-mapo-culture-walk": ["홍대·마포 산책", "소규모 전시나 공연 한 곳과 쉬어 갈 카페 한 곳을 도보권으로 묶으세요.", "골목 이동이 많은 지역이므로 비 예보와 보행 시간을 확인하고 일정에 여백을 남기는 편이 좋습니다."],
  "seoul-summer-indoor-events": ["여름 실내 행사", "냉방이 되는 실내 장소를 중심으로 한낮 이동을 줄이세요.", "대기 줄이 실외에 생기는지, 물품 반입 제한이 있는지, 휴게 공간이 있는지를 방문 전에 확인해야 합니다."],
  "seoul-one-day-culture-plan": ["서울 당일치기", "오전 한 곳, 오후 한 곳을 중심으로 잡고 저녁 일정은 선택 사항으로 남겨 두세요.", "먼 지역을 여러 곳 연결하기보다 같은 지하철 노선 또는 인접 자치구 안에서 이동하는 편이 안정적입니다."],
  "seoul-library-culture-programs": ["도서관 프로그램", "모집 시작일과 신청 대상을 먼저 확인하고 회원 가입이 필요한지도 살펴보세요.", "무료 강좌는 정원이 작고 대기 신청으로 바뀌는 경우가 있어 취소 알림과 준비물을 함께 확인해야 합니다."],
  "seoul-performance-seat-guide": ["공연 관람", "러닝타임, 관람 연령, 좌석 위치를 가격과 함께 비교하세요.", "지연 입장 제한과 인터미션 유무, 티켓 수령 시간을 알아두면 공연 시작 직전의 혼잡을 줄일 수 있습니다."],
  "seoul-budget-culture-day": ["가성비 문화생활", "입장료뿐 아니라 교통, 식사, 보관함, 주차 비용까지 하루 예산에 포함하세요.", "무료 행사 한 곳과 유료 행사 한 곳을 조합하면 비용을 관리하면서도 일정의 밀도를 높일 수 있습니다."],
  "seoul-solo-culture-trip": ["혼자 문화여행", "관람 속도를 자유롭게 조절할 수 있는 전시나 도서관을 중심으로 고르세요.", "늦은 시간에는 큰길과 대중교통 접근성을 우선하고 짐을 보관할 장소도 미리 확인하는 것이 편합니다."],
  "seoul-traditional-palace-events": ["궁궐·전통문화", "입장 마감과 해설 시작 시각, 별도 예약 여부를 공식 안내에서 확인하세요.", "야간개장이나 특별 프로그램은 일반 관람 시간과 운영 방식이 다를 수 있어 날짜별 안내가 중요합니다."],
  "seoul-weekend-culture-with-parents": ["부모님과 문화 나들이", "계단이 적고 좌석과 화장실이 가까운 장소를 먼저 고르세요.", "걷는 거리와 환승 횟수를 줄이고 식사 및 휴식 시간을 넉넉히 두면 일정이 훨씬 편안해집니다."]
};

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function cleanText(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function safeSlug(value) {
  return String(value || "").trim().replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-").slice(0, 120);
}

function safeExternalUrl(value) {
  try {
    const url = new URL(String(value || "").replace(/^http:/, "https:"));
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function officialImage(value) {
  const url = safeExternalUrl(value);
  if (!url) return "";
  const host = new URL(url).hostname.toLowerCase();
  return host.endsWith("seoul.go.kr") || host.endsWith("visitkorea.or.kr") ? url : "";
}

function kstDate() {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date()).replace(/\. /g, "-").replace(".", "");
}

// Converts the site's "2026.08.15" editorial date format into an RFC 822
// timestamp (RSS 2.0's pubDate format), anchored to noon KST since the
// source data only carries a day, not a time.
function rfc822Date(value) {
  const match = String(value || "").match(/(\d{4})\.(\d{2})\.(\d{2})/);
  if (!match) return new Date().toUTCString();
  const [, year, month, day] = match;
  return new Date(`${year}-${month}-${day}T12:00:00+09:00`).toUTCString();
}

function rssXml(posts) {
  const items = posts
    .map((post) => {
      const link = `${siteOrigin}/articles/${safeSlug(post.id)}/`;
      return `    <item>
      <title>${escapeHtml(post.title)}</title>
      <link>${escapeHtml(link)}</link>
      <guid isPermaLink="true">${escapeHtml(link)}</guid>
      <description>${escapeHtml(post.summary || "")}</description>
      <category>${escapeHtml(post.category || "")}</category>
      <pubDate>${rfc822Date(post.date)}</pubDate>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>대한축제뉴스</title>
    <link>${siteOrigin}/</link>
    <description>전국 축제, 문화행사 일정과 방문 전 체크 정보를 정리하는 뉴스 매거진입니다.</description>
    <language>ko-kr</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${siteOrigin}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}

function sitemapXml(posts) {
  const paths = [
    "/",
    "/about",
    "/editorial-policy",
    "/contact",
    "/privacy",
    "/terms",
    "/disclaimer",
    ...posts.map((post) => `/articles/${safeSlug(post.id)}/`)
  ];
  const entries = [...new Set(paths)].map((pathname, index) => {
    const priority = index === 0 ? "1.0" : pathname.startsWith("/articles/") ? "0.8" : "0.7";
    return `  <url><loc>${escapeHtml(`${siteOrigin}${pathname}`)}</loc><lastmod>${kstDate()}</lastmod><priority>${priority}</priority></url>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

async function loadEditorialPosts() {
  const source = await readFile(dataPath, "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox, { filename: dataPath, timeout: 1000 });
  return (sandbox.window.TRAVEL_PORTAL_DATA?.editorialPosts || []).filter((item) => item?.id && item?.title);
}

async function loadEvents() {
  const payload = JSON.parse(await readFile(eventDataPath, "utf8"));
  return {
    ...payload,
    items: Array.isArray(payload.items) ? payload.items : [],
    legacyItems: Array.isArray(payload.legacyItems) ? payload.legacyItems : []
  };
}

function uniqueEventItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const id = safeSlug(item?.id);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function sharedHead({ title, description, canonical, robots = "index,follow,max-image-preview:large", ads = true, image = "" }) {
  const imageMeta = image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : "";
  const adCode = ads
    ? `<meta name="google-adsense-account" content="${publisherId}" />\n    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}" crossorigin="anonymous"></script>`
    : "";
  return `
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="${escapeHtml(robots)}" />
    <meta name="theme-color" content="#ffffff" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    ${imageMeta}
    <link rel="stylesheet" href="/article-static.css?v=20260905-title-body-2" />
    ${adCode}`;
}

function siteHeader() {
  return `<header class="site-header site-header--article"><div class="site-header__brand-row"><a class="brand brand--article" href="/" aria-label="대한축제뉴스 홈"><span>DF</span><strong>대한축제뉴스</strong><small>전국 축제 여행 인사이트</small></a></div><div class="site-header__nav-row"><nav aria-label="주요 메뉴"><a href="/">홈</a><a href="/#travel-news">여행뉴스</a><a href="/#placesSection">국내여행</a><a href="/#placesSection">지역별축제</a><a href="/#allArticles">축제·행사</a><a href="/#before-trip">여행팁</a></nav><a class="header-search-link" href="/#festivalFinder" aria-label="축제 검색"><span class="header-search-icon" aria-hidden="true"></span></a></div></header>`;
}

function siteFooter() {
  return `<footer class="site-footer"><div><strong>대한축제뉴스</strong><p>공개된 전국 축제·문화행사 정보와 직접 확인해야 할 방문 준비 사항을 구분해 전합니다.</p><nav aria-label="사이트 안내"><a href="/about">소개</a><a href="/editorial-policy">편집 원칙</a><a href="/contact">문의</a><a href="/privacy">개인정보처리방침</a><a href="/terms">이용약관</a><a href="/disclaimer">면책 안내</a></nav><small>© 2026 대한축제뉴스</small></div></footer>`;
}

function articleBreadcrumb(currentLabel, currentHref) {
  return `<nav class="article-breadcrumb" aria-label="현재 위치"><a href="/">홈</a><span aria-hidden="true">-</span><a href="${escapeHtml(currentHref)}">${escapeHtml(currentLabel)}</a></nav>`;
}

function articleShareRow(canonical, title) {
  const encodedUrl = encodeURIComponent(canonical);
  const encodedTitle = encodeURIComponent(title);
  return `<div class="article-share-row" aria-label="기사 공유"><a class="share-button share-button--kakao" href="https://story.kakao.com/share?url=${encodedUrl}" target="_blank" rel="noopener noreferrer" aria-label="카카오스토리로 공유">K</a><a class="share-button share-button--naver" href="https://share.naver.com/web/shareView?url=${encodedUrl}&title=${encodedTitle}" target="_blank" rel="noopener noreferrer" aria-label="네이버로 공유">N</a><a class="share-button share-button--facebook" href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" rel="noopener noreferrer" aria-label="페이스북으로 공유">f</a><a class="share-button share-button--x" href="https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}" target="_blank" rel="noopener noreferrer" aria-label="X로 공유">X</a><a class="share-button share-button--link" href="${escapeHtml(canonical)}" aria-label="기사 원문 주소">URL</a></div>`;
}

function sidebarImageFor(item) {
  const galleryImage = Array.isArray(item?.galleryImages) ? item.galleryImages.map(officialImage).find(Boolean) : "";
  return officialImage(item?.image) || galleryImage || "";
}

function sidebarDateLabel(item) {
  return cleanText(item?.date || item?.place || item?.category || "일정 확인");
}

function latestContentSidebar(items = [], currentId = "") {
  const enriched = items
    .filter((item) => item?.id && item?.title && safeSlug(item.id) !== currentId)
    .map((item) => ({ item, image: sidebarImageFor(item) }));
  const ordered = [
    ...enriched.filter((entry) => entry.image),
    ...enriched.filter((entry) => !entry.image)
  ].slice(0, 9);
  if (!ordered.length) return "";
  const cards = ordered.map(({ item, image }) => {
    const slug = safeSlug(item.id);
    const title = cleanText(item.articleTitle || item.displayTitle || item.headline) || cleanText(item.title) || "축제 소식";
    return `<a class="article-sidebar-card" href="/seoul-events/${encodeURIComponent(slug)}/">${image ? `<span class="article-sidebar-thumb" style="--sidebar-image: url(&quot;${escapeHtml(image)}&quot;)"><img src="${escapeHtml(image)}" alt="${escapeHtml(title)} 썸네일" loading="lazy" decoding="async" /></span>` : `<span class="article-sidebar-thumb article-sidebar-thumb--empty"><strong>DF</strong></span>`}<span class="article-sidebar-copy"><em>${escapeHtml(item.category || "축제 소식")}</em><strong>${escapeHtml(title)}</strong><small>${escapeHtml(sidebarDateLabel(item))}</small></span></a>`;
  }).join("");
  return `<aside class="article-sidebar" aria-label="최신 콘텐츠"><h2>최신 콘텐츠</h2><div class="article-sidebar-list">${cards}</div></aside>`;
}

function categoryMatches(post, event) {
  const postText = `${post.category} ${post.title}`;
  const eventText = `${event.category} ${event.title}`;
  if (/전시|미술/.test(postText)) return /전시|미술/.test(eventText);
  if (/공연|야간|데이트/.test(postText)) return /공연|연극|콘서트|무용|국악|뮤지컬|오페라/.test(eventText);
  if (/가족|아이|체험|도서관/.test(postText)) return /교육|체험|어린이|가족/.test(eventText);
  if (/전통|궁궐|축제/.test(postText)) return /축제|전통|역사/.test(eventText);
  return true;
}

function relatedEvents(post, events) {
  return events
    .filter((event) => event?.id && event?.title && categoryMatches(post, event))
    .slice(0, 3);
}

function eventCards(events) {
  if (!events.length) return `<p class="notice">이번 달 공개 행사 중 이 주제와 바로 연결되는 항목은 아직 없습니다. 메인 목록에서 최신 일정을 확인해 주세요.</p>`;
  return `<div class="event-cards">${events.map((event) => {
    const image = officialImage(event.image);
    return `<article><a href="/seoul-events/${encodeURIComponent(safeSlug(event.id))}/">${image ? `<span class="event-image"><img src="${escapeHtml(image)}" alt="${escapeHtml(event.title)} 포스터" loading="lazy" /></span>` : `<span class="event-image event-image--empty">이미지 없음</span>`}<span class="event-card__body"><em>${escapeHtml(event.category || "축제 소식")}</em><strong>${escapeHtml(event.title)}</strong><small>${escapeHtml(event.date || event.place || "일정 확인")}</small></span></a></article>`;
  }).join("")}</div>`;
}

function editorialBody(post, events) {
  const [theme, plan, caution] = guideProfiles[post.id] || [post.category || "서울 여행", "한 장소를 중심으로 이동 거리가 짧은 일정을 만드세요.", "공식 안내의 일정과 운영 조건을 방문 직전에 다시 확인하세요."];
  return `
    <p class="lead">${escapeHtml(post.summary)} 이 글은 특정 행사를 대신 홍보하기보다, ${escapeHtml(theme)} 일정을 직접 고를 때 필요한 기준을 순서대로 설명합니다.</p>
    <section aria-labelledby="summary-title"><p class="eyebrow">QUICK GUIDE</p><h2 id="summary-title">먼저 확인할 핵심</h2><div class="summary-grid"><div><strong>일정</strong><span>행사 날짜와 실제 관람 가능한 회차를 확인합니다.</span></div><div><strong>이동</strong><span>가장 가까운 역의 출구와 도보 시간을 함께 봅니다.</span></div><div><strong>예약</strong><span>현장 입장인지 사전 예매인지 구분합니다.</span></div><div><strong>변경</strong><span>방문 당일 공식 공지에서 취소·변경 여부를 다시 봅니다.</span></div></div></section>
    <section aria-labelledby="plan-title"><p class="eyebrow">STEP BY STEP</p><h2 id="plan-title">서울 ${escapeHtml(theme)} 일정 짜는 순서</h2><ol class="timeline"><li><span>1</span><div><h3>가장 중요한 일정 하나를 정합니다</h3><p>${escapeHtml(plan)} 모든 후보를 한꺼번에 넣으면 이동과 대기 시간이 늘어나므로, 꼭 보고 싶은 한 곳을 일정의 기준점으로 삼는 것이 좋습니다.</p></div></li><li><span>2</span><div><h3>공식 운영 정보를 대조합니다</h3><p>날짜, 시작·종료 시각, 장소, 이용 대상, 입장료는 게시된 원문을 기준으로 확인합니다. 같은 행사도 날짜별 회차와 운영 방식이 달라질 수 있습니다.</p></div></li><li><span>3</span><div><h3>이동과 쉬는 시간을 계산합니다</h3><p>지도에 표시되는 이동 시간에 20~30분의 여유를 더하고, 식사나 휴식이 필요한 동행자가 있다면 중간에 앉을 수 있는 장소를 포함합니다.</p></div></li><li><span>4</span><div><h3>출발 직전에 변경 사항을 확인합니다</h3><p>${escapeHtml(caution)} 우천, 시설 사정, 매진 때문에 안내가 바뀔 수 있으므로 공식 홈페이지와 문의처를 마지막으로 확인하세요.</p></div></li></ol></section>
    <section aria-labelledby="choice-title"><p class="eyebrow">HOW TO CHOOSE</p><h2 id="choice-title">무엇을 기준으로 비교할까요?</h2><h3>시간보다 체류 가능 시간을 봅니다</h3><p>행사 시작 시각만 맞는다고 좋은 일정은 아닙니다. 입장 대기, 티켓 수령, 물품 보관, 관람 후 이동까지 포함해 실제로 머물 수 있는 시간을 계산해야 합니다. 짧은 일정이라면 여러 곳을 방문하기보다 한 공간을 충분히 보는 편이 만족도가 높습니다.</p><h3>가격표에 없는 비용도 더합니다</h3><p>무료 또는 저가 행사도 교통비, 주차비, 식사비, 보관함 이용료가 생길 수 있습니다. 차량을 이용한다면 행사장 주차장만 믿지 말고 인근 공영주차장과 대중교통을 함께 비교하세요. 유료 행사는 취소 가능 시점과 환불 수수료도 확인 대상입니다.</p><h3>동행자에게 맞는 조건을 먼저 봅니다</h3><p>어린이와 함께라면 관람 연령과 보호자 동반 기준, 부모님과 함께라면 엘리베이터와 좌석, 혼자라면 귀가 동선과 보관 공간이 중요합니다. 행사 자체의 인기도보다 함께 가는 사람의 이동 속도와 관심사를 우선하면 일정이 자연스러워집니다.</p></section>
    <section aria-labelledby="current-title"><p class="eyebrow">CURRENT EVENTS</p><h2 id="current-title">이번 달 함께 살펴볼 서울 행사</h2><p>아래 항목은 서울 열린데이터광장에 공개된 이번 달 자료를 기준으로 연결했습니다. 사진은 각 행사 원문에 등록된 이미지만 사용하며, 세부 운영 정보는 해당 행사 페이지의 공식 안내 링크에서 다시 확인할 수 있습니다.</p>${eventCards(events)}</section>
    <section aria-labelledby="check-title"><p class="eyebrow">CHECKLIST</p><h2 id="check-title">출발 전 마지막 체크</h2><ul class="check-list"><li>행사명과 날짜가 내가 선택한 회차와 일치하는지 확인</li><li>공식 주소를 지도에 다시 입력하고 출입구 위치 확인</li><li>사전 예약, 현장 발권, 신분증 또는 증빙서류 필요 여부 확인</li><li>입장 마감과 러닝타임, 중간 입장 가능 여부 확인</li><li>우천·폭염·시설 사정에 따른 변경 공지 확인</li><li>유료 행사는 최종 가격과 취소·환불 조건 확인</li></ul><p class="closing">서울 여행 정보는 자주 바뀝니다. 이 글은 일정을 선택하는 기준을 제공하며, 실제 방문 여부는 공식 운영기관의 최신 공지를 확인한 뒤 결정하는 것이 가장 안전합니다.</p></section>`;
}

function editorialPage(post, allEvents, sidebarItems = []) {
  const canonical = `${siteOrigin}/articles/${safeSlug(post.id)}/`;
  const related = relatedEvents(post, allEvents);
  const breadcrumb = articleBreadcrumb(post.category || "여행 가이드", "/#editorialPicks");
  const shareRow = articleShareRow(canonical, post.title);
  const sidebar = latestContentSidebar(sidebarItems);
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.summary,
    datePublished: String(post.date || "").replaceAll(".", "-"),
    dateModified: kstDate(),
    author: { "@type": "Organization", name: "대한축제뉴스", url: `${siteOrigin}/about` },
    publisher: { "@type": "Organization", name: "대한축제뉴스", url: siteOrigin },
    mainEntityOfPage: canonical
  }).replace(/</g, "\\u003c");
  return `<!doctype html><html lang="ko"><head>${sharedHead({ title: `${post.title} | 대한축제뉴스`, description: post.summary, canonical })}<script type="application/ld+json">${jsonLd}</script></head><body>${siteHeader()}<main class="article-main article-main--with-sidebar"><div class="article-layout"><article class="editorial-article article-content">${breadcrumb}<header class="article-header"><p class="eyebrow">${escapeHtml(post.category || "서울 여행 가이드")}</p><h1>${escapeHtml(post.title)}</h1><p>${escapeHtml(post.summary)}</p><div class="byline"><span>대한축제뉴스 편집부</span><time datetime="${escapeHtml(String(post.date || "").replaceAll(".", "-"))}">${escapeHtml(post.date)}</time><span>${escapeHtml(post.readTime || "읽기")}</span></div>${shareRow}</header>${editorialBody(post, related)}<aside class="source-note"><strong>자료와 편집 기준</strong><p>서울시 공개 문화행사 자료는 일정 후보를 찾는 데 사용하고, 본문은 방문자가 실제로 확인해야 할 기준을 대한축제뉴스 편집부가 재구성했습니다. 행사 내용이 변경될 수 있어 방문 전 공식 안내 확인을 권합니다.</p><a href="/editorial-policy">편집 원칙 보기</a></aside></article>${sidebar}</div></main>${siteFooter()}</body></html>`;
}

function infoRow(label, value, note = "") {
  if (!cleanText(value)) return "";
  return `<tr><th scope="row">${escapeHtml(label)}</th><td><strong>${escapeHtml(cleanText(value))}</strong>${note ? `<small>${escapeHtml(note)}</small>` : ""}</td></tr>`;
}

function compactDateToUtc(value) {
  const text = String(value || "").replace(/\D/g, "");
  if (text.length !== 8) return null;
  const year = Number(text.slice(0, 4));
  const month = Number(text.slice(4, 6));
  const day = Number(text.slice(6, 8));
  if (!year || !month || !day) return null;
  return Date.UTC(year, month - 1, day);
}

function compactDateDiffDays(fromValue, toValue) {
  const from = compactDateToUtc(fromValue);
  const to = compactDateToUtc(toValue);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null;
  return Math.round((to - from) / 86400000);
}

function currentKstCompactDate() {
  return kstDate().replace(/\D/g, "");
}

function eventDateRange(event = {}) {
  const tokens = String(event.date || "").match(/\d{4}[-.]\d{1,2}[-.]\d{1,2}|\d{8}/g) || [];
  const values = tokens
    .map((token) => Number(String(token).replace(/\D/g, "")))
    .filter((value) => Number.isFinite(value) && value > 0);
  const start = values[0] || 0;
  return { start, end: values[values.length - 1] || start };
}

function isWeekendCompact(value) {
  const date = compactDateToUtc(value);
  if (!Number.isFinite(date)) return false;
  const day = new Date(date).getUTCDay();
  return day === 0 || day === 5 || day === 6;
}

function eventStatusInfo(event = {}) {
  const today = Number(currentKstCompactDate());
  const { start, end } = eventDateRange(event);
  if (!start) return null;
  if (start <= today && end >= today) {
    const daysLeft = compactDateDiffDays(today, end);
    return Number.isFinite(daysLeft) && daysLeft <= 3
      ? { key: "ending", label: "종료 임박" }
      : { key: "live", label: "진행 중" };
  }
  if (start > today) {
    const daysUntil = compactDateDiffDays(today, start);
    if (Number.isFinite(daysUntil) && daysUntil <= 3 && isWeekendCompact(start)) {
      return { key: "weekend", label: "이번 주말" };
    }
    if (Number.isFinite(daysUntil) && daysUntil <= 14) return { key: "soon", label: "곧 시작" };
    return { key: "scheduled", label: "예정" };
  }
  return { key: "past", label: "지난 행사" };
}

function eventStatusMarkup(event = {}) {
  const status = eventStatusInfo(event);
  if (!status) return "";
  return `<span class="event-status event-status--${escapeHtml(status.key)}">${escapeHtml(status.label)}</span>`;
}

function highlightCard(label, value) {
  if (!cleanText(value)) return "";
  return `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(cleanText(value))}</strong></div>`;
}

function eventVisitHighlights(event, place) {
  const status = eventStatusInfo(event);
  const cards = [
    status ? highlightCard("상태", status.label) : "",
    highlightCard("기간", event.date),
    highlightCard("장소", place),
    highlightCard("시간", event.time),
    highlightCard("요금", event.fee || (event.isFree ? "무료" : "")),
    highlightCard("문의", event.tel)
  ].filter(Boolean);
  if (!cards.length) return "";
  return `<section class="event-visit-highlights" aria-label="핵심 방문정보">${cards.join("")}</section>`;
}

function programInfoMarkup(event) {
  const rows = [
    cleanText(event.time) ? `<li><strong>운영 시간</strong><span>${escapeHtml(cleanText(event.time))}</span></li>` : "",
    cleanText(event.program) ? `<li><strong>행사 프로그램</strong><span>${escapeHtml(cleanText(event.program))}</span></li>` : "",
    cleanText(event.subevent) ? `<li><strong>부대 행사</strong><span>${escapeHtml(cleanText(event.subevent))}</span></li>` : "",
    cleanText(event.spendTime) ? `<li><strong>관람 소요시간</strong><span>${escapeHtml(cleanText(event.spendTime))}</span></li>` : "",
    cleanText(event.target) ? `<li><strong>이용 대상</strong><span>${escapeHtml(cleanText(event.target))}</span></li>` : "",
    cleanText(event.fee) ? `<li><strong>이용 요금</strong><span>${escapeHtml(cleanText(event.fee))}</span></li>` : "",
    cleanText(event.booking) ? `<li><strong>예매처</strong><span>${escapeHtml(cleanText(event.booking))}</span></li>` : "",
    cleanText(event.org) ? `<li><strong>주최·기관</strong><span>${escapeHtml(cleanText(event.org))}</span></li>` : "",
    cleanText(event.discountInfo) ? `<li><strong>할인 정보</strong><span>${escapeHtml(cleanText(event.discountInfo))}</span></li>` : ""
  ].filter(Boolean);
  if (!rows.length) {
    return `<p>공식 공개 데이터에 세부 프로그램 항목은 아직 등록되어 있지 않습니다. 회차, 체험 프로그램, 입장 마감은 행사 주최 측 공지에서 확인하세요.</p>`;
  }
  return `<ul class="visit-fact-list">${rows.join("")}</ul>`;
}

function eventOfficialDetailList(event) {
  const details = Array.isArray(event.detailInfo) ? event.detailInfo : [];
  const repeated = new Set(["행사소개", "행사 장소", "행사 시간", "이용 요금", "주최 기관", "주관 기관", "문의 전화", "행사 프로그램", "부대 행사", "관람 소요시간", "참가 연령", "예매처"]);
  const rows = details
    .filter((item) => cleanText(item?.label) && cleanText(item?.value))
    .filter((item) => !repeated.has(cleanText(item.label)))
    .slice(0, 10)
    .map((item) => `<li><strong>${escapeHtml(cleanText(item.label))}</strong><span>${escapeHtml(cleanText(item.value))}</span></li>`);
  return rows.length ? `<ul class="visit-fact-list visit-fact-list--official">${rows.join("")}</ul>` : "";
}

function eventOverviewParagraphs(value) {
  const overview = cleanText(value);
  if (!overview) return [];
  const hardBreaks = overview
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (hardBreaks.length > 1) return hardBreaks.slice(0, 5);

  const sentences = [];
  const sentencePattern = /.+?(?:(?<!\d)[.!?。](?=\s+[가-힣A-Z0-9"'“‘])|(?<!\d)[.!?。](?=\s*$)|$)/g;
  for (const match of overview.matchAll(sentencePattern)) {
    const text = match[0].trim();
    if (text) sentences.push(text);
  }
  if (sentences.length <= 2) return [overview];

  const paragraphs = [];
  let buffer = "";
  sentences.forEach((sentence) => {
    const next = buffer ? `${buffer} ${sentence}` : sentence;
    if (next.length > 180 && buffer) {
      paragraphs.push(buffer);
      buffer = sentence;
    } else {
      buffer = next;
    }
  });
  if (buffer) paragraphs.push(buffer);
  return paragraphs.slice(0, 5);
}

function eventOverviewSentences(value) {
  const overview = cleanText(value);
  if (!overview) return [];
  const sentences = [];
  const sentencePattern = /.+?(?:(?<!\d)[.!?。](?=\s+[가-힣A-Z0-9"'“‘])|(?<!\d)[.!?。](?=\s*$)|$)/g;
  for (const match of overview.matchAll(sentencePattern)) {
    const text = match[0].trim();
    if (text) sentences.push(text);
  }
  return sentences;
}

function eventOverviewMarkup(event, title) {
  const chunks = eventOverviewParagraphs(event.overview || event.summary);
  if (!chunks.length) {
    return `<p>${escapeHtml(title)}의 공식 소개문은 공개 데이터에 별도로 제공되지 않았습니다. 이 페이지에서는 현재 확인 가능한 일정, 장소, 문의처와 방문 전 체크 항목을 중심으로 정리했습니다.</p>`;
  }
  return chunks.map((item) => `<p>${escapeHtml(item)}</p>`).join("");
}

function eventPlanningSection(event, place, official, mapUrl) {
  const status = eventStatusInfo(event);
  const periodText = cleanText(event.date) || "공식 일정 확인";
  const timeText = cleanText(event.time) || "날짜별 운영 시간이 다를 수 있어 공식 공지를 확인해야 합니다.";
  const feeText = cleanText(event.fee) || "요금 정보가 공개되지 않았거나 현장 프로그램별로 다를 수 있습니다.";
  const placeText = place || "공식 안내의 행사장 주소";
  const officialText = official ? "공식 홈페이지 연결 가능" : "공식 홈페이지가 공개 데이터에 별도로 등록되지 않음";

  return `<section aria-labelledby="planning-title"><p class="eyebrow">VISIT PLAN</p><h2 id="planning-title">방문 전에 이렇게 확인하세요</h2><div class="event-insight-grid"><article><strong>일정</strong><p>${escapeHtml(periodText)}</p><small>${status ? `${escapeHtml(status.label)} 상태로 분류됩니다.` : "날짜 기준 상태는 공식 일정을 기준으로 다시 확인하세요."}</small></article><article><strong>운영</strong><p>${escapeHtml(timeText)}</p><small>공연, 체험, 먹거리 부스는 전체 운영시간과 다르게 마감될 수 있습니다.</small></article><article><strong>요금</strong><p>${escapeHtml(feeText)}</p><small>무료 행사도 체험·먹거리·주차 비용은 별도일 수 있습니다.</small></article><article><strong>장소</strong><p>${escapeHtml(placeText)}</p><small>${mapUrl ? "지도에서 출입구와 주변 이동 시간을 확인하세요." : "정확한 출입구는 방문 전 공식 안내를 확인하세요."}</small></article></div><p class="event-body-note">${escapeHtml(officialText)}. 날짜, 시간, 요금, 장소는 현장 사정이나 날씨에 따라 바뀔 수 있으므로 출발 전 최신 공지를 한 번 더 확인하는 것이 좋습니다.</p></section>`;
}

function visitFlowMarkup(official, mapUrl) {
  const officialText = official ? "공식 안내에서 운영 변경과 회차를 확인합니다." : "공식 안내가 별도로 공개되면 운영 변경과 회차를 먼저 확인합니다.";
  const mapText = mapUrl ? "지도에서 행사장 위치와 가장 가까운 출입구를 확인합니다." : "주소가 공개되면 지도에서 행사장 위치와 가장 가까운 출입구를 확인합니다.";
  return `<ol class="visit-flow"><li><span>1</span><p>${escapeHtml(officialText)}</p></li><li><span>2</span><p>${escapeHtml(mapText)}</p></li><li><span>3</span><p>요금, 증빙서류, 현장 발권 여부를 출발 전에 다시 확인합니다.</p></li></ol>`;
}

function eventChecklistMarkup(event, official, mapUrl) {
  const checklist = [
    cleanText(event.date) ? `방문하려는 날짜가 ${cleanText(event.date)} 기간 안에 있는지 확인` : "방문 날짜와 실제 운영일 확인",
    cleanText(event.time) ? `운영 시간 ${cleanText(event.time)}와 마지막 입장·마감 시간을 구분해서 확인` : "운영 시간과 마지막 입장 시간 확인",
    cleanText(event.fee) ? `이용 요금 ${cleanText(event.fee)}와 별도 체험비·주차비 확인` : "입장료, 체험비, 주차비 등 별도 비용 확인",
    mapUrl ? "지도에서 행사장 출입구, 주차 위치, 도보 이동 시간을 미리 확인" : "행사장 주소와 출입구 위치 확인",
    cleanText(event.tel) ? `문의처 ${cleanText(event.tel)} 또는 공식 안내에서 변경 공지 확인` : "문의처 또는 공식 안내에서 변경 공지 확인",
    official ? "공식 안내 페이지에서 우천·취소·매진 여부 확인" : "우천·취소·매진 여부는 주최 측 공지에서 확인"
  ];
  return `<section aria-labelledby="checklist-title"><p class="eyebrow">CHECKLIST</p><h2 id="checklist-title">출발 전 체크리스트</h2><ul class="event-checklist">${checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>`;
}

function eventNearbyMarkup(event, place, mapUrl) {
  const queryBase = place || cleanText(event.address);
  const mapLinks = queryBase ? [
    ["주변 관광지", `${queryBase} 주변 가볼만한곳`],
    ["주변 맛집", `${queryBase} 맛집`],
    ["주변 주차", `${queryBase} 주차장`]
  ].map(([label, query]) => `<a href="https://map.naver.com/p/search/${encodeURIComponent(query)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)} 찾기</a>`).join("") : "";

  return `<section aria-labelledby="nearby-title"><p class="eyebrow">NEARBY</p><h2 id="nearby-title">주변 동선 잡기</h2><p>${queryBase ? `${escapeHtml(queryBase)} 주변은 행사 당일 교통량과 보행 동선이 달라질 수 있습니다.` : "행사장 주변 동선은 방문 전 지도와 공식 안내를 함께 확인하세요."} 대한축제뉴스는 확인되지 않은 명소를 임의로 추천하지 않고, 실제 지도 검색으로 이동 시간을 확인할 수 있게 정리합니다.</p>${mapLinks ? `<div class="event-place-actions">${mapLinks}</div>` : ""}${mapUrl ? `<p class="event-body-note">행사장 검색 결과는 지도 서비스의 최신 정보에 따라 달라질 수 있습니다.</p>` : ""}</section>`;
}

function eventMonth(event = {}) {
  const text = [event.date, event.startDate, event.eventStartDate].filter(Boolean).join(" ");
  const match = text.match(/\d{4}[-.]?(\d{2})[-.]?\d{0,2}/);
  if (match) return Number(match[1]);
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Seoul", month: "numeric" }).format(new Date()));
}

function eventCoupangKeyword(event = {}) {
  const text = [
    event.title,
    event.category,
    event.subCategory,
    event.summary,
    event.place,
    event.address
  ].filter(Boolean).join(" ");

  if (/비|우천|장마/.test(text)) return "우천 여행 준비물";
  if (/어린이|키즈|가족|유아/.test(text)) return "아이와 여행 준비물";
  if (/야간|밤|나이트|불꽃|빛축제|라이트/.test(text)) return "야간 축제 준비물";
  if (/바다|해변|해수욕|물놀이|여름/.test(text)) return "여름 여행 준비물";
  if (/먹거리|푸드|맛|야시장|맥주|와인|커피|김장/.test(text)) return "먹거리 여행 준비물";
  if (/꽃|자연|공원|산책|정원|수목원|숲|등산|트레킹|한강|야외/.test(text)) return "야외 축제 준비물";

  const month = eventMonth(event);
  if (month >= 3 && month <= 5) return "봄 여행 준비물";
  if (month >= 6 && month <= 8) return "여름 여행 준비물";
  if (month >= 9 && month <= 11) return "가을 여행 준비물";
  return "겨울 여행 준비물";
}

function coupangTravelProductsAd(slot = "event", keyword = "여행 준비물") {
  const safeSlot = safeSlug(slot) || "event";
  const safeKeyword = cleanText(keyword) || "여행 준비물";
  const titleId = `coupangProducts-${safeSlot}`;
  return `<aside class="coupang-widget-ad coupang-products-section" data-coupang-products data-coupang-keyword="${escapeHtml(safeKeyword)}" aria-labelledby="${escapeHtml(titleId)}"><div class="coupang-products-head"><p class="coupang-widget-label">Travel Essentials</p><h2 id="${escapeHtml(titleId)}">방문 전 챙기면 좋은 여행 준비물</h2><p>${escapeHtml(safeKeyword)} 중심으로 쿠팡 파트너스 상품을 불러옵니다. 실제 일정과 동행자에게 필요한지 확인한 뒤 준비하세요.</p></div><div class="coupang-products-grid" data-coupang-products-grid><article class="coupang-product-card coupang-product-card--loading">${escapeHtml(safeKeyword)} 상품을 불러오는 중입니다.</article></div><a class="coupang-products-more" data-coupang-products-more href="https://www.coupang.com/np/search?q=${encodeURIComponent(safeKeyword)}" target="_blank" rel="sponsored noopener noreferrer">여행 준비물 더보기</a><p class="coupang-widget-disclosure">이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</p></aside>`;
}

function coupangTravelProductsScript() {
  return `<script>(() => { const sections = [...document.querySelectorAll("[data-coupang-products]:not([data-coupang-loaded])")]; if (!sections.length) return; const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char])); const firstArrayFrom = (value) => { if (Array.isArray(value)) return value; if (!value || typeof value !== "object") return []; for (const item of Object.values(value)) { const nested = firstArrayFrom(item); if (nested.length) return nested; } return []; }; const safeUrl = (value) => { try { const url = new URL(String(value || ""), location.origin); return /^https?:$/.test(url.protocol) ? url.href : ""; } catch { return ""; } }; const formatWon = (value) => { const number = Number(value); return Number.isFinite(number) && number > 0 ? new Intl.NumberFormat("ko-KR").format(number) + "원" : "가격 확인"; }; const normalize = (payload) => { const data = payload?.data || payload || {}; const productData = Array.isArray(data.productData) ? data.productData : []; const items = productData.length ? productData : firstArrayFrom(data); return items.map((item = {}) => { const title = item.productName || item.title || item.name || ""; return { title, url: safeUrl(item.productUrl || item.url || item.link || ""), image: safeUrl(item.productImage || item.imageUrl || item.thumbnailUrl || item.image || ""), price: item.productPrice || item.price || item.salePrice || 0, category: item.categoryName || item.category || "여행 준비물", isRocket: Boolean(item.isRocket), isFreeShipping: Boolean(item.isFreeShipping) }; }).filter((item) => item.title && item.url).slice(0, 4); }; const empty = (section, message) => { const grid = section.querySelector("[data-coupang-products-grid]"); section.classList.add("is-fallback"); if (grid) grid.innerHTML = '<article class="coupang-product-card coupang-product-card--loading">' + escapeHtml(message) + "</article>"; }; const render = (section, items, payload) => { const grid = section.querySelector("[data-coupang-products-grid]"); const more = section.querySelector("[data-coupang-products-more]"); if (!grid) return; if (!items.length) { empty(section, "표시할 여행 준비물 상품을 찾지 못했습니다. 아래 링크에서 관련 준비물을 확인해 주세요."); return; } section.classList.remove("is-fallback"); const landingUrl = safeUrl(payload?.data?.landingUrl || payload?.landingUrl || ""); if (more && landingUrl) more.href = landingUrl; grid.innerHTML = items.map((item) => { const badges = [item.isRocket ? "로켓" : "", item.isFreeShipping ? "무료배송" : ""].filter(Boolean).join(" · "); const meta = formatWon(item.price) + (badges ? " · " + badges : ""); const image = item.image ? "<" + 'img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.title) + '" loading="lazy" />' : '<div class="coupang-product-placeholder" aria-hidden="true">CP</div>'; return '<article class="coupang-product-card"><a href="' + escapeHtml(item.url) + '" target="_blank" rel="sponsored noopener noreferrer" aria-label="' + escapeHtml(item.title + " 상품 보기") + '">' + image + '<span>' + escapeHtml(item.category) + '</span><strong>' + escapeHtml(item.title) + '</strong><small>' + escapeHtml(meta) + '</small></a></article>'; }).join(""); }; sections.forEach(async (section) => { section.dataset.coupangLoaded = "true"; const keyword = String(section.dataset.coupangKeyword || "여행 준비물").trim() || "여행 준비물"; try { const query = new URLSearchParams({ keyword, limit: "4" }); const response = await fetch("/api/coupang?" + query.toString(), { headers: { Accept: "application/json" } }); let payload = {}; try { payload = await response.json(); } catch {} if (!response.ok || payload?.ok === false) throw new Error(payload?.message || "Coupang request failed."); render(section, normalize(payload), payload); } catch (error) { console.warn("Coupang travel products could not be loaded.", error); empty(section, "여행 관련 상품을 불러오지 못했습니다. 아래 링크에서 준비물을 확인해 주세요."); } }); })();</script>`;
}

function eventInlinePhoto(title, image, index) {
  if (!image) return "";
  return `<figure class="event-inline-photo"><img src="${escapeHtml(image)}" alt="${escapeHtml(title)} 현장 이미지 ${index}" loading="lazy" /><figcaption>공개 행사 정보에 등록된 행사 이미지입니다.</figcaption></figure>`;
}

function eventFeatureTerms(event) {
  const text = [
    event.title,
    event.summary,
    event.overview,
    event.program,
    event.subevent,
    ...(Array.isArray(event.detailInfo) ? event.detailInfo.map((item) => item?.value) : [])
  ].map(cleanText).filter(Boolean).join(" ");
  const patterns = [
    ["눈썰매", /눈썰매/],
    ["얼음썰매", /얼음썰매/],
    ["얼음낚시", /얼음낚시|빙어|송어/],
    ["먹거리", /먹거리|푸드|야시장|맥주|와인|커피|김장|분식|바비큐/],
    ["포토존", /포토존|사진|야경/],
    ["공연", /공연|콘서트|무대|음악|국악|댄스/],
    ["체험", /체험|놀이|만들기|워크숍/],
    ["전시", /전시|미디어아트|아트|박람회/],
    ["꽃", /꽃|벚꽃|유채|메밀꽃|장미|국화/],
    ["숲", /숲|정원|수목원|공원|자연/],
    ["불꽃", /불꽃|불빛|빛축제|라이트/],
    ["바다", /바다|해변|해수욕|물놀이/],
    ["전통", /전통|궁궐|문화재|민속/]
  ];
  const terms = [];
  for (const [label, pattern] of patterns) {
    if (pattern.test(text) && !terms.includes(label)) terms.push(label);
  }
  return terms.slice(0, 3);
}

function eventKindLabel(event) {
  const text = [event.title, event.category, event.summary, event.overview].map(cleanText).join(" ");
  if (/눈썰매|얼음|겨울|동장군|빙어|송어/.test(text)) return "겨울 축제";
  if (/먹거리|푸드|야시장|맥주|와인|커피|김장/.test(text)) return "먹거리 축제";
  if (/꽃|숲|정원|수목원|자연/.test(text)) return "자연 축제";
  if (/공연|콘서트|무대|음악|국악|댄스/.test(text)) return "공연 축제";
  if (/전시|미디어아트|아트|박람회/.test(text)) return "전시 행사";
  if (/불꽃|불빛|빛축제|라이트|야간/.test(text)) return "야간 축제";
  return "축제";
}

function eventShortPlace(place) {
  const value = cleanText(place)
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+[가-힣A-Za-z0-9·.-]+(?:로|길)\s*\d.*$/g, "")
    .replace(/서울특별시/g, "서울")
    .replace(/부산광역시/g, "부산")
    .replace(/대구광역시/g, "대구")
    .replace(/인천광역시/g, "인천")
    .replace(/광주광역시/g, "광주")
    .replace(/대전광역시/g, "대전")
    .replace(/울산광역시/g, "울산")
    .replace(/세종특별자치시/g, "세종")
    .replace(/경기도/g, "경기")
    .replace(/강원특별자치도/g, "강원")
    .replace(/충청북도/g, "충북")
    .replace(/충청남도/g, "충남")
    .replace(/전북특별자치도/g, "전북")
    .replace(/전라남도/g, "전남")
    .replace(/경상북도/g, "경북")
    .replace(/경상남도/g, "경남")
    .replace(/제주특별자치도/g, "제주")
    .replace(/\s*(일원|내|앞)$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!value) return "";
  const words = value.split(" ").filter(Boolean);
  if (words.length > 2 && /국민관광지|관광지|일원|축제장/.test(value)) return words.slice(0, 2).join(" ");
  if (words.length > 3) return words.slice(0, 3).join(" ");
  return value;
}

function eventDurationLabel(event) {
  const { start, end } = eventDateRange(event);
  if (!start || !end || start === end) return "";
  const diff = compactDateDiffDays(start, end);
  if (!Number.isFinite(diff)) return "";
  const days = diff + 1;
  if (days < 2 || days > 180) return "";
  return `${days}일간`;
}

function compactHeadlineHook(value, maxLength = 42) {
  const text = cleanText(value).replace(/[“”"'‘’]/g, "").replace(/[.!?。]+$/g, "");
  if (!text) return "";
  if (text.length <= maxLength) return text;
  const slice = text.slice(0, maxLength + 1);
  const cut = Math.max(slice.lastIndexOf(" "), slice.lastIndexOf(","), slice.lastIndexOf("·"));
  const end = cut >= 24 ? cut : maxLength;
  return text.slice(0, end).replace(/[,.，。]\s*$/g, "");
}

function eventArticleHeadline(event, title, place) {
  const features = eventFeatureTerms(event);
  const kind = eventKindLabel(event);
  const shortPlace = eventShortPlace(place || event.place || event.address);
  const duration = eventDurationLabel(event);
  let hook = "";
  if (features.length >= 2 && shortPlace) {
    hook = `${features.join("·")}까지, ${shortPlace}에서 즐기는 ${kind}`;
  } else if (duration && shortPlace) {
    hook = `${duration} ${shortPlace}에서 이어지는 ${kind}`;
  } else if (features.length) {
    hook = `${features.join("·")} 중심으로 둘러보는 ${kind}`;
  } else {
    hook = compactHeadlineHook(eventOverviewSentences(event.overview || event.summary)[0] || `${title}의 공식 일정과 방문 정보를 정리했습니다`);
  }
  return `“${compactHeadlineHook(hook, 46)}”… ${title}`;
}

function eventArticleLead(event, title, place) {
  const features = eventFeatureTerms(event);
  const date = cleanText(event.date);
  const time = cleanText(event.time);
  const fee = cleanText(event.fee);
  const checks = [time ? "운영시간" : "", fee ? "요금" : "", cleanText(event.tel) ? "문의처" : ""].filter(Boolean);
  const first = date && place
    ? `${date} ${place}에서 열리는 ${title}입니다.`
    : `${title}의 공식 일정과 방문 전 확인할 정보를 정리했습니다.`;
  const second = features.length
    ? `공식 소개에는 ${features.join("·")} 같은 현장 포인트가 등록되어 있습니다.`
    : "공개 데이터에 등록된 소개와 장소 정보를 기준으로 확인했습니다.";
  const third = checks.length
    ? `아래 핵심정보에서 ${checks.join("·")} 항목을 바로 확인할 수 있습니다.`
    : "비어 있는 정보는 임의로 채우지 않고 공식 확인이 필요한 항목으로 구분했습니다.";
  return `${first} ${second} ${third}`;
}

function eventOpeningBody(event, title, place) {
  const features = eventFeatureTerms(event);
  const date = cleanText(event.date);
  const intro = eventOverviewSentences(event.overview || event.summary).slice(0, 2);
  const paragraphs = [];
  if (intro.length) paragraphs.push(intro.join(" "));
  const featureText = features.length
    ? `${features.join("·")}처럼 공식 소개에 나온 즐길 거리를 먼저 보고,`
    : "공식 소개에 나온 현장 정보를 먼저 보고,";
  const visitText = [date ? `일정 ${date}` : "", place ? `장소 ${place}` : "", cleanText(event.fee) ? `요금 ${cleanText(event.fee)}` : ""].filter(Boolean).join(", ");
  paragraphs.push(`${title} 방문을 준비한다면 ${featureText} 실제 출발 전에는 ${visitText || "일정과 장소"}를 다시 확인하는 편이 좋습니다.`);
  return paragraphs.map((item) => `<p class="event-opening-summary">${escapeHtml(item)}</p>`).join("");
}

function eventOpeningTitle(event, title, place) {
  const features = eventFeatureTerms(event);
  const shortPlace = eventShortPlace(place || event.place || event.address);
  if (features.length >= 2) return `${features[0]}부터 ${features[1]}까지, ${title}의 주요 장면`;
  if (shortPlace) return `${shortPlace}에서 먼저 보는 ${title}`;
  return `사진으로 먼저 보는 ${title}`;
}

function eventPage(event, sourceLabel, sidebarItems = []) {
  const id = safeSlug(event.id);
  const canonical = `${siteOrigin}/seoul-events/${id}/`;
  const title = cleanText(event.title) || "축제 소식";
  const primaryImage = officialImage(event.image);
  const rawGalleryImages = [...new Set((Array.isArray(event.galleryImages) ? event.galleryImages : []).map(officialImage).filter(Boolean))];
  const heroImage = primaryImage || rawGalleryImages[0] || "";
  const inlinePhotos = rawGalleryImages.filter((url) => url !== heroImage).slice(0, 3);
  const inlinePhotoBlocks = inlinePhotos.map((url, index) => eventInlinePhoto(title, url, index + 1));
  const official = safeExternalUrl(event.homepage);
  const place = cleanText(event.place || event.address);
  const mapUrl = place ? `https://map.naver.com/p/search/${encodeURIComponent(place)}` : "";
  const description = cleanText(event.summary) || `${place || "현지"}에서 열리는 ${title}의 일정과 방문 전 확인 사항입니다.`;
  const breadcrumb = articleBreadcrumb("축제·행사", "/#allArticles");
  const shareRow = articleShareRow(canonical, title);
  const sidebar = latestContentSidebar(sidebarItems, id);
  const status = eventStatusMarkup(event);
  const highlights = eventVisitHighlights(event, place);
  const imageList = [heroImage, ...rawGalleryImages.filter((url) => url !== heroImage)].filter(Boolean);
  const heroMarkup = heroImage
    ? `<figure class="official-poster official-poster--hero" style="--article-hero-image: url(&quot;${escapeHtml(heroImage)}&quot;)"><img src="${escapeHtml(heroImage)}" alt="${escapeHtml(title)} 대표 이미지" /><figcaption>${primaryImage ? "공개 행사 정보에 등록된 공식 이미지입니다." : "공개 행사 정보에 등록된 대표 이미지입니다."}</figcaption></figure>`
    : `<div class="poster-empty poster-empty--hero" role="img" aria-label="등록된 행사 이미지 없음"><strong>대한축제뉴스</strong><span>축제 이미지 준비 중</span></div>`;
  const articleHeadline = cleanText(event.articleTitle || event.displayTitle || event.headline) || eventArticleHeadline(event, title, place);
  const articleLead = eventArticleLead(event, title, place);
  const openingSection = `<section class="event-opening-section" aria-labelledby="opening-title"><p class="eyebrow">ON SITE</p><h2 id="opening-title">${escapeHtml(eventOpeningTitle(event, title, place))}</h2>${heroMarkup}<div class="event-opening-copy">${eventOpeningBody(event, title, place)}</div></section>`;
  const titleHeader = `<header class="article-header event-title-header"><div class="event-title-meta"><p class="eyebrow">${escapeHtml(event.category || "축제 소식")}</p>${status}</div><h1>${escapeHtml(articleHeadline)}</h1><p class="event-lead">${escapeHtml(articleLead)}</p><div class="byline"><span>대한축제뉴스 편집부</span><span>입력 ${escapeHtml(kstDate())}</span><span>자료 ${escapeHtml(sourceLabel || "공공 관광 데이터")}</span></div>${shareRow}</header>`;
  const coupangKeyword = eventCoupangKeyword(event);
  const basicInfoSection = `<section aria-labelledby="basic-title"><p class="eyebrow">BASIC INFO</p><h2 id="basic-title">핵심 방문정보</h2><div class="table-scroll"><table><tbody>${infoRow("일정", event.date, "날짜별 운영 시간은 공식 안내에서 확인하세요.")}${infoRow("장소", place)}${infoRow("주소", event.address && cleanText(event.address) !== place ? event.address : "")}${infoRow("운영 시간", event.time)}${infoRow("이용 요금", event.fee, "할인·무료 대상은 증빙 기준을 확인하세요.")}${infoRow("주차", event.parking || event.parkingInfo)}${infoRow("교통", event.transport || event.traffic || event.publicTransport)}${infoRow("이용 대상", event.target)}${infoRow("문의", event.tel)}${infoRow("주최·기관", event.org)}${infoRow("예매처", event.booking)}${infoRow("공식 홈페이지", official)}</tbody></table></div><div class="action-row">${official ? `<a class="primary-button" href="${escapeHtml(official)}" target="_blank" rel="noopener noreferrer">공식 안내 보기</a>` : ""}${mapUrl ? `<a class="secondary-button" href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener noreferrer">지도에서 장소 보기</a>` : ""}</div></section>`;
  const aboutSection = `<section aria-labelledby="about-title"><p class="eyebrow">INTRODUCTION</p><h2 id="about-title">축제 소개</h2>${eventOverviewMarkup(event, title)}${inlinePhotoBlocks[0] || ""}<p>위 내용은 공개 관광 데이터에 등록된 소개와 기본 정보를 바탕으로 정리했습니다. 운영기관의 실시간 공지를 대신하지 않으므로 방문 전 회차, 입장 마감, 취소 여부를 다시 확인하세요.</p></section>`;
  const programSection = `<section aria-labelledby="program-title"><p class="eyebrow">PROGRAM</p><h2 id="program-title">주요 프로그램과 이용 조건</h2>${programInfoMarkup(event)}${eventOfficialDetailList(event)}${inlinePhotoBlocks[1] || ""}<p>프로그램은 날짜와 시간대에 따라 운영 여부가 달라질 수 있습니다. 인기 체험, 공연, 먹거리 부스는 조기 마감될 수 있으니 가장 보고 싶은 항목부터 확인하는 편이 좋습니다.</p></section>`;
  const transportSection = `<section aria-labelledby="transport-title"><p class="eyebrow">TRANSPORT</p><h2 id="transport-title">주차·교통</h2><p>${place ? `${escapeHtml(place)} 기준으로 행사장 위치와 출입구를 먼저 확인하세요.` : "공식 안내에 표시된 정확한 장소와 출입구를 먼저 확인하세요."} 행사장 주차 정보가 제공되지 않았거나 불명확하면 대중교통을 우선 비교하고, 차량 이용 시에는 인근 공영주차장의 운영 시간과 요금을 별도로 확인하는 편이 안전합니다.</p>${inlinePhotoBlocks[2] || ""}${visitFlowMarkup(official, mapUrl)}</section>`;
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Event",
    name: title,
    description,
    image: imageList.length ? imageList : undefined,
    location: place ? { "@type": "Place", name: place, address: cleanText(event.address || place) } : undefined,
    organizer: event.org ? { "@type": "Organization", name: cleanText(event.org) } : undefined,
    url: official || canonical
  }).replace(/</g, "\\u003c");
  return `<!doctype html><html lang="ko"><head>${sharedHead({ title: `${title} 일정·장소·요금 | 대한축제뉴스`, description, canonical, robots: "noindex,follow,max-image-preview:large", ads: false, image: heroImage })}<script type="application/ld+json">${jsonLd}</script></head><body>${siteHeader()}<main class="article-main article-main--with-sidebar event-main"><div class="article-layout"><article class="event-article article-content">${breadcrumb}${titleHeader}${openingSection}${highlights}${basicInfoSection}${eventPlanningSection(event, place, official, mapUrl)}${aboutSection}${programSection}${transportSection}${eventChecklistMarkup(event, official, mapUrl)}${eventNearbyMarkup(event, place, mapUrl)}<aside class="source-note"><strong>정보 출처</strong><p>${escapeHtml(sourceLabel || "공공 관광 데이터")}에 공개된 항목을 정리했습니다. 대한축제뉴스는 비어 있는 운영 정보를 임의로 추정하지 않습니다.</p>${official ? `<a href="${escapeHtml(official)}" target="_blank" rel="noopener noreferrer">원문에서 최신 정보 확인</a>` : `<a href="/editorial-policy">편집 원칙 확인</a>`}</aside>${coupangTravelProductsAd(`event-${id}`, coupangKeyword)}</article>${sidebar}</div></main>${siteFooter()}${coupangTravelProductsScript()}</body></html>`;
}

export async function generateStaticArticles() {
  const [posts, eventPayload] = await Promise.all([loadEditorialPosts(), loadEvents()]);
  await Promise.all([rm(articleDir, { recursive: true, force: true }), rm(eventDir, { recursive: true, force: true })]);
  await Promise.all([mkdir(articleDir, { recursive: true }), mkdir(eventDir, { recursive: true })]);

  // The curated editorial posts are all Seoul neighborhood guides, so their
  // "related events" carousel should only ever surface Seoul events even
  // though eventPayload.items now covers festivals nationwide.
  const seoulEvents = eventPayload.items.filter((event) => event.areaCode === "1");
  const eventPageItems = uniqueEventItems([...eventPayload.items, ...eventPayload.legacyItems]);
  const sidebarEventItems = eventPageItems.filter((event) => event?.id && event?.title).slice(0, 24);

  for (const post of posts) {
    const target = path.join(articleDir, safeSlug(post.id));
    await mkdir(target, { recursive: true });
    await writeFile(path.join(target, "index.html"), editorialPage(post, seoulEvents, sidebarEventItems), "utf8");
  }

  for (const event of eventPageItems) {
    const slug = safeSlug(event.id);
    if (!slug) continue;
    const target = path.join(eventDir, slug);
    await mkdir(target, { recursive: true });
    await writeFile(path.join(target, "index.html"), eventPage(event, eventPayload.source, sidebarEventItems), "utf8");
  }

  await writeFile(path.join(rootDir, "sitemap.xml"), sitemapXml(posts), "utf8");
  await writeFile(path.join(rootDir, "feed.xml"), rssXml(posts), "utf8");

  console.log(`Generated ${posts.length} editorial articles, ${eventPageItems.length} event pages (${eventPayload.items.length} current, ${eventPayload.legacyItems.length} legacy), sitemap.xml, and feed.xml.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  generateStaticArticles().catch((error) => {
    console.error(error?.stack || String(error));
    process.exitCode = 1;
  });
}
