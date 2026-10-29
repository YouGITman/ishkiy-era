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

### 5. Stripe membership
£9.99 buys the assessment, the report and the first month; membership then rolls at £12.99 a month, or £89.99 a year. Stripe is the only record of who is a member — there is no membership table in Supabase. Do all of this in **test mode** first, then repeat in live mode.

1. **Products → Add product** "iSHKiY Membership", with two recurring GBP prices, both set to **include tax** (tax behaviour: inclusive):
   - £12.99 monthly → copy its `price_…` ID
   - £89.99 yearly → copy its `price_…` ID
2. **Products → Coupons → New**: £3.00 off, duration **Once**, applies to the membership product. Give it the ID `INTRO3`. This is what makes the first month £9.99.
3. **Settings → Billing → Customer portal**: switch on cancelling (at the end of the period), switching between the two prices, and updating payment methods. Add your terms and privacy links.
4. **Settings → Billing → Subscriptions and emails**: switch on **renewal reminder** emails (these matter for annual plans and for the coming DMCC subscription rules), failed-payment emails and retries.
5. **Stripe Tax** (once you register for VAT): add your UK registration under Tax → Registrations, then set `STRIPE_AUTOMATIC_TAX=on` below.
6. **Netlify → Site settings → Environment variables:**

| Variable | Value |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_…` (then `sk_live_…`) |
| `STRIPE_PRICE_MONTHLY` | the £12.99 price ID |
| `STRIPE_PRICE_ANNUAL` | the £89.99 price ID |
| `STRIPE_INTRO_COUPON` | `INTRO3` |
| `MEMBERSHIP_SECRET` | 32+ random characters — `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Changing it signs every member out of membership until they restore. |
| `STRIPE_AUTOMATIC_TAX` | `on` once Stripe Tax is set up; leave unset before |
| `STRIPE_SURVEY_COUPON` | a coupon for **100% off, duration Once** (the tester survey's free month); optional — without it, members are told their month is added by hand |

**Sandbox shortcut:** the sandbox's price and coupon IDs are built into `netlify/lib/membership.js`, so with a test key (`sk_test_…`) only `STRIPE_SECRET_KEY` and `MEMBERSHIP_SECRET` are needed. Live mode reads every value from Netlify and never uses the built-in ones. A Netlify value always wins.

Redeploy after adding them. Until the price variables exist, the join screen shows "Membership isn't switched on yet" and founding codes still work.

**Test it:** on a deploy preview, pick a depth → join screen → pay with card `4242 4242 4242 4242` (any future date, any CVC). You should land on the warm-up, and Settings should show "Monthly · renews …". "Manage, switch plan or cancel" opens Stripe's portal.

**How it fits together:** `netlify/functions/checkout.js` starts Checkout; `membership.js` confirms a completed checkout and hands the app a signed token, and re-checks it every few hours; `portal.js` opens the customer portal; `restore.js` brings a membership onto a new device after the person signs in with the email link (their Stripe email must match). Shared code is in `netlify/lib/membership.js`.

### 6. Founding access codes (optional)
Codes still work alongside membership — tucked under the plans on the join screen as "Have a founding access code?". A code gives founding access: assessment, report, Library, and the Companion, with no time limit.
```
node gen-codes.mjs 10
```
prints ten codes and their hashes. Paste the hashes into `CODE_HASHES` in `src/app.jsx`, commit, deploy. Send one code per customer with their payment confirmation.

**Simplest founding flow:** one code per Stripe confirmation message, rotated manually after each sale (you'll have five to ten customers — thirty seconds each). Automation comes when volume justifies a backend, not before.

The `PREVIEW` code is not in `CODE_HASHES` and needs no removing before launch — it is gated on the hostname instead. See the note above `CODE_HASHES` in `src/app.jsx`.

---

### 7. Tester survey
While `TESTER_MODE` is on (top of `src/app.jsx`), people with a report see a "Tell us what it was really like" card on Home (also in Settings). Seven open questions: the first five minutes, what nearly made them quit, the one feature to keep, where they had to guess, monthly vs one-off, and whether they'd keep paying after the report. Members who finish get their next month free, applied to their subscription automatically by `/api/reward` (once per subscription; needs `STRIPE_SURVEY_COUPON`).

1. Supabase → SQL Editor → paste `supabase/tester-feedback.sql` → Run (once). Answers land in `tester_feedback`, readable only by the admin email.
2. At full launch set `TESTER_MODE = false`: the survey, the analytics consent card and the tester settings all go.

### 8. Behavioural analytics (PostHog)
Screen views, time on each screen and on each assessment question, hover time on key buttons, and the screen someone was on when they left. Off until the tester taps "Yes, that's fine" on Home (or turns it on in Settings), and off entirely until a key is set.

1. posthog.com → sign up → create a project on **EU cloud** (the free tier is plenty).
2. Project settings → copy the **Project API key** (`phc_…`, public by design) into `POSTHOG_KEY` in `src/analytics.js`. Commit → deploys.
3. In PostHog: **Paths** on `$screen` shows routes through the app; `screen_time` broken down by `$screen_name` shows dwell; `app_hidden` by `$screen_name` and `item` shows exit points.

It deliberately doesn't use the posthog-js library: its autocapture and session replay would record the text people tap, which here means their answers. `src/analytics.js` sends only screen names, part ids, question numbers and timings.

## Files

| File | What it is |
|---|---|
| `index.html` | Shell, fonts, all styling including print styles. The visual layer ("LUMINOUS") is one block at the end of the stylesheet |
| `src/items.js` | The item bank — mirrors `ERA-v1-item-bank.md` exactly; edit wording here |
| `src/app.jsx` | Flow, scoring, glimmers, unlock, report generation, companion chat, account and practitioner screens |
| `src/mini.js` | Mini-assessments and their scoring |
| `VOICE.md` | How iSHKiY talks: the Sharp and Quiet registers, and what to avoid. The AI follows the same rules (`VOICE` in `src/app.jsx`) |
| `src/fx.jsx` | Motion and light: the starfield, word reveals, screen transitions, scroll reveals, sparks, count-ups. Decoration only; reduced-motion users get a still version |
| `src/voice.js` | Two-way voice for the Companion using the browser's own speech: tap the mic to dictate, Listen to hear a reply, and answers to spoken questions are read aloud. Free, no keys. Recognition runs through the browser maker (Google, Microsoft or Apple); iSHKiY only receives the words. Firefox has no recognition, so the mic hides there |
| `netlify/functions/claude.js` | The shared iSHKiY AI proxy (key server-side; the model is pinned here) |
| `netlify/functions/checkout.js`, `membership.js`, `portal.js`, `restore.js`, `reward.js` | Stripe membership: start checkout, confirm and re-check membership, open the customer portal, restore on a new device, the survey's free month |
| `src/analytics.js` | Consent-gated PostHog events: screens, timings, hovers, exit points |
| `supabase/tester-feedback.sql` | The tester survey table — run once |
| `netlify/lib/membership.js` | Shared Stripe client and the signed membership token |
| `supabase/schema.sql` | Tables and row-level security — paste into the Supabase SQL editor |
| `admin.html` / `dist/admin.js` | Admin view for the practitioner approval queue |
| `gen-codes.mjs` | Access-code generator |
| `npm run preview` | Runs the app locally on `http://127.0.0.1:5199`, unminified and rebuilding as you go. The Companion won't answer — `/api/claude` only exists on Netlify. |
| `icon.svg` / `favicon.svg` | **Placeholders** — replace with `ii-dark-primary.svg` from the canonical rebrand kit |

## Housekeeping before launch
- [ ] Replace placeholder icons with the canonical ii sub-mark from the rebrand kit
- [ ] Stripe set up in live mode (section 5), and one real £9.99 purchase made and refunded
- [ ] Solicitor check of the join-screen consent wording and your subscription terms
- [ ] Generate real codes
- [ ] Run one full assessment on the Pixel and one on Chrome desktop
- [ ] Read one full generated report out loud — the voice test

## What v1 deliberately does not have
The free Glimpse tier, dashboards, and paid human sessions (practitioner payouts via Stripe Connect come next). Membership itself is live — see section 5.

Accounts and the practitioner layer arrived after the original v1 scope: sign-in is a Supabase email magic link, the cloud copy of the profile is opt-in, and sharing with a practitioner requires an explicit grant recorded in `share_grants`. The default path through the app still touches none of it.
