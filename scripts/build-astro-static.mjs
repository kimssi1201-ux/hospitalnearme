import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const outDir = join(root, "dist");

const deployableDirs = [
  ".well-known/",
  "articles/",
  "assets/",
  "generated/",
  "images/",
  "seoul-events/",
];

const deployableRootFiles = new Set([
  "_headers",
  "_redirects",
  "_worker.js",
  "CNAME",
  "ads.txt",
  "feed.xml",
  "manifest.webmanifest",
  "robots.txt",
  "sitemap.xml",
]);

const deployableRootExtensions = new Set([
  ".avif",
  ".css",
  ".gif",
  ".html",
  ".ico",
  ".jpg",
  ".jpeg",
  ".js",
  ".png",
  ".svg",
  ".webmanifest",
  ".webp",
  ".xml",
  ".txt",
]);

const neverDeploy = new Set([
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "README.md",
  "AGENTS.md",
  "astro.config.mjs",
  "wrangler.toml",
]);

const trackedFiles = execFileSync("git", ["ls-files"], {
  cwd: root,
  encoding: "utf8",
})
  .split(/\r?\n/)
  .filter(Boolean);

const isDeployable = (filePath) => {
  if (neverDeploy.has(filePath)) return false;
  if (deployableDirs.some((dir) => filePath.startsWith(dir))) return true;
  if (filePath.includes("/")) return false;
  if (deployableRootFiles.has(filePath)) return true;

  const extension = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
  return deployableRootExtensions.has(extension);
};

const files = trackedFiles.filter(isDeployable);

for (const filePath of files) {
  const source = join(root, filePath);
  const target = join(outDir, filePath);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(source, target);
}

console.log(`Copied ${files.length} legacy deployable files into dist/.`);
