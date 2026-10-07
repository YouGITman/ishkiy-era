# iSHKiY — ERA v1

The Essence Recovery Assessment. Nine parts, ~105 items, glimmer screens between parts, Claude-written report, print-to-PDF. Haven pattern: single-page React app, Netlify hosting, serverless proxy holding the API key. Supabase sits behind it for the optional account, the practitioner directory, and anonymous event counts — everything else stays on-device.

**No account required. Answers never leave the device unless you ask them to.** The assessment runs entirely in the customer's browser (`localStorage`); the report is generated through the proxy and belongs to them. Signing in is optional and adds one thing: a cloud copy of the profile, readable by that user alone and deletable on demand. Event tracking counts taps, never words — no answers, no conversations, no names.

---

## Deploy (about 20 minutes, same route as Haven)

### 1. GitHub
1. Open GitHub Desktop → File → **Add local repository** → choose this `ishkiy-era` folder (if it says "not a repository", click *create a repository* when offered).
2. Name it `ishkiy-era`. Commit everything ("ERA v1"). **Publish repository** (private is fine).

### 2. Netlify
1. Netlify → **Add new site → Import an existing project** → GitHub → `ishkiy-era`.
2. Set **Base directory** to `ishkiy-era`. Everything lives one folder down from the repo root, and Netlify reads `netlify.toml` from the base directory — get this wrong and the build finds no `package.json`. Build command and publish directory then come from `netlify.toml` automatically (`npm run build`, publish `.`).
3. Site settings → **Environment variables** → add `ANTHROPIC_API_KEY` with your key (same one Haven's function uses). Redeploy after adding it (Deploys → Trigger deploy).

> **Don't upload files to the repo root.** The project folder is `ishkiy-era/`; a copy of `src/`, `dist/`, or `index.html` sitting at the root is not what deploys, and it silently becomes the version you edit next. This has happened four times.

### 3. Supabase
The project URL and anon key are already pasted into `src/app.jsx` (the anon key is public by design — row-level security does the guarding). To stand up a fresh project: Supabase → **SQL Editor → New query** → paste `supabase/schema.sql` → **Run**. Change the admin email inside that file if it isn't `tarang@ishkiy.com`. Until the schema exists, account features show as "coming online" and the app works without them.

### 4. Test with the founder code
Open a **deploy preview** (any Netlify preview or branch URL, or `npm run preview` locally), tap **Begin**, enter code `PREVIEW`. That code works only where the hostname is not the live site, so it can never be used against production. Run the whole assessment yourself, end to end, and generate a real report. This is Gate 2's true review — the item bank read differently on paper than it will on your phone.

### 5. Stripe
People pay on Stripe's own checkout page and come straight back unlocked. Card details never touch iSHKiY. Two Netlify functions do the work: `netlify/functions/checkout.js` starts the checkout, and `netlify/functions/verify-payment.js` confirms it when they return, then ties the payment to that device so a shared link can't unlock a second phone. No database, no webhooks.

Netlify needs two environment variables, set separately per deploy context so previews use test mode and the live site takes real money:

| Variable | Deploy Previews / Branch deploys | Production |
|---|---|---|
| `STRIPE_SECRET_KEY` | test restricted key (`rk_test_…`) | live restricted key (`rk_live_…`) |
| `STRIPE_PRICE_ID` | test price (`price_…`) | live price (`price_…`) |

The restricted key needs **Checkout Sessions: Write** and **PaymentIntents: Write**, nothing else. Discount codes created in Stripe (Products → Coupons → promotion codes) work at checkout automatically. Until both variables exist, the Pay button says payments are being set up and codes still work. The price shown in the app is `PRICE_LABEL` in `src/app.jsx`; keep it the same as the Stripe price.

### 6. Founding access codes
```
node gen-codes.mjs 10
```
prints ten codes and their hashes. Paste the hashes into `CODE_HASHES` in `src/app.jsx`, commit, deploy. Send one code per customer with their payment confirmation.

**Codes are now for giveaways and founders.** Paying customers unlock through Stripe automatically; hand a code to anyone you want to let in free.

The `PREVIEW` code is not in `CODE_HASHES` and needs no removing before launch — it is gated on the hostname instead. See the note above `CODE_HASHES` in `src/app.jsx`.

---

## Files

| File | What it is |
|---|---|
| `index.html` | Shell, fonts, all styling including print styles. The visual layer ("LUMINOUS") is one block at the end of the stylesheet |
| `src/items.js` | The item bank — mirrors `ERA-v1-item-bank.md` exactly; edit wording here |
| `src/app.jsx` | Flow, scoring, glimmers, unlock, report generation, companion chat, account and practitioner screens |
| `src/mini.js` | Mini-assessments and their scoring |
| `VOICE.md` | How iSHKiY talks: the Sharp and Quiet registers, and what to avoid. The AI follows the same rules (`VOICE` in `src/app.jsx`) |
| `src/fx.jsx` | Motion and light: the starfield, word reveals, screen transitions, scroll reveals, sparks, count-ups. Decoration only; reduced-motion users get a still version |
| `netlify/functions/checkout.js` / `verify-payment.js` | Stripe checkout and payment confirmation (keys server-side) |
| `netlify/functions/claude.js` | The shared iSHKiY AI proxy (key server-side; the model is pinned here) |
| `supabase/schema.sql` | Tables and row-level security — paste into the Supabase SQL editor |
| `admin.html` / `dist/admin.js` | Admin view for the practitioner approval queue |
| `gen-codes.mjs` | Access-code generator |
| `npm run preview` | Runs the app locally on `http://127.0.0.1:5199`, unminified and rebuilding as you go. The Companion won't answer — `/api/claude` only exists on Netlify. |
| `icon.svg` / `favicon.svg` | **Placeholders** — replace with `ii-dark-primary.svg` from the canonical rebrand kit |

## Housekeeping before launch
- [ ] Replace placeholder icons with the canonical ii sub-mark from the rebrand kit
- [ ] Stripe keys and price set in Netlify (test for previews, live for production), and one test purchase made on a preview
- [ ] Generate real codes
- [ ] Run one full assessment on the Pixel and one on Chrome desktop
- [ ] Read one full generated report out loud — the voice test

## What v1 deliberately does not have
Subscriptions, the free Glimpse tier, dashboards. All of that waits behind the first paying customers — by design, per the roadmap.

Accounts and the practitioner layer arrived after the original v1 scope: sign-in is a Supabase email magic link, the cloud copy of the profile is opt-in, and sharing with a practitioner requires an explicit grant recorded in `share_grants`. The default path through the app still touches none of it.
