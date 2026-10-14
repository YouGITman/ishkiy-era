// POST /api/reward {session_id} -> the tester survey's free month, applied to
// the member's subscription as a one-off 100% coupon on their next bill.
// Once per subscription: the subscription's metadata remembers it was given.
import { stripe, json, validSession } from "../lib/stripe.js";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const coupon = process.env.STRIPE_SURVEY_COUPON;
  if (!coupon) return json({ error: "Reward not switched on" }, 503);
  let body = {};
  try { body = await req.json(); } catch {}
  if (!validSession(body.session_id)) return json({ error: "Bad session id" }, 400);
  try {
    const s = await stripe("GET", `checkout/sessions/${body.session_id}`, { expand: ["subscription"] });
    const sub = s.subscription;
    if (!sub || !["active", "trialing", "past_due"].includes(sub.status)) return json({ error: "No live membership" }, 404);
    if (sub.metadata && sub.metadata.survey_reward) return json({ ok: true, already: true });
    await stripe("POST", `subscriptions/${sub.id}`, { discounts: [{ coupon }], metadata: { survey_reward: new Date().toISOString().slice(0, 10) } });
    return json({ ok: true });
  } catch (e) {
    return json({ error: e.message }, 502);
  }
};

export const config = { path: "/api/reward" };
