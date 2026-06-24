const calorieFoods = [
  { id: "rice", name: "밥", kcal: 145, carb: 32, protein: 2.7, fat: 0.3 },
  { id: "chicken-breast", name: "닭가슴살", kcal: 165, carb: 0, protein: 31, fat: 3.6 },
  { id: "tofu", name: "두부", kcal: 80, carb: 2, protein: 8, fat: 4.5 },
  { id: "egg", name: "달걀", kcal: 155, carb: 1.1, protein: 13, fat: 11 },
  { id: "pork", name: "돼지고기", kcal: 242, carb: 0, protein: 27, fat: 14 },
  { id: "beef", name: "소고기", kcal: 250, carb: 0, protein: 26, fat: 15 },
  { id: "mackerel", name: "고등어", kcal: 205, carb: 0, protein: 19, fat: 14 },
  { id: "potato", name: "감자", kcal: 77, carb: 17, protein: 2, fat: 0.1 },
  { id: "kimchi", name: "김치", kcal: 21, carb: 4, protein: 1.7, fat: 0.3 },
  { id: "onion", name: "양파", kcal: 40, carb: 9.3, protein: 1.1, fat: 0.1 },
  { id: "carrot", name: "당근", kcal: 41, carb: 10, protein: 0.9, fat: 0.2 },
  { id: "apple", name: "사과", kcal: 52, carb: 14, protein: 0.3, fat: 0.2 },
  { id: "noodle", name: "삶은 면", kcal: 138, carb: 25, protein: 4.5, fat: 2.1 },
  { id: "milk", name: "우유", kcal: 61, carb: 4.8, protein: 3.2, fat: 3.3 },
  { id: "cheese", name: "치즈", kcal: 402, carb: 1.3, protein: 25, fat: 33 },
  { id: "olive-oil", name: "올리브오일", kcal: 884, carb: 0, protein: 0, fat: 100 },
  { id: "sugar", name: "설탕", kcal: 387, carb: 100, protein: 0, fat: 0 },
  { id: "flour", name: "밀가루", kcal: 364, carb: 76, protein: 10, fat: 1 }
];

const calorieState = {
  items: []
};

function calorieNumber(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function calorieRound(value) {
  return Math.round(value * 10) / 10;
}

function calorieByGram(food, grams) {
  const ratio = grams / 100;
  return {
    ...food,
    grams,
    kcal: calorieRound(food.kcal * ratio),
    carb: calorieRound(food.carb * ratio),
    protein: calorieRound(food.protein * ratio),
    fat: calorieRound(food.fat * ratio)
  };
}

function getSelectedCalorieFood() {
  const select = document.querySelector("#calorieFood");
  const selected = calorieFoods.find((food) => food.id === select.value);
  if (selected) return selected;

  return {
    id: `custom-${Date.now()}`,
    name: document.querySelector("#customFoodName").value.trim() || "직접 입력 재료",
    kcal: calorieNumber(document.querySelector("#customKcal").value),
    carb: calorieNumber(document.querySelector("#customCarb").value),
    protein: calorieNumber(document.querySelector("#customProtein").value),
    fat: calorieNumber(document.querySelector("#customFat").value)
  };
}

function renderCalorieOptions() {
  const select = document.querySelector("#calorieFood");
  if (!select) return;

  select.innerHTML = [
    ...calorieFoods.map((food) => `<option value="${food.id}">${food.name} · 100g ${food.kcal}kcal</option>`),
    `<option value="custom">직접 입력한 재료</option>`
  ].join("");
}

function renderCalorieTotals() {
  const totalBox = document.querySelector("#calorieTotals");
  const list = document.querySelector("#calorieList");
  const clearButton = document.querySelector("#clearCalories");
  if (!totalBox || !list || !clearButton) return;

  const totals = calorieState.items.reduce(
    (sum, item) => ({
      kcal: sum.kcal + item.kcal,
      carb: sum.carb + item.carb,
      protein: sum.protein + item.protein,
      fat: sum.fat + item.fat
    }),
    { kcal: 0, carb: 0, protein: 0, fat: 0 }
  );

  totalBox.innerHTML = `
    <span><strong>${calorieRound(totals.kcal)}</strong>kcal</span>
    <span><strong>${calorieRound(totals.carb)}</strong>g 탄수화물</span>
    <span><strong>${calorieRound(totals.protein)}</strong>g 단백질</span>
    <span><strong>${calorieRound(totals.fat)}</strong>g 지방</span>
  `;

  if (!calorieState.items.length) {
    list.innerHTML = `<li><span>계산할 재료를 추가해 주세요.</span></li>`;
    clearButton.hidden = true;
    return;
  }

  clearButton.hidden = false;
  list.innerHTML = calorieState.items.map((item, index) => `
    <li>
      <span>
        <strong>${item.name}</strong>
        ${item.grams}g · ${item.kcal}kcal · 탄 ${item.carb}g · 단 ${item.protein}g · 지 ${item.fat}g
      </span>
      <button type="button" aria-label="${item.name} 삭제" data-remove-calorie="${index}">×</button>
    </li>
  `).join("");

  list.querySelectorAll("[data-remove-calorie]").forEach((button) => {
    button.addEventListener("click", () => {
      calorieState.items.splice(Number(button.dataset.removeCalorie), 1);
      renderCalorieTotals();
    });
  });
}

function bindCalorieCalculator() {
  const form = document.querySelector("#calorieForm");
  const amount = document.querySelector("#calorieAmount");
  const clearButton = document.querySelector("#clearCalories");
  if (!form || !amount || !clearButton) return;

  renderCalorieOptions();
  renderCalorieTotals();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const grams = Math.max(1, calorieNumber(amount.value));
    const food = getSelectedCalorieFood();

    if (!food.kcal && food.id.startsWith("custom")) {
      if (typeof showToast === "function") showToast("직접 입력 재료는 100g당 kcal를 입력해 주세요.");
      return;
    }

    calorieState.items.push(calorieByGram(food, grams));
    renderCalorieTotals();
  });

  clearButton.addEventListener("click", () => {
    calorieState.items = [];
    renderCalorieTotals();
  });
}

bindCalorieCalculator();
