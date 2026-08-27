import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Reports how well generated/seoul-events.json's galleryImages field is
// filling in - i.e. how much detailImage2 + PhotoGalleryService1 are
// actually finding for the current festival list. Read-only, no network
// calls: run it any time after `npm run refresh` to see the payoff of the
// photo backfill without re-fetching anything.

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = path.join(rootDir, "generated", "seoul-events.json");

function bucketFor(count) {
  if (count === 0) return "0장";
  if (count <= 2) return "1-2장";
  return "3장 이상";
}

async function main() {
  const payload = JSON.parse(await readFile(dataPath, "utf8"));
  const items = Array.isArray(payload.items) ? payload.items : [];

  if (!items.length) {
    console.log("generated/seoul-events.json에 항목이 없습니다.");
    return;
  }

  const buckets = { "0장": 0, "1-2장": 0, "3장 이상": 0 };
  const byRegion = new Map();

  for (const item of items) {
    const count = Array.isArray(item.galleryImages) ? item.galleryImages.length : 0;
    buckets[bucketFor(count)] += 1;

    const region = item.areaCode || "unknown";
    const stat = byRegion.get(region) || { total: 0, withPhotos: 0 };
    stat.total += 1;
    if (count > 0) stat.withPhotos += 1;
    byRegion.set(region, stat);
  }

  const total = items.length;
  const atLeast3 = buckets["3장 이상"];
  const withAny = total - buckets["0장"];

  console.log(`총 ${total}개 항목 중 사진이 1장이라도 있는 항목: ${withAny}개 (${Math.round((withAny / total) * 1000) / 10}%)`);
  console.log(`3장 이상 확보한 항목: ${atLeast3}개 (${Math.round((atLeast3 / total) * 1000) / 10}%)`);
  console.log("");
  console.log("사진 개수 분포:");
  for (const [label, count] of Object.entries(buckets)) {
    console.log(`  ${label}: ${count}개 (${Math.round((count / total) * 1000) / 10}%)`);
  }

  console.log("");
  console.log("지역(areaCode)별 사진 확보율:");
  const sortedRegions = [...byRegion.entries()].sort((a, b) => Number(a[0]) - Number(b[0]));
  for (const [region, stat] of sortedRegions) {
    const percent = stat.total ? Math.round((stat.withPhotos / stat.total) * 1000) / 10 : 0;
    console.log(`  areaCode ${region}: ${stat.withPhotos}/${stat.total} (${percent}%)`);
  }
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exitCode = 1;
});
