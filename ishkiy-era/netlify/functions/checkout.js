// Starts a Stripe Checkout for ERA founding access.
// Needs two Netlify environment variables (see README, "Stripe"):
//   STRIPE_SECRET_KEY  a restricted key: Checkout Sessions (write), PaymentIntents (write)
//   STRIPE_PRICE_ID    the price_... id of the £29 founding-access price
// Use test-mode values for Deploy Previews and live values for Production.
export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const key = process.env.STRIPE_SECRET_KEY, price = process.env.STRIPE_PRICE_ID;
  if (!key || !price) return json({ error: "not_configured" }, 503);

  let body = {};
  try { body = await req.json(); } catch {}
  const device = typeof body.device === "string" ? body.device.slice(0, 40) : "";

  // Back to whichever site started the checkout, so previews return to previews.
  const origin = new URL(req.url).origin;
  const form = new URLSearchParams({
    mode: "payment",
    "line_items[0][price]": price,
    "line_items[0][quantity]": "1",
    allow_promotion_codes: "true",
    success_url: `${origin}/?paid={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?checkout=cancelled`,
    "metadata[app]": "era",
    "payment_intent_data[metadata][app]": "era",
  });
  if (device) form.set("client_reference_id", device);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) return json({ error: "stripe", detail: data.error && data.error.message }, 502);
  return json({ url: data.url });
};

const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });

export const config = { path: "/api/checkout" };
