import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import {
  getActiveCampaigns,
  getCampaignBySlug,
  getCampaignsByCategory,
  getFeaturedCampaigns,
  getLatestCampaigns,
  getPopularCampaigns,
  getRelatedCampaigns,
  validateCampaignData
} from "../src/lib/campaigns.mjs";
import { getCategories } from "../src/lib/categories.mjs";

const now = new Date("2026-09-10T12:00:00+09:00");
const fixtureCampaigns = [
  {
    id: "health-001",
    slug: "health-consulting",
    title: "건강 상담 이벤트",
    category: "health",
    description: "건강 상담 혜택을 확인합니다.",
    image: "/images/campaigns/demo-event.svg",
    ctaText: "무료 상담 신청",
    ctaUrl: "https://example.com/health",
    active: true,
    featured: true,
    popular: true,
    priority: 20,
    startDate: "2026-09-09"
  },
  {
    id: "health-002",
    slug: "health-ended",
    title: "종료 건강 이벤트",
    category: "health",
    description: "종료 처리 확인용입니다.",
    image: "/images/campaigns/demo-event.svg",
    ctaText: "확인",
    ctaUrl: "https://example.com/ended",
    active: true,
    popular: true,
    priority: 100,
    startDate: "2026-09-01",
    endDate: "2026-09-02"
  },
  {
    id: "wedding-001",
    slug: "wedding-fair",
    title: "웨딩박람회 무료초대권",
    category: "wedding",
    description: "웨딩박람회 무료초대권 안내입니다.",
    image: "/images/campaigns/demo-event.svg",
    ctaText: "무료초대권 신청",
    ctaUrl: "https://example.com/wedding",
    active: true,
    featured: true,
    priority: 10,
    startDate: "2026-09-10"
  },
  {
    id: "life-001",
    slug: "life-hidden",
    title: "비활성 생활 이벤트",
    category: "life",
    description: "비활성 처리 확인용입니다.",
    image: "/images/campaigns/demo-event.svg",
    ctaText: "확인",
    ctaUrl: "https://example.com/life",
    active: false
  }
];

async function fixturePath(campaigns) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "view1-campaigns-"));
  const filePath = path.join(directory, "campaigns.json");
  await writeFile(filePath, JSON.stringify(campaigns, null, 2), "utf8");
  return { directory, filePath };
}

test("campaign data loads with safe defaults and inactive demo is excluded", async () => {
  const active = await getActiveCampaigns({ now });
  const demo = await getCampaignBySlug("demo-wedding-fair", { now });

  assert.equal(active.length, 0);
  assert.equal(demo.demo, true);
  assert.equal(demo.active, false);
  assert.equal(demo.listable, false);
  assert.equal(demo.expired, true);
});

test("campaign helper functions filter and sort active campaigns", async () => {
  const { directory, filePath } = await fixturePath(fixtureCampaigns);
  try {
    const active = await getActiveCampaigns({ path: filePath, now });
    const featured = await getFeaturedCampaigns({ path: filePath, now });
    const popular = await getPopularCampaigns({ path: filePath, now });
    const latest = await getLatestCampaigns({ path: filePath, now });
    const health = await getCampaignsByCategory("health", { path: filePath, now });
    const related = await getRelatedCampaigns(active[0], { path: filePath, now, limit: 3 });

    assert.deepEqual(active.map((item) => item.slug), ["health-consulting", "wedding-fair"]);
    assert.deepEqual(featured.map((item) => item.slug), ["health-consulting", "wedding-fair"]);
    assert.deepEqual(popular.map((item) => item.slug), ["health-consulting"]);
    assert.deepEqual(latest.map((item) => item.slug), ["wedding-fair", "health-consulting"]);
    assert.deepEqual(health.map((item) => item.slug), ["health-consulting"]);
    assert.ok(related.every((item) => item.category === active[0].category));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("campaign validation catches duplicate slugs, bad categories, and invalid URLs", async () => {
  const { directory, filePath } = await fixturePath([
    fixtureCampaigns[0],
    {
      ...fixtureCampaigns[0],
      id: "duplicate",
      category: "unknown",
      ctaUrl: "javascript:alert(1)"
    }
  ]);
  try {
    const errors = await validateCampaignData({
      path: filePath,
      categories: await getCategories(),
      checkFiles: false,
      now
    });
    assert.ok(errors.some((error) => error.includes("duplicate slug")));
    assert.ok(errors.some((error) => error.includes("unknown category")));
    assert.ok(errors.some((error) => error.includes("ctaUrl must be an absolute")));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
