// GET  /api/checkout          -> which plans are on sale, and their prices
// POST /api/checkout {plan}   -> a Stripe Checkout URL to send the customer to
import { PLANS, stripe, json } from "../lib/stripe.js";

const priceOf = async (plan) => {
  const id = process.env[PLANS[plan].env];
  if (!id) return null;
  const p = await stripe("GET", `prices/${id}`);
  return { amount: p.unit_amount, currency: p.currency, interval: p.recurring ? p.recurring.interval : null };
};

export default async (req) => {
  try {
    if (req.method === "GET") {
      const [once, monthly] = await Promise.all([priceOf("once"), priceOf("monthly")]);
      return json({ once, monthly });
    }
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    let body = {};
    try { body = await req.json(); } catch {}
    const plan = PLANS[body.plan] ? body.plan : null;
    const price = plan && process.env[PLANS[plan].env];
    if (!price) return json({ error: "That plan isn't on sale" }, 400);

    // Back to wherever the customer bought from: live site, preview or localhost.
    const origin = new URL(req.url).origin;
    const session = await stripe("POST", "checkout/sessions", {
      mode: PLANS[plan].mode,
      line_items: [{ price, quantity: 1 }],
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      // One-off buyers get a Customer too, so refunds and receipts sit in one place.
      customer_creation: PLANS[plan].mode === "payment" ? "always" : undefined,
      metadata: { plan },
      subscription_data: PLANS[plan].mode === "subscription" ? { metadata: { plan } } : undefined,
      success_url: `${origin}/?paid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancelled`,
    });
    return json({ url: session.url });
  } catch (e) {
    return json({ error: e.message }, 502);
  }
};

export const config = { path: "/api/checkout" };
