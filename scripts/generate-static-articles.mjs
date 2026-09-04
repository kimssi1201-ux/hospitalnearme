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
    <link rel="stylesheet" href="/article-static.css?v=20260904-magazine-detail-3" />
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
    return `<a class="article-sidebar-card" href="/seoul-events/${encodeURIComponent(slug)}/">${image ? `<span class="article-sidebar-thumb" style="--sidebar-image: url(&quot;${escapeHtml(image)}&quot;)"><img src="${escapeHtml(image)}" alt="${escapeHtml(item.title)} 썸네일" loading="lazy" decoding="async" /></span>` : `<span class="article-sidebar-thumb article-sidebar-thumb--empty"><strong>DF</strong></span>`}<span class="article-sidebar-copy"><em>${escapeHtml(item.category || "축제 소식")}</em><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(sidebarDateLabel(item))}</small></span></a>`;
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
  const cards = [
    highlightCard("기간", event.date),
    highlightCard("장소", place),
    highlightCard("요금", event.fee || (event.isFree ? "무료" : "")),
    highlightCard("문의", event.tel)
  ].filter(Boolean);
  if (!cards.length) return "";
  return `<section class="event-visit-highlights" aria-label="핵심 방문정보">${cards.join("")}</section>`;
}

function programInfoMarkup(event) {
  const rows = [
    cleanText(event.time) ? `<li><strong>운영 시간</strong><span>${escapeHtml(cleanText(event.time))}</span></li>` : "",
    cleanText(event.target) ? `<li><strong>이용 대상</strong><span>${escapeHtml(cleanText(event.target))}</span></li>` : "",
    cleanText(event.fee) ? `<li><strong>이용 요금</strong><span>${escapeHtml(cleanText(event.fee))}</span></li>` : "",
    cleanText(event.org) ? `<li><strong>주최·기관</strong><span>${escapeHtml(cleanText(event.org))}</span></li>` : ""
  ].filter(Boolean);
  if (!rows.length) {
    return `<p>공식 공개 데이터에 세부 프로그램 항목은 등록되어 있지 않습니다. 회차, 체험 프로그램, 입장 마감은 공식 안내에서 확인하세요.</p>`;
  }
  return `<ul class="visit-fact-list">${rows.join("")}</ul>`;
}

function visitFlowMarkup(official, mapUrl) {
  const officialText = official ? "공식 안내에서 운영 변경과 회차를 확인합니다." : "공식 안내가 별도로 공개되면 운영 변경과 회차를 먼저 확인합니다.";
  const mapText = mapUrl ? "지도에서 행사장 위치와 가장 가까운 출입구를 확인합니다." : "주소가 공개되면 지도에서 행사장 위치와 가장 가까운 출입구를 확인합니다.";
  return `<ol class="visit-flow"><li><span>1</span><p>${escapeHtml(officialText)}</p></li><li><span>2</span><p>${escapeHtml(mapText)}</p></li><li><span>3</span><p>요금, 증빙서류, 현장 발권 여부를 출발 전에 다시 확인합니다.</p></li></ol>`;
}

function coupangWidgetAd(slot = "event") {
  const safeSlot = safeSlug(slot) || "event";
  return `<aside class="coupang-widget-ad" aria-label="쿠팡 파트너스 광고"><div class="coupang-widget-label">Advertisement</div><div class="coupang-widget-frame" id="coupangWidget-${escapeHtml(safeSlot)}" data-coupang-widget></div><p class="coupang-widget-disclosure">이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</p></aside>`;
}

function coupangWidgetScript() {
  return `<script>(() => { const targets = [...document.querySelectorAll("[data-coupang-widget]:not([data-coupang-loaded])")]; if (!targets.length) return; const config = { id: 1003200, trackingCode: "AF1488183", subId: null, template: "carousel", height: "140" }; const render = () => { if (!window.PartnersCoupang?.G) return; targets.forEach((target) => { if (target.dataset.coupangLoaded) return; target.dataset.coupangLoaded = "true"; const width = Math.max(300, Math.min(680, Math.floor(target.clientWidth || target.parentElement?.clientWidth || window.innerWidth - 36))); new window.PartnersCoupang.G({ ...config, width: String(width), container: target }); }); }; if (window.PartnersCoupang?.G) { render(); return; } const script = document.createElement("script"); script.src = "https://ads-partners.coupang.com/g.js"; script.async = true; script.onload = render; script.onerror = () => { targets.forEach((target) => { target.dataset.coupangLoaded = "error"; }); }; document.head.appendChild(script); })();</script>`;
}

function eventInlinePhoto(title, image, index) {
  if (!image) return "";
  return `<figure class="event-inline-photo"><img src="${escapeHtml(image)}" alt="${escapeHtml(title)} 현장 이미지 ${index}" loading="lazy" /><figcaption>공개 행사 정보에 등록된 행사 이미지입니다.</figcaption></figure>`;
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
  const openingTitle = `${title}, 방문 전 먼저 볼 것`;
  const openingCopy = `${event.date ? `공개 일정은 ${cleanText(event.date)}입니다. ` : ""}${place ? `방문지는 ${place}입니다. ` : ""}아래에는 요금, 교통, 주차처럼 방문 전에 확인해야 할 항목을 공식 공개 데이터 중심으로 정리했습니다.`;
  const openingSection = `<section class="event-opening-section" aria-labelledby="opening-title"><p class="eyebrow">FESTIVAL STORY</p><h2 id="opening-title">${escapeHtml(openingTitle)}</h2>${heroMarkup}<p>${escapeHtml(openingCopy)}</p></section>`;
  const titleHeader = `<header class="article-header event-title-header"><div class="event-title-meta"><p class="eyebrow">${escapeHtml(event.category || "축제 소식")}</p>${status}</div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p><div class="byline"><span>대한축제뉴스 편집부</span><span>입력 ${escapeHtml(kstDate())}</span><span>자료 ${escapeHtml(sourceLabel || "공공 관광 데이터")}</span></div>${shareRow}</header>`;
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
  return `<!doctype html><html lang="ko"><head>${sharedHead({ title: `${title} 일정·장소·요금 | 대한축제뉴스`, description, canonical, robots: "noindex,follow,max-image-preview:large", ads: false, image: heroImage })}<script type="application/ld+json">${jsonLd}</script></head><body>${siteHeader()}<main class="article-main article-main--with-sidebar event-main"><div class="article-layout"><article class="event-article article-content">${breadcrumb}${titleHeader}${openingSection}${highlights}<section aria-labelledby="basic-title"><p class="eyebrow">BASIC INFO</p><h2 id="basic-title">핵심 방문정보</h2><div class="table-scroll"><table><tbody>${infoRow("일정", event.date, "날짜별 운영 시간은 공식 안내에서 확인하세요.")}${infoRow("장소", place)}${infoRow("주소", event.address && cleanText(event.address) !== place ? event.address : "")}${infoRow("운영 시간", event.time)}${infoRow("이용 요금", event.fee, "할인·무료 대상은 증빙 기준을 확인하세요.")}${infoRow("주차", event.parking || event.parkingInfo)}${infoRow("교통", event.transport || event.traffic || event.publicTransport)}${infoRow("이용 대상", event.target)}${infoRow("문의", event.tel)}${infoRow("주최·기관", event.org)}${infoRow("공식 홈페이지", official)}</tbody></table></div><div class="action-row">${official ? `<a class="primary-button" href="${escapeHtml(official)}" target="_blank" rel="noopener noreferrer">공식 안내 보기</a>` : ""}${mapUrl ? `<a class="secondary-button" href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener noreferrer">지도에서 장소 보기</a>` : ""}</div></section><section aria-labelledby="about-title"><p class="eyebrow">INTRODUCTION</p><h2 id="about-title">축제 소개</h2>${inlinePhotoBlocks[0] || ""}<p>공개 데이터는 행사 탐색을 돕는 자료이며 운영기관의 실시간 공지를 대신하지 않습니다. 회차별 입장 시간, 매진 여부, 현장 발권, 휴관 또는 취소 공지는 공식 안내에서 확인하세요.</p></section><section aria-labelledby="program-title"><p class="eyebrow">PROGRAM</p><h2 id="program-title">주요 프로그램 확인</h2>${programInfoMarkup(event)}${inlinePhotoBlocks[1] || ""}<p>체험 프로그램, 공연 회차, 입장 마감처럼 날짜별로 달라지는 항목은 방문 직전 공식 안내에서 다시 확인하세요.</p></section><section aria-labelledby="transport-title"><p class="eyebrow">TRANSPORT</p><h2 id="transport-title">주차·교통</h2><p>${place ? `${escapeHtml(place)}을(를) 기준으로 행사장 위치와 출입구를 먼저 확인하세요.` : "공식 안내에 표시된 정확한 장소와 출입구를 먼저 확인하세요."} 행사장 주차 정보가 제공되지 않았거나 불명확하면 대중교통을 우선 비교하고, 차량 이용 시에는 인근 공영주차장의 운영 시간과 요금을 별도로 확인하는 편이 안전합니다.</p>${inlinePhotoBlocks[2] || ""}${visitFlowMarkup(official, mapUrl)}</section><section aria-labelledby="nearby-title"><p class="eyebrow">NEARBY</p><h2 id="nearby-title">주변 같이 갈 곳</h2><p>이 행사 데이터에는 주변 관광지 목록이 별도로 포함되어 있지 않습니다. 대한축제뉴스는 확인되지 않은 주변 명소를 임의로 추천하지 않으며, 실제 방문 전에는 공식 안내와 지도에서 주변 이동 시간을 함께 확인하세요.</p></section><aside class="source-note"><strong>정보 출처</strong><p>${escapeHtml(sourceLabel || "공공 관광 데이터")}에 공개된 항목을 정리했습니다. 대한축제뉴스는 비어 있는 운영 정보를 임의로 추정하지 않습니다.</p>${official ? `<a href="${escapeHtml(official)}" target="_blank" rel="noopener noreferrer">원문에서 최신 정보 확인</a>` : `<a href="/editorial-policy">편집 원칙 확인</a>`}</aside>${coupangWidgetAd(`event-${id}`)}</article>${sidebar}</div></main>${siteFooter()}${coupangWidgetScript()}</body></html>`;
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
