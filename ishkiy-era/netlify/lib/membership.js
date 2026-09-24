// Membership helpers shared by the Stripe functions.
//
// Stripe is the one record of who is a member — there is no copy of it in
// Supabase to drift out of date. The app holds a signed token naming its Stripe
// customer; every check asks Stripe for that customer's subscription as it is
// right now. The token is an HMAC over the customer id, so a customer id alone
// can't be used to read anyone's membership.
import Stripe from "stripe";
import { createHmac, timingSafeEqual } from "node:crypto";

export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export const stripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  // STRIPE_API_HOST points the SDK at stripe-mock (or any stand-in) for local tests; unset in production.
  const host = process.env.STRIPE_API_HOST;
  return host ? new Stripe(key, { host, port: Number(process.env.STRIPE_API_PORT || 12111), protocol: "http" }) : new Stripe(key);
};

const secret = () => {
  const s = process.env.MEMBERSHIP_SECRET;
  if (!s || s.length < 32) throw new Error("MEMBERSHIP_SECRET must be set (32+ characters)");
  return s;
};
const sign = (customerId) => createHmac("sha256", secret()).update(customerId).digest("base64url");
export const tokenFor = (customerId) => `${customerId}.${sign(customerId)}`;
export const customerFromToken = (token) => {
  if (typeof token !== "string") return null;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const id = token.slice(0, dot), mac = Buffer.from(token.slice(dot + 1));
  const want = Buffer.from(sign(id));
  return mac.length === want.length && timingSafeEqual(mac, want) ? id : null;
};

// past_due keeps access while Stripe retries a failed card; everything else is out.
export const LIVE = ["active", "trialing", "past_due"];

/* The subscription that decides access: a live one if there is one, otherwise
   the most recent, so a lapsed member sees when it ended rather than nothing. */
export const membershipOf = async (s, customerId) => {
  const subs = await s.subscriptions.list({ customer: customerId, status: "all", limit: 10 });
  const sorted = subs.data.sort((a, b) => b.created - a.created);
  const sub = sorted.find((x) => LIVE.includes(x.status)) || sorted[0];
  if (!sub) return { status: "none" };
  const item = sub.items && sub.items.data && sub.items.data[0];
  // Period dates live on the subscription item in current API versions.
  const periodEnd = (item && item.current_period_end) || sub.current_period_end || null;
  const interval = item && item.price && item.price.recurring ? item.price.recurring.interval : null;
  return {
    status: sub.status,
    live: LIVE.includes(sub.status),
    plan: interval === "year" ? "annual" : "monthly",
    periodEnd: periodEnd ? periodEnd * 1000 : null,
    cancelAtPeriodEnd: !!sub.cancel_at_period_end,
  };
};
