const mealKey = "teenclimate.meals";
const goalKey = "teenclimate.goals";
const uiKey = "teenclimate.ui";
const activityKey = "teenclimate.activities";
const meals = JSON.parse(localStorage.getItem(mealKey) || "[]");
const goals = JSON.parse(localStorage.getItem(goalKey) || '{"carbon":5,"minutes":150,"calories":2000,"lowMeals":7}');
const uiSettings = JSON.parse(localStorage.getItem(uiKey) || '{"theme":"light","viewport":"desktop"}');
const mealCarbonMeta = {
  low: { label: "저탄소", color: "#1f8a5b" },
  middle: { label: "보통", color: "#f2c14e" },
  high: { label: "고탄소", color: "#c96b4b" },
};
const q = (selector) => document.querySelector(selector);
function toast(message) {
  const target = q("#toast");
  if (!target) return;
  target.textContent = message;
  target.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => target.classList.remove("show"), 2200);
}
function saveMeals() { localStorage.setItem(mealKey, JSON.stringify(meals.slice(0, 30))); }
function saveGoals() { localStorage.setItem(goalKey, JSON.stringify(goals)); }
function saveUi() { localStorage.setItem(uiKey, JSON.stringify(uiSettings)); }
function applyUi() {
  document.body.classList.toggle("theme-dark", uiSettings.theme === "dark");
  document.body.classList.toggle("view-mobile", uiSettings.viewport === "mobile");
  if (q("#themeToggle")) q("#themeToggle").textContent = uiSettings.theme === "dark" ? "다크" : "화이트";
  if (q("#viewportToggle")) q("#viewportToggle").textContent = uiSettings.viewport === "mobile" ? "모바일" : "PC";
}
function currentActivities() { return JSON.parse(localStorage.getItem(activityKey) || "[]"); }
function addMeal() {
  const name = q("#mealName").value.trim();
  if (!name) return toast("식단 메뉴를 입력해주세요.");
  meals.unshift({ date: new Date().toLocaleDateString("ko-KR"), type: q("#mealType").value, name, calories: Number(q("#mealCalories").value) || 0, carbon: q("#mealCarbon").value });
  q("#mealName").value = "";
  saveMeals();
  renderDashboard();
  toast("식단 기록을 저장했습니다.");
}
function stats() {
  const activities = currentActivities();
  const carbon = activities.reduce((sum, item) => sum + ((Number(item.distance) || 0) * 0.19), 0);
  const minutes = activities.reduce((sum, item) => sum + (Number(item.minutes) || 0), 0);
  const calories = meals.reduce((sum, item) => sum + (Number(item.calories) || 0), 0);
  const lowMeals = meals.filter((item) => item.carbon === "low").length;
  const mealCounts = { low: 0, middle: 0, high: 0 };
  meals.forEach((item) => { mealCounts[item.carbon] = (mealCounts[item.carbon] || 0) + 1; });
  return { activities, carbon, minutes, calories, lowMeals, mealCounts };
}
function progress(label, value, goal, unit) {
  const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  return `<div class="progress-row"><div class="progress-label"><span>${label}</span><span>${value.toFixed(unit === "kg" ? 1 : 0)}${unit} / ${goal}${unit}</span></div><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div></div>`;
}
function renderDashboard() {
  if (!q("#dashboard")) return;
  const data = stats();
  q("#mealLog").innerHTML = meals.length ? meals.slice(0, 8).map((meal) => `<article><strong>${meal.type} · ${meal.name}</strong><p>${meal.date} · ${meal.calories}kcal · ${(mealCarbonMeta[meal.carbon] || mealCarbonMeta.middle).label} 식단</p></article>`).join("") : '<p class="empty">아직 저장한 식단 기록이 없습니다.</p>';
  q("#goalCarbon").value = goals.carbon;
  q("#goalMinutes").value = goals.minutes;
  q("#goalCalories").value = goals.calories;
  q("#goalLowMeals").value = goals.lowMeals;
  q("#goalCharts").innerHTML = [progress("탄소 절감", data.carbon, Number(goals.carbon) || 0, "kg"), progress("운동 시간", data.minutes, Number(goals.minutes) || 0, "분"), progress("식단 칼로리", data.calories, Number(goals.calories) || 0, "kcal"), progress("저탄소 식단", data.lowMeals, Number(goals.lowMeals) || 0, "회")].join("");
  q("#goalSummary").innerHTML = `<p><strong>현재 예상 절감:</strong> ${data.carbon.toFixed(1)}kg CO2</p><p><strong>운동 기록:</strong> ${data.minutes}분</p><p><strong>식단 기록:</strong> ${meals.length}회, ${data.calories}kcal</p>`;
  const grouped = {};
  data.activities.forEach((item) => { grouped[item.type] = (grouped[item.type] || 0) + ((Number(item.distance) || 0) * 0.19); });
  const entries = Object.entries(grouped).length ? Object.entries(grouped) : [["기록 없음", 0]];
  const max = Math.max(...entries.map(([, value]) => value), 1);
  q("#activityChart").innerHTML = entries.map(([label, value]) => `<div class="bar-row"><span>${label}</span><div class="bar-track"><span class="bar-fill" style="width:${Math.max(4, (value / max) * 100)}%"></span></div><strong>${value.toFixed(1)}kg</strong></div>`).join("");
  const total = Math.max(1, data.mealCounts.low + data.mealCounts.middle + data.mealCounts.high);
  const low = (data.mealCounts.low / total) * 100;
  const middle = low + (data.mealCounts.middle / total) * 100;
  q("#mealDonut").style.background = `conic-gradient(${mealCarbonMeta.low.color} 0 ${low}%, ${mealCarbonMeta.middle.color} ${low}% ${middle}%, ${mealCarbonMeta.high.color} ${middle}% 100%)`;
  q("#mealLegend").innerHTML = Object.entries(mealCarbonMeta).map(([key, meta]) => `<div class="legend-item"><span><i style="background:${meta.color}"></i> ${meta.label}</span><strong>${data.mealCounts[key] || 0}회</strong></div>`).join("");
}
function saveGoalInputs() {
  goals.carbon = Number(q("#goalCarbon").value) || 0;
  goals.minutes = Number(q("#goalMinutes").value) || 0;
  goals.calories = Number(q("#goalCalories").value) || 0;
  goals.lowMeals = Number(q("#goalLowMeals").value) || 0;
  saveGoals();
  renderDashboard();
  toast("목표치를 저장했습니다.");
}
function renderMap(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return toast("표시할 좌표가 없습니다.");
  q("#mapLat").value = lat.toFixed(6);
  q("#mapLng").value = lng.toFixed(6);
  const delta = 0.01;
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join(",");
  q("#mapFrame").innerHTML = `<iframe title="현재 위치 지도" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}"></iframe>`;
}
function useCurrentLocation() {
  if (!navigator.geolocation) return toast("이 브라우저는 위치 기능을 지원하지 않습니다.");
  navigator.geolocation.getCurrentPosition((pos) => renderMap(pos.coords.latitude, pos.coords.longitude), () => toast("위치 권한을 허용해야 지도를 표시할 수 있습니다."), { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
}
function resetDashboard() {
  meals.splice(0, meals.length);
  localStorage.setItem(activityKey, JSON.stringify([]));
  saveMeals();
  renderDashboard();
  toast("오늘 식단과 운동 기록을 초기화했습니다.");
}
q("#addMealButton")?.addEventListener("click", addMeal);
q("#saveGoalsButton")?.addEventListener("click", saveGoalInputs);
q("#showMapButton")?.addEventListener("click", () => renderMap(Number(q("#mapLat").value), Number(q("#mapLng").value)));
q("#useCurrentMapButton")?.addEventListener("click", useCurrentLocation);
q("#resetDashboardButton")?.addEventListener("click", resetDashboard);
q("#themeToggle")?.addEventListener("click", () => { uiSettings.theme = uiSettings.theme === "dark" ? "light" : "dark"; saveUi(); applyUi(); });
q("#viewportToggle")?.addEventListener("click", () => { uiSettings.viewport = uiSettings.viewport === "mobile" ? "desktop" : "mobile"; saveUi(); applyUi(); });
applyUi();
renderDashboard();
