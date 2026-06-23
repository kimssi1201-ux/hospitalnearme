const form = document.querySelector("#recipeSearchForm");
const grid = document.querySelector("#recipeGrid");
const statusBox = document.querySelector("#statusBox");
const template = document.querySelector("#recipeCardTemplate");
const keywordInput = document.querySelector("#keywordInput");
const ingredientInput = document.querySelector("#ingredientInput");
const categoryInput = document.querySelector("#categoryInput");

function setStatus(message, isError = false) {
  statusBox.textContent = message;
  statusBox.classList.toggle("error", isError);
}

function compact(text, limit = 120) {
  if (!text) return "재료 정보가 준비 중입니다.";
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > limit ? `${clean.slice(0, limit)}...` : clean;
}

function createNutrition(nutrition) {
  const items = [
    ["열량", nutrition?.calories ? `${nutrition.calories} kcal` : "-"],
    ["탄수화물", nutrition?.carbohydrate ? `${nutrition.carbohydrate} g` : "-"],
    ["단백질", nutrition?.protein ? `${nutrition.protein} g` : "-"],
    ["지방", nutrition?.fat ? `${nutrition.fat} g` : "-"],
    ["나트륨", nutrition?.sodium ? `${nutrition.sodium} mg` : "-"],
  ];

  return items.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("");
}

function renderRecipes(items) {
  grid.innerHTML = "";

  if (!items.length) {
    setStatus("검색 결과가 없습니다. 다른 메뉴명이나 재료명으로 검색해보세요.");
    return;
  }

  setStatus(`${items.length}개의 레시피를 불러왔습니다.`);

  items.forEach((recipe) => {
    const card = template.content.firstElementChild.cloneNode(true);
    const image = card.querySelector(".recipe-image");
    const title = card.querySelector("h3");
    const meta = card.querySelector(".recipe-meta");
    const ingredients = card.querySelector(".ingredients");
    const nutrition = card.querySelector(".nutrition");
    const steps = card.querySelector(".steps");

    image.src = recipe.image || "https://placehold.co/800x520?text=Recipe";
    image.alt = `${recipe.name || "레시피"} 이미지`;
    title.textContent = recipe.name || "이름 없는 레시피";
    meta.innerHTML = `<span>${recipe.category || "요리"}</span><span>${recipe.method || "조리법"}</span>`;
    ingredients.textContent = compact(recipe.ingredients, 160);
    nutrition.innerHTML = createNutrition(recipe.nutrition);

    const stepList = Array.isArray(recipe.steps) ? recipe.steps : [];
    if (stepList.length) {
      steps.innerHTML = stepList
        .map((step) => `<li>${step.text}${step.image ? `<img src="${step.image}" alt="조리 과정 이미지" loading="lazy" />` : ""}</li>`)
        .join("");
    } else {
      steps.innerHTML = "<li>조리순서 정보가 준비 중입니다.</li>";
    }

    grid.appendChild(card);
  });
}

async function loadRecipes(params = {}) {
  const query = new URLSearchParams({ count: "12" });

  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });

  setStatus("레시피 데이터를 불러오는 중입니다.");
  grid.innerHTML = "";

  try {
    const response = await fetch(`/api/recipes?${query.toString()}`);
    const data = await response.json();

    if (!response.ok || !data.ok) {
      setStatus(data.message || "레시피 API 설정을 확인해주세요.", true);
      return;
    }

    renderRecipes(data.items || []);
  } catch (error) {
    setStatus("레시피 데이터를 불러오지 못했습니다. 배포 환경과 API 키 설정을 확인해주세요.", true);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  loadRecipes({
    keyword: keywordInput.value.trim(),
    ingredient: ingredientInput.value.trim(),
    category: categoryInput.value,
  });
});

document.querySelectorAll(".quick-tags button").forEach((button) => {
  button.addEventListener("click", () => {
    keywordInput.value = button.dataset.keyword || "";
    ingredientInput.value = button.dataset.ingredient || "";
    categoryInput.value = button.dataset.category || "";
    loadRecipes({
      keyword: keywordInput.value,
      ingredient: ingredientInput.value,
      category: categoryInput.value,
    });
  });
});

loadRecipes({ keyword: "김치" });
