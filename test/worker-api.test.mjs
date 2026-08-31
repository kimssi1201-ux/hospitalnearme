import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import worker from "../_worker.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

async function bodyOf(response) {
  return response.json();
}

test("worker delegates non-API requests to Pages assets", async () => {
  let delegated = false;
  const response = await worker.fetch(new Request("https://view1.kr/index.html"), {
    ASSETS: {
      fetch: async () => {
        delegated = true;
        return new Response("asset", { status: 200 });
      }
    }
  });

  assert.equal(response.status, 200);
  assert.equal(delegated, true);
  assert.equal(await response.text(), "asset");
});

test("worker delegates the clean search URL to Pages assets", async () => {
  let requestedUrl = "";
  const response = await worker.fetch(new Request("https://view1.kr/search?q=서울"), {
    ASSETS: {
      fetch: async (request) => {
        requestedUrl = request.url;
        return new Response("search asset", { status: 200 });
      }
    }
  });

  const assetUrl = new URL(requestedUrl);
  assert.equal(response.status, 200);
  assert.equal(assetUrl.pathname, "/search");
  assert.equal(assetUrl.searchParams.get("q"), "서울");
  assert.equal(await response.text(), "search asset");
});

test("worker rewrites nested root asset requests to the site root", async () => {
  let requestedUrl = "";
  const response = await worker.fetch(new Request("https://view1.kr/seoul-events/seoul-event-kp5ai2/travel.css?v=broken"), {
    ASSETS: {
      fetch: async (request) => {
        requestedUrl = request.url;
        return new Response("css asset", { status: 200, headers: { "content-type": "text/css" } });
      }
    }
  });

  const assetUrl = new URL(requestedUrl);
  assert.equal(response.status, 200);
  assert.equal(assetUrl.pathname, "/travel.css");
  assert.equal(assetUrl.searchParams.get("v"), "broken");
  assert.equal(response.headers.get("content-type"), "text/css");
  assert.equal(await response.text(), "css asset");
});

test("worker protects proxy routes from wrong origins and missing keys", async (t) => {
  await t.test("wrong origin", async () => {
    const response = await worker.fetch(new Request("https://view1.kr/api/myrealtrip", {
      headers: { origin: "https://evil.example" }
    }), {});
    assert.equal(response.status, 403);
  });

  await t.test("missing MyRealTrip key", async () => {
    const response = await worker.fetch(new Request("https://view1.kr/api/myrealtrip"), {});
    const body = await bodyOf(response);
    assert.equal(response.status, 500);
    assert.equal(body.code, "missing_myrealtrip_key");
  });

  await t.test("missing Coupang keys", async () => {
    const response = await worker.fetch(new Request("https://view1.kr/api/coupang?keyword=travel"), {});
    const body = await bodyOf(response);
    assert.equal(response.status, 500);
    assert.equal(body.code, "missing_coupang_key");
  });

  await t.test("missing TourAPI key", async () => {
    const response = await worker.fetch(new Request("https://view1.kr/api/tour-festivals"), {});
    const body = await bodyOf(response);
    assert.equal(response.status, 500);
    assert.equal(body.code, "missing_tour_key");
  });

  await t.test("missing PhotoGallery key", async () => {
    const response = await worker.fetch(new Request("https://view1.kr/api/tour-photo-gallery?keyword=서울아트위크"), {});
    const body = await bodyOf(response);
    assert.equal(response.status, 500);
    assert.equal(body.code, "missing_photo_gallery_key");
  });
});

test("worker proxies a validated PhotoGallery request and requires a keyword", async (t) => {
  await t.test("rejects missing keyword", async () => {
    const response = await worker.fetch(
      new Request("https://view1.kr/api/tour-photo-gallery"),
      { PHOTO_GALLERY_API_KEY: "server-only-key" }
    );
    const body = await bodyOf(response);
    assert.equal(response.status, 400);
    assert.equal(body.code, "missing_photo_gallery_keyword");
  });

  await t.test("proxies an allowed request without exposing the key to the client", async () => {
    let calledUrl = "";
    globalThis.fetch = async (url) => {
      calledUrl = String(url);
      return new Response(JSON.stringify({
        response: {
          header: { resultCode: "0000", resultMsg: "OK" },
          body: { items: { item: [{ galTitle: "서울아트위크", galWebImageUrl: "https://tong.visitkorea.or.kr/example.jpg" }] } }
        }
      }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    };

    const response = await worker.fetch(
      new Request("https://view1.kr/api/tour-photo-gallery?keyword=서울아트위크"),
      { PHOTO_GALLERY_API_KEY: "server-only-key" }
    );
    const body = await bodyOf(response);
    const upstream = new URL(calledUrl);

    assert.equal(response.status, 200);
    assert.equal(body.response.body.items.item[0].galTitle, "서울아트위크");
    assert.equal(upstream.origin, "https://apis.data.go.kr");
    assert.equal(upstream.pathname, "/B551011/PhotoGalleryService1/gallerySearchList1");
    assert.equal(upstream.searchParams.get("serviceKey"), "server-only-key");
    assert.equal(upstream.searchParams.get("keyword"), "서울아트위크");
  });
});

test("worker rejects unsupported MyRealTrip endpoints", async () => {
  const response = await worker.fetch(new Request("https://view1.kr/api/myrealtrip?endpoint=https://evil.example/data"), {
    MYREALTRIP_API_KEY: "test-key"
  });
  const body = await bodyOf(response);
  assert.equal(response.status, 400);
  assert.equal(body.code, "invalid_myrealtrip_endpoint");
  assert.equal(globalThis.fetch, originalFetch);
});

test("worker proxies an allowed MyRealTrip request with a mocked upstream", async () => {
  let calledUrl = "";
  let calledInit;
  globalThis.fetch = async (url, init) => {
    calledUrl = String(url);
    calledInit = init;
    return new Response(JSON.stringify({ categories: [{ id: "tour" }] }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };

  const response = await worker.fetch(new Request("https://view1.kr/api/myrealtrip?endpoint=tna-categories", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://view1.kr" },
    body: JSON.stringify({ city: "Seoul" })
  }), { MYREALTRIP_API_KEY: "test-key" });
  const body = await bodyOf(response);

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.categories[0].id, "tour");
  assert.equal(calledUrl, "https://partner-ext-api.myrealtrip.com/v1/products/tna/categories");
  assert.equal(calledInit.method, "POST");
  assert.equal(calledInit.headers.Authorization, "Bearer test-key");
  assert.equal(JSON.parse(calledInit.body).city, "Seoul");
});

test("worker proxies a validated TourAPI request without exposing the key to the client", async () => {
  let calledUrl = "";
  globalThis.fetch = async (url) => {
    calledUrl = String(url);
    return new Response(JSON.stringify({
      response: {
        header: { resultCode: "0000", resultMsg: "OK" },
        body: { totalCount: 1, items: { item: [{ contentid: "1", title: "서울 행사" }] } }
      }
    }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };

  const request = new Request(
    "https://view1.kr/api/tour-festivals?month=202608&pageNo=1&numOfRows=25&areaCode=1",
    { headers: { origin: "https://view1.kr" } }
  );
  const response = await worker.fetch(request, { TOUR_API_KEY: "server-only-key" });
  const body = await bodyOf(response);
  const upstream = new URL(calledUrl);

  assert.equal(response.status, 200);
  assert.equal(body.response.body.totalCount, 1);
  assert.equal(upstream.origin, "https://apis.data.go.kr");
  assert.equal(upstream.searchParams.get("serviceKey"), "server-only-key");
  assert.equal(upstream.searchParams.get("eventStartDate"), "20260801");
  assert.equal(upstream.searchParams.get("eventEndDate"), "20260831");
  assert.equal(upstream.searchParams.get("numOfRows"), "25");
});

test("worker validates and proxies TourAPI detail requests", async (t) => {
  await t.test("rejects unsupported detail endpoints", async () => {
    const response = await worker.fetch(
      new Request("https://view1.kr/api/tour-detail?endpoint=https://evil.example&contentId=123"),
      { TOUR_API_KEY: "server-only-key" }
    );
    const body = await bodyOf(response);
    assert.equal(response.status, 400);
    assert.equal(body.code, "invalid_tour_endpoint");
  });

  await t.test("proxies an allowlisted detail endpoint", async () => {
    let calledUrl = "";
    globalThis.fetch = async (url) => {
      calledUrl = String(url);
      return new Response(JSON.stringify({
        response: {
          header: { resultCode: "0000", resultMsg: "OK" },
          body: { items: { item: [{ contentid: "123", title: "상세 행사" }] } }
        }
      }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    };

    const response = await worker.fetch(
      new Request("https://view1.kr/api/tour-detail?endpoint=detailCommon2&contentId=123&contentTypeId=15"),
      { TOUR_API_KEY: "server-only-key" }
    );
    const upstream = new URL(calledUrl);
    assert.equal(response.status, 200);
    assert.match(upstream.pathname, /\/detailCommon2$/);
    assert.equal(upstream.searchParams.get("serviceKey"), "server-only-key");
    assert.equal(upstream.searchParams.get("contentId"), "123");
    assert.equal(upstream.searchParams.has("contentTypeId"), false);
    [
      "defaultYN",
      "firstImageYN",
      "areacodeYN",
      "catcodeYN",
      "addrinfoYN",
      "mapinfoYN",
      "overviewYN"
    ].forEach((parameter) => assert.equal(upstream.searchParams.has(parameter), false));
  });

  await t.test("sends contentTypeId only to endpoints that require it", async () => {
    let calledUrl = "";
    globalThis.fetch = async (url) => {
      calledUrl = String(url);
      return new Response(JSON.stringify({
        response: {
          header: { resultCode: "0000", resultMsg: "OK" },
          body: { items: { item: [] } }
        }
      }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    };

    const response = await worker.fetch(
      new Request("https://view1.kr/api/tour-detail?endpoint=detailIntro2&contentId=123&contentTypeId=15"),
      { TOUR_API_KEY: "server-only-key" }
    );
    const upstream = new URL(calledUrl);
    assert.equal(response.status, 200);
    assert.equal(upstream.searchParams.get("contentTypeId"), "15");
  });

  await t.test("rejects TourAPI flat error payloads", async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({
      resultCode: "10",
      resultMsg: "INVALID_REQUEST_PARAMETER_ERROR"
    }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });

    const response = await worker.fetch(
      new Request("https://view1.kr/api/tour-detail?endpoint=detailCommon2&contentId=123"),
      { TOUR_API_KEY: "server-only-key" }
    );
    const body = await bodyOf(response);
    assert.equal(response.status, 502);
    assert.equal(body.code, "tour_detail_request_failed");
    assert.equal(body.message, "INVALID_REQUEST_PARAMETER_ERROR");
  });

  await t.test("maps platform quota errors to 429", async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({
      OpenAPI_ServiceResponse: {
        cmmMsgHeader: {
          errMsg: "LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR",
          returnAuthMsg: "Daily request limit exceeded",
          returnReasonCode: "22"
        }
      }
    }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });

    const response = await worker.fetch(
      new Request("https://view1.kr/api/tour-detail?endpoint=detailCommon2&contentId=123"),
      { TOUR_API_KEY: "server-only-key" }
    );
    const body = await bodyOf(response);
    assert.equal(response.status, 429);
    assert.equal(body.providerCode, "22");
    assert.equal(body.message, "Daily request limit exceeded");
  });
});

test("worker permanently redirects legacy article query URLs", async (t) => {
  await t.test("curated article", async () => {
    const response = await worker.fetch(new Request("https://view1.kr/festival-detail?id=seoul-weekend-exhibition-guide"), {
      ASSETS: { fetch: async () => new Response("not expected") }
    });
    assert.equal(response.status, 301);
    assert.equal(response.headers.get("location"), "https://view1.kr/articles/seoul-weekend-exhibition-guide/");
  });

  await t.test("current Seoul event", async () => {
    const response = await worker.fetch(new Request("https://view1.kr/festival-detail?source=seoul&id=seoul-event-123"), {
      ASSETS: { fetch: async () => new Response("not expected") }
    });
    assert.equal(response.status, 301);
    assert.equal(response.headers.get("location"), "https://view1.kr/seoul-events/seoul-event-123/");
  });
});

test("worker handles preflight without calling an external API", async () => {
  globalThis.fetch = async () => {
    throw new Error("external fetch should not run for OPTIONS");
  };
  const response = await worker.fetch(new Request("https://view1.kr/api/myrealtrip", { method: "OPTIONS" }), {});
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-methods"), "GET, POST, OPTIONS");
});

function festivalAiRequest(body) {
  return new Request("https://view1.kr/api/festival-ai", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("worker festival AI endpoint rejects missing credentials", async () => {
  const response = await worker.fetch(festivalAiRequest({ title: "Festival" }), {});
  const body = await bodyOf(response);
  assert.equal(response.status, 500);
  assert.equal(body.code, "missing_openai_key");
});

test("worker festival AI endpoint parses fenced JSON from a mocked upstream response", async () => {
  let requestInit;
  globalThis.fetch = async (_url, init) => {
    requestInit = init;
    return new Response(JSON.stringify({
      output_text: "```json\n{\"sections\":[{\"title\":\"Visit\",\"body\":\"Check the schedule.\"}],\"tips\":[\"Bring water.\"]}\n```"
    }), { status: 200, headers: { "content-type": "application/json" } });
  };

  const response = await worker.fetch(
    festivalAiRequest({
      title: "Summer Festival",
      category: "Performance",
      summary: "A short event summary.",
      facts: ["Fact 1", "Fact 2"]
    }),
    { OPENAI_API_KEY: "test-openai-key", OPENAI_MODEL: "test-model" }
  );
  const body = await bodyOf(response);

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.sections[0].title, "Visit");
  assert.deepEqual(body.tips, ["Bring water."]);
  assert.equal(requestInit.headers.Authorization, "Bearer test-openai-key");
  assert.match(requestInit.body, /Summer Festival/);
});

test("worker festival AI endpoint safely falls back for malformed model JSON", async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ output_text: "not-json" }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });

  const response = await worker.fetch(festivalAiRequest({}), { OPENAI_API_KEY: "test-key" });
  const body = await bodyOf(response);
  assert.equal(response.status, 200);
  assert.deepEqual(body.sections, []);
  assert.deepEqual(body.tips, []);
});

test("worker festival AI endpoint preserves upstream errors and catches invalid request JSON", async (t) => {
  await t.test("upstream error", async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({ error: { message: "rate limited" } }), {
      status: 429,
      headers: { "content-type": "application/json" }
    });
    const response = await worker.fetch(festivalAiRequest({}), { OPENAI_API_KEY: "test-key" });
    const body = await bodyOf(response);
    assert.equal(response.status, 429);
    assert.equal(body.code, "openai_request_failed");
    assert.match(body.message, /rate limited/);
  });

  await t.test("invalid request JSON", async () => {
    const invalid = new Request("https://view1.kr/api/festival-ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{"
    });
    const response = await worker.fetch(invalid, { OPENAI_API_KEY: "test-key" });
    assert.equal(response.status, 400);
    assert.equal((await bodyOf(response)).ok, false);
  });
});
