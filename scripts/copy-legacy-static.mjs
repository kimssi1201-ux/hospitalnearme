import { copyFile, mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");

const rootFiles = [
  "_worker.js",
  "_headers",
  "_redirects",
  "ads.txt",
  "CNAME",
  "manifest.webmanifest",
  "feed.xml",
  "about.html",
  "contact.html",
  "privacy.html",
  "terms.html",
  "editorial-policy.html",
  "disclaimer.html",
  "articles.html",
  "recipes.html",
  "resources.html",
  "search.html",
  "search.js",
  "festival-detail.html",
  "festival-detail.js",
  "festival-detail.css",
  "article-static.css",
  "travel.css",
  "travel.js",
  "travel-data.js",
  "visual-gallery.css",
  "text-clarity.css",
  "styles.css",
  "site-fit.css",
  "policy-pages.css",
  "nav-size.css",
  "magazine.css",
  "latest-grid-fix.css",
  "home-reference.css",
  "hero-ratio-fix.css",
  "hero-mobile.css",
  "festival-mobile-fix.css",
  "font-polish.css"
];

const legacyDirectories = ["articles", "seoul-events", "generated"];

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function copyDirectory(source, target) {
  await mkdir(target, { recursive: true });
  const entries = await readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, targetPath);
    } else if (entry.isFile()) {
      await mkdir(path.dirname(targetPath), { recursive: true });
      await copyFile(sourcePath, targetPath);
    }
  }
}

await mkdir(distDir, { recursive: true });

for (const fileName of rootFiles) {
  const source = path.join(rootDir, fileName);
  if (await exists(source)) {
    await copyFile(source, path.join(distDir, fileName));
  }
}

for (const directory of legacyDirectories) {
  const source = path.join(rootDir, directory);
  if (await exists(source)) {
    await copyDirectory(source, path.join(distDir, directory));
  }
}

console.log("Copied Cloudflare files and legacy static content into dist/.");
