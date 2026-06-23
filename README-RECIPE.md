# 오늘 뭐 먹지 레시피 검색 기능

식품의약품안전처 `조리식품의 레시피 DB` OpenAPI를 사용해 메뉴명, 재료명, 카테고리별 레시피를 검색하는 기본 기능입니다.

## 추가된 파일

- `recipes.html` : 레시피 검색 페이지
- `recipe-site.css` : 레시피 페이지 디자인
- `recipe-site.js` : 검색 화면 동작
- `functions/api/recipes.js` : Cloudflare Pages Functions용 API 프록시
- `.env.example` : 환경변수 예시
- `.gitignore` : 실제 인증키 파일 업로드 방지

## 중요한 보안 규칙

실제 OpenAPI 인증키는 절대 `recipes.html`, `recipe-site.js`, GitHub README, 공개 이미지에 넣지 마세요.

인증키는 Cloudflare Pages 환경변수에만 등록해야 합니다.

## Cloudflare Pages 설정 방법

1. Cloudflare Pages 프로젝트로 이동
2. `Settings` 클릭
3. `Environment variables` 클릭
4. 변수 추가

```text
RECIPE_API_KEY=본인_공공데이터_인증키
```

5. 다시 배포

## 접속 경로

배포 후 아래 주소로 접속하면 됩니다.

```text
https://본인도메인/recipes.html
```

## API 호출 구조

브라우저는 인증키를 직접 사용하지 않고 아래 내부 API만 호출합니다.

```text
/api/recipes?keyword=김치
/api/recipes?ingredient=닭가슴살
/api/recipes?category=반찬
```

서버 함수가 내부에서 식품안전나라 API를 호출합니다.

```text
https://openapi.foodsafetykorea.go.kr/api/인증키/COOKRCP01/json/1/12/RCP_NM=김치
```

## 애드센스용 확장 아이디어

- 닭가슴살 다이어트 레시피 10가지
- 자취생 간단 반찬 모음
- 아이 반찬 레시피 추천
- 저녁 메뉴 추천
- 저염식 국물요리 모음
- 냉장고 재료로 만드는 간단요리
