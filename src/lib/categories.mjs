import { readFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const categoriesPath = path.join(rootDir, "data", "categories.json");

function normalizeCategory(category = {}) {
  return {
    slug: String(category.slug || "").trim(),
    name: String(category.name || "").trim(),
    description: String(category.description || "").trim(),
    order: Number.isFinite(Number(category.order)) ? Number(category.order) : 0
  };
}

export async function getCategories() {
  const payload = JSON.parse(await readFile(categoriesPath, "utf8"));
  return payload
    .map(normalizeCategory)
    .filter((category) => category.slug && category.name)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "ko"));
}

export async function getCategoryBySlug(slug) {
  return (await getCategories()).find((category) => category.slug === slug) || null;
}

export async function getCategoryMap() {
  return new Map((await getCategories()).map((category) => [category.slug, category]));
}
