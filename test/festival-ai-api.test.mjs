import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { onRequestGet, onRequestPost } from "../functions/api/festival-ai.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function request(body) {
  return new Request("https://view1.kr/api/festival-ai", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

async function bodyOf(response) {
  return response.json();
}

test("festival AI GET endpoint explains the method", async () => {
  const response = await onRequestGet();
  const body = await bodyOf(response);
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.match(body.message, /POST/);
});

test("festival AI rejects missing credentials", async () => {
  const response = await onRequestPost({ request: request({ title: "Festival" }), env: {} });
  const body = await bodyOf(response);
  assert.equal(response.status, 500);
  assert.equal(body.code, "missing_openai_key");
});

test("festival AI parses fenced JSON from a mocked upstream response", async () => {
  let requestInit;
  globalThis.fetch = async (_url, init) => {
    requestInit = init;
    return new Response(JSON.stringify({
      output_text: "```json\n{\"sections\":[{\"title\":\"Visit\",\"body\":\"Check the schedule.\"}],\"tips\":[\"Bring water.\"]}\n```"
    }), { status: 200, headers: { "content-type": "application/json" } });
  };

  const response = await onRequestPost({
    request: request({
      title: "Summer Festival",
      category: "Performance",
      summary: "A short event summary.",
      facts: ["Fact 1", "Fact 2"]
    }),
    env: { OPENAI_API_KEY: "test-openai-key", OPENAI_MODEL: "test-model" }
  });
  const body = await bodyOf(response);

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.sections[0].title, "Visit");
  assert.deepEqual(body.tips, ["Bring water."]);
  assert.equal(requestInit.headers.Authorization, "Bearer test-openai-key");
  assert.match(requestInit.body, /Summer Festival/);
});

test("festival AI safely falls back for malformed model JSON", async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ output_text: "not-json" }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });

  const response = await onRequestPost({ request: request({}), env: { OPENAI_API_KEY: "test-key" } });
  const body = await bodyOf(response);
  assert.equal(response.status, 200);
  assert.deepEqual(body.sections, []);
  assert.deepEqual(body.tips, []);
});

test("festival AI preserves upstream errors and catches invalid request JSON", async (t) => {
  await t.test("upstream error", async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({ error: { message: "rate limited" } }), {
      status: 429,
      headers: { "content-type": "application/json" }
    });
    const response = await onRequestPost({ request: request({}), env: { OPENAI_API_KEY: "test-key" } });
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
    const response = await onRequestPost({ request: invalid, env: { OPENAI_API_KEY: "test-key" } });
    assert.equal(response.status, 500);
    assert.equal((await bodyOf(response)).ok, false);
  });
});
