import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { getCategories } from "./categories.mjs";

const rootDir = process.cwd();
const campaignsPath = path.join(rootDir, "data", "campaigns.json");
const publicDir = path.join(rootDir, "public");

export function safeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function asArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => cleanText(item)).filter(Boolean);
}

function asFaq(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      question: cleanText(item?.question),
      answer: cleanText(item?.answer)
    }))
    .filter((item) => item.question && item.answer);
}

function normalizeDate(value) {
  const text = cleanText(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

function toBoolean(value) {
  return value === true;
}

function toPriority(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function compareByPriorityAndDate(a, b) {
  return (
    b.priority - a.priority ||
    String(b.startDate || "").localeCompare(String(a.startDate || "")) ||
    a.title.localeCompare(b.title, "ko")
  );
}

export function isCampaignExpired(campaign, now = new Date()) {
  const endDate = normalizeDate(campaign?.endDate);
  if (!endDate) return false;
  return now.getTime() > new Date(`${endDate}T23:59:59+09:00`).getTime();
}

export function normalizeCampaign(campaign = {}, index = 0, now = new Date()) {
  const slug = safeSlug(campaign.slug);
  const normalized = {
    id: cleanText(campaign.id) || slug || `campaign-${index + 1}`,
    slug,
    title: cleanText(campaign.title),
    shortTitle: cleanText(campaign.shortTitle) || cleanText(campaign.title),
    category: cleanText(campaign.category),
    description: cleanText(campaign.description),
    image: cleanText(campaign.image),
    badge: cleanText(campaign.badge),
    benefit: cleanText(campaign.benefit),
    ctaText: cleanText(campaign.ctaText),
    ctaUrl: cleanText(campaign.ctaUrl),
    provider: cleanText(campaign.provider),
    featured: toBoolean(campaign.featured),
    popular: toBoolean(campaign.popular),
    active: toBoolean(campaign.active),
    demo: toBoolean(campaign.demo),
    priority: toPriority(campaign.priority),
    startDate: normalizeDate(campaign.startDate),
    endDate: normalizeDate(campaign.endDate),
    disclosure: cleanText(campaign.disclosure),
    target: asArray(campaign.target),
    benefits: asArray(campaign.benefits),
    details: asArray(campaign.details),
    faq: asFaq(campaign.faq)
  };
  normalized.expired = isCampaignExpired(normalized, now);
  normalized.listable = normalized.active && !normalized.demo && !normalized.expired;
  return normalized;
}

export async function getAllCampaigns(options = {}) {
  const payload = JSON.parse(await readFile(options.path || campaignsPath, "utf8"));
  const now = options.now || new Date();
  return Array.isArray(payload) ? payload.map((campaign, index) => normalizeCampaign(campaign, index, now)) : [];
}

export async function getActiveCampaigns(options = {}) {
  return (await getAllCampaigns(options)).filter((campaign) => campaign.listable).sort(compareByPriorityAndDate);
}

export async function getFeaturedCampaigns(options = {}) {
  return (await getActiveCampaigns(options)).filter((campaign) => campaign.featured).sort(compareByPriorityAndDate);
}

export async function getPopularCampaigns(options = {}) {
  return (await getActiveCampaigns(options)).filter((campaign) => campaign.popular).sort(compareByPriorityAndDate);
}

export async function getLatestCampaigns(options = {}) {
  return (await getActiveCampaigns(options)).sort((a, b) => (
    String(b.startDate || "").localeCompare(String(a.startDate || "")) ||
    b.priority - a.priority ||
    a.title.localeCompare(b.title, "ko")
  ));
}

export async function getCampaignBySlug(slug, options = {}) {
  return (await getAllCampaigns(options)).find((campaign) => campaign.slug === slug) || null;
}

export async function getCampaignsByCategory(categorySlug, options = {}) {
  return (await getActiveCampaigns(options)).filter((campaign) => campaign.category === categorySlug);
}

export async function getRelatedCampaigns(campaign, options = {}) {
  if (!campaign?.category) return [];
  const limit = Number(options.limit) || 3;
  return (await getCampaignsByCategory(campaign.category, options))
    .filter((item) => item.slug !== campaign.slug)
    .slice(0, limit);
}

function validHttpUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

async function imageExists(imagePath) {
  if (!imagePath || !imagePath.startsWith("/") || imagePath.includes("://")) return false;
  try {
    await access(path.join(publicDir, imagePath.replace(/^\/+/, "")));
    return true;
  } catch {
    return false;
  }
}

export async function validateCampaignData(options = {}) {
  const rawPayload = JSON.parse(await readFile(options.path || campaignsPath, "utf8"));
  const categories = options.categories || await getCategories();
  const categorySlugs = new Set(categories.map((category) => category.slug));
  const errors = [];
  const seenIds = new Set();
  const seenSlugs = new Set();

  if (!Array.isArray(rawPayload)) {
    return ["data/campaigns.json must be an array."];
  }

  for (let index = 0; index < rawPayload.length; index += 1) {
    const original = rawPayload[index] || {};
    const campaign = normalizeCampaign(original, index, options.now || new Date());
    const label = campaign.slug || campaign.id || `index ${index}`;
    const isDemo = campaign.demo === true;

    if (!campaign.id) errors.push(`${label}: id is required.`);
    if (campaign.id && seenIds.has(campaign.id)) errors.push(`${label}: duplicate id "${campaign.id}".`);
    if (campaign.id) seenIds.add(campaign.id);

    if (!campaign.slug) errors.push(`${label}: slug is required.`);
    if (campaign.slug && campaign.slug !== cleanText(original.slug)) errors.push(`${label}: slug must already be URL-safe lowercase text.`);
    if (campaign.slug && seenSlugs.has(campaign.slug)) errors.push(`${label}: duplicate slug "${campaign.slug}".`);
    if (campaign.slug) seenSlugs.add(campaign.slug);

    for (const field of ["title", "category", "description", "image", "ctaText"]) {
      if (!campaign[field]) errors.push(`${label}: ${field} is required.`);
    }

    if (typeof original.active !== "boolean") errors.push(`${label}: active must be true or false.`);
    if (campaign.category && !categorySlugs.has(campaign.category)) errors.push(`${label}: unknown category "${campaign.category}".`);
    if (!isDemo && !campaign.ctaUrl) errors.push(`${label}: ctaUrl is required for non-demo campaigns.`);
    if (campaign.ctaUrl && !validHttpUrl(campaign.ctaUrl)) errors.push(`${label}: ctaUrl must be an absolute http(s) URL.`);
    if (campaign.image && !campaign.image.startsWith("/")) errors.push(`${label}: image must start with "/".`);
    if (campaign.image && campaign.image.includes("://")) errors.push(`${label}: image must be a local public path, not an external URL.`);
    if (campaign.image && options.checkFiles !== false && !(await imageExists(campaign.image))) {
      errors.push(`${label}: image file is missing at public${campaign.image}.`);
    }
    for (const field of ["startDate", "endDate"]) {
      if (original[field] && !normalizeDate(original[field])) errors.push(`${label}: ${field} must be YYYY-MM-DD.`);
    }
  }

  return errors;
}
