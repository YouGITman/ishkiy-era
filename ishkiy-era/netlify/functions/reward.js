// The tester survey's free month. POST { token } (the app's membership token):
// puts a one-off 100% coupon (STRIPE_SURVEY_COUPON) on the member's live ERA
// subscription, so their next bill is free. Once per subscription — the
// subscription's metadata remembers it was given.
import { json, stripe, customerFromToken, LIVE, setting } from "../lib/membership.js";

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const coupon = setting("STRIPE_SURVEY_COUPON");
  if (!coupon) return json({ error: "The free month isn't switched on yet.", detail: "STRIPE_SURVEY_COUPON is missing in Netlify" }, 503);
  let body = {};
  try { body = await req.json(); } catch {}
  const customer = customerFromToken(body.token);
  if (!customer) return json({ error: "Not recognised." }, 401);
  try {
    const s = stripe();
    const subs = await s.subscriptions.list({ customer, status: "all", limit: 10 });
    const sub = subs.data.find((x) => (x.metadata || {}).app === "era" && LIVE.includes(x.status));
    if (!sub) return json({ error: "No live membership to add the month to." }, 404);
    if ((sub.metadata || {}).survey_reward) return json({ ok: true, already: true });
    await s.subscriptions.update(sub.id, { discounts: [{ coupon }], metadata: { survey_reward: new Date().toISOString().slice(0, 10) } });
    return json({ ok: true });
  } catch (e) {
    console.error("reward", e && e.message);
    return json({ error: "Couldn't add the free month right now.", detail: e && e.message }, 502);
  }
};

export const config = { path: "/api/reward" };
