import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getActiveCampaigns, getAllCampaigns } from "../src/lib/campaigns.mjs";
import { getCategories } from "../src/lib/categories.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");

async function mustExist(relativePath) {
  await access(path.join(distDir, relativePath));
}

async function readDist(relativePath) {
  return readFile(path.join(distDir, relativePath), "utf8");
}

await mustExist("index.html");
await mustExist("_worker.js");
await mustExist("_headers");
await mustExist("_redirects");
await mustExist("ads.txt");
await mustExist("CNAME");
await mustExist("generated/seoul-events.json");
await mustExist("articles/seoul-weekend-exhibition-guide/index.html");

const eventDirectories = await readdir(path.join(distDir, "seoul-events"), { withFileTypes: true });
assert.ok(eventDirectories.some((entry) => entry.isDirectory()), "dist/seoul-events must include legacy event pages");

const home = await readDist("index.html");
assert.match(home, /VIEW1 \| 이벤트 정보 포털/);
assert.match(home, /data-campaign-search-form/);
assert.match(home, /기존 축제·여행 콘텐츠/);

const worker = await readDist("_worker.js");
assert.match(worker, /url\.pathname === ["']\/api\/coupang["']/);
assert.match(worker, /url\.pathname === ["']\/api\/myrealtrip["']/);
assert.match(worker, /url\.pathname === ["']\/api\/tour-festivals["']/);

const ads = await readDist("ads.txt");
assert.match(ads, /pub-5751319666030430/);

for (const category of await getCategories()) {
  await mustExist(`category/${category.slug}/index.html`);
}

for (const campaign of await getAllCampaigns()) {
  await mustExist(`event/${campaign.slug}/index.html`);
}

const demoDetail = await readDist("event/demo-wedding-fair/index.html");
assert.match(demoDetail, /현재 종료된 이벤트입니다/);
assert.match(demoDetail, /noindex,follow,max-image-preview:large/);

const sitemap = await readDist("sitemap.xml");
assert.match(sitemap, /https:\/\/view1\.kr\/category\/wedding\//);
assert.match(sitemap, /https:\/\/view1\.kr\/articles\/seoul-weekend-exhibition-guide\//);
assert.match(sitemap, /https:\/\/view1\.kr\/seoul-events\/tour-/);
assert.doesNotMatch(sitemap, /demo-wedding-fair/);

for (const campaign of await getActiveCampaigns()) {
  assert.match(sitemap, new RegExp(`https://view1\\.kr/event/${campaign.slug}/`));
}

console.log("Dist checks OK.");
