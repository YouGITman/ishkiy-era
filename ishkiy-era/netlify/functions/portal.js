// POST /api/portal {session_id} -> a Stripe Billing Portal URL, where a member
// can cancel, change card or download invoices. Needs the portal switched on
// once in Stripe: Settings -> Billing -> Customer portal.
import { stripe, json, validSession } from "../lib/stripe.js";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  let body = {};
  try { body = await req.json(); } catch {}
  if (!validSession(body.session_id)) return json({ error: "Bad session id" }, 400);
  try {
    const s = await stripe("GET", `checkout/sessions/${body.session_id}`);
    if (!s.customer) return json({ error: "No customer on this purchase" }, 404);
    const portal = await stripe("POST", "billing_portal/sessions", { customer: s.customer, return_url: new URL(req.url).origin + "/" });
    return json({ url: portal.url });
  } catch (e) {
    return json({ error: e.message }, 502);
  }
};

export const config = { path: "/api/portal" };
