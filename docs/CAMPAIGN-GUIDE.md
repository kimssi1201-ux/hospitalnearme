# VIEW1 캠페인 추가 가이드

이 사이트는 `data/campaigns.json`을 기준으로 캠페인 목록, 상세페이지, 카테고리, 인기 이벤트, 신규 이벤트, sitemap을 자동 생성합니다.

## 새 이벤트 추가 방법

1. 캠페인 대표 이미지를 `public/images/campaigns/`에 넣습니다.
2. `data/campaigns.json`을 엽니다.
3. 아래 템플릿을 배열 안에 새 항목으로 추가합니다.
4. `slug`, `title`, `category`, `description`, `image`, `ctaText`, `ctaUrl`, `active`를 입력합니다.
5. 메인 대표 노출이 필요하면 `featured: true`, 인기 영역 노출이 필요하면 `popular: true`를 설정합니다.
6. 우선순위를 높이고 싶으면 `priority` 숫자를 크게 입력합니다.
7. 저장 후 `npm run check`와 `npm run build`를 실행합니다.

```json
{
  "id": "campaign-001",
  "slug": "campaign-slug",
  "title": "캠페인 제목",
  "shortTitle": "짧은 제목",
  "category": "wedding",
  "description": "캠페인 설명을 입력합니다.",
  "image": "/images/campaigns/campaign-slug.webp",
  "badge": "무료상담",
  "benefit": "상담 혜택 안내",
  "ctaText": "무료 상담 신청하기",
  "ctaUrl": "https://실제-제휴-주소",
  "provider": "제휴업체명",
  "featured": true,
  "popular": false,
  "active": true,
  "priority": 100,
  "startDate": "2026-09-10",
  "endDate": "",
  "disclosure": "참여 실적에 따라 수수료를 제공받을 수 있습니다.",
  "target": ["신청 대상 1", "신청 대상 2"],
  "benefits": ["혜택 1", "혜택 2"],
  "details": ["상세 안내 문장 1", "상세 안내 문장 2"],
  "faq": [
    {
      "question": "신청 비용이 있나요?",
      "answer": "신청 조건은 공식 이벤트 페이지에서 확인할 수 있습니다."
    }
  ]
}
```

## 필수 값

- `slug`: URL에 들어가는 영문 소문자, 숫자, 하이픈 조합
- `title`: 캠페인 제목
- `category`: `data/categories.json`에 있는 카테고리 slug
- `description`: 목록과 SEO에 쓰는 짧은 설명
- `image`: `public/` 기준 이미지 경로
- `ctaText`: 버튼 문구
- `ctaUrl`: 실제 제휴 랜딩 URL
- `active`: `true` 또는 `false`

## 캠페인 종료 방법

- 즉시 숨김: `active`를 `false`로 바꿉니다.
- 종료일 기반 자동 숨김: `endDate`를 `YYYY-MM-DD`로 입력합니다. 종료일 다음 날부터 목록과 sitemap에서 제외됩니다.
- 상세 URL은 유지됩니다. 종료된 상세페이지에는 “현재 종료된 이벤트입니다.”가 표시됩니다.

## 메인 대표 이벤트 바꾸는 방법

- 대표로 노출할 캠페인에 `featured: true`를 설정합니다.
- 여러 개가 있으면 `priority`가 높은 순서로 표시됩니다.
- HTML 파일은 수정하지 않습니다.

## 카테고리 추가 방법

1. `data/categories.json`에 새 카테고리를 추가합니다.
2. 캠페인의 `category`에 새 카테고리 `slug`를 넣습니다.
3. 빌드하면 `/category/{slug}/` 페이지가 자동 생성됩니다.

## 주의

- 실제 존재하지 않는 CPA URL을 넣지 마세요.
- 타 사이트 이미지를 복사해 넣지 마세요.
- 데모 캠페인은 `demo: true`, `active: false`로 유지해야 운영 목록에 노출되지 않습니다.
