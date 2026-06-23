const storageKeys = {
  saved: "apiRecipeKitchen.saved",
  shopping: "apiRecipeKitchen.shopping"
};

const foodSafetyApi = {
  name: "COOKRCP01",
  host: "https://openapi.foodsafetykorea.go.kr/api"
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const state = {
  recipes: [],
  selectedRecipeId: "",
  saved: new Set(readJson(storageKeys.saved, [])),
  shopping: readJson(storageKeys.shopping, []),
  status: "idle",
  lastQuery: "",
  lastIngredient: ""
};

function getPublicApiKey() {
  return (
    window.RECIPE_API_KEY ||
    window.FOODSAFETY_API_KEY ||
    localStorage.getItem("recipeApiKey") ||
    new URLSearchParams(window.location.search).get("apiKey") ||
    ""
  ).trim();
}

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getRecipe(id) {
  return state.recipes.find((recipe) => recipe.id === id) || state.recipes[0] || null;
}

function normalizeRecipe(recipe, index) {
  if (recipe && (recipe.RCP_NM || recipe.RCP_SEQ)) {
    return normalizeFoodSafetyRecipe(recipe, index);
  }

  const steps = Array.isArray(recipe.steps)
    ? recipe.steps.map((step) => (typeof step === "string" ? step : step.text || "")).filter(Boolean)
    : [];

  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients.filter(Boolean)
    : splitIngredientText(recipe.ingredientText || recipe.ingredients || "");

  return {
    id: recipe.id || `api-${index}`,
    title: recipe.title || recipe.name || "API 레시피",
    category: recipe.category || recipe.method || "레시피",
    method: recipe.method || "",
    time: Number(recipe.time) || 30,
    servings: Number(recipe.servings) || 2,
    calories: Number(recipe.calories) || numberFrom(recipe.nutrition?.calories),
    protein: Number(recipe.protein) || numberFrom(recipe.nutrition?.protein),
    image: recipe.image || recipe.thumbnail || "",
    intro: recipe.intro || recipe.tip || "API에서 불러온 레시피입니다.",
    tags: Array.isArray(recipe.tags) ? recipe.tags.filter(Boolean).slice(0, 5) : [],
    ingredients: ingredients.length ? ingredients : ["재료 정보가 API 응답에 포함되지 않았습니다."],
    steps: steps.length ? steps : ["조리 과정이 API 응답에 포함되지 않았습니다."],
    nutrition: recipe.nutrition || {},
    source: "api"
  };
}

function normalizeFoodSafetyRecipe(row, index) {
  const steps = [];
  for (let i = 1; i <= 20; i += 1) {
    const text = String(row[`MANUAL${String(i).padStart(2, "0")}`] || "").trim();
    if (text) steps.push(text);
  }

  const category = row.RCP_PAT2 || "공공 레시피";
  return {
    id: `foodsafety-${row.RCP_SEQ || index}`.replace(/[^a-zA-Z0-9가-힣-]/g, "-"),
    title: row.RCP_NM || "공공 레시피",
    category,
    method: row.RCP_WAY2 || "",
    time: 30,
    servings: 2,
    calories: numberFrom(row.INFO_ENG),
    protein: numberFrom(row.INFO_PRO),
    image: row.ATT_FILE_NO_MAIN || row.ATT_FILE_NO_MK || "",
    intro: row.RCP_NA_TIP || `${category} 방식으로 정리된 공공 레시피입니다.`,
    tags: [row.RCP_PAT2, row.RCP_WAY2, row.HASH_TAG].filter(Boolean).slice(0, 5),
    ingredients: splitIngredientText(row.RCP_PARTS_DTLS),
    steps: steps.length ? steps : ["API 응답에 조리 순서가 포함되지 않았습니다."],
    nutrition: {
      calories: row.INFO_ENG || "",
      carbohydrate: row.INFO_CAR || "",
      protein: row.INFO_PRO || "",
      fat: row.INFO_FAT || "",
      sodium: row.INFO_NA || ""
    },
    source: "foodsafetykorea"
  };
}

function splitIngredientText(value) {
  return String(value || "")
    .split(/,|·|ㆍ|\n|\r|;/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 24);
}

function numberFrom(value) {
  const parsed = Number.parseFloat(String(value || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

async function loadRecipes({ query = "", ingredient = "", category = "" } = {}) {
  state.status = "loading";
  state.lastQuery = query;
  state.lastIngredient = ingredient;
  renderStatus();
  renderGridLoading();

  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (ingredient) params.set("ingredients", ingredient);
  if (category) params.set("category", category);
  params.set("limit", "12");

  try {
    const payload = await fetchRecipes(params, { query, ingredient, category });
    const apiItems = Array.isArray(payload.recipes) ? payload.recipes : payload.items || [];
    state.recipes = apiItems.map(normalizeRecipe);
    state.status = payload.source === "not_configured" ? "unconfigured" : "ready";
    state.selectedRecipeId = state.recipes[0]?.id || "";
  } catch (error) {
    state.recipes = [];
    state.selectedRecipeId = "";
    state.status = error.message === "public_api_key_missing" ? "unconfigured" : "error";
  }

  renderAll();
}

async function fetchRecipes(params, filters) {
  try {
    const response = await fetch(`/api/recipes?${params.toString()}`, {
      headers: { Accept: "application/json" }
    });

    if (response.ok) return response.json();
  } catch {
    // GitHub Pages cannot execute /api routes, so fall through to direct API mode.
  }

  return fetchFoodSafetyRecipes(filters);
}

async function fetchFoodSafetyRecipes({ query = "", ingredient = "", category = "" }) {
  const key = getPublicApiKey();
  if (!key) throw new Error("public_api_key_missing");

  const filters = [];
  if (query) filters.push(`RCP_NM=${encodeURIComponent(query)}`);
  if (ingredient) filters.push(`RCP_PARTS_DTLS=${encodeURIComponent(ingredient)}`);
  if (category) filters.push(`RCP_PAT2=${encodeURIComponent(category)}`);

  const filterPath = filters.length ? `/${filters.join("/")}` : "";
  const endpoint = `${foodSafetyApi.host}/${key}/${foodSafetyApi.name}/json/1/12${filterPath}`;
  const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("direct_api_failed");

  const data = await response.json();
  const body = data[foodSafetyApi.name] || {};
  const rows = Array.isArray(body.row) ? body.row : [];
  return {
    ok: true,
    source: "foodsafetykorea",
    totalCount: Number(body.total_count || rows.length || 0),
    recipes: rows,
    items: rows
  };
}

function renderAll() {
  renderStatus();
  renderCategoryOptions();
  renderRecipeGrid();
  renderDetail();
  renderShopping();
  renderSaved();
}

function renderStatus() {
  const count = state.recipes.length;
  const summary = $("#apiSummary");
  const summaryText = $("#apiSummaryText");
  const resultCount = $("#resultCount");

  if (state.status === "loading") {
    summary.textContent = "API 연결 중";
    summaryText.textContent = "레시피 데이터를 불러오고 있습니다.";
    resultCount.textContent = "API 응답 대기 중";
    return;
  }

  if (state.status === "error") {
    summary.textContent = "API 확인 필요";
    summaryText.textContent = "레시피 API 응답을 받지 못했습니다. 잠시 뒤 다시 검색하거나 API 연결 설정을 확인하세요.";
    resultCount.textContent = "API 응답 없음";
    return;
  }

  if (state.status === "unconfigured") {
    summary.textContent = "API 키 연결 필요";
    summaryText.textContent = "현재 도메인은 GitHub Pages로 응답하고 있어 서버 API가 실행되지 않습니다. Cloudflare Pages 전환 전까지는 공개 API 키를 브라우저 설정에 넣으면 검색이 작동합니다.";
    resultCount.textContent = "API 연결 대기";
    return;
  }

  summary.textContent = count ? `${count}개 레시피 로드` : "레시피 없음";
  summaryText.textContent = count
    ? "API 응답으로 받은 레시피만 화면에 표시하고 있습니다."
    : "검색어를 바꿔 다시 불러와 보세요.";
  resultCount.textContent = `${count}개 API 레시피`;
}

function renderGridLoading() {
  $("#recipeGrid").innerHTML = `
    <div class="empty-state">
      <strong>API에서 레시피를 불러오는 중입니다.</strong>
      <p>잠시만 기다려 주세요.</p>
    </div>
  `;
}

function renderRecipeGrid() {
  const grid = $("#recipeGrid");

  if (!state.recipes.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <strong>표시할 API 레시피가 없습니다.</strong>
        <p>검색어를 바꾸거나 Cloudflare API 배포 상태를 확인하세요.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = state.recipes.map(renderRecipeCard).join("");

  $$("[data-open]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedRecipeId = button.dataset.open;
      renderDetail();
      $("#recipeDetail").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  $$("[data-save]").forEach((button) => {
    button.addEventListener("click", () => toggleSaved(button.dataset.save));
  });
}

function renderRecipeCard(recipe) {
  const saved = state.saved.has(recipe.id);
  return `
    <article class="recipe-card">
      ${renderImage(recipe)}
      <div class="recipe-card__body">
        <div class="recipe-meta">
          <span>API</span>
          <span>${escapeHtml(recipe.category)}</span>
          ${recipe.method ? `<span>${escapeHtml(recipe.method)}</span>` : ""}
        </div>
        <h3>${escapeHtml(recipe.title)}</h3>
        <p>${escapeHtml(shortText(recipe.intro, 92))}</p>
        <div class="recipe-tags">
          ${recipe.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
        </div>
        <div class="recipe-card__actions">
          <button type="button" class="small" data-open="${recipe.id}">자세히 보기</button>
          <button type="button" class="ghost small" data-save="${recipe.id}">${saved ? "저장됨" : "저장"}</button>
        </div>
      </div>
    </article>
  `;
}

function renderImage(recipe) {
  if (recipe.image) {
    return `<img src="${escapeAttribute(recipe.image)}" alt="${escapeAttribute(recipe.title)}" loading="lazy">`;
  }
  return `<div class="placeholder-image" aria-hidden="true">R</div>`;
}

function renderDetail() {
  const recipe = getRecipe(state.selectedRecipeId);
  const detail = $("#recipeDetail");

  if (!recipe) {
    detail.innerHTML = `
      <p class="eyebrow">Recipe Detail</p>
      <h2>API 레시피를 기다리고 있습니다</h2>
      <p>검색 결과가 들어오면 상세 조리법이 이곳에 표시됩니다.</p>
    `;
    return;
  }

  detail.innerHTML = `
    <div class="detail-layout">
      <div class="detail-media">${renderImage(recipe)}</div>
      <div class="detail-copy">
        <p class="eyebrow">${escapeHtml(recipe.category)}${recipe.method ? ` · ${escapeHtml(recipe.method)}` : ""}</p>
        <h2>${escapeHtml(recipe.title)}</h2>
        <p>${escapeHtml(recipe.intro)}</p>
        <div class="detail-stats">
          <span><strong>${recipe.calories || "-"}</strong>kcal</span>
          <span><strong>${recipe.protein || "-"}</strong>g 단백질</span>
          <span><strong>${recipe.time}</strong>분</span>
          <span><strong>${recipe.servings}</strong>인분</span>
        </div>
        <h3>재료</h3>
        <ul class="ingredient-list">
          ${recipe.ingredients.map((item) => `
            <li>
              <span>${escapeHtml(item)}</span>
              <button type="button" data-add-shopping="${escapeAttribute(item)}">추가</button>
            </li>
          `).join("")}
        </ul>
        <h3>조리 순서</h3>
        <ol class="step-list">
          ${recipe.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
        </ol>
      </div>
    </div>
  `;

  $$("[data-add-shopping]").forEach((button) => {
    button.addEventListener("click", () => addShopping(button.dataset.addShopping));
  });
}

function renderCategoryOptions() {
  const categories = [...new Set(state.recipes.map((recipe) => recipe.category).filter(Boolean))];
  const select = $("#categoryFilter");
  const current = select.value;
  select.innerHTML = `<option value="">전체</option>${categories.map((category) => `<option value="${escapeAttribute(category)}">${escapeHtml(category)}</option>`).join("")}`;
  select.value = categories.includes(current) ? current : "";

  const list = $("#categoryList");
  if (!categories.length) {
    list.innerHTML = `<p class="muted">API 레시피가 로드되면 분류가 표시됩니다.</p>`;
    return;
  }

  list.innerHTML = categories
    .map((category) => `<button type="button" data-category="${escapeAttribute(category)}">${escapeHtml(category)}</button>`)
    .join("");

  $$("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      $("#categoryFilter").value = button.dataset.category;
      submitSearch();
    });
  });
}

function renderShopping() {
  const list = $("#shoppingList");
  if (!state.shopping.length) {
    list.innerHTML = `<li class="muted">장보기 목록이 비어 있습니다.</li>`;
    return;
  }

  list.innerHTML = state.shopping
    .map((item) => `
      <li>
        <span>${escapeHtml(item)}</span>
        <button type="button" data-remove-shopping="${escapeAttribute(item)}">삭제</button>
      </li>
    `)
    .join("");

  $$("[data-remove-shopping]").forEach((button) => {
    button.addEventListener("click", () => {
      state.shopping = state.shopping.filter((item) => item !== button.dataset.removeShopping);
      saveJson(storageKeys.shopping, state.shopping);
      renderShopping();
    });
  });
}

function renderSaved() {
  const container = $("#savedList");
  const savedRecipes = Array.from(state.saved)
    .map((id) => state.recipes.find((recipe) => recipe.id === id))
    .filter(Boolean);

  if (!savedRecipes.length) {
    container.innerHTML = `<div class="empty-state">저장한 API 레시피가 없습니다.</div>`;
    return;
  }

  container.innerHTML = savedRecipes
    .map((recipe) => `
      <button type="button" class="saved-card" data-open-saved="${recipe.id}">
        <strong>${escapeHtml(recipe.title)}</strong>
        <span>${escapeHtml(recipe.category)} · ${recipe.calories || "-"}kcal</span>
      </button>
    `)
    .join("");

  $$("[data-open-saved]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedRecipeId = button.dataset.openSaved;
      renderDetail();
      $("#recipeDetail").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function submitSearch() {
  loadRecipes({
    query: $("#queryInput").value.trim(),
    ingredient: $("#ingredientInput").value.trim(),
    category: $("#categoryFilter").value
  });
}

function addShopping(item) {
  if (!state.shopping.includes(item)) {
    state.shopping.push(item);
    saveJson(storageKeys.shopping, state.shopping);
    renderShopping();
    showToast("장보기 목록에 추가했습니다.");
  }
}

function toggleSaved(id) {
  if (state.saved.has(id)) {
    state.saved.delete(id);
    showToast("저장을 해제했습니다.");
  } else {
    state.saved.add(id);
    showToast("레시피를 저장했습니다.");
  }
  saveJson(storageKeys.saved, Array.from(state.saved));
  renderRecipeGrid();
  renderSaved();
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2000);
}

function shortText(value, limit) {
  const text = String(value || "");
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function bindEvents() {
  $("#heroSearchForm").addEventListener("submit", (event) => {
    event.preventDefault();
    $("#queryInput").value = $("#heroQuery").value.trim();
    submitSearch();
    $("#latest").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  $("#searchForm").addEventListener("submit", (event) => {
    event.preventDefault();
    submitSearch();
  });

  $("#clearShopping").addEventListener("click", () => {
    state.shopping = [];
    saveJson(storageKeys.shopping, state.shopping);
    renderShopping();
  });

  $("#clearSaved").addEventListener("click", () => {
    state.saved.clear();
    saveJson(storageKeys.saved, []);
    renderRecipeGrid();
    renderSaved();
  });
}

function init() {
  bindEvents();
  renderShopping();
  renderSaved();
  loadRecipes();
}

init();
