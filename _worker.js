const OPENAI_ENDPOINT = "https://api.openai.com/v1/responses";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/travel") {
      const assetUrl = new URL(request.url);
      assetUrl.pathname = "/travel-list.html";
      const response = await env.ASSETS.fetch(new Request(assetUrl, request));
      return normalizeAssetResponse(response, request, env);
    }

    if (/^\/travel\/[^/]+\/?$/.test(url.pathname)) {
      const assetUrl = new URL(request.url);
      assetUrl.pathname = "/travel-detail.html";
      const response = await env.ASSETS.fetch(new Request(assetUrl, request));
      return normalizeAssetResponse(response, request, env);
    }

    if (url.pathname === "/api/festival-ai") {
      return handleFestivalAiApi(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

async function normalizeAssetResponse(response, request, env) {
  if (![301, 302, 307, 308].includes(response.status)) return response;

  const location = response.headers.get("location") || "";
  if (!location) return response;

  const nextUrl = new URL(location, request.url);
  const fallbackUrl = new URL(request.url);

  if (nextUrl.pathname === "/travel-detail") {
    fallbackUrl.pathname = "/travel-detail";
  } else if (nextUrl.pathname === "/travel-list") {
    fallbackUrl.pathname = "/travel-list";
  } else {
    return response;
  }

  return env.ASSETS.fetch(new Request(fallbackUrl, request));
}

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
              `You are a travel and festival information editor. Write in ${targetLanguageName(article.language)}. Use only the provided festival information and create a short pre-visit guide. Do not invent unverified prices, dates, places, or transport details. Output JSON only.`
          },
          {
            role: "user",
            content: `Create supplemental content for this festival detail page in ${targetLanguageName(article.language)}.

Return format:
{
  "sections": [
    {"title": "short section title", "body": "2-3 sentences"},
    {"title": "short section title", "body": "2-3 sentences"},
    {"title": "short section title", "body": "2-3 sentences"}
  ],
  "tips": ["short checklist sentence 1", "short checklist sentence 2", "short checklist sentence 3"]
}

Festival information:
Title: ${article.title}
Category: ${article.category}
Summary: ${article.summary}
Schedule: ${article.date}
Place: ${article.address}
Facts: ${article.facts.join(" / ")}`
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
    language: article.language,
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
    language: normalizeLanguage(input?.language),
    title: String(input?.title || "축제").slice(0, 120),
    category: String(input?.category || "축제 정보").slice(0, 80),
    summary: String(input?.summary || "").slice(0, 700),
    date: String(input?.date || "").slice(0, 120),
    address: String(input?.address || "").slice(0, 180),
    facts
  };
}

function normalizeLanguage(value) {
  const language = String(value || "ko").toLowerCase();
  return ["ko", "en", "ja", "zh"].includes(language) ? language : "ko";
}

function targetLanguageName(language) {
  return {
    ko: "Korean",
    en: "English",
    ja: "Japanese",
    zh: "Simplified Chinese"
  }[language] || "Korean";
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
