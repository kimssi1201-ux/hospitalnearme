const newsTopics = {
  climate: {
    label: "기후 위기",
    query: "기후 위기 OR 기후변화",
    fallback: [
      ["폭염이 일상 안전 문제가 되는 이유", "기온 상승은 건강, 학습 집중도, 전력 사용량에 동시에 영향을 줍니다. 학교에서는 물 마시기, 그늘 동선, 냉방 규칙을 함께 점검할 수 있습니다."],
      ["기후 뉴스에서 숫자를 읽는 법", "평년 대비, 전년 대비, 관측 이래 같은 표현을 구분하면 기사가 말하는 변화의 크기를 더 정확히 이해할 수 있습니다."],
      ["청소년 기후 행동이 필요한 이유", "기후 행동은 지식 확인에서 끝나지 않고 급식, 통학, 전기 사용 같은 생활 시스템을 바꾸는 참여로 이어질 때 힘을 얻습니다."],
    ],
  },
  extreme: {
    label: "폭염과 폭우",
    query: "폭염 폭우 기후변화",
    fallback: [
      ["폭염 대비 체크리스트", "야외 활동 시간, 물 섭취, 냉방 공간, 취약한 친구를 확인하는 간단한 체크리스트가 학교 안전 활동이 될 수 있습니다."],
      ["집중호우가 도시를 흔드는 방식", "짧은 시간에 많은 비가 오면 배수, 지하 공간, 통학로 안전이 동시에 문제가 됩니다. 지역 재난 문자를 함께 확인해 보세요."],
      ["기상재해 기사 토론법", "피해 규모만 보지 말고 예방책, 책임 기관, 시민이 할 수 있는 준비를 같이 찾아야 실천형 학습이 됩니다."],
    ],
  },
  energy: {
    label: "재생에너지",
    query: "재생에너지 태양광 풍력 기후",
    fallback: [
      ["학교 전기 사용을 줄이는 방법", "조명, 냉난방, 충전기 대기전력처럼 학생이 관찰할 수 있는 항목부터 기록하면 에너지 절약 캠페인이 구체화됩니다."],
      ["재생에너지 기사를 볼 때 묻기", "발전량, 저장, 송전망, 지역 수용성처럼 함께 따라오는 쟁점을 확인하면 찬반 구호보다 깊게 읽을 수 있습니다."],
      ["에너지 전환과 진로", "기후 문제는 공학뿐 아니라 데이터 분석, 디자인, 법, 경제, 커뮤니케이션 분야와도 연결됩니다."],
    ],
  },
  school: {
    label: "학교와 청소년",
    query: "청소년 기후 행동 학교 탄소중립",
    fallback: [
      ["학교 급식과 기후 행동", "음식물 쓰레기 기록, 남김 이유 조사, 선택식 개선 제안은 청소년이 바로 시작할 수 있는 기후 프로젝트입니다."],
      ["동아리 캠페인을 오래 지속하는 법", "인증 사진보다 참여 장벽을 낮추고, 결과를 숫자와 이야기로 공유하는 방식이 캠페인의 지속성을 높입니다."],
      ["학생회가 할 수 있는 기후 의제", "통학 안전, 교실 냉난방, 분리배출, 축제 쓰레기 같은 의제는 학교 운영과 연결해 제안하기 좋습니다."],
    ],
  },
  policy: {
    label: "기후 정책",
    query: "기후 정책 탄소중립 온실가스",
    fallback: [
      ["탄소중립 정책 읽기", "목표 연도, 감축 기준, 이행 수단, 예산을 확인하면 정책이 선언인지 실행 계획인지 구분할 수 있습니다."],
      ["지역 기후 정책 찾기", "시청, 구청, 교육청 홈페이지에서 탄소중립 계획과 폭염 대책을 찾아 학교 프로젝트와 연결해 보세요."],
      ["정책 뉴스와 시민 참여", "댓글보다 공개 의견 제출, 설문, 청소년 의회, 학교 토론회처럼 공식 참여 통로를 확인하는 습관이 중요합니다."],
    ],
  },
};

const newsList = document.querySelector("#newsList");
const newsStatus = document.querySelector("#newsStatus");
const newsTopicSelect = document.querySelector("#newsTopic");
const loadNewsButton = document.querySelector("#loadNewsButton");

function buildGoogleNewsRss(query) {
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;
  return `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`;
}

function newsSearchUrl(query) {
  return `https://news.google.com/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;
}

function cleanNewsText(text) {
  return (text || "")
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatNewsDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "날짜 확인 필요";
  return date.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

async function fetchClimateNews(topic) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6500);
  try {
    const response = await fetch(buildGoogleNewsRss(topic.query), {
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) throw new Error("뉴스 응답 오류");
    const xmlText = await response.text();
    const xml = new DOMParser().parseFromString(xmlText, "text/xml");
    const items = Array.from(xml.querySelectorAll("item")).slice(0, 6);
    return items.map((item) => ({
      title: cleanNewsText(item.querySelector("title")?.textContent),
      link: item.querySelector("link")?.textContent || newsSearchUrl(topic.query),
      date: formatNewsDate(item.querySelector("pubDate")?.textContent),
      source: cleanNewsText(item.querySelector("source")?.textContent) || "Google 뉴스",
      summary: `${topic.label} 이슈를 원문 기사에서 확인하고, 학교나 가정에서 적용할 수 있는 행동으로 연결해 보세요.`,
      type: "latest",
    })).filter((item) => item.title);
  } finally {
    clearTimeout(timer);
  }
}

function renderNewsCards(items, topic, isFallback = false) {
  newsList.innerHTML = items.map((item) => {
    const title = Array.isArray(item) ? item[0] : item.title;
    const summary = Array.isArray(item) ? item[1] : item.summary;
    const link = Array.isArray(item) ? newsSearchUrl(`${topic.query} ${item[0]}`) : item.link;
    const source = Array.isArray(item) ? "브리핑 주제" : `${item.source} · ${item.date}`;
    return `
      <article class="news-card">
        <span>${isFallback ? "Briefing" : "Latest"}</span>
        <h3><a href="${link}" target="_blank" rel="noopener">${title}</a></h3>
        <p>${summary}</p>
        <p class="news-source">${source}</p>
      </article>
    `;
  }).join("");
}

async function loadClimateNews() {
  if (!newsList || !newsStatus || !newsTopicSelect) return;
  const topic = newsTopics[newsTopicSelect.value] || newsTopics.climate;
  newsStatus.textContent = `${topic.label} 관련 최신 뉴스를 불러오는 중입니다.`;
  if (loadNewsButton) loadNewsButton.disabled = true;
  try {
    const items = await fetchClimateNews(topic);
    if (!items.length) throw new Error("뉴스 항목 없음");
    renderNewsCards(items, topic);
    newsStatus.textContent = `${topic.label} 관련 최신 기사 ${items.length}개를 불러왔습니다. 기사 원문은 새 창에서 열립니다.`;
  } catch (error) {
    renderNewsCards(topic.fallback, topic, true);
    newsStatus.textContent = `외부 뉴스 연결이 원활하지 않아 ${topic.label} 브리핑 주제를 먼저 보여줍니다. 카드 제목을 누르면 최신 뉴스 검색으로 이동합니다.`;
  } finally {
    if (loadNewsButton) loadNewsButton.disabled = false;
  }
}

if (loadNewsButton) loadNewsButton.addEventListener("click", loadClimateNews);
if (newsTopicSelect) newsTopicSelect.addEventListener("change", loadClimateNews);
loadClimateNews();
