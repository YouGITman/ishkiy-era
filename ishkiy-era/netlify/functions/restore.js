// Restores a membership on a new device. The person signs in with the app's
// existing email link (Supabase), which proves they own the address; this finds
// the Stripe customer with that email and hands back a token. Without the
// sign-in, an email address alone never unlocks anything.
import { json, stripe, tokenFor, membershipOf } from "../lib/membership.js";

// Public by design (same values the app ships with); row-level security guards the data.
const SUPA_URL = process.env.SUPABASE_URL || "https://rstyfrjtyvtxktnynnnw.supabase.co";
const SUPA_ANON = process.env.SUPABASE_ANON_KEY || "sb_publishable_p-4dmXxdBcrO8oT6nlVjpw_ofYnapaS";

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  let body = {};
  try { body = await req.json(); } catch {}
  if (typeof body.access_token !== "string") return json({ error: "Sign in first." }, 401);
  try {
    const who = await fetch(`${SUPA_URL}/auth/v1/user`, { headers: { apikey: SUPA_ANON, Authorization: `Bearer ${body.access_token}` } });
    if (!who.ok) return json({ error: "Your sign-in has expired. Sign in again." }, 401);
    const user = await who.json();
    const email = user && user.email && user.email_confirmed_at ? user.email : null;
    if (!email) return json({ error: "Confirm your email first." }, 401);

    const s = stripe();
    const customers = await s.customers.list({ email, limit: 10 });
    let best = null;
    for (const c of customers.data) {
      const m = await membershipOf(s, c.id);
      if (m.live) { best = { id: c.id, m }; break; }
      if (!best && m.status !== "none") best = { id: c.id, m };
    }
    if (!best) return json({ error: "No membership found for that email." }, 404);
    return json({ token: tokenFor(best.id), ...best.m });
  } catch (e) {
    console.error("restore", e && e.message);
    return json({ error: "Couldn't restore right now." }, 502);
  }
};

export const config = { path: "/api/restore" };
