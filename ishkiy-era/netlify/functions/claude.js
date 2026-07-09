// iSHKiY shared AI proxy — key lives in Netlify env var ANTHROPIC_API_KEY.
export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return new Response(JSON.stringify({ error: "Missing ANTHROPIC_API_KEY" }), { status: 500 });

  let body;
  try { body = await req.json(); } catch { return new Response("Bad request", { status: 400 }); }

  const payload = {
    model: "claude-sonnet-4-6",
    max_tokens: Math.min(body.max_tokens || 1400, 2000),
    system: typeof body.system === "string" ? body.system.slice(0, 8000) : undefined,
    messages: Array.isArray(body.messages) ? body.messages.slice(0, 4) : [],
  };

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
