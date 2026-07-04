const OPENAI_ENDPOINT = "https://api.openai.com/v1/responses";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/festival-ai") {
      return handleFestivalAiApi(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

async function handleFestivalAiApi(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: apiHeaders(request)
    });
  }

  if (request.method !== "POST") {
    return jsonResponse({ ok: false, message: "POST method required." }, 405, request);
  }

  if (!isSameOriginRequest(request)) {
    return jsonResponse({ ok: false, message: "Forbidden origin." }, 403, request);
  }

  try {
    const apiKey = String(env.OPENAI_API_KEY || "").trim();
    if (!apiKey) {
      return jsonResponse(
        {
          ok: false,
          code: "missing_openai_key",
          message: "OPENAI_API_KEY 환경변수가 설정되지 않았습니다."
        },
        500,
        request
      );
    }

    const input = await readJson(request);
    const article = normalizeFestivalArticle(input);
    const cacheRequest = await buildCacheRequest(request, article);
    const cached = await readCache(cacheRequest);
    if (cached) return cached;

    const model = String(env.OPENAI_MODEL || "gpt-5.2").trim();
    const response = await fetch(OPENAI_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content:
              "너는 한국어 여행·축제 정보 에디터다. 제공된 축제 정보만 바탕으로 방문 전 도움이 되는 짧은 가이드를 만든다. 확인되지 않은 가격, 날짜, 장소, 교통편은 단정하지 않는다. JSON만 출력한다."
          },
          {
            role: "user",
            content: `다음 축제 상세 페이지에 넣을 보강 콘텐츠를 JSON으로 작성해줘.

반환 형식:
{
  "sections": [
    {"title": "방문 포인트", "body": "2~3문장"},
    {"title": "예약 전 체크", "body": "2~3문장"},
    {"title": "현장 준비", "body": "2~3문장"}
  ],
  "tips": ["짧은 체크 문장 1", "짧은 체크 문장 2", "짧은 체크 문장 3"]
}

축제 정보:
제목: ${article.title}
분류: ${article.category}
요약: ${article.summary}
일정: ${article.date}
장소: ${article.address}
기본 정보: ${article.facts.join(" / ")}`
          }
        ],
        max_output_tokens: 700
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      return jsonResponse(
        {
          ok: false,
          code: "openai_request_failed",
          message: payload?.error?.message || "OpenAI 요청에 실패했습니다."
        },
        response.status,
        request
      );
    }

    const content = normalizeModelContent(parseModelJson(extractOutputText(payload)));
    const finalResponse = jsonResponse({ ok: true, ...content }, 200, request, {
      "cache-control": "public, max-age=86400"
    });
    await writeCache(cacheRequest, finalResponse.clone());
    return finalResponse;
  } catch (error) {
    const status = Number(error?.status || 500);
    return jsonResponse(
      {
        ok: false,
        code: "festival_ai_error",
        message: error && error.message ? error.message : String(error)
      },
      status,
      request
    );
  }
}

function isSameOriginRequest(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    const error = new Error("Invalid JSON body.");
    error.status = 400;
    throw error;
  }
}

async function buildCacheRequest(request, article) {
  const url = new URL(request.url);
  const hashSource = JSON.stringify({
    id: article.contentId,
    title: article.title,
    date: article.date,
    address: article.address
  });
  const hash = await sha256(hashSource);
  url.pathname = "/api/festival-ai/cache";
  url.search = `?key=${hash}`;
  return new Request(url.toString(), { method: "GET" });
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function readCache(cacheRequest) {
  if (typeof caches === "undefined") return null;
  const response = await caches.default.match(cacheRequest);
  if (!response) return null;

  const cached = new Response(response.body, response);
  cached.headers.set("x-cache", "HIT");
  return cached;
}

async function writeCache(cacheRequest, response) {
  if (typeof caches === "undefined") return;
  await caches.default.put(cacheRequest, response);
}

function normalizeFestivalArticle(input) {
  const facts = Array.isArray(input?.facts)
    ? input.facts.map((item) => String(item || "").slice(0, 120))
    : [];

  return {
    contentId: String(input?.contentId || input?.id || "").slice(0, 80),
    title: String(input?.title || "축제").slice(0, 120),
    category: String(input?.category || "축제 정보").slice(0, 80),
    summary: String(input?.summary || "").slice(0, 700),
    date: String(input?.date || "").slice(0, 120),
    address: String(input?.address || "").slice(0, 180),
    facts
  };
}

function extractOutputText(payload) {
  if (payload?.output_text) return payload.output_text;

  return (payload?.output || [])
    .flatMap((item) => item?.content || [])
    .map((content) => content?.text || "")
    .join("\n")
    .trim();
}

function parseModelJson(text) {
  if (!text) return { sections: [], tips: [] };

  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    return { sections: [], tips: [] };
  }
}

function normalizeModelContent(content) {
  return {
    sections: Array.isArray(content.sections)
      ? content.sections.slice(0, 3).map((item) => ({
          title: String(item?.title || "방문 포인트").slice(0, 40),
          body: String(item?.body || "").slice(0, 360)
        }))
      : [],
    tips: Array.isArray(content.tips)
      ? content.tips.slice(0, 5).map((item) => String(item || "").slice(0, 140))
      : []
  };
}

function apiHeaders(request, extra = {}) {
  const origin = request.headers.get("origin");
  const allowOrigin = origin && isSameOriginRequest(request) ? origin : new URL(request.url).origin;

  return {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "x-content-type-options": "nosniff",
    ...extra
  };
}

function jsonResponse(payload, status = 200, request, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: apiHeaders(request, {
      "cache-control": "no-store",
      ...extraHeaders
    })
  });
}
