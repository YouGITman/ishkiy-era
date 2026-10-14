// Shared Stripe helpers for the Netlify functions. No SDK: Stripe's REST API
// takes form-encoded bodies, and three small calls don't justify a dependency.
//
// Env vars (Netlify -> Site settings -> Environment variables):
//   STRIPE_SECRET_KEY     sk_live_... in production, sk_test_... in deploy previews
//   STRIPE_PRICE_ONCE     price_... for the one-off purchase (£9.99)
//   STRIPE_PRICE_MONTHLY  price_... for the monthly membership (optional; the
//                         monthly option stays hidden until this is set)

export const PLANS = {
  once: { env: "STRIPE_PRICE_ONCE", mode: "payment" },
  monthly: { env: "STRIPE_PRICE_MONTHLY", mode: "subscription" },
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

/* What a session entitles someone to, right now. One-off payments are for
   good; a subscription is live while Stripe says active or trialing (past_due
   gets the benefit of the doubt while Stripe retries the card). */
export async function entitlement(sessionId) {
  const s = await stripe("GET", `checkout/sessions/${sessionId}`, { expand: ["subscription"] });
  const plan = (s.metadata && s.metadata.plan) || (s.mode === "subscription" ? "monthly" : "once");
  if (s.mode === "subscription") {
    const sub = s.subscription;
    const status = sub && sub.status;
    const active = ["active", "trialing", "past_due"].includes(status);
    // current_period_end moved onto subscription items in newer API versions.
    const end = sub && (sub.current_period_end || (sub.items && sub.items.data[0] && sub.items.data[0].current_period_end));
    return { paid: s.status === "complete", plan, active, status, cancelAt: sub && sub.cancel_at_period_end ? end : null, renews: end || null };
  }
  // A 100%-off promotion code completes with no_payment_required; that counts.
  const paid = s.status === "complete" && ["paid", "no_payment_required"].includes(s.payment_status);
  return { paid, plan, active: paid, status: s.payment_status };
}
