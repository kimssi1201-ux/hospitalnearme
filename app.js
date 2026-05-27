const challenges = [
  { id: "food-leftover", title: "급식 잔반 0에 가까워지기", category: "food", level: "easy", time: 10, impact: 0.45, badge: "잔반 줄이기", description: "먹을 만큼만 받고 남긴 이유를 기록해 다음 식사 선택을 조정합니다.", steps: ["평소보다 20% 적게 받기", "부족하면 추가 배식 이용하기", "남긴 음식 종류와 이유 기록하기"] },
  { id: "food-menu", title: "저탄소 급식 메뉴 인터뷰", category: "food", level: "hard", time: 40, impact: 1.3, badge: "급식 연구원", description: "영양교사 또는 급식 담당자에게 메뉴 구성 기준을 묻고 학생 제안서를 만듭니다.", steps: ["질문 5개 작성", "가능한 저탄소 메뉴 조사", "학생 의견과 함께 제안서 정리"] },
  { id: "food-snack", title: "간식 포장 줄이기", category: "food", level: "medium", time: 20, impact: 0.35, badge: "포장 줄이기", description: "하루 동안 간식 포장 쓰레기를 기록하고 대체 선택을 찾습니다.", steps: ["간식 포장 개수 세기", "대용량/무포장 대안 찾기", "다음 구매 기준 정하기"] },
  { id: "energy-standby", title: "교실 대기전력 순찰", category: "energy", level: "easy", time: 10, impact: 0.35, badge: "전기 탐정", description: "쉬는 시간이나 하교 전 사용하지 않는 전자기기 전원을 확인합니다.", steps: ["충전기와 멀티탭 확인", "사용하지 않는 화면 끄기", "담당 친구와 체크표 만들기"] },
  { id: "energy-temp", title: "냉난방 온도 지킴이", category: "energy", level: "medium", time: 20, impact: 0.7, badge: "에너지 가디언", description: "교실 온도와 체감 상태를 기록해 무리한 냉난방을 줄입니다.", steps: ["교실 온도 기록", "창문 개폐 상태 확인", "적정 온도 안내문 붙이기"] },
  { id: "energy-audit", title: "우리 반 에너지 감사", category: "energy", level: "hard", time: 40, impact: 1.8, badge: "에너지 감사관", description: "조명, 전자기기, 냉난방 사용을 조사하고 개선안을 발표합니다.", steps: ["사용 시간 조사", "낭비 지점 찾기", "개선 전후 비교표 만들기"] },
  { id: "transport-walk", title: "한 정거장 걷기", category: "transport", level: "medium", time: 20, impact: 0.9, badge: "초록 이동", description: "안전한 구간에서 차량 이동을 줄이고 걷기나 대중교통을 선택합니다.", steps: ["안전한 경로 확인", "친구나 가족에게 계획 알리기", "이동거리 기록"] },
  { id: "transport-map", title: "등하교 탄소 지도", category: "transport", level: "hard", time: 40, impact: 1.6, badge: "이동 데이터 분석가", description: "반 친구들의 이동 방식을 익명으로 조사해 저탄소 이동 대안을 찾습니다.", steps: ["익명 설문 만들기", "도보/대중교통/차량 비율 계산", "개선 아이디어 발표"] },
  { id: "transport-bike", title: "자전거 안전 경로 찾기", category: "transport", level: "medium", time: 20, impact: 0.8, badge: "안전 라이더", description: "무리한 이동 대신 안전한 자전거 가능 구간을 조사합니다.", steps: ["자전거도로 확인", "위험 구간 표시", "대체 경로 공유"] },
  { id: "waste-tumbler", title: "일회용 컵 대신 텀블러", category: "waste", level: "easy", time: 10, impact: 0.25, badge: "다회용 컵", description: "하루 동안 일회용 컵 사용을 피하고 사용하지 않은 컵 수를 기록합니다.", steps: ["텀블러 챙기기", "매점이나 카페에서 사용하기", "피한 일회용품 개수 기록"] },
  { id: "waste-buy", title: "사지 않기 24시간", category: "waste", level: "medium", time: 20, impact: 0.8, badge: "소비 멈춤", description: "꼭 필요하지 않은 물건 구매를 하루 미루고 대안을 찾습니다.", steps: ["사고 싶은 물건 적기", "24시간 뒤 다시 판단", "대여/수리/공유 대안 찾기"] },
  { id: "waste-sort", title: "분리배출 오류 찾기", category: "waste", level: "medium", time: 20, impact: 0.4, badge: "분리배출 코치", description: "교실이나 집에서 자주 틀리는 분리배출 항목을 찾아 안내문을 만듭니다.", steps: ["오염된 재활용품 찾기", "헷갈리는 품목 조사", "3줄 안내문 작성"] },
  { id: "school-poster", title: "학급 기후 행동 포스터", category: "school", level: "hard", time: 40, impact: 2.0, badge: "캠페인 메이커", description: "친구들이 바로 따라 할 수 있는 하나의 행동을 포스터로 제안합니다.", steps: ["행동 하나 정하기", "짧은 문구 만들기", "인증 방법 정하기"] },
  { id: "school-meeting", title: "우리 학교 기후 회의", category: "school", level: "hard", time: 40, impact: 2.4, badge: "기후 리더", description: "급식, 에너지, 쓰레기 중 하나를 골라 학생 제안서를 만듭니다.", steps: ["문제 하나 선택", "학생 의견 모으기", "실행 가능한 제안 3개 작성"] },
  { id: "school-news", title: "기후 뉴스 팩트체크", category: "school", level: "medium", time: 20, impact: 0.2, badge: "기후 리터러시", description: "기후 뉴스의 출처, 기간, 비교 기준을 확인하고 요약합니다.", steps: ["기사 출처 확인", "숫자의 기준 찾기", "친구에게 3문장으로 설명"] },
];

const categoryNames = { food: "급식과 음식", energy: "전기와 에너지", transport: "등하교 이동", waste: "쓰레기와 소비", school: "학교 캠페인" };
const storageKey = "teenclimate.completed";
const journalKey = "teenclimate.journal";
const activityKey = "teenclimate.activities";
const mealKey = "teenclimate.meals";
const goalKey = "teenclimate.goals";
const uiKey = "teenclimate.ui";
const completed = new Set(JSON.parse(localStorage.getItem(storageKey) || "[]"));
const journals = JSON.parse(localStorage.getItem(journalKey) || "[]");
const activities = JSON.parse(localStorage.getItem(activityKey) || "[]");
const meals = JSON.parse(localStorage.getItem(mealKey) || "[]");
const goals = JSON.parse(localStorage.getItem(goalKey) || '{"carbon":5,"minutes":150,"calories":2000,"lowMeals":7}');
const uiSettings = JSON.parse(localStorage.getItem(uiKey) || '{"theme":"light","viewport":"desktop"}');
const $ = (selector) => document.querySelector(selector);
const exerciseMeta = {
  walk: { label: "걷기", met: 3.5, co2PerKm: 0.19 },
  bike: { label: "자전거", met: 6.8, co2PerKm: 0.19 },
  run: { label: "달리기", met: 8.3, co2PerKm: 0.19 },
  hike: { label: "등산/빠른 걷기", met: 6.0, co2PerKm: 0.19 },
};
const gpsState = {
  watchId: null,
  startedAt: null,
  timerId: null,
  lastPosition: null,
  currentPosition: null,
  distanceKm: 0,
};
const mealCarbonMeta = {
  low: { label: "저탄소", score: 1, color: "#1f8a5b" },
  middle: { label: "보통", score: 2, color: "#f2c14e" },
  high: { label: "고탄소", score: 3, color: "#c96b4b" },
};

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function persist() {
  localStorage.setItem(storageKey, JSON.stringify([...completed]));
}

function filteredChallenges() {
  const filter = $("#categoryFilter").value;
  return challenges.filter((item) => filter === "all" || item.category === filter);
}

function renderChallenges() {
  $("#challengeList").innerHTML = filteredChallenges().map((item) => {
    const done = completed.has(item.id);
    return `
      <article class="challenge-card">
        <div class="card-top">
          <div><span>${categoryNames[item.category]}</span><h3>${item.title}</h3></div>
          <strong>${item.impact.toFixed(2)}kg</strong>
        </div>
        <p>${item.description}</p>
        <ol>${item.steps.map((step) => `<li>${step}</li>`).join("")}</ol>
        <button class="${done ? "is-done" : ""}" type="button" data-complete="${item.id}">${done ? "완료됨" : "완료 기록"}</button>
      </article>
    `;
  }).join("");
  renderStats();
}

function renderStats() {
  const doneItems = challenges.filter((item) => completed.has(item.id));
  const impact = doneItems.reduce((sum, item) => sum + item.impact, 0);
  const badges = new Set(doneItems.map((item) => item.badge));
  $("#impactTotal").textContent = `${impact.toFixed(1)}kg`;
  $("#completedCount").textContent = doneItems.length;
  $("#badgeCount").textContent = badges.size;
  $("#badgeGrid").innerHTML = challenges.slice(0, 10).map((item) => `
    <div class="badge ${completed.has(item.id) ? "earned" : ""}">
      <span>${completed.has(item.id) ? "획득" : "대기"}</span>
      <strong>${item.badge}</strong>
    </div>
  `).join("");
}

function renderPlan() {
  $("#weeklyPlan").innerHTML = challenges.slice(0, 7).map((item, index) => `
    <label class="plan-item">
      <input type="checkbox" data-complete="${item.id}" ${completed.has(item.id) ? "checked" : ""} />
      <span>DAY ${index + 1}</span>
      <strong>${item.title}</strong>
    </label>
  `).join("");
}

function recommendChallenge() {
  const interest = $("#interest").value;
  const level = $("#level").value;
  const time = Number($("#time").value);
  const grade = $("#grade").value;
  const candidates = challenges
    .filter((item) => item.category === interest)
    .filter((item) => item.time <= time || level === "hard")
    .sort((a, b) => Number(b.level === level) - Number(a.level === level) || b.impact - a.impact);
  const pick = candidates[0] || challenges.find((item) => item.category === interest) || challenges[0];
  $("#recommendation").innerHTML = `
    <article class="recommend-card">
      <span>${grade} 맞춤 추천</span>
      <h3>${pick.title}</h3>
      <p>${pick.description}</p>
      <div class="meta-row"><span>${categoryNames[pick.category]}</span><span>${pick.time}분</span><span>예상 ${pick.impact.toFixed(2)}kg 절감</span></div>
      <ol>${pick.steps.map((step) => `<li>${step}</li>`).join("")}</ol>
      <button type="button" data-complete="${pick.id}">이 챌린지 완료 기록</button>
    </article>
  `;
}

function renderJournal() {
  $("#journalList").innerHTML = journals.length
    ? journals.map((item) => `<article><strong>${item.date}</strong><p>${item.text}</p></article>`).join("")
    : '<p class="empty">아직 저장한 실천 일지가 없습니다.</p>';
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function haversineKm(a, b) {
  const toRad = (value) => (value * Math.PI) / 180;
  const radius = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const angle = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(angle), Math.sqrt(1 - angle));
}

function calculateCalories(type, weightKg, minutes) {
  const met = exerciseMeta[type]?.met || exerciseMeta.walk.met;
  return Math.round((met * 3.5 * weightKg * minutes) / 200);
}

function updateGpsMetrics() {
  const elapsed = gpsState.startedAt ? Date.now() - gpsState.startedAt : 0;
  const minutes = Math.max(1, elapsed / 60000);
  const type = $("#exerciseType").value;
  const weight = Number($("#weightInput").value) || 55;
  const calories = calculateCalories(type, weight, minutes);
  const speed = elapsed > 0 ? gpsState.distanceKm / (elapsed / 3600000) : 0;
  const co2 = gpsState.distanceKm * (exerciseMeta[type]?.co2PerKm || 0.19);
  $("#gpsDistance").textContent = `${gpsState.distanceKm.toFixed(2)} km`;
  $("#gpsDuration").textContent = formatDuration(elapsed);
  $("#gpsSpeed").textContent = `${speed.toFixed(1)} km/h`;
  $("#gpsCalories").textContent = `${calories} kcal`;
  $("#gpsCarbon").textContent = `자동차 이동을 대신했다면 약 ${co2.toFixed(2)}kg CO2 절감 추정`;
}

function startGpsTracking() {
  if (!navigator.geolocation) {
    showToast("이 브라우저는 GPS 기능을 지원하지 않습니다.");
    return;
  }
  if (gpsState.watchId !== null) {
    showToast("이미 GPS 측정 중입니다.");
    return;
  }
  gpsState.startedAt = Date.now();
  gpsState.distanceKm = 0;
  gpsState.lastPosition = null;
  $("#gpsStatus").textContent = "위치 권한을 확인하는 중입니다.";
  gpsState.timerId = setInterval(updateGpsMetrics, 1000);
  gpsState.watchId = navigator.geolocation.watchPosition(
    (position) => {
      const current = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      gpsState.currentPosition = current;
      if (gpsState.lastPosition) {
        const segment = haversineKm(gpsState.lastPosition, current);
        if (segment < 1) gpsState.distanceKm += segment;
      }
      gpsState.lastPosition = current;
      $("#gpsStatus").textContent = `측정 중 · 정확도 약 ${Math.round(position.coords.accuracy)}m`;
      updateGpsMetrics();
    },
    () => {
      $("#gpsStatus").textContent = "위치 권한이 거부되었거나 GPS를 사용할 수 없습니다.";
      showToast("GPS 권한을 허용해야 실시간 측정이 가능합니다.");
      stopGpsTracking(false);
    },
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 },
  );
}

function stopGpsTracking(saveActivity = true) {
  if (gpsState.watchId !== null) {
    navigator.geolocation.clearWatch(gpsState.watchId);
    gpsState.watchId = null;
  }
  clearInterval(gpsState.timerId);
  gpsState.timerId = null;
  if (saveActivity && gpsState.startedAt) {
    const elapsed = Date.now() - gpsState.startedAt;
    const minutes = Math.max(1, Math.round(elapsed / 60000));
    const type = $("#exerciseType").value;
    const weight = Number($("#weightInput").value) || 55;
    const calories = calculateCalories(type, weight, minutes);
    activities.unshift({
      date: new Date().toLocaleString("ko-KR"),
      type: exerciseMeta[type].label,
      distance: gpsState.distanceKm,
      minutes,
      calories,
    });
    localStorage.setItem(activityKey, JSON.stringify(activities.slice(0, 10)));
    renderActivities();
    renderDashboard();
    showToast("운동 측정을 저장했습니다.");
  }
  gpsState.startedAt = null;
  gpsState.lastPosition = null;
  $("#gpsStatus").textContent = "측정을 중지했습니다.";
  updateGpsMetrics();
}

function renderCalories() {
  const type = $("#exerciseType").value;
  const weight = Number($("#weightInput").value) || 55;
  const minutes = Number($("#minutesInput").value) || 0;
  const distance = Number($("#distanceInput").value) || 0;
  const calories = calculateCalories(type, weight, minutes);
  const co2 = distance * (exerciseMeta[type]?.co2PerKm || 0.19);
  $("#calorieResult").innerHTML = `
    <strong>${exerciseMeta[type].label} ${minutes}분 예상 소모: ${calories} kcal</strong>
    <p>${distance.toFixed(1)}km를 자동차 대신 이동했다면 약 ${co2.toFixed(2)}kg CO2 절감으로 볼 수 있습니다. 칼로리와 탄소 절감량은 개인차와 환경에 따라 달라지는 추정값입니다.</p>
  `;
}

function renderActivities() {
  $("#activityLog").innerHTML = activities.length
    ? activities.map((item) => `<article><strong>${item.type} · ${item.minutes}분 · ${item.calories}kcal</strong><p>${item.date} · ${item.distance.toFixed(2)}km 기록</p></article>`).join("")
    : '<p class="empty">아직 저장한 운동 기록이 없습니다.</p>';
}

function todayString() {
  return new Date().toLocaleDateString("ko-KR");
}

function saveMeals() {
  localStorage.setItem(mealKey, JSON.stringify(meals.slice(0, 30)));
}

function saveGoals() {
  localStorage.setItem(goalKey, JSON.stringify(goals));
}

function saveUiSettings() {
  localStorage.setItem(uiKey, JSON.stringify(uiSettings));
}

function applyUiSettings() {
  uiSettings.theme = "light";
  uiSettings.viewport = "desktop";
  document.documentElement.dataset.theme = "light";
  document.documentElement.style.colorScheme = "light";
  document.body.classList.remove("theme-dark", "view-mobile");

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.setAttribute("content", "#f5f7fb");

  const themeToggle = $("#themeToggle");
  if (themeToggle) {
    themeToggle.remove();
  }

  const viewportToggle = $("#viewportToggle");
  if (viewportToggle) {
    viewportToggle.remove();
  }
}

function addMeal() {
  const name = $("#mealName").value.trim();
  if (!name) {
    showToast("식단 메뉴를 먼저 입력해주세요.");
    return;
  }
  meals.unshift({
    date: todayString(),
    type: $("#mealType").value,
    name,
    calories: Number($("#mealCalories").value) || 0,
    carbon: $("#mealCarbon").value,
  });
  $("#mealName").value = "";
  saveMeals();
  renderDashboard();
  showToast("식단 기록을 저장했습니다.");
}

function renderMeals() {
  $("#mealLog").innerHTML = meals.length
    ? meals.slice(0, 8).map((meal) => {
      const meta = mealCarbonMeta[meal.carbon] || mealCarbonMeta.middle;
      return `<article><strong>${meal.type} · ${meal.name}</strong><p>${meal.date} · ${meal.calories}kcal · ${meta.label} 식단</p></article>`;
    }).join("")
    : '<p class="empty">아직 저장한 식단 기록이 없습니다.</p>';
}

function collectDashboardStats() {
  const challengeCarbon = challenges
    .filter((item) => completed.has(item.id))
    .reduce((sum, item) => sum + item.impact, 0);
  const activityMinutes = activities.reduce((sum, item) => sum + (Number(item.minutes) || 0), 0);
  const activityCarbon = activities.reduce((sum, item) => sum + ((Number(item.distance) || 0) * 0.19), 0);
  const totalCalories = meals.reduce((sum, item) => sum + (Number(item.calories) || 0), 0);
  const lowMeals = meals.filter((item) => item.carbon === "low").length;
  const mealCounts = { low: 0, middle: 0, high: 0 };
  meals.forEach((item) => {
    mealCounts[item.carbon] = (mealCounts[item.carbon] || 0) + 1;
  });
  return {
    carbon: challengeCarbon + activityCarbon,
    activityMinutes,
    totalCalories,
    lowMeals,
    mealCounts,
  };
}

function progressRow(label, value, goal, unit) {
  const ratio = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  return `
    <div class="progress-row">
      <div class="progress-label"><span>${label}</span><span>${value.toFixed(unit === "kg" ? 1 : 0)}${unit} / ${goal}${unit}</span></div>
      <div class="progress-track"><div class="progress-fill" style="width:${ratio}%"></div></div>
    </div>
  `;
}

function renderGoalCharts(stats) {
  $("#goalCharts").innerHTML = [
    progressRow("탄소 절감", stats.carbon, Number(goals.carbon) || 0, "kg"),
    progressRow("운동 시간", stats.activityMinutes, Number(goals.minutes) || 0, "분"),
    progressRow("식단 칼로리", stats.totalCalories, Number(goals.calories) || 0, "kcal"),
    progressRow("저탄소 식단", stats.lowMeals, Number(goals.lowMeals) || 0, "회"),
  ].join("");
  $("#goalSummary").innerHTML = `
    <p><strong>현재 예상 절감:</strong> ${stats.carbon.toFixed(1)}kg CO2</p>
    <p><strong>운동 기록:</strong> ${stats.activityMinutes}분</p>
    <p><strong>식단 기록:</strong> ${meals.length}회, ${stats.totalCalories}kcal</p>
  `;
}

function renderActivityChart() {
  const grouped = {};
  activities.forEach((item) => {
    grouped[item.type] = (grouped[item.type] || 0) + ((Number(item.distance) || 0) * 0.19);
  });
  const entries = Object.entries(grouped).length ? Object.entries(grouped) : [["기록 없음", 0]];
  const max = Math.max(...entries.map(([, value]) => value), 1);
  $("#activityChart").innerHTML = entries.map(([label, value]) => `
    <div class="bar-row">
      <span>${label}</span>
      <div class="bar-track"><span class="bar-fill" style="width:${Math.max(4, (value / max) * 100)}%"></span></div>
      <strong>${value.toFixed(1)}kg</strong>
    </div>
  `).join("");
}

function renderMealDonut(stats) {
  const total = Math.max(1, stats.mealCounts.low + stats.mealCounts.middle + stats.mealCounts.high);
  const low = (stats.mealCounts.low / total) * 100;
  const middle = low + (stats.mealCounts.middle / total) * 100;
  $("#mealDonut").style.background = `conic-gradient(${mealCarbonMeta.low.color} 0 ${low}%, ${mealCarbonMeta.middle.color} ${low}% ${middle}%, ${mealCarbonMeta.high.color} ${middle}% 100%)`;
  $("#mealLegend").innerHTML = Object.entries(mealCarbonMeta).map(([key, meta]) => `
    <div class="legend-item"><span><i style="background:${meta.color}"></i> ${meta.label}</span><strong>${stats.mealCounts[key] || 0}회</strong></div>
  `).join("");
}

function renderDashboard() {
  renderMeals();
  $("#goalCarbon").value = goals.carbon;
  $("#goalMinutes").value = goals.minutes;
  $("#goalCalories").value = goals.calories;
  $("#goalLowMeals").value = goals.lowMeals;
  const stats = collectDashboardStats();
  renderGoalCharts(stats);
  renderActivityChart();
  renderMealDonut(stats);
}

function saveGoalInputs() {
  goals.carbon = Number($("#goalCarbon").value) || 0;
  goals.minutes = Number($("#goalMinutes").value) || 0;
  goals.calories = Number($("#goalCalories").value) || 0;
  goals.lowMeals = Number($("#goalLowMeals").value) || 0;
  saveGoals();
  renderDashboard();
  showToast("목표치를 저장했습니다.");
}

function renderMap(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    showToast("표시할 좌표가 없습니다.");
    return;
  }
  $("#mapLat").value = lat.toFixed(6);
  $("#mapLng").value = lng.toFixed(6);
  const delta = 0.01;
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join(",");
  $("#mapFrame").innerHTML = `<iframe title="현재 위치 지도" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}"></iframe>`;
}

function useCurrentLocationForMap() {
  if (gpsState.currentPosition) {
    renderMap(gpsState.currentPosition.latitude, gpsState.currentPosition.longitude);
    return;
  }
  if (!navigator.geolocation) {
    showToast("이 브라우저는 위치 기능을 지원하지 않습니다.");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const current = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      gpsState.currentPosition = current;
      renderMap(current.latitude, current.longitude);
    },
    () => showToast("위치 권한을 허용해야 지도를 표시할 수 있습니다."),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
  );
}

function resetTodayDashboard() {
  meals.splice(0, meals.length);
  activities.splice(0, activities.length);
  saveMeals();
  localStorage.setItem(activityKey, JSON.stringify([]));
  renderActivities();
  renderDashboard();
  showToast("오늘 식단과 운동 기록을 초기화했습니다.");
}

document.addEventListener("click", (event) => {
  const id = event.target.dataset.complete;
  if (!id) return;
  if (completed.has(id)) {
    completed.delete(id);
    showToast("완료 기록을 취소했습니다.");
  } else {
    completed.add(id);
    showToast("기후 행동을 기록했습니다.");
  }
  persist();
  renderChallenges();
  renderPlan();
});

document.addEventListener("change", (event) => {
  const id = event.target.dataset.complete;
  if (!id) return;
  if (event.target.checked) completed.add(id);
  else completed.delete(id);
  persist();
  renderChallenges();
  renderPlan();
});

$("#categoryFilter").addEventListener("change", renderChallenges);
$("#recommendButton").addEventListener("click", recommendChallenge);
$("#saveJournal").addEventListener("click", () => {
  const text = $("#journalText").value.trim();
  if (!text) {
    showToast("실천 내용을 먼저 적어주세요.");
    return;
  }
  journals.unshift({ date: new Date().toLocaleDateString("ko-KR"), text });
  localStorage.setItem(journalKey, JSON.stringify(journals.slice(0, 12)));
  $("#journalText").value = "";
  renderJournal();
  showToast("실천 일지를 저장했습니다.");
});
$("#startGpsButton").addEventListener("click", startGpsTracking);
$("#stopGpsButton").addEventListener("click", () => stopGpsTracking(true));
$("#calculateCaloriesButton").addEventListener("click", renderCalories);
["#exerciseType", "#weightInput", "#minutesInput", "#distanceInput"].forEach((selector) => {
  $(selector).addEventListener("input", renderCalories);
  $(selector).addEventListener("change", renderCalories);
});
$("#addMealButton").addEventListener("click", addMeal);
$("#saveGoalsButton").addEventListener("click", saveGoalInputs);
$("#showMapButton").addEventListener("click", () => renderMap(Number($("#mapLat").value), Number($("#mapLng").value)));
$("#useCurrentMapButton").addEventListener("click", useCurrentLocationForMap);
$("#resetDashboardButton").addEventListener("click", resetTodayDashboard);
applyUiSettings();
renderChallenges();
renderPlan();
renderJournal();
recommendChallenge();
renderCalories();
renderActivities();
renderDashboard();
