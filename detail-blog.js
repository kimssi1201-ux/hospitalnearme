renderDetail = function renderDetail() {
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
    <article class="detail-article">
      <nav class="detail-breadcrumb" aria-label="레시피 위치">
        <span>레시피</span>
        <span>${escapeHtml(recipe.category)}</span>
        <span>${escapeHtml(recipe.title)}</span>
      </nav>
      <header class="detail-article-header">
        <p class="eyebrow">${escapeHtml(recipe.category)}${recipe.method ? ` · ${escapeHtml(recipe.method)}` : ""}</p>
        <h2 id="detailTitle">${escapeHtml(recipe.title)}</h2>
        <p class="detail-meta">오늘의 레시피 키친 · ${recipe.time || 30}분 · ${recipe.servings || 2}인분</p>
        <p class="detail-lede">${escapeHtml(recipe.intro)}</p>
        <div class="detail-jump-links" aria-label="상세 목차">
          <a href="#detailIngredients">재료</a>
          <a href="#detailSteps">조리 순서</a>
          <a href="#detailNutrition">영양 정보</a>
          <a href="#detailTips">팁</a>
        </div>
      </header>

      <div class="detail-media detail-article-media">${renderImage(recipe)}</div>

      <div class="detail-article-grid">
        <div class="detail-story">
          <section class="detail-story-section" id="detailIntro">
            <p class="eyebrow">Recipe Note</p>
            <h3>이 레시피 소개</h3>
            <p>${escapeHtml(recipe.intro || "오늘 식탁에 올리기 좋은 집밥 레시피입니다.")}</p>
          </section>

          <section class="detail-story-section" id="detailIngredients">
            <p class="eyebrow">Ingredients</p>
            <h3>필요한 재료</h3>
            <ul class="ingredient-list">
              ${recipe.ingredients.map((item) => `
                <li>
                  <span>${escapeHtml(item)}</span>
                </li>
              `).join("")}
            </ul>
          </section>

          <section class="detail-story-section" id="detailSteps">
            <p class="eyebrow">How To Cook</p>
            <h3>조리 순서</h3>
            <ol class="step-list">
              ${recipe.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
            </ol>
          </section>

          <section class="detail-story-section" id="detailTips">
            <p class="eyebrow">Kitchen Tip</p>
            <h3>맛있게 만드는 팁</h3>
            <p>${escapeHtml(recipe.intro || "재료 상태에 따라 간과 익힘 정도를 조절해 주세요.")}</p>
          </section>
        </div>

        <aside class="recipe-summary-card" aria-label="레시피 요약">
          <h3>Recipe Card</h3>
          <div class="detail-stats">
            <span><strong>${recipe.time || 30}</strong>분</span>
            <span><strong>${recipe.servings || 2}</strong>인분</span>
            <span><strong>${recipe.calories || "-"}</strong>kcal</span>
            <span><strong>${recipe.protein || "-"}</strong>g 단백질</span>
          </div>
          <section class="nutrition-panel" id="detailNutrition" aria-label="열량 및 영양 정보">
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
        </aside>
      </div>

      <section class="detail-story-section detail-related">
        <p class="eyebrow">More Recipes</p>
        <h3>관련 레시피</h3>
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
      </section>
    </article>
  `;

  bindOpenButtons(detail);
  bindSaveButtons(detail);
};

renderDetail();
