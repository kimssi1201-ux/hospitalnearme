# 서울여행뉴스 (view1.kr)

서울 축제, 서울 여행 코스, 서울 가볼 만한 곳과 방문 전 체크 정보를 뉴스형 카드로 모아 보여주는 서울 여행 정보 블로그입니다. 프레임워크나 빌드 번들러 없이 정적 HTML/CSS/브라우저 JS로 만들어졌고, Cloudflare Pages에 배포됩니다. API 키가 필요한 호출은 모두 `_worker.js`(Cloudflare Worker)가 서버 측에서 프록시합니다.

## 주요 페이지

- `index.html`: 메인 피드. 서울 최신 문화행사, 큐레이션 기획 글, 여행 예약 검색을 카드형 뉴스 레이아웃으로 노출 (`travel-data.js`, `travel.js`)
- `festival-detail.html`: 축제/행사 상세 페이지. 서울 문화행사 API, TourAPI, OpenAI 보조 콘텐츠, 주차장 정보, 예약 검색을 조합해 표시 (`travel-data.js`, `festival-detail.js`)
- `articles.html`: 큐레이션 기획 글 목록
- `about.html`, `contact.html`, `privacy.html`, `terms.html`, `disclaimer.html`, `editorial-policy.html`, `resources.html`: 소개/정책 정적 페이지
- `recipes.html`: 폐기된 레시피 검색 기능의 리다이렉트 스텁(`index.html`로 즉시 이동). 과거 유입 링크를 위해 유지

## 콘텐츠 자동 생성

- `articles/<slug>/index.html`: 저장된 데이터로 생성되는 큐레이션 기획 글 (총 24개)
- `seoul-events/<slug>/index.html`: 서울시 문화행사 데이터를 기반으로 자동 생성되는 개별 행사 상세 페이지
- `generated/seoul-events.json`: `scripts/update-seoul-content.mjs`가 서울 열린데이터광장 API에서 가져와 저장하는 원본 데이터
- `scripts/generate-static-articles.mjs`: 위 데이터로 `articles/`, `seoul-events/`, `sitemap.xml`을 재생성
- `.github/workflows/daily-seoul-content.yml`: 매일 05:00 KST에 콘텐츠를 새로고침하고 변경분을 자동 커밋

## Cloudflare Worker / API (`_worker.js`)

정적 자산 서빙 앞단에서 다음 API를 프록시합니다 (API 키는 Cloudflare Pages 환경변수에만 저장, 저장소에 커밋 금지):

- `/api/seoul-events`: 서울 열린데이터광장 문화행사 정보
- `/api/tour-festivals`, `/api/tour-detail`: 한국관광공사 TourAPI
- `/api/seoul-parking`: 서울 공영주차장 안내 (좌표 기반 거리 정렬)
- `/api/festival-ai`: OpenAI로 축제 상세 보조 콘텐츠 생성 (KO/EN/JA/ZH)
- `/api/myrealtrip`: MyRealTrip 제휴 API (화이트리스트된 endpoint만 허용)
- `/api/coupang`: 쿠팡파트너스 상품 검색

`_worker.js`가 존재하므로 Cloudflare Pages Functions(`functions/` 디렉토리)는 사용하지 않습니다 — API는 전부 `_worker.js`에 구현합니다.

## Cloudflare Pages 배포 설정

- Framework preset: None
- Build command: 비워두기
- Build output directory: `/`

## 로컬 실행 / 테스트 / 배포

실행, 테스트, 검증, 배포 명령은 `AGENTS.md`에 정리되어 있습니다 (`npm run check`, `npm run refresh` 등).
