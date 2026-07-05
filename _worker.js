const OPENAI_ENDPOINT = "https://api.openai.com/v1/responses";
const MYREALTRIP_API_BASE = "https://partner-ext-api.myrealtrip.com";
const MYREALTRIP_ENDPOINTS = {
  "tna-categories": "/v1/products/tna/categories",
  "airport-autocomplete": "/v1/products/flight/airport-autocomplete",
  "accommodation-region": "/v1/products/accommodation/region-autocomplete",
  "accommodation-region-autocomplete": "/v1/products/accommodation/region-autocomplete",
  "accommodation-search": "/v1/products/accommodation/search"
};
const MYREALTRIP_DEFAULT_ENDPOINT = `${MYREALTRIP_API_BASE}${MYREALTRIP_ENDPOINTS["tna-categories"]}`;
const MYREALTRIP_POST_PATHS = new Set([
  "/v1/products/accommodation/region-autocomplete",
  "/v1/products/accommodation/search"
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/festival-ai") {
      return handleFestivalAiApi(request, env);
    }

    if (url.pathname === "/api/seoul-events") {
      return handleSeoulEventsApi(request, env);
    }

    if (url.pathname === "/api/seoul-parking") {
      return handleSeoulParkingApi(request, env);
    }

    if (url.pathname === "/api/myrealtrip") {
      return handleMyRealTripApi(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

async function handleMyRealTripApi(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: apiHeaders(request)
    });
  }

  if (request.method !== "GET" && request.method !== "POST") {
    return jsonResponse({ ok: false, message: "GET or POST method required." }, 405, request);
  }

  if (!isSameOriginRequest(request)) {
    return jsonResponse({ ok: false, message: "Forbidden origin." }, 403, request);
  }

  const apiKey = String(env.MYREALTRIP_API_KEY || "").trim();
  const requestUrl = new URL(request.url);
  const endpoint = normalizeMyRealTripEndpoint(
    requestUrl.searchParams.get("endpoint") || requestUrl.searchParams.get("type") || env.MYREALTRIP_API_ENDPOINT
  );

  if (!apiKey) {
    return jsonResponse(
      {
        ok: false,
        code: "missing_myrealtrip_key",
        message: "MYREALTRIP_API_KEY 환경변수가 설정되지 않았습니다."
      },
      500,
      request
    );
  }

  try {
    const apiUrl = new URL(endpoint);
    const privatePath = apiUrl.pathname.toLowerCase();
    if (privatePath.includes("/revenues") || privatePath.includes("/settlement") || privatePath.includes("/orders")) {
      return jsonResponse(
        {
          ok: false,
          code: "private_myrealtrip_endpoint_blocked",
          message: "정산, 주문, 매출 API는 공개 웹사이트 프록시로 연결할 수 없습니다. 사이트에는 상품/투어 목록용 공개 제휴 API endpoint만 연결하세요."
        },
        403,
        request
      );
    }
    const shouldPost = request.method === "POST" || MYREALTRIP_POST_PATHS.has(apiUrl.pathname);
    const proxyParams = collectProxyParams(requestUrl.searchParams);
    const requestInit = {
      method: shouldPost ? "POST" : "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "x-api-key": apiKey
      }
    };

    if (shouldPost) {
      requestInit.headers["Content-Type"] = "application/json";
      requestInit.body = JSON.stringify(await buildMyRealTripPostBody(request, apiUrl.pathname, proxyParams));
    } else {
      Object.entries(proxyParams).forEach(([key, value]) => apiUrl.searchParams.set(key, value));
    }

    const response = await fetch(apiUrl.toString(), requestInit);
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : { raw: await response.text() };

    if (!response.ok) {
      return jsonResponse(
        {
          ok: false,
          code: "myrealtrip_request_failed",
          status: response.status,
          message: payload?.message || payload?.error || "MyRealTrip API 요청에 실패했습니다.",
          data: payload
        },
        response.status,
        request
      );
    }

    return jsonResponse(
      {
        ok: true,
        source: "MyRealTrip",
        data: payload
      },
      200,
      request,
      { "cache-control": "public, max-age=900" }
    );
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        code: "myrealtrip_proxy_error",
        message: error?.message || "MyRealTrip API 프록시 처리 중 오류가 발생했습니다."
      },
      500,
      request
    );
  }
}

function normalizeMyRealTripEndpoint(value) {
  const endpoint = String(value || "").trim();
  if (!endpoint) return MYREALTRIP_DEFAULT_ENDPOINT;
  if (MYREALTRIP_ENDPOINTS[endpoint]) return `${MYREALTRIP_API_BASE}${MYREALTRIP_ENDPOINTS[endpoint]}`;
  if (endpoint.startsWith("/")) return `${MYREALTRIP_API_BASE}${endpoint}`;
  return endpoint;
}

function collectProxyParams(searchParams) {
  const params = {};
  searchParams.forEach((value, key) => {
    if (key === "type" || key === "endpoint") return;
    params[key] = value;
  });
  return params;
}

async function buildMyRealTripPostBody(request, pathname, queryParams) {
  const postedBody = request.method === "POST" ? await readJsonBody(request) : {};
  const body = { ...queryParams, ...postedBody };

  if (pathname === "/v1/products/accommodation/region-autocomplete") {
    return {
      keyword: String(body.keyword || body.q || body.search || "서울").trim(),
      isDomestic: parseBoolean(body.isDomestic, true)
    };
  }

  if (pathname === "/v1/products/accommodation/search") {
    const checkIn = body.checkIn || dateOffset(1);
    const checkOut = body.checkOut || dateOffset(2);
    const searchBody = {
      regionId: parseInteger(body.regionId, 178308),
      checkIn,
      checkOut,
      adultCount: parseInteger(body.adultCount, 2),
      childCount: parseInteger(body.childCount, 0),
      page: parseInteger(body.page, 0),
      size: parseInteger(body.size, 10)
    };
    if (body.starRating) searchBody.starRating = String(body.starRating);
    return searchBody;
  }

  return body;
}

async function readJsonBody(request) {
  try {
    return await request.json();
  } catch (_) {
    return {};
  }
}

function parseBoolean(value, fallback) {
  if (value === true || value === false) return value;
  if (value == null || value === "") return fallback;
  return String(value).toLowerCase() === "true";
}

function parseInteger(value, fallback) {
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) ? number : fallback;
}

function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

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
    const limit = clampNumber(url.searchParams.get("limit"), 100, 1000, 300);
    const month = normalizeYearMonth(url.searchParams.get("month"));
    const endpoint = `http://openapi.seoul.go.kr:8088/${encodeURIComponent(apiKey)}/json/culturalEventInfo/1/${limit}/`;
    const cacheRequest = new Request(`${url.origin}/api/seoul-events/cache?limit=${limit}&month=${month}`, { method: "GET" });
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

    const rows = normalizeSeoulRows(payload?.culturalEventInfo?.row, month);
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

function normalizeYearMonth(value) {
  const text = String(value || "").trim();
  if (/^\d{6}$/.test(text)) return text;

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit"
    }).formatToParts(new Date());
    const year = parts.find((part) => part.type === "year")?.value || String(new Date().getFullYear());
    const month = parts.find((part) => part.type === "month")?.value || String(new Date().getMonth() + 1).padStart(2, "0");
    return `${year}${month}`;
  } catch {
    const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
    return `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  }
}

function monthRange(month) {
  const year = Number(month.slice(0, 4));
  const monthNumber = Number(month.slice(4, 6));
  const lastDay = String(new Date(year, monthNumber, 0).getDate()).padStart(2, "0");
  return {
    start: `${month}01`,
    end: `${month}${lastDay}`
  };
}

function dateTokens(value) {
  const text = String(value || "");
  const compact = text.match(/\d{8}/g) || [];
  const dashed = text.match(/\d{4}[.-]\d{2}[.-]\d{2}/g) || [];
  return [
    ...compact,
    ...dashed.map((date) => date.replace(/\D/g, ""))
  ].filter((date) => date.length === 8);
}

function seoulEventOverlapsMonth(item, month) {
  const range = monthRange(month);
  const tokens = [
    ...dateTokens(item.STRTDATE),
    ...dateTokens(item.DATE),
    ...dateTokens(item.END_DATE)
  ];
  if (!tokens.length) return true;

  const start = tokens[0];
  const end = tokens[tokens.length - 1] || start;
  return start <= range.end && end >= range.start;
}

function normalizeSeoulRows(row, month) {
  const rows = Array.isArray(row) ? row : row ? [row] : [];
  return rows
    .filter((item) => item?.TITLE)
    .filter((item) => seoulEventOverlapsMonth(item, month))
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

async function handleSeoulParkingApi(request, env) {
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
    const apiKey = String(env.SEOUL_PARKING_API_KEY || "").trim();
    if (!apiKey) {
      return jsonResponse(
        {
          ok: false,
          code: "missing_parking_key",
          message: "SEOUL_PARKING_API_KEY 환경변수가 설정되지 않았습니다."
        },
        500,
        request
      );
    }

    const url = new URL(request.url);
    const limit = clampNumber(url.searchParams.get("limit"), 20, 1000, 300);
    const lat = Number(url.searchParams.get("lat"));
    const lng = Number(url.searchParams.get("lng"));
    const endpoint = `http://openapi.seoul.go.kr:8088/${encodeURIComponent(apiKey)}/json/GetParkInfo/1/${limit}/`;
    const cacheRequest = new Request(`${url.origin}/api/seoul-parking/cache?v=2&limit=${limit}`, { method: "GET" });
    const cached = await readCache(cacheRequest);
    let rows;

    if (cached) {
      const payload = await cached.clone().json();
      rows = Array.isArray(payload.items) ? payload.items : [];
    } else {
      const response = await fetch(endpoint, {
        headers: { Accept: "application/json" }
      });
      const payload = await response.json();
      if (!response.ok) {
        return jsonResponse(
          {
            ok: false,
            code: "parking_request_failed",
            message: payload?.RESULT?.MESSAGE || "서울 공영주차장 API 요청에 실패했습니다."
          },
          response.status,
          request
        );
      }

      rows = normalizeParkingRows(payload?.GetParkInfo?.row);
      const cacheResponse = jsonResponse(
        {
          ok: true,
          source: "서울 열린데이터광장 공영주차장 안내 정보",
          count: rows.length,
          items: rows
        },
        200,
        request,
        { "cache-control": "public, max-age=3600" }
      );
      await writeCache(cacheRequest, cacheResponse.clone());
    }

    const items = rankParkingRows(rows, lat, lng).slice(0, 8);
    return jsonResponse(
      {
        ok: true,
        source: "서울 열린데이터광장 공영주차장 안내 정보",
        count: items.length,
        items
      },
      200,
      request,
      { "cache-control": "public, max-age=1800" }
    );
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        code: "seoul_parking_error",
        message: error && error.message ? error.message : String(error)
      },
      500,
      request
    );
  }
}

function normalizeParkingRows(row) {
  const rows = Array.isArray(row) ? row : row ? [row] : [];
  return uniqueParkingRows(rows
    .map(normalizeParkingLot)
    .filter((item) => item.name));
}

function normalizeParkingLot(item) {
  const lat = normalizeSeoulLatitude(toNumber(item.LAT || item.LATITUDE || item.Y_CODE));
  const lng = normalizeSeoulLongitude(toNumber(item.LNG || item.LONGITUDE || item.LOT || item.X_CODE));
  const weekday = formatParkingHours(item.WEEKDAY_BEGIN_TIME, item.WEEKDAY_END_TIME);
  const weekend = formatParkingHours(item.WEEKEND_BEGIN_TIME, item.WEEKEND_END_TIME);
  const holiday = formatParkingHours(item.HOLIDAY_BEGIN_TIME, item.HOLIDAY_END_TIME);

  return {
    name: cleanText(item.PARKING_NAME || item.PKLT_NM || item.NAME),
    address: cleanText(item.ADDR || item.ADDRESS || item.ROAD_ADDR),
    tel: cleanText(item.TEL || item.PHONE),
    type: cleanText(item.PARKING_TYPE_NM || item.PARKING_TYPE),
    operationRule: cleanText(item.OPERATION_RULE_NM || item.OPERATION_RULE),
    payType: cleanText(item.PAY_NM || item.PAY_YN),
    capacity: cleanText(item.CAPACITY),
    currentParking: cleanText(item.CUR_PARKING),
    baseRate: formatParkingRate(item.RATES, item.TIME_RATE),
    addRate: formatParkingRate(item.ADD_RATES, item.ADD_TIME_RATE),
    dayMaximum: cleanText(item.DAY_MAXIMUM),
    weekday,
    weekend,
    holiday,
    lat,
    lng
  };
}

function uniqueParkingRows(rows) {
  const seen = new Set();
  return rows.filter((item) => {
    const key = `${item.name}|${item.address}`.replace(/\s+/g, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeSeoulLatitude(value) {
  return Number.isFinite(value) && value >= 37 && value <= 38 ? value : null;
}

function normalizeSeoulLongitude(value) {
  return Number.isFinite(value) && value >= 126 && value <= 128 ? value : null;
}

function rankParkingRows(rows, lat, lng) {
  const hasPoint = Number.isFinite(lat) && Number.isFinite(lng);
  return rows
    .map((item) => ({
      ...item,
      distanceM: hasPoint && Number.isFinite(item.lat) && Number.isFinite(item.lng)
        ? Math.round(distanceMeters(lat, lng, item.lat, item.lng))
        : null
    }))
    .sort((a, b) => {
      if (a.distanceM == null && b.distanceM == null) return 0;
      if (a.distanceM == null) return 1;
      if (b.distanceM == null) return -1;
      return a.distanceM - b.distanceM;
    });
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

function toNumber(value) {
  const number = Number(cleanText(value));
  return Number.isFinite(number) ? number : null;
}

function formatParkingHours(start, end) {
  const begin = formatHour(start);
  const finish = formatHour(end);
  if (!begin && !finish) return "";
  return `${begin || "시작 확인"} - ${finish || "종료 확인"}`;
}

function formatHour(value) {
  const text = cleanText(value).replace(/[^\d]/g, "");
  if (!text) return "";
  const padded = text.padStart(4, "0").slice(0, 4);
  return `${padded.slice(0, 2)}:${padded.slice(2, 4)}`;
}

function formatParkingRate(rate, minutes) {
  const rateText = cleanText(rate);
  const minuteText = cleanText(minutes);
  if (!rateText && !minuteText) return "";
  if (rateText && minuteText) return `${minuteText}분 ${rateText}원`;
  return rateText ? `${rateText}원` : `${minuteText}분 기준`;
}

function distanceMeters(lat1, lng1, lat2, lng2) {
  const radius = 6371000;
  const toRad = (degree) => degree * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
