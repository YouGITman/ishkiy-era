// Shared Stripe helpers for the Netlify functions. No SDK: Stripe's REST API
// takes form-encoded bodies, and three small calls don't justify a dependency.
//
// Pricing (agreed in the visual-redesign work, PR #2):
//   monthly  £9.99 for the first month (a one-off £3 coupon), then £12.99 a month
//   annual   £89.99 a year
// The report is delivered in the first month and stays the customer's for good.
//
// Env vars (Netlify -> Site settings -> Environment variables):
//   STRIPE_SECRET_KEY      sk_live_... in production, sk_test_... in deploy previews
//   STRIPE_PRICE_MONTHLY   price_... recurring £12.99 / month
//   STRIPE_PRICE_ANNUAL    price_... recurring £89.99 / year
//   STRIPE_INTRO_COUPON    coupon id: £3 off, duration "once" (makes the first month £9.99)
//   STRIPE_SURVEY_COUPON   coupon id: 100% off, duration "once" (the tester survey's free month)

export const PLANS = {
  monthly: { env: "STRIPE_PRICE_MONTHLY" },
  annual: { env: "STRIPE_PRICE_ANNUAL" },
};

// Flattens { a: { b: 1 }, c: [x] } into a[b]=1&c[0]=x, the way Stripe wants it.
const form = (obj, prefix = "", out = new URLSearchParams()) => {
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object") form(v, key, out);
    else out.append(key, String(v));
  }
  return out;
};

export async function stripe(method, path, params) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  const url = `https://api.stripe.com/v1/${path}` + (method === "GET" && params ? `?${form(params)}` : "");
  const res = await fetch(url, {
    method,
    headers: { authorization: `Bearer ${key}`, "content-type": "application/x-www-form-urlencoded" },
    body: method === "GET" ? undefined : form(params || {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data.error && data.error.message) || `Stripe ${res.status}`);
  return data;
}

export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

// A Checkout Session id is long and random; it is the customer's receipt for
// this device. Reject anything that isn't shaped like one before calling Stripe.
export const validSession = (id) => typeof id === "string" && /^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(id);

/* What a session entitles someone to, right now: membership is live while
   Stripe says active or trialing (past_due gets the benefit of the doubt
   while Stripe retries the card). */
export async function entitlement(sessionId) {
  const s = await stripe("GET", `checkout/sessions/${sessionId}`, { expand: ["subscription"] });
  const plan = (s.metadata && s.metadata.plan) || "monthly";
  const sub = s.subscription;
  const status = sub && sub.status;
  const active = s.status === "complete" && ["active", "trialing", "past_due"].includes(status);
  // current_period_end moved onto subscription items in newer API versions.
  const end = sub && (sub.current_period_end || (sub.items && sub.items.data[0] && sub.items.data[0].current_period_end));
  return { plan, active, status, cancelAt: sub && sub.cancel_at_period_end ? end : null, renews: end || null, rewarded: !!(sub && sub.metadata && sub.metadata.survey_reward) };
}
