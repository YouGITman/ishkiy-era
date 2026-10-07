// Confirms a finished Stripe Checkout so the app can unlock.
// The person lands back on the site with ?paid=cs_..., and the app sends that
// id here with its device id. We ask Stripe whether the session belongs to ERA
// and is paid, then tie the payment to that device by writing it into the
// payment's metadata, so a shared success link can't unlock a second device.
// Same environment variables as checkout.js; no database needed.
export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return json({ ok: false, reason: "not_configured" }, 503);

  let body = {};
  try { body = await req.json(); } catch {}
  const id = String(body.session_id || "");
  const device = String(body.device || "").slice(0, 40);
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id) || !device) return json({ ok: false, reason: "bad_request" }, 400);

  const auth = { Authorization: `Bearer ${key}` };
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${id}?expand[]=payment_intent`, { headers: auth });
  if (res.status === 404) return json({ ok: false, reason: "not_found" }, 404);
  const s = await res.json().catch(() => ({}));
  if (!res.ok) return json({ ok: false, reason: "stripe" }, 502);
  if ((s.metadata || {}).app !== "era") return json({ ok: false, reason: "not_found" }, 404);
  if (s.status !== "complete" || !["paid", "no_payment_required"].includes(s.payment_status)) return json({ ok: false, reason: "unpaid" }, 402);

  // A fully discounted checkout has no payment to tie a device to; it unlocks as is.
  const pi = s.payment_intent && typeof s.payment_intent === "object" ? s.payment_intent : null;
  if (pi) {
    const claimed = (pi.metadata || {}).era_device;
    if (claimed && claimed !== device) return json({ ok: false, reason: "claimed" }, 409);
    if (!claimed) {
      const form = new URLSearchParams({ "metadata[era_device]": device, "metadata[era_claimed_at]": new Date().toISOString() });
      await fetch(`https://api.stripe.com/v1/payment_intents/${pi.id}`, { method: "POST", headers: { ...auth, "Content-Type": "application/x-www-form-urlencoded" }, body: form });
    }
  }
  return json({ ok: true, receipt: (pi && pi.id) || s.id, email: (s.customer_details || {}).email || null, live: s.livemode === true });
};

const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });

export const config = { path: "/api/verify-payment" };
