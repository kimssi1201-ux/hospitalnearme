function buildRecipeExtra(recipe) {
  const title = `${recipe.title || ""}`;
  const category = `${recipe.category || "집밥"}`;
  const method = `${recipe.method || ""}`;
  const ingredients = (recipe.ingredients || []).join(" ");
  const searchable = `${title} ${category} ${method} ${ingredients}`;
  const time = Number(recipe.time || 30);
  const calories = Number.parseFloat(recipe.calories || nutritionValue(recipe, "calories"));
  const protein = Number.parseFloat(recipe.protein || nutritionValue(recipe, "protein"));
  const sodium = Number.parseFloat(nutritionValue(recipe, "sodium"));
  const isSoup = /국|탕|찌개|전골|해장/.test(searchable);
  const isSide = /반찬|무침|샐러드|소스|절임/.test(searchable);
  const isRice = /밥|죽|덮밥|비빔/.test(searchable);
  const isNoodle = /면|국수|파스타|라면/.test(searchable);
  const isChicken = /닭|치킨/.test(searchable);
  const isPork = /돼지|삼겹|목살/.test(searchable);
  const isTofu = /두부/.test(searchable);
  const isKimchi = /김치/.test(searchable);

  const difficulty = time <= 20 || (recipe.steps || []).length <= 4
    ? "초보도 쉬움"
    : time >= 45 || (recipe.steps || []).length >= 8
      ? "차근차근 요리"
      : "보통";

  const cookingPoint = isSoup
    ? "국물 요리는 처음엔 센 불로 끓이고, 재료가 익은 뒤 중약불로 줄이면 맛이 더 부드러워집니다."
    : isSide
      ? "무침과 샐러드는 양념을 한 번에 다 넣기보다 조금씩 더하면 짜지 않고 산뜻하게 맞출 수 있습니다."
      : isRice
        ? "밥 요리는 수분이 많아지지 않게 재료의 물기를 가볍게 제거한 뒤 섞으면 식감이 좋아집니다."
        : "불 조절을 급하게 하지 말고, 재료가 익는 순서대로 넣으면 맛과 식감이 안정됩니다.";

  const substitute = isChicken
    ? "닭고기는 닭가슴살, 안심, 닭다리살로 바꿔도 좋고 담백하게 먹고 싶다면 두부를 조금 곁들여도 좋습니다."
    : isPork
      ? "돼지고기는 앞다리살이나 목살로 바꿔도 무난하고, 기름기를 줄이고 싶다면 살코기 위주로 준비하세요."
      : isTofu
        ? "두부는 부침용을 쓰면 단단하고, 부드러운 식감을 원하면 찌개용 두부를 사용해도 좋습니다."
        : isKimchi
          ? "김치는 신맛이 강하면 물에 살짝 헹구거나 설탕을 아주 조금 더해 맛을 정리할 수 있습니다."
          : "같은 식감의 채소나 단백질 재료로 바꿔도 좋습니다. 단, 간은 마지막에 한 번 더 확인하세요.";

  const storage = isSide
    ? "무침류와 샐러드는 가능한 당일에 먹는 것이 가장 좋고, 남으면 밀폐 용기에 담아 냉장 보관하세요."
    : isSoup
      ? "국물 요리는 한 김 식힌 뒤 밀폐 용기에 담아 냉장 보관하고, 다시 데울 때는 한 번 충분히 끓여주세요."
      : "남은 음식은 충분히 식힌 뒤 밀폐 용기에 담아 냉장 보관하고, 먹기 전 냄새와 상태를 확인하세요.";

  const pairing = isSoup
    ? "담백한 밥, 나물 반찬, 김치와 잘 어울립니다."
    : isSide
      ? "따뜻한 밥, 국물 요리, 달걀 요리와 곁들이기 좋습니다."
      : isNoodle
        ? "가벼운 샐러드나 피클처럼 산뜻한 반찬을 곁들이면 균형이 좋습니다."
        : "김치, 장아찌, 맑은 국처럼 맛을 정리해주는 반찬과 잘 맞습니다.";

  const nutritionNote = Number.isFinite(sodium) && sodium >= 600
    ? "나트륨이 높은 편이라 국물이나 양념은 기호에 맞게 조절해 주세요."
    : Number.isFinite(protein) && protein >= 15
      ? "단백질을 챙기기 좋은 메뉴라 한 끼 식사로 활용하기 좋습니다."
      : Number.isFinite(calories) && calories <= 200
        ? "열량이 비교적 가벼운 편이라 부담 없는 반찬이나 곁들임 메뉴로 좋습니다."
        : "영양 정보는 1인분 기준 추정치이므로 재료 양에 따라 달라질 수 있습니다.";

  const tags = [
    time <= 20 ? "빠른 요리" : "집밥 메뉴",
    difficulty,
    isSoup ? "국물 요리" : isSide ? "반찬 추천" : category,
    Number.isFinite(calories) && calories <= 200 ? "가벼운 메뉴" : "든든한 한 끼",
  ];

  return {
    difficulty,
    cookingPoint,
    substitute,
    storage,
    pairing,
    nutritionNote,
    tags,
    faqs: [
      {
        question: "미리 만들어도 괜찮나요?",
        answer: isSide
          ? "무침이나 샐러드류는 시간이 지나면 물이 생길 수 있어 먹기 직전에 버무리는 편이 좋습니다."
          : "대부분 미리 만들어도 괜찮지만, 다시 데울 때는 중약불에서 천천히 데우면 맛이 덜 흐트러집니다.",
      },
      {
        question: "간이 강하면 어떻게 조절하나요?",
        answer: isSoup
          ? "물을 조금 더 넣고 한 번 끓인 뒤, 부족한 향은 대파나 마늘처럼 향채소로 보완해보세요."
          : "양념이 강하면 채소나 두부처럼 담백한 재료를 조금 더 넣어 균형을 맞추면 좋습니다.",
      },
      {
        question: "아이와 함께 먹을 수 있나요?",
        answer: /고추|매운|청양|김치/.test(searchable)
          ? "매운 재료는 줄이고, 양념을 덜어낸 뒤 아이 몫은 따로 간을 약하게 맞추는 것을 추천합니다."
          : "간을 조금 약하게 맞추면 아이 반찬이나 가족 식사로도 활용하기 좋습니다.",
      },
    ],
  };
}

renderDetail = function renderDetail() {
  const recipe = getRecipe(state.selectedRecipeId);
  const detail = $("#recipeDetail");

  if (!recipe) {
    detail.innerHTML = `
      <p class="eyebrow">레시피 상세 🍳</p>
      <h2 id="detailTitle">레시피를 선택하세요</h2>
      <p>검색 결과가 들어오면 상세 조리법, 재료, 팁이 이곳에 표시됩니다.</p>
    `;
    return;
  }

  const related = state.recipes
    .filter((item) => item.id !== recipe.id && item.category === recipe.category)
    .slice(0, 4);
  const extra = buildRecipeExtra(recipe);

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
          <a href="#detailExtra">요리 정보</a>
          <a href="#detailFaq">질문</a>
        </div>
      </header>

      <div class="detail-media detail-article-media">${renderImage(recipe)}</div>

      <div class="detail-article-grid">
        <div class="detail-story">
          <section class="detail-story-section" id="detailIntro">
            <p class="eyebrow">요리 노트 📝</p>
            <h3>이 레시피 소개</h3>
            <p>${escapeHtml(recipe.intro || "오늘 식탁에 올리기 좋은 집밥 레시피입니다.")}</p>
          </section>

          <section class="detail-story-section" id="detailIngredients">
            <p class="eyebrow">재료 준비 🧄</p>
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
            <p class="eyebrow">만드는 법 🍳</p>
            <h3>조리 순서</h3>
            <ol class="step-list">
              ${recipe.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
            </ol>
          </section>

          <section class="detail-story-section" id="detailTips">
            <p class="eyebrow">요리 팁 ✨</p>
            <h3>맛있게 만드는 팁</h3>
            <p>${escapeHtml(extra.cookingPoint)}</p>
          </section>

          <section class="detail-story-section recipe-extra-section" id="detailExtra">
            <p class="eyebrow">더 맛있게 먹는 정보 🍚</p>
            <h3>조리 전 알아두면 좋은 점</h3>
            <div class="recipe-extra-grid">
              <article>
                <span>난이도</span>
                <strong>${escapeHtml(extra.difficulty)}</strong>
                <p>처음 만드는 메뉴라면 재료를 먼저 손질해두고 시작하면 훨씬 편합니다.</p>
              </article>
              <article>
                <span>대체 재료</span>
                <strong>재료가 없을 때</strong>
                <p>${escapeHtml(extra.substitute)}</p>
              </article>
              <article>
                <span>보관 방법</span>
                <strong>남았을 때</strong>
                <p>${escapeHtml(extra.storage)}</p>
              </article>
              <article>
                <span>곁들이기</span>
                <strong>어울리는 메뉴</strong>
                <p>${escapeHtml(extra.pairing)}</p>
              </article>
            </div>
            <div class="recipe-tag-row" aria-label="레시피 특징">
              ${extra.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
            </div>
          </section>

          <section class="detail-story-section recipe-faq-section" id="detailFaq">
            <p class="eyebrow">자주 묻는 질문 💬</p>
            <h3>요리할 때 궁금한 점</h3>
            <div class="recipe-faq-list">
              ${extra.faqs.map((item) => `
                <details>
                  <summary>${escapeHtml(item.question)}</summary>
                  <p>${escapeHtml(item.answer)}</p>
                </details>
              `).join("")}
            </div>
          </section>
        </div>

        <aside class="recipe-summary-card" aria-label="레시피 요약">
          <h3>레시피 요약 🍽️</h3>
          <div class="detail-stats">
            <span><strong>${recipe.time || 30}</strong>분</span>
            <span><strong>${recipe.servings || 2}</strong>인분</span>
            <span><strong>${recipe.calories || "-"}</strong>kcal</span>
            <span><strong>${recipe.protein || "-"}</strong>g 단백질</span>
          </div>
          <section class="nutrition-panel" id="detailNutrition" aria-label="열량 및 영양 정보">
            <h3>열량 및 영양 정보 🥗</h3>
            <div>
              <span><strong>${escapeHtml(recipe.calories || nutritionValue(recipe, "calories") || "-")}</strong>kcal 열량</span>
              <span><strong>${escapeHtml(nutritionValue(recipe, "carbohydrate") || "-")}</strong>g 탄수화물</span>
              <span><strong>${escapeHtml(recipe.protein || nutritionValue(recipe, "protein") || "-")}</strong>g 단백질</span>
              <span><strong>${escapeHtml(nutritionValue(recipe, "fat") || "-")}</strong>g 지방</span>
              <span><strong>${escapeHtml(nutritionValue(recipe, "sodium") || "-")}</strong>mg 나트륨</span>
            </div>
          </section>
          <section class="nutrition-note" aria-label="영양 해석">
            <strong>한 줄 영양 메모</strong>
            <p>${escapeHtml(extra.nutritionNote)}</p>
          </section>
        </aside>
      </div>

      <section class="detail-story-section detail-related">
        <p class="eyebrow">추천 레시피 📌</p>
        <h3>함께 보면 좋은 레시피</h3>
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
