// iSHKiY shared AI proxy — key lives in Netlify env var ANTHROPIC_API_KEY.
/* The Companion resends the same profile, report and voice instructions with
   every question. Sent as `cached`, that prefix is marked for prompt caching:
   repeat reads within a few minutes cost about a tenth of fresh input, and only
   the part that changes each time (`system`) is billed at full rate. Callers
   that send `system` alone behave exactly as before. */
const systemFrom = (body) => {
  const cached = typeof body.cached === "string" ? body.cached.slice(0, 30000) : "";
  const rest = typeof body.system === "string" ? body.system.slice(0, 32000 - cached.length) : "";
  if (!cached) return rest || undefined;
  return [
    { type: "text", text: cached, cache_control: { type: "ephemeral" } },
    ...(rest ? [{ type: "text", text: rest }] : []),
  ];
};

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
    system: systemFrom(body),
    messages: Array.isArray(body.messages) ? body.messages.slice(0, 8) : [],
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
