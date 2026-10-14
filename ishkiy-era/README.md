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
Checkout runs on Stripe's own page through three small Netlify functions (`/api/checkout`, `/api/verify`, `/api/portal`). No webhook and no database: Stripe sends the customer back to `/?paid=<session>`, the app confirms that session with Stripe, and the device keeps it as its receipt. Monthly members are re-checked once a day, so a cancelled membership winds down by itself.

1. Stripe → **Product catalogue → Add product** "iSHKiY founding access", one-off price **£9.99 GBP**. Copy the price id (`price_…`).
2. *(Optional, when the price is decided)* add a recurring monthly price to a membership product. Until its id is set, the monthly option simply doesn't appear.
3. Stripe → **Settings → Billing → Customer portal** → turn it on (lets members cancel and download receipts). **Settings → Emails** → tick *Successful payments* so receipts go out.
4. Netlify → **Environment variables**:
   - `STRIPE_SECRET_KEY` — `sk_live_…` for **Production**, `sk_test_…` for **Deploy previews / Branch deploys** (Netlify lets you set a different value per deploy context). Test with card `4242 4242 4242 4242`.
   - `STRIPE_PRICE_ONCE` — the £9.99 price id (live id in production, test-mode id in previews).
   - `STRIPE_PRICE_MONTHLY` — optional, as above.
5. Redeploy. Discount codes: Products → Coupons → create a promotion code; Checkout already accepts them, and a 100%-off code unlocks like a payment.

**Refunds.** The unlock screen promises "if you don't think it was worth it, tell me and I'll refund you". Refund from the payment in the Stripe Dashboard (Payments → the charge → Refund). Access isn't revoked; that's the point of the promise.

### 6. Founding access codes (comps and testers)
```
node gen-codes.mjs 10
```
prints ten codes and their hashes. Paste the hashes into `CODE_HASHES` in `src/app.jsx`, commit, deploy. Send one code per customer with their payment confirmation.

**Simplest founding flow:** one code per Stripe confirmation message, rotated manually after each sale (you'll have five to ten customers — thirty seconds each). Automation comes when volume justifies a backend, not before.

The `PREVIEW` code is not in `CODE_HASHES` and needs no removing before launch — it is gated on the hostname instead. See the note above `CODE_HASHES` in `src/app.jsx`.

---

### 7. Tester survey
The tester version asks seven open questions (first five minutes, what nearly made them quit, the one feature to keep, where they had to guess, monthly vs one-off, would they keep paying) and gives 30 more Companion days on completion. Entry points: a card on Home once the report exists, the "week has ended" Companion screen, and Settings.

1. Supabase → SQL Editor → paste `supabase/tester-feedback.sql` → Run. Answers land in `tester_feedback`, readable only by the admin email.
2. Monthly members who finish it are told their free month is credited by hand: in Stripe, open their subscription → **Add coupon** (a one-month 100% coupon).
3. At full launch set `TESTER_MODE = false` in `src/app.jsx` — survey, consent card and tester settings all go with it.

### 8. Behavioural analytics (PostHog)
Screen views, time on each screen (and on each question of the assessment), hover dwell on key buttons, and the screen someone was on when they left. Off until the tester taps "Yes, that's fine" on Home (or turns it on in Settings).

1. posthog.com → sign up → create a project on **EU cloud** (free tier is plenty).
2. Project settings → copy the **Project API key** (`phc_…`, public by design) into `POSTHOG_KEY` in `src/analytics.js`. Commit → deploys.
3. In PostHog: **Paths** (event `$screen`) shows routes through the app; a **Trends** insight on `screen_time` broken down by `$screen_name` shows dwell; `app_hidden` broken down by `$screen_name` and `item` shows exit points.

It deliberately doesn't use the posthog-js library: its autocapture and session replay would record the text people tap, which here means their answers. `src/analytics.js` sends only screen names, part ids, question numbers and timings.

## Files

| File | What it is |
|---|---|
| `index.html` | Shell, fonts, all styling including print styles. The visual layer ("LUMINOUS") is one block at the end of the stylesheet |
| `src/items.js` | The item bank — mirrors `ERA-v1-item-bank.md` exactly; edit wording here |
| `src/app.jsx` | Flow, scoring, glimmers, unlock, report generation, companion chat, account and practitioner screens |
| `src/mini.js` | Mini-assessments and their scoring |
| `src/fx.jsx` | Motion and light: the starfield, word reveals, screen transitions, scroll reveals, sparks, count-ups. Decoration only; reduced-motion users get a still version |
| `netlify/functions/claude.js` | The shared iSHKiY AI proxy (key server-side; the model is pinned here) |
| `netlify/functions/checkout.js`, `verify.js`, `portal.js` | Stripe Checkout, payment confirmation, billing portal. Shared helpers in `netlify/lib/stripe.js` |
| `src/analytics.js` | Consent-gated PostHog events: screens, timings, hovers, exit points |
| `supabase/tester-feedback.sql` | The tester survey table — run once |
| `supabase/schema.sql` | Tables and row-level security — paste into the Supabase SQL editor |
| `admin.html` / `dist/admin.js` | Admin view for the practitioner approval queue |
| `gen-codes.mjs` | Access-code generator |
| `npm run preview` | Runs the app locally on `http://127.0.0.1:5199`, unminified and rebuilding as you go. The Companion won't answer — `/api/claude` only exists on Netlify. |
| `icon.svg` / `favicon.svg` | **Placeholders** — replace with `ii-dark-primary.svg` from the canonical rebrand kit |

## Housekeeping before launch
- [ ] Replace placeholder icons with the canonical ii sub-mark from the rebrand kit
- [ ] Stripe env vars set (live key in Production, test key in previews) and one real £9.99 purchase made and refunded
- [ ] `tester-feedback.sql` run; PostHog key pasted
- [ ] At full launch: `TESTER_MODE = false`
- [ ] Generate real codes
- [ ] Run one full assessment on the Pixel and one on Chrome desktop
- [ ] Read one full generated report out loud — the voice test

## What v1 deliberately does not have
The free Glimpse tier, dashboards. (Subscriptions are wired but hidden until a monthly price is set.) All of that waits behind the first paying customers — by design, per the roadmap.

Accounts and the practitioner layer arrived after the original v1 scope: sign-in is a Supabase email magic link, the cloud copy of the profile is opt-in, and sharing with a practitioner requires an explicit grant recorded in `share_grants`. The default path through the app still touches none of it.
