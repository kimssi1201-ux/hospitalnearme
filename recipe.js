const storageKeys = {
  saved: "apiRecipeKitchen.saved",
  shopping: "apiRecipeKitchen.shopping"
};

const foodSafetyApi = {
  name: "COOKRCP01",
  host: "https://openapi.foodsafetykorea.go.kr/api"
};

const categoryPresets = [
  { label: "한식", hint: "집밥 기본", icon: "밥", query: "밥" },
  { label: "국/찌개", hint: "따뜻한 국물", icon: "국", category: "국&찌개" },
  { label: "반찬", hint: "매일 식탁", icon: "찬", category: "반찬" },
  { label: "면요리", hint: "간단한 한 그릇", icon: "면", query: "면" },
  { label: "다이어트", hint: "가벼운 한 끼", icon: "샐", query: "두부" },
  { label: "간식", hint: "아이와 함께", icon: "간", query: "간식" },
  { label: "디저트", hint: "달콤한 마무리", icon: "디", query: "과일" },
  { label: "아이 반찬", hint: "순한 메뉴", icon: "아", query: "달걀" },
  { label: "30분 요리", hint: "바쁜 날 추천", icon: "30", query: "찌개" },
  { label: "냉장고 재료", hint: "있는 재료 활용", icon: "냉", query: "감자" }
];

const collectionPresets = [
  { title: "바쁜 날 30분 요리", desc: "끓이기, 찌기처럼 빠르게 완성하기 좋은 메뉴를 모았습니다.", query: "찌개" },
  { title: "초보도 쉬운 집밥", desc: "과정이 짧고 재료가 익숙한 레시피를 먼저 살펴보세요.", query: "두부" },
  { title: "냉장고 재료로 만드는 요리", desc: "김치, 감자, 달걀처럼 자주 있는 재료를 활용합니다.", query: "김치" },
  { title: "아이 반찬 추천", desc: "자극을 줄이고 식탁에 곁들이기 좋은 반찬 아이디어입니다.", category: "반찬" }
];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const state = {
  recipes: [],
  selectedRecipeId: "",
  saved: new Set(readJson(storageKeys.saved, [])),
  shopping: readJson(storageKeys.shopping, []),
  status: "idle",
  lastQuery: "",
  lastIngredient: "",
  activePreset: ""
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
    title: recipe.title || recipe.name || "레시피",
    category: recipe.category || recipe.method || "레시피",
    method: recipe.method || "",
    time: Number(recipe.time) || 30,
    servings: Number(recipe.servings) || 2,
    calories: Number(recipe.calories) || numberFrom(recipe.nutrition?.calories),
    protein: Number(recipe.protein) || numberFrom(recipe.nutrition?.protein),
    image: normalizeImageUrl(recipe.image || recipe.thumbnail || ""),
    intro: recipe.intro || recipe.tip || "소개 문구가 준비 중인 레시피입니다.",
    tags: Array.isArray(recipe.tags) ? recipe.tags.filter(Boolean).slice(0, 5) : [],
    ingredients: ingredients.length ? ingredients : ["재료 정보가 아직 준비되지 않았습니다."],
    steps: steps.length ? steps : ["조리 과정이 아직 준비되지 않았습니다."],
    nutrition: recipe.nutrition || {},
    source: recipe.source || "api"
  };
}

function normalizeFoodSafetyRecipe(row, index) {
  const steps = [];
  for (let i = 1; i <= 20; i += 1) {
    const text = String(row[`MANUAL${String(i).padStart(2, "0")}`] || "").trim();
    if (text) steps.push(text);
  }

  const category = row.RCP_PAT2 || "레시피";
  return {
    id: `foodsafety-${row.RCP_SEQ || index}`.replace(/[^a-zA-Z0-9가-힣-]/g, "-"),
    title: row.RCP_NM || "레시피",
    category,
    method: row.RCP_WAY2 || "",
    time: 30,
    servings: 2,
    calories: numberFrom(row.INFO_ENG),
    protein: numberFrom(row.INFO_PRO),
    image: normalizeImageUrl(row.ATT_FILE_NO_MAIN || row.ATT_FILE_NO_MK || ""),
    intro: row.RCP_NA_TIP || `${category} 방식으로 정리된 레시피입니다.`,
    tags: [row.RCP_PAT2, row.RCP_WAY2, row.HASH_TAG].filter(Boolean).slice(0, 5),
    ingredients: splitIngredientText(row.RCP_PARTS_DTLS),
    steps: steps.length ? steps : ["조리 순서가 아직 준비되지 않았습니다."],
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

function normalizeImageUrl(value) {
  return String(value || "").replace("http://www.foodsafetykorea.go.kr", "https://www.foodsafetykorea.go.kr");
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

async function loadRecipes({ query = "", ingredient = "", category = "", preset = "" } = {}) {
  state.status = "loading";
  state.lastQuery = query;
  state.lastIngredient = ingredient;
  state.activePreset = preset;
  renderStatus();
  renderLoading();

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

  const hasLocalFilter = Boolean(query || ingredient || category);
  const endpoint = `${foodSafetyApi.host}/${key}/${foodSafetyApi.name}/json/1/${hasLocalFilter ? 999 : 12}`;
  const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("direct_api_failed");

  const data = await response.json();
  const body = data[foodSafetyApi.name] || {};
  const rows = Array.isArray(body.row) ? body.row : [];
  const filteredRows = filterFoodSafetyRows(rows, { query, ingredient, category });
  return {
    ok: true,
    source: "foodsafetykorea",
    totalCount: hasLocalFilter ? filteredRows.length : Number(body.total_count || rows.length || 0),
    recipes: filteredRows.slice(0, 12),
    items: filteredRows.slice(0, 12)
  };
}

function filterFoodSafetyRows(rows, { query, ingredient, category }) {
  const queryNeedle = normalizeSearchText(query);
  const ingredientNeedle = normalizeSearchText(ingredient);
  const categoryNeedle = normalizeSearchText(category);

  return rows.filter((row) => {
    const title = normalizeSearchText(row.RCP_NM);
    const parts = normalizeSearchText(row.RCP_PARTS_DTLS);
    const rowCategory = normalizeSearchText(row.RCP_PAT2);
    const method = normalizeSearchText(row.RCP_WAY2);
    const tags = normalizeSearchText(row.HASH_TAG);

    const queryMatch = !queryNeedle || [title, parts, rowCategory, method, tags].some((value) => value.includes(queryNeedle));
    const ingredientMatch = !ingredientNeedle || parts.includes(ingredientNeedle);
    const categoryMatch = !categoryNeedle || rowCategory.includes(categoryNeedle);

    return queryMatch && ingredientMatch && categoryMatch;
  });
}

function normalizeSearchText(value) {
  return String(value || "").replace(/\s+/g, "").toLowerCase();
}

function renderAll() {
  renderStatus();
  renderHeroPicks();
  renderCategories();
  renderRecipeGrid();
  renderPopular();
  renderCollections();
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
    summary.textContent = "레시피 준비 중";
    summaryText.textContent = "잘 어울리는 레시피를 불러오고 있습니다.";
    resultCount.textContent = "레시피 준비 중";
    return;
  }

  if (state.status === "error") {
    summary.textContent = "레시피를 불러오지 못했습니다";
    summaryText.textContent = "잠시 뒤 다시 검색해 주세요.";
    resultCount.textContent = "검색 결과 없음";
    return;
  }

  if (state.status === "unconfigured") {
    summary.textContent = "레시피 준비 중";
    summaryText.textContent = "레시피 정보를 확인하는 중입니다. 잠시 뒤 다시 시도해 주세요.";
    resultCount.textContent = "레시피 준비 중";
    return;
  }

  summary.textContent = count ? `${count}개 추천` : "레시피 없음";
  summaryText.textContent = count
    ? "추천 레시피를 카드와 상세 보기로 정리했습니다."
    : "검색어를 바꿔 다시 불러와 보세요.";
  resultCount.textContent = `${count}개 레시피`;
}

function renderLoading() {
  const loadingCards = Array.from({ length: 6 }, () => `<div class="loading-card" aria-hidden="true"></div>`).join("");
  $("#recipeGrid").innerHTML = loadingCards;
  $("#popularList").innerHTML = `<div class="empty-state">인기 레시피를 정리하고 있습니다.</div>`;
  $("#heroPicks").innerHTML = `<div class="empty-state">추천 레시피를 불러오는 중입니다.</div>`;
}

function renderHeroPicks() {
  const container = $("#heroPicks");
  const picks = state.recipes.filter((recipe) => recipe.image).slice(0, 3);

  if (!picks.length) {
    container.innerHTML = `<div class="empty-state">추천 레시피가 준비되면 이곳에 표시됩니다.</div>`;
    return;
  }

  container.innerHTML = picks.map((recipe) => `
    <button class="hero-pick" type="button" data-open="${escapeAttribute(recipe.id)}">
      ${renderImage(recipe)}
      <span>
        <strong>${escapeHtml(recipe.title)}</strong>
        <span>${escapeHtml(recipe.category)} · ${recipe.calories || "-"}kcal</span>
      </span>
    </button>
  `).join("");

  bindOpenButtons(container);
}

function renderCategories() {
  const list = $("#categoryList");
  list.innerHTML = categoryPresets.map((preset) => `
    <button
      class="category-button ${state.activePreset === preset.label ? "is-active" : ""}"
      type="button"
      data-preset="${escapeAttribute(preset.label)}"
      data-query="${escapeAttribute(preset.query || "")}"
      data-category="${escapeAttribute(preset.category || "")}"
    >
      <span class="category-icon" aria-hidden="true">${escapeHtml(preset.icon)}</span>
      <span>
        <strong>${escapeHtml(preset.label)}</strong>
        <span>${escapeHtml(preset.hint)}</span>
      </span>
    </button>
  `).join("");

  $$("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      $("#queryInput").value = button.dataset.query || "";
      $("#ingredientInput").value = "";
      $("#categoryFilter").value = button.dataset.category || "";
      loadRecipes({
        query: button.dataset.query || "",
        category: button.dataset.category || "",
        preset: button.dataset.preset
      });
      $("#latest").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  renderCategoryOptions();
}

function renderRecipeGrid() {
  const grid = $("#recipeGrid");

  if (!state.recipes.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <strong>등록된 레시피가 없습니다.</strong>
        <p>검색어를 바꾸거나 잠시 후 다시 시도해 주세요.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = state.recipes.map((recipe) => renderRecipeCard(recipe)).join("");
  bindOpenButtons(grid);
  bindSaveButtons(grid);
}

function renderRecipeCard(recipe, rank = "") {
  const saved = state.saved.has(recipe.id);
  const calories = recipe.calories || nutritionValue(recipe, "calories") || "-";
  const protein = recipe.protein || nutritionValue(recipe, "protein") || "-";
  const sodium = nutritionValue(recipe, "sodium") || "-";
  return `
    <article class="recipe-card">
      <div class="recipe-media">
        ${renderImage(recipe)}
        <span class="time-badge">${recipe.time || 30}분</span>
        ${rank ? `<span class="rank-badge">#${rank}</span>` : ""}
      </div>
      <div class="recipe-card__body">
        <div class="recipe-meta">
          <span>${escapeHtml(recipe.category)}</span>
          ${recipe.method ? `<span>${escapeHtml(recipe.method)}</span>` : ""}
          <span>${recipe.servings || 2}인분</span>
        </div>
        <h3>${escapeHtml(recipe.title)}</h3>
        <p>${escapeHtml(shortText(recipe.intro, 88))}</p>
        <div class="nutrition-summary" aria-label="영양 정보 요약">
          <span><strong>${escapeHtml(calories)}</strong>kcal</span>
          <span><strong>${escapeHtml(protein)}</strong>g 단백질</span>
          <span><strong>${escapeHtml(sodium)}</strong>mg 나트륨</span>
        </div>
        <div class="recipe-tags">
          ${recipe.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
        </div>
        <div class="recipe-card__actions">
          <button type="button" data-open="${escapeAttribute(recipe.id)}">자세히 보기</button>
          <button type="button" class="ghost" data-save="${escapeAttribute(recipe.id)}">${saved ? "저장됨" : "저장"}</button>
        </div>
      </div>
    </article>
  `;
}

function nutritionValue(recipe, key) {
  const value = recipe.nutrition?.[key];
  return value === undefined || value === null || value === "" ? "" : String(value);
}

function renderPopular() {
  const list = $("#popularList");
  const popular = [...state.recipes]
    .sort((a, b) => Number(Boolean(b.image)) - Number(Boolean(a.image)) || (b.protein || 0) - (a.protein || 0))
    .slice(0, 5);

  if (!popular.length) {
    list.innerHTML = `<div class="empty-state">많이 찾는 레시피를 준비하고 있습니다.</div>`;
    return;
  }

  list.innerHTML = popular.map((recipe, index) => `
    <button class="popular-item" type="button" data-open="${escapeAttribute(recipe.id)}">
      <span class="popular-rank">${index + 1}</span>
      ${renderImage(recipe)}
      <span>
        <h3>${escapeHtml(recipe.title)}</h3>
        <p>${escapeHtml(recipe.category)} · ${recipe.calories || "-"}kcal · ${recipe.time || 30}분</p>
      </span>
    </button>
  `).join("");

  bindOpenButtons(list);
}

function renderCollections() {
  const container = $("#collectionList");
  container.innerHTML = collectionPresets.map((collection) => {
    const matches = state.recipes
      .filter((recipe) => {
        const text = normalizeSearchText(`${recipe.title} ${recipe.intro} ${recipe.ingredients.join(" ")} ${recipe.category}`);
        return collection.category
          ? normalizeSearchText(recipe.category).includes(normalizeSearchText(collection.category))
          : text.includes(normalizeSearchText(collection.query));
      })
      .slice(0, 3);

    return `
      <article class="collection-card">
        <p class="eyebrow">Kitchen Guide</p>
        <h3>${escapeHtml(collection.title)}</h3>
        <p>${escapeHtml(collection.desc)}</p>
        <ul>
          ${
            matches.length
              ? matches.map((recipe) => `<li>${escapeHtml(recipe.title)}</li>`).join("")
              : `<li class="muted">검색하면 관련 레시피가 이곳에 채워집니다.</li>`
          }
        </ul>
        <button type="button" data-collection-query="${escapeAttribute(collection.query || "")}" data-collection-category="${escapeAttribute(collection.category || "")}">
          모음 보기
        </button>
      </article>
    `;
  }).join("");

  $$("[data-collection-query]").forEach((button) => {
    button.addEventListener("click", () => {
      $("#queryInput").value = button.dataset.collectionQuery || "";
      $("#ingredientInput").value = "";
      $("#categoryFilter").value = button.dataset.collectionCategory || "";
      loadRecipes({
        query: button.dataset.collectionQuery || "",
        category: button.dataset.collectionCategory || ""
      });
      $("#latest").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function renderImage(recipe) {
  if (recipe.image) {
    return `<img src="${escapeAttribute(recipe.image)}" alt="${escapeAttribute(recipe.title)}" loading="lazy">`;
  }
  return `<span class="image-placeholder" aria-hidden="true">R</span>`;
}

function renderDetail() {
  const recipe = getRecipe(state.selectedRecipeId);
  const detail = $("#recipeDetail");

  if (!recipe) {
    detail.innerHTML = `
      <p class="eyebrow">Recipe Detail</p>
      <h2 id="detailTitle">레시피를 선택하세요</h2>
      <p>검색 결과가 들어오면 상세 조리법, 재료, 팁이 이곳에 표시됩니다.</p>
    `;
    return;
  }

  const related = state.recipes
    .filter((item) => item.id !== recipe.id && item.category === recipe.category)
    .slice(0, 4);

  detail.innerHTML = `
    <div class="detail-layout">
      <div class="detail-media">${renderImage(recipe)}</div>
      <div class="detail-copy">
        <p class="eyebrow">${escapeHtml(recipe.category)}${recipe.method ? ` · ${escapeHtml(recipe.method)}` : ""}</p>
        <h2 id="detailTitle">${escapeHtml(recipe.title)}</h2>
        <p>${escapeHtml(recipe.intro)}</p>
        <div class="detail-stats">
          <span><strong>${recipe.time || 30}</strong>분</span>
          <span><strong>${recipe.servings || 2}</strong>인분</span>
          <span><strong>${recipe.calories || "-"}</strong>kcal</span>
          <span><strong>${recipe.protein || "-"}</strong>g 단백질</span>
        </div>
        <section class="nutrition-panel" aria-label="열량 및 영양 정보">
          <h3>열량 및 영양 정보</h3>
          <div>
            <span><strong>${escapeHtml(recipe.calories || nutritionValue(recipe, "calories") || "-")}</strong>kcal 열량</span>
            <span><strong>${escapeHtml(nutritionValue(recipe, "carbohydrate") || "-")}</strong>g 탄수화물</span>
            <span><strong>${escapeHtml(recipe.protein || nutritionValue(recipe, "protein") || "-")}</strong>g 단백질</span>
            <span><strong>${escapeHtml(nutritionValue(recipe, "fat") || "-")}</strong>g 지방</span>
            <span><strong>${escapeHtml(nutritionValue(recipe, "sodium") || "-")}</strong>mg 나트륨</span>
          </div>
        </section>
        <button class="detail-action" type="button" data-save="${escapeAttribute(recipe.id)}">
          ${state.saved.has(recipe.id) ? "저장됨" : "레시피 저장"}
        </button>
        <h3 class="detail-section-title">재료</h3>
        <ul class="ingredient-list">
          ${recipe.ingredients.map((item) => `
            <li>
              <span>${escapeHtml(item)}</span>
              <button type="button" data-add-shopping="${escapeAttribute(item)}">추가</button>
            </li>
          `).join("")}
        </ul>
        <h3 class="detail-section-title">조리 순서</h3>
        <ol class="step-list">
          ${recipe.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
        </ol>
        <h3 class="detail-section-title">팁 또는 메모</h3>
        <p>${escapeHtml(recipe.intro || "재료 상태에 따라 간과 익힘 정도를 조절해 주세요.")}</p>
        <h3 class="detail-section-title">관련 레시피</h3>
        <div class="related-grid">
          ${
            related.length
              ? related.map((item) => `
                <button class="related-card" type="button" data-open="${escapeAttribute(item.id)}">
                  ${renderImage(item)}
                  <span>
                    <strong>${escapeHtml(item.title)}</strong>
                    <span class="muted">${escapeHtml(item.category)}</span>
                  </span>
                </button>
              `).join("")
              : `<div class="empty-state">관련 레시피가 더 불러와지면 표시됩니다.</div>`
          }
        </div>
      </div>
    </div>
  `;

  bindOpenButtons(detail);
  bindSaveButtons(detail);
  bindShoppingButtons(detail);
}

function renderCategoryOptions() {
  const categories = [...new Set(state.recipes.map((recipe) => recipe.category).filter(Boolean))];
  const select = $("#categoryFilter");
  const current = select.value;
  select.innerHTML = `<option value="">전체</option>${categories.map((category) => `<option value="${escapeAttribute(category)}">${escapeHtml(category)}</option>`).join("")}`;
  select.value = categories.includes(current) ? current : "";
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
    container.innerHTML = `<div class="empty-state">저장한 레시피가 없습니다.</div>`;
    return;
  }

  container.innerHTML = savedRecipes
    .map((recipe) => `
      <button type="button" class="saved-card" data-open="${escapeAttribute(recipe.id)}">
        <strong>${escapeHtml(recipe.title)}</strong>
        <span>${escapeHtml(recipe.category)} · ${recipe.calories || "-"}kcal</span>
      </button>
    `)
    .join("");

  bindOpenButtons(container);
}

function submitSearch() {
  state.activePreset = "";
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
  renderDetail();
}

function bindOpenButtons(root = document) {
  root.querySelectorAll("[data-open]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedRecipeId = button.dataset.open;
      renderDetail();
      $("#recipeDetail").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function bindSaveButtons(root = document) {
  root.querySelectorAll("[data-save]").forEach((button) => {
    button.addEventListener("click", () => toggleSaved(button.dataset.save));
  });
}

function bindShoppingButtons(root = document) {
  root.querySelectorAll("[data-add-shopping]").forEach((button) => {
    button.addEventListener("click", () => addShopping(button.dataset.addShopping));
  });
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
  $("#menuToggle").addEventListener("click", () => {
    const isOpen = $("#navLinks").classList.toggle("open");
    document.body.classList.toggle("nav-open", isOpen);
    $("#menuToggle").setAttribute("aria-expanded", String(isOpen));
  });

  $$("#navLinks a").forEach((link) => {
    link.addEventListener("click", () => {
      $("#navLinks").classList.remove("open");
      document.body.classList.remove("nav-open");
      $("#menuToggle").setAttribute("aria-expanded", "false");
    });
  });

  $("#heroSearchForm").addEventListener("submit", (event) => {
    event.preventDefault();
    $("#queryInput").value = $("#heroQuery").value.trim();
    $("#ingredientInput").value = "";
    $("#categoryFilter").value = "";
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
    renderDetail();
  });
}

function init() {
  bindEvents();
  renderCategories();
  renderShopping();
  renderSaved();
  loadRecipes();
}

init();
