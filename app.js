const hospitals = [
  {
    id: "care-001",
    name: "서울하늘내과의원",
    area: "서울",
    department: "내과",
    distance: 0.7,
    rating: 4.7,
    hours: "평일 09:00-20:00, 토 09:00-14:00",
    night: true,
    phone: "0212345678",
    address: "서울 중구 세종대로 100",
    note: "감기, 소화기, 만성질환 진료. 평일 저녁 진료 가능.",
  },
  {
    id: "care-002",
    name: "연세아이소아청소년과",
    area: "서울",
    department: "소아과",
    distance: 1.2,
    rating: 4.6,
    hours: "평일 09:00-18:30, 일 10:00-13:00",
    night: false,
    phone: "0298765432",
    address: "서울 마포구 월드컵북로 25",
    note: "영유아 진료, 예방접종, 주말 오전 진료.",
  },
  {
    id: "care-003",
    name: "경기365정형외과",
    area: "경기",
    department: "정형외과",
    distance: 2.4,
    rating: 4.5,
    hours: "매일 09:00-21:00",
    night: true,
    phone: "0311234567",
    address: "경기 성남시 분당구 판교역로 10",
    note: "관절, 척추, 스포츠 손상. 야간 물리치료 운영.",
  },
  {
    id: "care-004",
    name: "부산바른치과",
    area: "부산",
    department: "치과",
    distance: 1.8,
    rating: 4.8,
    hours: "평일 10:00-19:00, 목 10:00-21:00",
    night: true,
    phone: "0511239876",
    address: "부산 해운대구 해운대로 200",
    note: "충치, 스케일링, 임플란트 상담. 목요일 야간진료.",
  },
  {
    id: "care-005",
    name: "대구맑은이비인후과",
    area: "대구",
    department: "이비인후과",
    distance: 0.9,
    rating: 4.4,
    hours: "평일 09:00-19:00, 토 09:00-13:00",
    night: false,
    phone: "0535551212",
    address: "대구 중구 달구벌대로 50",
    note: "비염, 중이염, 목감기 진료.",
  },
  {
    id: "care-006",
    name: "우리동네온누리약국",
    area: "서울",
    department: "약국",
    distance: 0.4,
    rating: 4.3,
    hours: "매일 08:30-22:30",
    night: true,
    phone: "0277778888",
    address: "서울 종로구 종로 20",
    note: "야간 운영 약국. 일반의약품, 처방 조제.",
  },
];

const areas = ["전체", "서울", "경기", "부산", "대구"];
const departments = ["전체", "내과", "소아과", "정형외과", "치과", "이비인후과", "약국"];
const state = {
  keyword: "",
  area: "전체",
  department: "전체",
  nightOnly: false,
  sortBy: "distance",
};
const symptomGuides = [
  {
    symptom: "발열/몸살",
    department: "내과 또는 소아과",
    guide: "고열이 지속되거나 탈수, 호흡곤란이 동반되면 즉시 진료가 필요합니다.",
  },
  {
    symptom: "기침/목통증",
    department: "이비인후과 또는 내과",
    guide: "호흡기 증상이 있으면 마스크를 착용하고 접수 전 증상을 알려주세요.",
  },
  {
    symptom: "복통/설사",
    department: "내과",
    guide: "심한 복통, 혈변, 반복 구토, 탈수 증상이 있으면 빠르게 진료를 받으세요.",
  },
  {
    symptom: "삐끗함/관절통",
    department: "정형외과",
    guide: "부기, 변형, 보행 불가가 있으면 영상검사가 필요할 수 있습니다.",
  },
  {
    symptom: "치통",
    department: "치과",
    guide: "얼굴 부종, 발열, 삼킴 곤란이 있으면 응급 진료가 필요할 수 있습니다.",
  },
  {
    symptom: "약 조제/복약상담",
    department: "약국",
    guide: "처방전, 현재 복용 중인 약, 알레르기 정보를 함께 준비하면 좋습니다.",
  },
];
const saved = new Set(JSON.parse(localStorage.getItem("hospitalnearme.saved") || "[]"));

const $ = (selector) => document.querySelector(selector);
const keyword = $("#keyword");
const area = $("#area");
const department = $("#department");
const nightOnly = $("#nightOnly");
const sortBy = $("#sortBy");
const resultList = $("#resultList");
const savedList = $("#savedList");
const matchCount = $("#matchCount");
const statusHint = $("#statusHint");
const resetButton = $("#resetButton");
const toast = $("#toast");
const symptomSelect = $("#symptomSelect");
const symptomResult = $("#symptomResult");
const copyScriptButton = $("#copyScriptButton");
const visitProgress = $("#visitProgress");
const visitProgressText = $("#visitProgressText");
const visitTasks = JSON.parse(localStorage.getItem("hospitalnearme.visitTasks") || "{}");

function fillSelect(select, values) {
  select.innerHTML = values.map((value) => `<option value="${value}">${value}</option>`).join("");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2000);
}

function persistSaved() {
  localStorage.setItem("hospitalnearme.saved", JSON.stringify([...saved]));
}

function renderVisitTasks() {
  const boxes = document.querySelectorAll("[data-visit-task]");
  let done = 0;
  boxes.forEach((box) => {
    box.checked = Boolean(visitTasks[box.dataset.visitTask]);
    if (box.checked) done += 1;
  });
  visitProgress.value = done;
  visitProgressText.textContent = `${done} / ${boxes.length} 완료`;
}

function filteredHospitals() {
  const text = state.keyword.trim();
  return hospitals
    .filter((item) => {
      const keywordMatch = !text || `${item.name} ${item.department} ${item.address} ${item.note}`.includes(text);
      const areaMatch = state.area === "전체" || item.area === state.area;
      const departmentMatch = state.department === "전체" || item.department === state.department;
      const nightMatch = !state.nightOnly || item.night;
      return keywordMatch && areaMatch && departmentMatch && nightMatch;
    })
    .sort((a, b) => {
      if (state.sortBy === "rating") return b.rating - a.rating;
      if (state.sortBy === "night") return Number(b.night) - Number(a.night) || a.distance - b.distance;
      return a.distance - b.distance;
    });
}

function mapLink(item) {
  return `https://map.naver.com/p/search/${encodeURIComponent(item.name + " " + item.address)}`;
}

function renderResults() {
  const items = filteredHospitals();
  matchCount.textContent = `${items.length}곳`;
  statusHint.textContent = items.length ? `가장 가까운 곳은 ${items[0].distance}km 거리입니다.` : "조건을 넓혀 다시 검색해보세요.";

  resultList.innerHTML = items.length
    ? items.map((item) => `
      <article class="hospital-card">
        <div class="card-top">
          <div>
            <h3>${item.name}</h3>
            <p>${item.address}</p>
          </div>
          <button class="save-button ${saved.has(item.id) ? "is-saved" : ""}" type="button" data-save="${item.id}">
            ${saved.has(item.id) ? "저장됨" : "저장"}
          </button>
        </div>
        <div class="meta-row">
          <span>${item.department}</span>
          <span>${item.distance}km</span>
          <span>평점 ${item.rating}</span>
          <span class="${item.night ? "night" : "open"}">${item.night ? "야간 가능" : "일반 진료"}</span>
        </div>
        <p>${item.hours}</p>
        <p>${item.note}</p>
        <div class="card-actions">
          <a href="tel:${item.phone}">전화</a>
          <a href="${mapLink(item)}" target="_blank" rel="noreferrer">지도</a>
        </div>
      </article>
    `).join("")
    : '<p class="empty">조건에 맞는 병원/약국이 없습니다.</p>';

  renderSaved();
}

function renderSaved() {
  const items = hospitals.filter((item) => saved.has(item.id));
  savedList.innerHTML = items.length
    ? items.map((item) => `<article class="saved-item"><strong>${item.name}</strong><span>${item.department} · ${item.distance}km · ${item.hours}</span></article>`).join("")
    : '<p class="empty">아직 저장한 곳이 없습니다.</p>';
}

function updateState() {
  state.keyword = keyword.value;
  state.area = area.value;
  state.department = department.value;
  state.nightOnly = nightOnly.checked;
  state.sortBy = sortBy.value;
  renderResults();
}

fillSelect(area, areas);
fillSelect(department, departments);
fillSelect(symptomSelect, symptomGuides.map((item) => item.symptom));
renderResults();
renderSymptomGuide();
renderVisitTasks();

[keyword, area, department, nightOnly, sortBy].forEach((input) => input.addEventListener("input", updateState));
[area, department, nightOnly, sortBy].forEach((input) => input.addEventListener("change", updateState));

resetButton.addEventListener("click", () => {
  keyword.value = "";
  area.value = "전체";
  department.value = "전체";
  nightOnly.checked = false;
  sortBy.value = "distance";
  updateState();
});

symptomSelect.addEventListener("change", renderSymptomGuide);

function renderSymptomGuide() {
  const guide = symptomGuides.find((item) => item.symptom === symptomSelect.value) || symptomGuides[0];
  symptomResult.innerHTML = `
    <strong>${guide.department}</strong>
    <span>${guide.guide}</span>
    <button type="button" class="secondary" id="applyDepartment">이 진료과로 검색</button>
  `;
  $("#applyDepartment").addEventListener("click", () => {
    const target = guide.department.includes("소아과")
      ? "소아과"
      : guide.department.includes("이비인후과")
        ? "이비인후과"
        : guide.department.includes("정형외과")
          ? "정형외과"
          : guide.department.includes("치과")
            ? "치과"
            : guide.department.includes("약국")
              ? "약국"
              : "내과";
    department.value = target;
    updateState();
    document.querySelector("#finder").scrollIntoView({ behavior: "smooth" });
  });
}

resultList.addEventListener("click", (event) => {
  const id = event.target.dataset.save;
  if (!id) return;
  if (saved.has(id)) {
    saved.delete(id);
    showToast("저장을 해제했습니다.");
  } else {
    saved.add(id);
    showToast("저장했습니다.");
  }
  persistSaved();
  renderResults();
});

document.addEventListener("change", (event) => {
  const task = event.target.dataset.visitTask;
  if (!task) return;
  visitTasks[task] = event.target.checked;
  localStorage.setItem("hospitalnearme.visitTasks", JSON.stringify(visitTasks));
  renderVisitTasks();
});

copyScriptButton.addEventListener("click", () => {
  const text = "오늘 현재 진료 접수가 가능한가요? 제 증상은 ___이고, 초진입니다. 대기시간과 필요한 서류가 있을까요?";
  navigator.clipboard.writeText(text).then(() => showToast("전화 확인 문장을 복사했습니다."));
});
