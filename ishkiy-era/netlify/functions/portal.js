// Opens Stripe's customer portal: cancel, switch monthly <-> annual, change card,
// see invoices. What the portal allows is set in the Stripe dashboard.
import { json, stripe, customerFromToken } from "../lib/membership.js";

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  let body = {};
  try { body = await req.json(); } catch {}
  const customer = customerFromToken(body.token);
  if (!customer) return json({ error: "Not recognised." }, 401);
  try {
    const session = await stripe().billingPortal.sessions.create({ customer, return_url: `${new URL(req.url).origin}/?portal=back` });
    return json({ url: session.url });
  } catch (e) {
    console.error("portal", e && e.message);
    return json({ error: "Couldn't open membership settings right now." }, 502);
  }
};

export const config = { path: "/api/portal" };
