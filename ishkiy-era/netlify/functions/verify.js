// GET /api/verify?session_id=cs_... -> what this purchase entitles the device to.
// Called once when the customer lands back from Checkout, and again now and
// then for monthly members so a cancelled membership winds down on its own.
import { entitlement, json, validSession } from "../lib/stripe.js";

export default async (req) => {
  const id = new URL(req.url).searchParams.get("session_id");
  if (!validSession(id)) return json({ error: "Bad session id" }, 400);
  try {
    return json(await entitlement(id));
  } catch (e) {
    return json({ error: e.message }, 502);
  }
};

export const config = { path: "/api/verify" };
