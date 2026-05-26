const challenges = [
  { id: "food-leftover", title: "급식 잔반 0에 가까워지기", category: "food", level: "easy", time: 10, impact: 0.45, badge: "잔반 줄이기", description: "먹을 만큼만 받고 남긴 이유를 기록해 다음 식사 선택을 조정합니다.", steps: ["처음에는 평소보다 20% 적게 받기", "부족하면 추가 배식 이용하기", "남긴 음식 종류를 기록하기"] },
  { id: "food-vegday", title: "주 1회 저탄소 식단 선택", category: "food", level: "medium", time: 20, impact: 1.2, badge: "저탄소 식탁", description: "가능한 날에 채소 중심 식단을 선택하고 친구와 이유를 공유합니다.", steps: ["급식 메뉴 확인하기", "채소 반찬 먼저 먹기", "선택 이유를 한 문장으로 기록하기"] },
  { id: "energy-standby", title: "교실 대기전력 순찰", category: "energy", level: "easy", time: 10, impact: 0.35, badge: "전기 탐정", description: "쉬는 시간이나 하교 전 사용하지 않는 전자기기 전원을 확인합니다.", steps: ["충전기와 멀티탭 확인", "사용하지 않는 화면 끄기", "담당 친구와 체크표 만들기"] },
  { id: "energy-temp", title: "냉난방 온도 지킴이", category: "energy", level: "medium", time: 20, impact: 0.7, badge: "에너지 가디언", description: "교실 온도와 체감 상태를 기록해 무리한 냉난방을 줄입니다.", steps: ["교실 온도 기록", "창문 개폐 상태 확인", "담임 선생님과 적정 온도 논의"] },
  { id: "transport-walk", title: "한 정거장 걷기 또는 자전거", category: "transport", level: "medium", time: 20, impact: 0.9, badge: "초록 이동", description: "안전한 구간에서 자동차 이동을 줄이고 걷기 또는 자전거를 선택합니다.", steps: ["안전한 경로 확인", "친구나 가족에게 이동 계획 알리기", "이동거리 기록"] },
  { id: "transport-carpool", title: "등하교 이동 탄소 지도 만들기", category: "transport", level: "hard", time: 40, impact: 1.6, badge: "이동 데이터 분석가", description: "반 친구들의 이동 방식을 익명으로 조사해 줄일 수 있는 지점을 찾습니다.", steps: ["익명 설문 만들기", "도보/대중교통/차량 비율 계산", "개선 아이디어 발표"] },
  { id: "waste-tumbler", title: "일회용 컵 대신 텀블러", category: "waste", level: "easy", time: 10, impact: 0.25, badge: "다회용 컵", description: "하루 동안 일회용 컵 사용을 피하고 사용하지 않은 컵 수를 기록합니다.", steps: ["텀블러 챙기기", "매점이나 카페에서 사용하기", "피한 일회용품 개수 기록"] },
  { id: "waste-buy", title: "사지 않기 24시간 챌린지", category: "waste", level: "medium", time: 20, impact: 0.8, badge: "소비 멈춤", description: "꼭 필요하지 않은 물건 구매를 하루 미루고 이유를 기록합니다.", steps: ["사고 싶은 물건 적기", "24시간 뒤 다시 판단", "대여/수리/공유 대안 찾기"] },
  { id: "school-campaign", title: "학급 기후 행동 포스터", category: "school", level: "hard", time: 40, impact: 2.0, badge: "캠페인 메이커", description: "친구들이 바로 따라 할 수 있는 하나의 행동을 포스터로 제안합니다.", steps: ["행동 하나 정하기", "짧은 문구 만들기", "실천 인증 방법 정하기"] },
  { id: "school-club", title: "우리 학교 기후 회의 열기", category: "school", level: "hard", time: 40, impact: 2.4, badge: "기후 리더", description: "급식, 에너지, 쓰레기 중 하나를 골라 학생 제안서를 만듭니다.", steps: ["문제 하나 선택", "학생 의견 모으기", "실행 가능한 제안 3개 작성"] },
];

const categoryNames = { food: "급식/음식", energy: "전기/에너지", transport: "등하교/이동", waste: "쓰레기/소비", school: "학교 캠페인" };
const storageKey = "teenclimate.completed";
const journalKey = "teenclimate.journal";
const completed = new Set(JSON.parse(localStorage.getItem(storageKey) || "[]"));
const journals = JSON.parse(localStorage.getItem(journalKey) || "[]");
const $ = (selector) => document.querySelector(selector);
const challengeList = $("#challengeList");
const categoryFilter = $("#categoryFilter");
const impactTotal = $("#impactTotal");
const completedCount = $("#completedCount");
const badgeCount = $("#badgeCount");
const badgeGrid = $("#badgeGrid");
const weeklyPlan = $("#weeklyPlan");
const recommendation = $("#recommendation");
const toast = $("#toast");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}
function persist() { localStorage.setItem(storageKey, JSON.stringify([...completed])); }
function getFilteredChallenges() { return challenges.filter((challenge) => categoryFilter.value === "all" || challenge.category === categoryFilter.value); }

function renderChallenges() {
  challengeList.innerHTML = getFilteredChallenges().map((challenge) => {
    const isDone = completed.has(challenge.id);
    return `<article class="challenge-card"><div class="card-top"><div><span>${categoryNames[challenge.category]}</span><h3>${challenge.title}</h3></div><strong>${challenge.impact.toFixed(2)}kg</strong></div><p>${challenge.description}</p><ol>${challenge.steps.map((step) => `<li>${step}</li>`).join("")}</ol><button class="${isDone ? "is-done" : ""}" type="button" data-complete="${challenge.id}">${isDone ? "완료됨" : "완료 기록"}</button></article>`;
  }).join("");
  renderStats();
}

function renderStats() {
  const doneItems = challenges.filter((challenge) => completed.has(challenge.id));
  const impact = doneItems.reduce((sum, item) => sum + item.impact, 0);
  const badges = new Set(doneItems.map((item) => item.badge));
  impactTotal.textContent = `${impact.toFixed(1)}kg`;
  completedCount.textContent = doneItems.length;
  badgeCount.textContent = badges.size;
  badgeGrid.innerHTML = challenges.map((challenge) => `<div class="badge ${completed.has(challenge.id) ? "earned" : ""}"><span>${completed.has(challenge.id) ? "획득" : "대기"}</span><strong>${challenge.badge}</strong></div>`).join("");
}

function renderWeeklyPlan() {
  weeklyPlan.innerHTML = challenges.slice(0, 7).map((challenge, index) => `<label class="plan-item"><input type="checkbox" data-complete="${challenge.id}" ${completed.has(challenge.id) ? "checked" : ""} /><span>DAY ${index + 1}</span><strong>${challenge.title}</strong></label>`).join("");
}

function recommendChallenge() {
  const interest = $("#interest").value;
  const level = $("#level").value;
  const time = Number($("#time").value);
  const grade = $("#grade").value;
  const candidates = challenges.filter((challenge) => challenge.category === interest).filter((challenge) => challenge.time <= time || level === "hard").sort((a, b) => Number(b.level === level) - Number(a.level === level) || b.impact - a.impact);
  const pick = candidates[0] || challenges.find((challenge) => challenge.category === interest) || challenges[0];
  recommendation.innerHTML = `<article class="recommend-card"><span>${grade} 맞춤 추천</span><h3>${pick.title}</h3><p>${pick.description}</p><div class="meta-row"><span>${categoryNames[pick.category]}</span><span>${pick.time}분</span><span>예상 ${pick.impact.toFixed(2)}kg 절감</span></div><button type="button" data-complete="${pick.id}">이 챌린지 완료 기록</button></article>`;
}

function renderJournal() {
  const list = $("#journalList");
  list.innerHTML = journals.length ? journals.map((item) => `<article><strong>${item.date}</strong><p>${item.text}</p></article>`).join("") : '<p class="empty">아직 기록이 없습니다.</p>';
}

document.addEventListener("click", (event) => {
  const id = event.target.dataset.complete;
  if (!id) return;
  if (completed.has(id)) { completed.delete(id); showToast("완료 기록을 취소했습니다."); }
  else { completed.add(id); showToast("기후 행동을 기록했습니다."); }
  persist(); renderChallenges(); renderWeeklyPlan();
});
document.addEventListener("change", (event) => {
  const id = event.target.dataset.complete;
  if (!id) return;
  if (event.target.checked) completed.add(id); else completed.delete(id);
  persist(); renderChallenges(); renderWeeklyPlan();
});
categoryFilter.addEventListener("change", renderChallenges);
$("#recommendButton").addEventListener("click", recommendChallenge);
$("#saveJournal").addEventListener("click", () => {
  const text = $("#journalText").value.trim();
  if (!text) { showToast("기록할 내용을 먼저 적어주세요."); return; }
  journals.unshift({ date: new Date().toLocaleDateString("ko-KR"), text });
  localStorage.setItem(journalKey, JSON.stringify(journals.slice(0, 8)));
  $("#journalText").value = "";
  renderJournal(); showToast("오늘의 실천 기록을 저장했습니다.");
});
renderChallenges(); renderWeeklyPlan(); renderJournal(); recommendChallenge();
