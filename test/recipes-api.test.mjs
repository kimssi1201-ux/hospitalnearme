import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { onRequestGet } from "../functions/api/recipes.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

async function bodyOf(response) {
  return response.json();
}

function request(query = "") {
  return new Request(`https://view1.kr/api/recipes${query}`);
}

test("recipe API rejects missing credentials", async () => {
  const response = await onRequestGet({ request: request(), env: {} });
  const body = await bodyOf(response);

  assert.equal(response.status, 500);
  assert.equal(body.ok, false);
  assert.equal(body.source, "not_configured");
  assert.deepEqual(body.recipes, []);
});

test("recipe API normalizes a successful response and clamps pagination", async () => {
  let calledUrl = "";
  globalThis.fetch = async (url) => {
    calledUrl = String(url);
    return new Response(JSON.stringify({
      COOKRCP01: {
        total_count: "1",
        row: [{
          RCP_SEQ: "42",
          RCP_NM: "Tofu Soup",
          RCP_PAT2: "Soup",
          RCP_WAY2: "Boil",
          RCP_PARTS_DTLS: "tofu, onion",
          ATT_FILE_NO_MK: "https://example.test/thumb.jpg",
          ATT_FILE_NO_MAIN: "https://example.test/main.jpg",
          INFO_ENG: "120 kcal",
          INFO_PRO: "12g",
          MANUAL01: "Boil water",
          MANUAL02: "Add tofu"
        }]
      }
    }), { status: 200, headers: { "content-type": "application/json" } });
  };

  const response = await onRequestGet({
    request: request("?keyword=tofu&ingredient=onion&category=Soup&start=0&count=999"),
    env: { RECIPE_API_KEY: "test-key" }
  });
  const body = await bodyOf(response);

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.totalCount, 1);
  assert.equal(body.recipes[0].title, "Tofu Soup");
  assert.equal(body.recipes[0].image, "https://example.test/main.jpg");
  assert.deepEqual(body.recipes[0].ingredients, ["tofu", "onion"]);
  assert.deepEqual(body.recipes[0].steps, ["Boil water", "Add tofu"]);
  assert.equal(body.recipes[0].calories, 120);
  assert.equal(body.recipes[0].protein, 12);
  assert.match(calledUrl, /\/test-key\/COOKRCP01\/json\/1\/50/);
  assert.match(decodeURIComponent(calledUrl), /RCP_NM=tofu/);
});

test("recipe API handles empty rows and lower pagination boundaries", async () => {
  let calledUrl = "";
  globalThis.fetch = async (url) => {
    calledUrl = String(url);
    return new Response(JSON.stringify({ COOKRCP01: { row: [] } }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };

  const response = await onRequestGet({
    request: request("?start=-30&count=0"),
    env: { API_KEY: "fallback-key" }
  });
  const body = await bodyOf(response);

  assert.equal(response.status, 200);
  assert.deepEqual(body.recipes, []);
  assert.match(calledUrl, /\/fallback-key\/COOKRCP01\/json\/1\/1/);
});

test("recipe API reports upstream and network failures", async (t) => {
  await t.test("upstream HTTP error", async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({ error: "down" }), {
      status: 503,
      headers: { "content-type": "application/json" }
    });

    const response = await onRequestGet({ request: request(), env: { RECIPE_API_KEY: "test-key" } });
    const body = await bodyOf(response);
    assert.equal(response.status, 502);
    assert.equal(body.ok, false);
    assert.equal(body.status, 503);
  });

  await t.test("network exception", async () => {
    globalThis.fetch = async () => { throw new Error("network down"); };
    const response = await onRequestGet({ request: request(), env: { RECIPE_API_KEY: "test-key" } });
    const body = await bodyOf(response);
    assert.equal(response.status, 500);
    assert.equal(body.ok, false);
    assert.deepEqual(body.items, []);
  });
});
