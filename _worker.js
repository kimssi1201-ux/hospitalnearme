const API_NAME = "COOKRCP01";
const DEFAULT_COUNT = 12;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/recipes") {
      return handleRecipeApi(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

async function handleRecipeApi(request, env) {
  try {
    const url = new URL(request.url);
    const key = String(env.RECIPE_API_KEY || env.API_KEY || "").trim();

    if (url.searchParams.get("health") === "1") {
      return jsonResponse({
        ok: true,
        runtime: "cloudflare-pages-worker",
        hasKey: Boolean(key),
        keyLength: key.length
      });
    }

    if (!key) {
      return jsonResponse({
        ok: false,
        source: "not_configured",
        recipes: [],
        items: [],
        message: "RECIPE_API_KEY 환경변수가 설정되지 않았습니다."
      });
    }

    const keyword = (url.searchParams.get("keyword") || url.searchParams.get("q") || "").trim();
    const ingredient = (url.searchParams.get("ingredient") || url.searchParams.get("ingredients") || "").trim();
    const category = (url.searchParams.get("category") || "").trim();
    const start = safeNumber(url.searchParams.get("start"), 1, 1, 999);
    const count = safeNumber(url.searchParams.get("count") || url.searchParams.get("limit"), DEFAULT_COUNT, 1, 50);
    const hasLocalFilter = Boolean(keyword || ingredient || category);
    const apiEnd = hasLocalFilter ? 999 : start + count - 1;
    const apiUrl = `https://openapi.foodsafetykorea.go.kr/api/${encodeURIComponent(key)}/${API_NAME}/json/1/${apiEnd}`;

    const response = await fetch(apiUrl, {
      headers: { accept: "application/json" }
    });
    const text = await response.text();

    if (!response.ok) {
      return jsonResponse({
        ok: false,
        source: "foodsafetykorea",
        recipes: [],
        items: [],
        message: "레시피 API 호출에 실패했습니다.",
        status: response.status,
        bodyPreview: text.slice(0, 220)
      });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return jsonResponse({
        ok: false,
        source: "foodsafetykorea",
        recipes: [],
        items: [],
        message: "레시피 API가 JSON이 아닌 응답을 반환했습니다.",
        bodyPreview: text.slice(0, 220)
      });
    }

    const body = data[API_NAME] || {};
    const rows = Array.isArray(body.row) ? body.row : [];
    const filteredRows = filterRows(rows, { keyword, ingredient, category });
    const pagedRows = hasLocalFilter ? filteredRows.slice(start - 1, start - 1 + count) : filteredRows;
    const recipes = pagedRows.map(normalizeRecipe);

    return jsonResponse({
      ok: true,
      source: "foodsafetykorea",
      totalCount: hasLocalFilter ? filteredRows.length : Number(body.total_count || rows.length || 0),
      recipes,
      items: recipes,
      result: body.RESULT || null
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      source: "worker_error",
      recipes: [],
      items: [],
      message: "레시피 API 처리 중 오류가 발생했습니다.",
      error: error && error.message ? error.message : String(error)
    });
  }
}

function filterRows(rows, { keyword, ingredient, category }) {
  const keywordNeedle = normalizeSearchText(keyword);
  const ingredientNeedle = normalizeSearchText(ingredient);
  const categoryNeedle = normalizeSearchText(category);

  return rows.filter((row) => {
    const title = normalizeSearchText(row.RCP_NM);
    const parts = normalizeSearchText(row.RCP_PARTS_DTLS);
    const rowCategory = normalizeSearchText(row.RCP_PAT2);
    const method = normalizeSearchText(row.RCP_WAY2);
    const tags = normalizeSearchText(row.HASH_TAG);

    const keywordMatch = !keywordNeedle || [title, parts, rowCategory, method, tags].some((value) => value.includes(keywordNeedle));
    const ingredientMatch = !ingredientNeedle || parts.includes(ingredientNeedle);
    const categoryMatch = !categoryNeedle || rowCategory.includes(categoryNeedle);

    return keywordMatch && ingredientMatch && categoryMatch;
  });
}

function normalizeSearchText(value) {
  return String(value || "").replace(/\s+/g, "").toLowerCase();
}

function normalizeRecipe(row, index) {
  const steps = pickSteps(row);
  const ingredients = splitIngredients(row.RCP_PARTS_DTLS);

  return {
    id: `api-${row.RCP_SEQ || row.RCP_NM || index}`.replace(/[^a-zA-Z0-9가-힣-]/g, "-"),
    title: row.RCP_NM || "공공 레시피",
    name: row.RCP_NM || "공공 레시피",
    category: row.RCP_PAT2 || "공공 레시피",
    method: row.RCP_WAY2 || "",
    level: "보통",
    time: 30,
    servings: 2,
    calories: toNumber(row.INFO_ENG),
    protein: toNumber(row.INFO_PRO),
    popularity: 72,
    image: row.ATT_FILE_NO_MAIN || row.ATT_FILE_NO_MK || "",
    thumbnail: row.ATT_FILE_NO_MK || row.ATT_FILE_NO_MAIN || "",
    intro: row.RCP_NA_TIP || `${row.RCP_PAT2 || "요리"} 방식의 공공 레시피입니다.`,
    tags: [row.RCP_PAT2, row.RCP_WAY2, row.HASH_TAG].filter(Boolean).slice(0, 5),
    ingredients,
    ingredientText: row.RCP_PARTS_DTLS || "",
    nutrition: {
      calories: row.INFO_ENG || "",
      carbohydrate: row.INFO_CAR || "",
      protein: row.INFO_PRO || "",
      fat: row.INFO_FAT || "",
      sodium: row.INFO_NA || ""
    },
    tip: row.RCP_NA_TIP || "",
    steps,
    source: "api",
    sourceUrl: ""
  };
}

function pickSteps(row) {
  const steps = [];
  for (let i = 1; i <= 20; i += 1) {
    const key = `MANUAL${String(i).padStart(2, "0")}`;
    const text = (row[key] || "").trim();
    if (text) steps.push(text);
  }
  return steps;
}

function splitIngredients(value) {
  const text = String(value || "").trim();
  if (!text) return ["재료 정보는 API 원문을 확인하세요."];
  return text
    .split(/,|·|\n|\r|;/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function safeNumber(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function toNumber(value) {
  const parsed = Number.parseFloat(String(value || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*"
    }
  });
}
