const API_NAME = "COOKRCP01";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*",
    },
  });
}

function safeNumber(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function pickSteps(row) {
  const steps = [];
  for (let i = 1; i <= 20; i += 1) {
    const key = `MANUAL${String(i).padStart(2, "0")}`;
    const imageKey = `MANUAL_IMG${String(i).padStart(2, "0")}`;
    const text = (row[key] || "").trim();
    if (text) {
      steps.push({ text, image: row[imageKey] || "" });
    }
  }
  return steps;
}

function normalizeRecipe(row) {
  return {
    id: row.RCP_SEQ,
    name: row.RCP_NM,
    category: row.RCP_PAT2,
    method: row.RCP_WAY2,
    image: row.ATT_FILE_NO_MAIN || row.ATT_FILE_NO_MK || "",
    thumbnail: row.ATT_FILE_NO_MK || row.ATT_FILE_NO_MAIN || "",
    ingredients: row.RCP_PARTS_DTLS,
    hashtag: row.HASH_TAG,
    nutrition: {
      calories: row.INFO_ENG,
      carbohydrate: row.INFO_CAR,
      protein: row.INFO_PRO,
      fat: row.INFO_FAT,
      sodium: row.INFO_NA,
    },
    tip: row.RCP_NA_TIP,
    steps: pickSteps(row),
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const key = env.RECIPE_API_KEY;

  if (!key) {
    return json(
      {
        ok: false,
        message: "RECIPE_API_KEY 환경변수가 설정되지 않았습니다. Cloudflare Pages 환경변수에 공공데이터 인증키를 넣어주세요.",
      },
      500,
    );
  }

  const url = new URL(request.url);
  const keyword = (url.searchParams.get("keyword") || "").trim();
  const ingredient = (url.searchParams.get("ingredient") || "").trim();
  const category = (url.searchParams.get("category") || "").trim();
  const start = safeNumber(url.searchParams.get("start"), 1, 1, 999);
  const count = safeNumber(url.searchParams.get("count"), 12, 1, 50);
  const end = start + count - 1;

  const filters = [];
  if (keyword) filters.push(`RCP_NM=${encodeURIComponent(keyword)}`);
  if (ingredient) filters.push(`RCP_PARTS_DTLS=${encodeURIComponent(ingredient)}`);
  if (category) filters.push(`RCP_PAT2=${encodeURIComponent(category)}`);

  const filterPath = filters.length ? `/${filters.join("/")}` : "";
  const apiUrl = `https://openapi.foodsafetykorea.go.kr/api/${key}/${API_NAME}/json/${start}/${end}${filterPath}`;

  try {
    const response = await fetch(apiUrl, {
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      return json({ ok: false, message: "레시피 API 호출에 실패했습니다.", status: response.status }, 502);
    }

    const data = await response.json();
    const body = data[API_NAME] || {};
    const rows = Array.isArray(body.row) ? body.row : [];

    return json({
      ok: true,
      totalCount: Number(body.total_count || rows.length || 0),
      items: rows.map(normalizeRecipe),
    });
  } catch (error) {
    return json({ ok: false, message: "레시피 데이터를 불러오는 중 오류가 발생했습니다." }, 500);
  }
}
