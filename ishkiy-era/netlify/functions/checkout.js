// Starts a Stripe Checkout for iSHKiY membership.
//   monthly: £9.99 first month (a one-off £3 coupon), then £12.99 a month
//   annual:  £89.99 a year, report included
// Prices, coupon and tax are all configured in Stripe; see README.
import { json, stripe } from "../lib/membership.js";

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  let body = {};
  try { body = await req.json(); } catch {}
  const plan = body.plan === "annual" ? "annual" : "monthly";
  const price = plan === "annual" ? process.env.STRIPE_PRICE_ANNUAL : process.env.STRIPE_PRICE_MONTHLY;
  if (!price) return json({ error: "Membership isn't switched on yet." }, 503);

  const origin = new URL(req.url).origin;
  // The intro price is for a first membership only; the app says whether this is one.
  const intro = plan === "monthly" && body.intro !== false && process.env.STRIPE_INTRO_COUPON;
  try {
    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      // Checkout accepts a set discount or a code box, not both.
      ...(intro ? { discounts: [{ coupon: process.env.STRIPE_INTRO_COUPON }] } : { allow_promotion_codes: true }),
      ...(process.env.STRIPE_AUTOMATIC_TAX === "on" ? { automatic_tax: { enabled: true } } : {}),
      subscription_data: { metadata: { app: "era", plan } },
      custom_text: {
        submit: {
          message: plan === "annual"
            ? "£89.99 today for a year of membership. It renews yearly and we'll email you before it does. Cancel any time from Settings."
            : `${intro ? "£9.99 today, then £12.99" : "£12.99"} each month. Cancel any time from Settings in the app.`,
        },
      },
      success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancel`,
    });
    return json({ url: session.url });
  } catch (e) {
    console.error("checkout", e && e.message);
    return json({ error: "Checkout couldn't start. Try again in a moment." }, 502);
  }
};

export const config = { path: "/api/checkout" };
