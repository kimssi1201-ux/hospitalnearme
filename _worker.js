const OPENAI_ENDPOINT = "https://api.openai.com/v1/responses";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/festival-ai") {
      return handleFestivalAiApi(request, env);
    }

    if (url.pathname === "/api/seoul-events") {
      return handleSeoulEventsApi(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

async function handleSeoulEventsApi(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: apiHeaders(request)
    });
  }

  if (request.method !== "GET") {
    return jsonResponse({ ok: false, message: "GET method required." }, 405, request);
  }

  if (!isSameOriginRequest(request)) {
    return jsonResponse({ ok: false, message: "Forbidden origin." }, 403, request);
  }

  try {
    const apiKey = String(env.SEOUL_OPEN_API_KEY || "").trim();
    if (!apiKey) {
      return jsonResponse(
        {
          ok: false,
          code: "missing_seoul_key",
          message: "SEOUL_OPEN_API_KEY 환경변수가 설정되지 않았습니다."
        },
        500,
        request
      );
    }

    const url = new URL(request.url);
    const limit = clampNumber(url.searchParams.get("limit"), 20, 300, 120);
    const endpoint = `https://openapi.seoul.go.kr:8088/${encodeURIComponent(apiKey)}/json/culturalEventInfo/1/${limit}/`;
    const cacheRequest = new Request(`${url.origin}/api/seoul-events/cache?limit=${limit}`, { method: "GET" });
    const cached = await readCache(cacheRequest);
    if (cached) return cached;

    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" }
    });

    const payload = await response.json();
    if (!response.ok) {
      return jsonResponse(
        {
          ok: false,
          code: "seoul_request_failed",
          message: payload?.RESULT?.MESSAGE || "서울 문화행사 API 요청에 실패했습니다."
        },
        response.status,
        request
      );
    }

    const rows = normalizeSeoulRows(payload?.culturalEventInfo?.row);
    const finalResponse = jsonResponse(
      {
        ok: true,
        source: "서울 열린데이터광장 문화행사 정보",
        count: rows.length,
        items: rows
      },
      200,
      request,
      { "cache-control": "public, max-age=1800" }
    );
    await writeCache(cacheRequest, finalResponse.clone());
    return finalResponse;
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        code: "seoul_events_error",
        message: error && error.message ? error.message : String(error)
      },
      500,
      request
    );
  }
}

function normalizeSeoulRows(row) {
  const rows = Array.isArray(row) ? row : row ? [row] : [];
  return rows
    .filter((item) => item?.TITLE)
    .map((item, index) => normalizeSeoulEvent(item, index));
}

function normalizeSeoulEvent(item, index) {
  const title = cleanText(item.TITLE);
  const place = cleanText(item.PLACE);
  const gu = cleanText(item.GUNAME);
  const date = cleanText(item.DATE) || formatSeoulPeriod(item.STRTDATE, item.END_DATE);
  const fee = cleanText(item.USE_FEE);
  const time = cleanText(item.TIME || item.EVENT_TIME || item.PLAYTIME);
  const category = cleanText(item.CODENAME) || "서울 문화행사";
  const image = normalizeUrl(item.MAIN_IMG) || "https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=900&q=80";
  const homepage = normalizeUrl(item.ORG_LINK || item.HMPG_ADDR);
  const tel = cleanText(item.INQUIRY || item.TEL || item.PHONE);
  const address = [gu, place].filter(Boolean).join(" ");

  return {
    id: `seoul-event-${hashString(`${title}-${date}-${place}`) || index}`,
    source: "seoul",
    category,
    title,
    summary: buildSeoulSummary({ title, place, date, fee, category }),
    date: date || "일정 확인 필요",
    readTime: "서울 행사 정보",
    image,
    address,
    place,
    gu,
    tel,
    homepage,
    fee,
    time,
    org: cleanText(item.ORG_NAME),
    target: cleanText(item.USE_TRGT),
    isFree: cleanText(item.IS_FREE),
    lat: cleanText(item.LAT),
    lng: cleanText(item.LOT),
    updatedAt: cleanText(item.RGSTDATE)
  };
}

function buildSeoulSummary({ title, place, date, fee, category }) {
  const chunks = [
    place ? `${place}에서 진행되는 ${category}입니다` : `${title} 관련 서울 문화행사입니다`,
    date ? `일정은 ${date}입니다` : "",
    fee ? `이용요금은 ${fee} 기준으로 확인됩니다` : "요금 정보는 공식 안내를 확인해 주세요"
  ].filter(Boolean);
  return `${chunks.join(". ")}.`;
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

function cleanText(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(value) {
  const text = cleanText(value);
  if (!text) return "";
  const url = text.startsWith("//") ? `https:${text}` : text;
  if (!/^https?:\/\//i.test(url)) return "";
  return url.replace(/^http:/i, "https:");
}

function formatSeoulPeriod(start, end) {
  const startText = formatSeoulDate(start);
  const endText = formatSeoulDate(end);
  if (startText && endText && startText !== endText) return `${startText} - ${endText}`;
  return startText || endText || "";
}

function formatSeoulDate(value) {
  const text = cleanText(value);
  if (!text) return "";
  const compact = text.replace(/[^\d]/g, "");
  if (compact.length < 8) return text;
  return `${compact.slice(0, 4)}.${compact.slice(4, 6)}.${compact.slice(6, 8)}`;
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(number)));
}

function hashString(value) {
  let hash = 0;
  const text = String(value || "");
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36);
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
    "access-control-allow-methods": "GET, POST, OPTIONS",
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
