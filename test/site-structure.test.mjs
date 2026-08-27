import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publisherId = "ca-pub-5751319666030430";

test("every HTML page has the shared head requirements", async () => {
  const files = (await readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
    .map((entry) => entry.name);

  assert.equal(files.length, 12);

  for (const file of files) {
    const source = await readFile(path.join(root, file), "utf8");
    const head = source.match(/<head\b[\s\S]*?<\/head>/i)?.[0] || "";
    assert.match(head, /<meta\s+name=["']viewport["']/i, file);
    if (file === "festival-detail.html") {
      assert.match(head, /name=["']robots["'][^>]+noindex/i, file);
      assert.doesNotMatch(head, /adsbygoogle\.js/i, file);
    } else {
      assert.match(head, new RegExp(`adsbygoogle\\.js\\?client=${publisherId}`), file);
    }
    assert.match(head, /<link\s+rel=["']canonical["']/i, file);
    assert.doesNotMatch(source, /ca-pub-8468106244002167/, file);
  }
});

test("landing page exposes the feed mounts without a hero mount", async () => {
  const source = await readFile(path.join(root, "index.html"), "utf8");
  assert.match(source, /id="recommendedArticles"/);
  assert.match(source, /id="newsFeedList"/);
  assert.match(source, /id="loadMoreArticles"/);
  assert.match(source, /id="festivalSearchForm"/);
  assert.match(source, /data-search-chip="서울"/);
  assert.match(source, /class="primary-nav nav-mega"/);
  assert.doesNotMatch(source, /id="featuredArticle"/);
});

test("search page exposes a crawl-safe festival search experience", async () => {
  const source = await readFile(path.join(root, "search.html"), "utf8");
  const script = await readFile(path.join(root, "search.js"), "utf8");
  const redirects = await readFile(path.join(root, "_redirects"), "utf8");

  assert.match(source, /name="robots" content="noindex,follow,max-image-preview:large"/);
  assert.match(source, /<link\s+rel="canonical"\s+href="https:\/\/view1\.kr\/search"/);
  assert.match(source, /id="searchPageForm"/);
  assert.match(source, /id="searchResultsList"/);
  assert.match(source, /href="\/search\?q=서울"/);
  assert.match(script, /generated\/seoul-events\.json/);
  assert.match(script, /portalData\.editorialPosts/);
  assert.doesNotMatch(redirects, /\/search\s+\/search\.html/);
});

test("landing page includes crawlable article cards before JavaScript runs", async () => {
  const source = await readFile(path.join(root, "index.html"), "utf8");
  const sections = ["RECOMMENDED", "FEED"];

  for (const name of sections) {
    const block = source.match(new RegExp(`<!-- STATIC_${name}_START -->([\\s\\S]*?)<!-- STATIC_${name}_END -->`))?.[1] || "";
    assert.match(block, /<article\b/, `${name} static cards`);
    assert.match(block, /href="\/(?:articles|seoul-events)\//, `${name} static article links`);
  }

  const articleLinks = [...source.matchAll(/href="(\/(?:articles|seoul-events)\/[^"#]+)"/g)].map((match) => match[1]);
  assert.ok(articleLinks.length >= 15, `expected at least 15 crawlable article links, received ${articleLinks.length}`);
  assert.doesNotMatch(source, /href="festival-detail\?/);
});

test("local script and stylesheet references resolve", async () => {
  const files = (await readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
    .map((entry) => entry.name);

  for (const file of files) {
    const source = await readFile(path.join(root, file), "utf8");
    for (const match of source.matchAll(/<(?:script|link)\b[^>]+(?:src|href)=["']([^"']+)["']/gi)) {
      const asset = match[1];
      if (/^(?:https?:)?\/\//i.test(asset) || asset.startsWith("data:")) continue;
      const relative = decodeURIComponent(asset.split(/[?#]/, 1)[0]);
      if (!relative) continue;
      await assert.doesNotReject(readFile(path.resolve(root, relative.replace(/^\//, ""))), `${file}: ${asset}`);
    }
  }
});

test("ads.txt matches the active publisher ID", async () => {
  const source = await readFile(path.join(root, "ads.txt"), "utf8");
  assert.match(source, /google\.com, pub-5751319666030430, DIRECT/);
  assert.doesNotMatch(source, /pub-8468106244002167/);
});

test("public trust pages use the current festival news brand", async () => {
  const files = ["about.html", "contact.html", "privacy.html", "terms.html", "editorial-policy.html", "disclaimer.html"];
  for (const file of files) {
    const source = await readFile(path.join(root, file), "utf8");
    assert.match(source, /대한축제뉴스/, file);
    assert.doesNotMatch(source, /틴클라임 액션|오늘의 레시피 키친|서울여행뉴스/, file);
  }

  const landing = await readFile(path.join(root, "index.html"), "utf8");
  for (const file of files) assert.match(landing, new RegExp(`href=["']${file}["']`), file);
});

test("sitemap contains only stable editorial and trust URLs", async () => {
  const source = await readFile(path.join(root, "sitemap.xml"), "utf8");
  const urls = [...source.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);

  assert.ok(urls.length >= 20 && urls.length <= 40, `unexpected sitemap size: ${urls.length}`);
  assert.equal(urls.length, new Set(urls).size);
  assert.ok(urls.includes("https://view1.kr/"));
  assert.ok(urls.some((url) => url.includes("/articles/")));
  assert.ok(urls.some((url) => url.endsWith("/editorial-policy")));
  assert.ok(urls.every((url) => !url.includes("source=seoul")));
  assert.ok(urls.every((url) => !url.includes("festival-detail")));
  assert.ok(urls.every((url) => !url.includes("/seoul-events/")));
  assert.ok(urls.every((url) => !url.includes("title=")));
  assert.ok(urls.every((url) => !url.includes("generated/seoul-events.json")));
});

test("RSS feed lists the curated editorial articles as valid, stable items", async () => {
  const source = await readFile(path.join(root, "feed.xml"), "utf8");

  assert.match(source, /<rss version="2\.0">/);
  assert.match(source, /<title>대한축제뉴스<\/title>/);
  assert.match(source, /<link>https:\/\/view1\.kr\/<\/link>/);

  const links = [...source.matchAll(/<link>(https:\/\/view1\.kr\/articles\/[^<]+)<\/link>/g)].map((match) => match[1]);
  assert.ok(links.length >= 20, `expected at least 20 feed items, received ${links.length}`);
  assert.equal(links.length, new Set(links).size);

  const guids = [...source.matchAll(/<guid isPermaLink="true">([^<]+)<\/guid>/g)].map((match) => match[1]);
  assert.equal(guids.length, links.length);

  const pubDates = [...source.matchAll(/<pubDate>([^<]+)<\/pubDate>/g)].map((match) => match[1]);
  assert.ok(pubDates.every((value) => !Number.isNaN(Date.parse(value))), "every pubDate parses as a valid date");

  const index = await readFile(path.join(root, "index.html"), "utf8");
  assert.match(index, /<link rel="alternate" type="application\/rss\+xml"[^>]+href="\/feed\.xml"/);
});

test("API detail links are stable and raw feed pages are not indexed", async () => {
  const travelSource = await readFile(path.join(root, "travel.js"), "utf8");
  const detailSource = await readFile(path.join(root, "festival-detail.js"), "utf8");

  const detailUrlBody = travelSource.match(/function detailUrl\(item\)[\s\S]*?\r?\n}\r?\n/)?.[0] || "";
  assert.match(detailUrlBody, /\/seoul-events\//);
  assert.match(detailUrlBody, /\/articles\//);
  assert.doesNotMatch(detailUrlBody, /title:\s*item\.title|summary:|image,/);
  assert.match(detailSource, /fetchGeneratedSeoulArticle/);
  assert.match(detailSource, /noindex,follow,max-image-preview:large/);
  assert.match(detailSource, /articleStructuredData/);
});

test("curated articles are complete, indexable documents before JavaScript", async () => {
  const articleRoot = path.join(root, "articles");
  const directories = (await readdir(articleRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory());
  assert.ok(directories.length >= 20, `expected at least 20 curated articles, received ${directories.length}`);

  const titles = new Set();
  for (const directory of directories) {
    const source = await readFile(path.join(articleRoot, directory.name, "index.html"), "utf8");
    const title = source.match(/<title>(.*?)<\/title>/)?.[1] || "";
    const bodyText = source
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    assert.ok(title && !titles.has(title), `${directory.name}: unique title`);
    titles.add(title);
    assert.match(source, new RegExp(`https://view1\\.kr/articles/${directory.name}/`));
    assert.match(source, /<h1>[^<]+<\/h1>/);
    assert.match(source, /대한축제뉴스 편집부/);
    assert.match(source, /href="\/editorial-policy"/);
    assert.match(source, new RegExp(`adsbygoogle\\.js\\?client=${publisherId}`));
    assert.doesNotMatch(source, /name="robots" content="noindex/);
    assert.doesNotMatch(source, /images\.unsplash\.com/);
    assert.ok(bodyText.length >= 2200, `${directory.name}: substantial initial article text (${bodyText.length})`);
  }
});

test("current event pages use exact public data, noindex, and the Coupang widget", async () => {
  const payload = JSON.parse(await readFile(path.join(root, "generated", "seoul-events.json"), "utf8"));
  const eventRoot = path.join(root, "seoul-events");
  const directories = (await readdir(eventRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory());
  assert.equal(directories.length, payload.items.length);

  for (const directory of directories) {
    const source = await readFile(path.join(eventRoot, directory.name, "index.html"), "utf8");
    assert.match(source, /name="robots" content="noindex,follow,max-image-preview:large"/);
    assert.doesNotMatch(source, /adsbygoogle\.js|adsbytenping/);
    assert.match(source, /class="coupang-widget-ad"/);
    assert.match(source, /data-coupang-widget/);
    assert.match(source, /ads-partners\.coupang\.com\/g\.js/);
    assert.match(source, /new window\.PartnersCoupang\.G/);
    assert.match(source, /쿠팡 파트너스 활동/);
    assert.match(source, /행사 기본 정보/);
    assert.match(source, /비어 있는 운영 정보를 임의로 추정하지 않습니다/);
    assert.match(source, /https:\/\/view1\.kr\/seoul-events\//);
    for (const match of source.matchAll(/<img\b[^>]+src="([^"]+)"/g)) {
      const host = new URL(match[1].replaceAll("&amp;", "&")).hostname;
      assert.ok(host.endsWith("seoul.go.kr") || host.endsWith("visitkorea.or.kr"), `${directory.name}: ${host}`);
    }
  }
});

test("legacy detail URLs redirect to canonical static pages", async () => {
  const workerSource = await readFile(path.join(root, "_worker.js"), "utf8");
  assert.match(workerSource, /function legacyDetailRedirect/);
  assert.match(workerSource, /\/seoul-events\//);
  assert.match(workerSource, /\/articles\//);
});

test("TourAPI credentials stay server-side and affiliate APIs are deferred", async () => {
  const dataSource = await readFile(path.join(root, "travel-data.js"), "utf8");
  const travelSource = await readFile(path.join(root, "travel.js"), "utf8");
  const detailSource = await readFile(path.join(root, "festival-detail.js"), "utf8");
  const workerSource = await readFile(path.join(root, "_worker.js"), "utf8");
  const initBody = travelSource.match(/function init\(\)[\s\S]*?\r?\n}\r?\n/)?.[0] || "";

  assert.match(dataSource, /endpoint:\s*["']\/api\/tour-festivals["']/);
  assert.doesNotMatch(dataSource, /serviceKey\s*:/);
  assert.doesNotMatch(detailSource, /serviceKey\s*:|apis\.data\.go\.kr\/B551011/);
  assert.match(detailSource, /const base = ["']\/api\/tour-detail["']/);
  assert.match(workerSource, /env\.TOUR_API_KEY/);
  assert.match(workerSource, /url\.pathname === ["']\/api\/tour-festivals["']/);
  assert.match(workerSource, /url\.pathname === ["']\/api\/tour-detail["']/);
  assert.doesNotMatch(initBody, /deferAffiliateData\(\)|loadMyRealTripProducts\(\)|loadCoupangProducts\(\)/);
  assert.match(travelSource, /function openBookingSearch[\s\S]*?loadAffiliateDataOnce\(\)/);
});

test("article image rendering uses API images or an explicit empty state", async () => {
  const travelSource = await readFile(path.join(root, "travel.js"), "utf8");
  const imageBody = travelSource.match(/function imageMarkup\(item, size = "card"\)[\s\S]*?\r?\n}\r?\n/)?.[0] || "";

  assert.match(imageBody, /image-fallback-text/);
  assert.match(imageBody, /classList\.add\('is-empty'\)/);
  assert.doesNotMatch(imageBody, /images\.unsplash\.com/);
  assert.match(travelSource, /const DEFAULT_FESTIVAL_IMAGE = ""/);
});

test("generated festival content records the requested KST month and refresh window", async () => {
  const payload = JSON.parse(await readFile(path.join(root, "generated", "seoul-events.json"), "utf8"));
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit"
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;

  assert.equal(payload.requestedMonth || payload.month, `${year}${month}`);
  assert.match(payload.month, /^\d{6}$/);
  assert.equal(payload.count, payload.items.length);
  assert.ok(payload.items.length > 0);
  if (payload.queryRange) {
    assert.match(payload.queryRange.start, /^\d{8}$/);
    assert.match(payload.queryRange.end, /^\d{8}$/);
    assert.ok(payload.queryRange.start <= payload.queryRange.end);
    assert.match(payload.queryRange.label, /\S/);
  }

  payload.items.forEach((item) => {
    assert.ok(String(item.title || "").trim(), "generated item title");
    assert.ok(String(item.date || "").trim(), item.title);
  });
});

test("affiliate sections are contextual and do not interrupt the news feed with a generic widget", async () => {
  const travelSource = await readFile(path.join(root, "travel.js"), "utf8");
  const detailSource = await readFile(path.join(root, "festival-detail.js"), "utf8");
  const detailStyles = await readFile(path.join(root, "festival-detail.css"), "utf8");

  assert.doesNotMatch(travelSource, /blocks\.push\(coupangWidgetMarkup/);
  assert.match(travelSource, /class="mrt-feed-disclosure"/);
  assert.match(travelSource, /const isFlightRelated = \/[^/]+\/\.test\(text\)/);
  assert.match(travelSource, /enabledFilters: \[\.\.\.new Set\(enabledFilters\)\]/);
  assert.match(travelSource, /enabledFilters\.includes\("flight"\)/);
  assert.match(detailSource, /function coupangTravelKeyword\(article = \{\}\)/);
  assert.match(detailSource, /function detailAffiliateKinds\(article = \{\}\)/);
  assert.match(detailSource, /copy\.cards\.filter\(\(\[kind\]\) => affiliateKinds\.includes\(kind\)\)/);
  assert.match(detailStyles, /repeat\(auto-fit, minmax\(220px, 1fr\)\)/);

  const body = detailSource.match(/function renderTravelDetailBody[\s\S]*?\r?\n}\r?\n/)?.[0] || "";
  const tips = body.indexOf("CleanVisitTipSection");
  const products = body.indexOf("CoupangTravelProductsSection");
  const booking = body.indexOf("BookingCheckSection");
  assert.ok(tips >= 0 && products > tips && booking > products);
});
