import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const rootDir = process.cwd();

function safeSlug(value) {
  return String(value || "").trim().replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-");
}

function cleanText(value) {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export async function getEditorialPosts(limit = 8) {
  const source = await readFile(path.join(rootDir, "travel-data.js"), "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox, { filename: "travel-data.js", timeout: 1000 });
  const posts = sandbox.window.TRAVEL_PORTAL_DATA?.editorialPosts || [];
  return posts
    .filter((post) => post?.id && post?.title)
    .slice(0, limit)
    .map((post) => ({
      title: cleanText(post.title),
      description: cleanText(post.summary || post.description),
      category: cleanText(post.category || "생활/정보"),
      image: cleanText(post.image),
      url: `/articles/${safeSlug(post.id)}/`,
      date: cleanText(post.date)
    }));
}

export async function getFestivalItems(limit = 8) {
  const payload = JSON.parse(await readFile(path.join(rootDir, "generated", "seoul-events.json"), "utf8"));
  const items = [
    ...(Array.isArray(payload.items) ? payload.items : []),
    ...(Array.isArray(payload.legacyItems) ? payload.legacyItems : [])
  ];
  const seen = new Set();
  return items
    .filter((item) => {
      const id = safeSlug(item?.id);
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return Boolean(item?.title);
    })
    .slice(0, limit)
    .map((item) => ({
      title: cleanText(item.articleTitle || item.title),
      description: cleanText(item.summary),
      category: cleanText(item.category || "축제"),
      image: cleanText(item.image),
      url: `/seoul-events/${safeSlug(item.id)}/`,
      date: cleanText(item.date)
    }));
}

export async function getExistingArticlePaths() {
  const articleRoot = path.join(rootDir, "articles");
  try {
    const entries = await readdir(articleRoot, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => `/articles/${entry.name}/`).sort();
  } catch {
    return [];
  }
}

export async function getExistingFestivalPaths() {
  const eventRoot = path.join(rootDir, "seoul-events");
  try {
    const entries = await readdir(eventRoot, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => `/seoul-events/${entry.name}/`).sort();
  } catch {
    return [];
  }
}
