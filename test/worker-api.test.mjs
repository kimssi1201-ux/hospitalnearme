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

test("worker handles preflight without calling an external API", async () => {
  globalThis.fetch = async () => {
    throw new Error("external fetch should not run for OPTIONS");
  };
  const response = await worker.fetch(new Request("https://view1.kr/api/myrealtrip", { method: "OPTIONS" }), {});
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-methods"), "GET, POST, OPTIONS");
});
