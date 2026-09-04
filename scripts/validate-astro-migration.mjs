import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const outDir = join(root, "dist");

const trackedFiles = execFileSync("git", ["ls-files"], {
  cwd: root,
  encoding: "utf8",
})
  .split(/\r?\n/)
  .filter(Boolean);

const htmlFiles = trackedFiles.filter((filePath) => filePath.endsWith(".html"));
const exactFiles = [
  "_headers",
  "_redirects",
  "_worker.js",
  "CNAME",
  "ads.txt",
  "feed.xml",
  "manifest.webmanifest",
  "robots.txt",
  "sitemap.xml",
].filter((filePath) => trackedFiles.includes(filePath));

const readUtf8 = async (base, filePath) => readFile(join(base, filePath), "utf8");
const normalize = (value = "") => value.replace(/\s+/g, " ").trim();

const getTitle = (html) => normalize(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]);
const getMeta = (html, name) => {
  const byName = html.match(new RegExp(`<meta\\s+[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["'][^>]*>`, "i"));
  const byProperty = html.match(new RegExp(`<meta\\s+[^>]*property=["']${name}["'][^>]*content=["']([^"']*)["'][^>]*>`, "i"));
  return normalize((byName || byProperty)?.[1]);
};
const getCanonical = (html) => normalize(html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["'][^>]*>/i)?.[1]);
const getH1 = (html) => normalize(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, " "));
const getJsonLdCount = (html) => (html.match(/type=["']application\/ld\+json["']/gi) || []).length;

const fail = (message) => {
  console.error(message);
  process.exitCode = 1;
};

for (const filePath of htmlFiles) {
  const before = await readUtf8(root, filePath);
  const after = await readUtf8(outDir, filePath).catch(() => null);

  if (after === null) {
    fail(`Missing HTML output: ${filePath}`);
    continue;
  }

  if (before !== after) {
    fail(`HTML changed during Astro migration: ${filePath}`);
  }

  const fields = [
    ["title", getTitle],
    ["meta description", (html) => getMeta(html, "description")],
    ["canonical", getCanonical],
    ["og:title", (html) => getMeta(html, "og:title")],
    ["og:description", (html) => getMeta(html, "og:description")],
    ["h1", getH1],
    ["JSON-LD count", getJsonLdCount],
  ];

  for (const [label, getter] of fields) {
    if (getter(before) !== getter(after)) {
      fail(`${label} mismatch: ${filePath}`);
    }
  }
}

for (const filePath of exactFiles) {
  const before = await readUtf8(root, filePath);
  const after = await readUtf8(outDir, filePath).catch(() => null);

  if (after === null) {
    fail(`Missing static output: ${filePath}`);
    continue;
  }

  if (before !== after) {
    fail(`Static file changed during Astro migration: ${filePath}`);
  }
}

if (!process.exitCode) {
  console.log(`Astro migration validation passed for ${htmlFiles.length} HTML files and ${exactFiles.length} static control files.`);
}
