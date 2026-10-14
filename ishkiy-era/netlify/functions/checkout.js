// GET  /api/checkout               -> which plans are on sale, and their prices
// POST /api/checkout {plan, intro} -> a Stripe Checkout URL to send the customer to
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
      const [monthly, annual] = await Promise.all([priceOf("monthly"), priceOf("annual")]);
      let intro = null;
      if (monthly && process.env.STRIPE_INTRO_COUPON) {
        const c = await stripe("GET", `coupons/${process.env.STRIPE_INTRO_COUPON}`);
        intro = { amount: c.amount_off ? monthly.amount - c.amount_off : Math.round(monthly.amount * (1 - (c.percent_off || 0) / 100)), currency: monthly.currency };
      }
      return json({ monthly, annual, intro });
    }
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    let body = {};
    try { body = await req.json(); } catch {}
    const plan = PLANS[body.plan] ? body.plan : null;
    const price = plan && process.env[PLANS[plan].env];
    if (!process.env.STRIPE_SECRET_KEY) return json({ error: "Stripe isn't set up on this site yet (STRIPE_SECRET_KEY is missing in Netlify)." }, 503);
    if (!price) return json({ error: `Membership isn't switched on yet (${plan ? PLANS[plan].env : "plan"} is missing in Netlify).` }, 503);

    // The intro price is for a first membership only; the app says whether this is one.
    const intro = plan === "monthly" && body.intro !== false && process.env.STRIPE_INTRO_COUPON;
    // Back to wherever the customer bought from: live site, preview or localhost.
    const origin = new URL(req.url).origin;
    const session = await stripe("POST", "checkout/sessions", {
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      // Checkout takes a set discount or a code box, not both.
      ...(intro ? { discounts: [{ coupon: intro }] } : { allow_promotion_codes: true }),
      metadata: { plan },
      subscription_data: { metadata: { app: "era", plan } },
      custom_text: { submit: { message: plan === "annual"
        ? "£89.99 today for a year of membership. It renews yearly and we'll email you before it does. Cancel any time from Settings."
        : `${intro ? "£9.99 today, then £12.99" : "£12.99"} each month. Cancel any time from Settings in the app.` } },
      success_url: `${origin}/?paid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancelled`,
    });
    return json({ url: session.url });
  } catch (e) {
    return json({ error: e.message }, 502);
  }
};

export const config = { path: "/api/checkout" };
