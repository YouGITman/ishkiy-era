// Membership status, two ways in:
//   { session_id } — straight back from Checkout: confirms the payment with
//                    Stripe and hands the app its token for the first time.
//   { token }      — any later check: verifies the token, asks Stripe.
import { json, stripe, tokenFor, customerFromToken, membershipOf } from "../lib/membership.js";

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  let body = {};
  try { body = await req.json(); } catch {}
  try {
    const s = stripe();
    let customer = null;
    if (typeof body.session_id === "string" && body.session_id.startsWith("cs_")) {
      const session = await s.checkout.sessions.retrieve(body.session_id);
      if (session.status !== "complete" || !session.customer) return json({ error: "That checkout hasn't completed." }, 402);
      customer = typeof session.customer === "string" ? session.customer : session.customer.id;
    } else {
      customer = customerFromToken(body.token);
      if (!customer) return json({ error: "Not recognised." }, 401);
    }
    const m = await membershipOf(s, customer);
    return json({ token: tokenFor(customer), ...m });
  } catch (e) {
    console.error("membership", e && e.message);
    return json({ error: "Couldn't check membership right now." }, 502);
  }
};

export const config = { path: "/api/membership" };
