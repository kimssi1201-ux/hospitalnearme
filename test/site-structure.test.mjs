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

  assert.equal(files.length, 11);

  for (const file of files) {
    const source = await readFile(path.join(root, file), "utf8");
    const head = source.match(/<head\b[\s\S]*?<\/head>/i)?.[0] || "";
    assert.match(head, /<meta\s+name=["']viewport["']/i, file);
    assert.match(head, new RegExp(`adsbygoogle\\.js\\?client=${publisherId}`), file);
    assert.match(head, /<link\s+rel=["']canonical["']/i, file);
    assert.doesNotMatch(source, /ca-pub-8468106244002167/, file);
  }
});

test("landing page exposes the feed mounts without a hero mount", async () => {
  const source = await readFile(path.join(root, "index.html"), "utf8");
  assert.match(source, /id="recommendedArticles"/);
  assert.match(source, /id="newsFeedList"/);
  assert.doesNotMatch(source, /id="featuredArticle"/);
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

test("public trust pages use the current Seoul travel brand", async () => {
  const files = ["about.html", "contact.html", "privacy.html", "terms.html", "editorial-policy.html", "disclaimer.html"];
  for (const file of files) {
    const source = await readFile(path.join(root, file), "utf8");
    assert.match(source, /서울여행뉴스/, file);
    assert.doesNotMatch(source, /틴클라임 액션|오늘의 레시피 키친/, file);
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
  assert.ok(urls.some((url) => url.includes("festival-detail?id=")));
  assert.ok(urls.some((url) => url.endsWith("/editorial-policy")));
  assert.ok(urls.every((url) => !url.includes("source=seoul")));
  assert.ok(urls.every((url) => !url.includes("title=")));
  assert.ok(urls.every((url) => !url.includes("generated/seoul-events.json")));
});

test("API detail links are stable and raw feed pages are not indexed", async () => {
  const travelSource = await readFile(path.join(root, "travel.js"), "utf8");
  const detailSource = await readFile(path.join(root, "festival-detail.js"), "utf8");

  const detailUrlBody = travelSource.match(/function detailUrl\(item\)[\s\S]*?\r?\n}\r?\n/)?.[0] || "";
  assert.match(detailUrlBody, /source:\s*["']seoul["']/);
  assert.doesNotMatch(detailUrlBody, /title:\s*item\.title|summary:|image,/);
  assert.match(detailSource, /fetchGeneratedSeoulArticle/);
  assert.match(detailSource, /noindex,follow,max-image-preview:large/);
  assert.match(detailSource, /articleStructuredData/);
});

test("generated Seoul content matches the current KST month", async () => {
  const payload = JSON.parse(await readFile(path.join(root, "generated", "seoul-events.json"), "utf8"));
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit"
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;

  assert.equal(payload.month, `${year}${month}`);
  assert.equal(payload.count, payload.items.length);
  assert.ok(payload.items.length > 0);
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
