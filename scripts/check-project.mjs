import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publisherId = "ca-pub-5751319666030430";
const oldPublisherId = "ca-pub-8468106244002167";
const htmlFiles = (await readdir(root, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
  .map((entry) => entry.name)
  .sort();
const failures = [];

function fail(message) {
  failures.push(message);
}

for (const fileName of htmlFiles) {
  const filePath = path.join(root, fileName);
  const source = await readFile(filePath, "utf8");
  const head = source.match(/<head\b[\s\S]*?<\/head>/i)?.[0] || "";

  if (!head) fail(`${fileName}: missing head element`);
  if (!/<meta\s+name=["']viewport["']/i.test(head)) fail(`${fileName}: missing viewport meta`);
  const isNoindexFallback = fileName === "festival-detail.html" && /name=["']robots["'][^>]+noindex/i.test(head);
  if (!isNoindexFallback && !head.includes(`adsbygoogle.js?client=${publisherId}`)) {
    fail(`${fileName}: missing current AdSense code in head`);
  }
  if (isNoindexFallback && head.includes("adsbygoogle.js")) fail(`${fileName}: noindex fallback must not load ads`);
  if (source.includes(oldPublisherId)) fail(`${fileName}: old AdSense publisher ID remains`);

  for (const match of source.matchAll(/<(?:script|link)\b[^>]+(?:src|href)=["']([^"']+)["']/gi)) {
    const asset = match[1];
    if (/^(?:https?:)?\/\//i.test(asset) || asset.startsWith("data:")) continue;
    const localAsset = decodeURIComponent(asset.split(/[?#]/, 1)[0]);
    if (!localAsset) continue;
    const assetPath = path.resolve(root, localAsset.replace(/^\//, ""));
    try {
      await readFile(assetPath);
    } catch {
      fail(`${fileName}: missing local asset ${asset}`);
    }
  }
}

const index = await readFile(path.join(root, "index.html"), "utf8");
if (!index.includes('id="recommendedArticles"')) fail("index.html: recommendation mount is missing");
if (!index.includes('id="newsFeedList"')) fail("index.html: news feed mount is missing");
if (index.includes('id="featuredArticle"')) fail("index.html: removed hero mount is still present");

const adsTxt = await readFile(path.join(root, "ads.txt"), "utf8");
if (!adsTxt.includes(`pub-${publisherId.slice(7)}`)) fail("ads.txt: current AdSense publisher ID is missing");
if (adsTxt.includes(oldPublisherId.slice(7))) fail("ads.txt: old AdSense publisher ID remains");

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Project checks OK: ${htmlFiles.length} HTML pages checked.`);
}
