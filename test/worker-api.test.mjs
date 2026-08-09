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

test("worker handles preflight without calling an external API", async () => {
  globalThis.fetch = async () => {
    throw new Error("external fetch should not run for OPTIONS");
  };
  const response = await worker.fetch(new Request("https://view1.kr/api/myrealtrip", { method: "OPTIONS" }), {});
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-methods"), "GET, POST, OPTIONS");
});
