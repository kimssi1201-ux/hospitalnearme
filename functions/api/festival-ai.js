const OPENAI_ENDPOINT = "https://api.openai.com/v1/responses";

export async function onRequestPost({ request, env }) {
  try {
    const apiKey = String(env.OPENAI_API_KEY || "").trim();
    if (!apiKey) {
      return jsonResponse(
        {
          ok: false,
          code: "missing_openai_key",
          message: "OPENAI_API_KEY 환경변수가 설정되지 않았습니다."
        },
        500
      );
    }

    const input = await request.json();
    const article = normalizeArticle(input);
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
              "너는 한국어 여행·축제 정보 에디터다. 사용자가 제공한 축제 정보만 바탕으로 방문 전 도움이 되는 짧은 가이드를 만든다. 확인되지 않은 가격, 날짜, 장소, 교통편은 단정하지 않는다. JSON만 출력한다."
          },
          {
            role: "user",
            content: `다음 축제 상세 페이지에 넣을 보강 콘텐츠를 JSON으로 작성해줘.

반환 형식:
{
  "sections": [
    {"title": "방문 포인트", "body": "2~3문장"},
    {"title": "예약 전 체크", "body": "2~3문장"},
    {"title": "현장 준비 팁", "body": "2~3문장"}
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
        max_output_tokens: 900
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
        response.status
      );
    }

    const content = parseModelJson(extractOutputText(payload));
    return jsonResponse({ ok: true, ...content });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        code: "festival_ai_error",
        message: error?.message || "AI 축제 가이드 생성 중 오류가 발생했습니다."
      },
      500
    );
  }
}

export async function onRequestGet() {
  return jsonResponse({
    ok: true,
    message: "POST 방식으로 축제 정보를 보내면 AI 방문 가이드를 생성합니다."
  });
}

function normalizeArticle(input) {
  const facts = Array.isArray(input?.facts)
    ? input.facts.map((item) => String(item || "").slice(0, 120))
    : [];

  return {
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
  const fallback = {
    sections: [],
    tips: []
  };

  if (!text) return fallback;

  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      sections: Array.isArray(parsed.sections) ? parsed.sections.slice(0, 3) : [],
      tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 5) : []
    };
  } catch {
    return fallback;
  }
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
