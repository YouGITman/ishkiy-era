// iSHKiY shared AI proxy — key lives in Netlify env var ANTHROPIC_API_KEY.
export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return new Response(JSON.stringify({ error: "Missing ANTHROPIC_API_KEY" }), { status: 500 });

  let body;
  try { body = await req.json(); } catch { return new Response("Bad request", { status: 400 }); }

  const payload = {
    model: "claude-sonnet-5",
    // Thinking runs adaptive by default on Sonnet 5 and its tokens come out of
    // max_tokens. The budgets here are small (220-1400), so keep it off.
    thinking: { type: "disabled" },
    max_tokens: Math.min(body.max_tokens || 1400, 2000),
    // 8000 used to sit here and the Companion silently overran it — the profile,
    // the report and the shared memory together run past 20k, and the tail of the
    // prompt (the "answer this message now" instruction) was being cut off.
    system: typeof body.system === "string" ? body.system.slice(0, 32000) : undefined,
    messages: Array.isArray(body.messages) ? body.messages.slice(0, 8) : [],
  };
  // Structured outputs, for callers that need an answer the app can parse
  // without guessing (the Companion's voice router). Only a JSON schema
  // format is passed through; nothing else in output_config is accepted.
  const fmt = body.output_config && body.output_config.format;
  if (fmt && fmt.type === "json_schema" && fmt.schema && typeof fmt.schema === "object") {
    payload.output_config = { format: { type: "json_schema", schema: fmt.schema } };
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  return new Response(text, { status: res.status, headers: { "content-type": "application/json" } });
};

export const config = { path: "/api/claude" };
