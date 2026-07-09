# iSHKiY — ERA v1

The Essence Recovery Assessment. Nine parts, ~105 items, glimmer screens between parts, Claude-written report, print-to-PDF. Haven pattern: single-page React app, Netlify hosting, serverless proxy holding the API key, everything else on-device.

**No accounts. No database. No user data on any server.** Answers live in the customer's browser (`localStorage`); the report is generated through the proxy and belongs to them.

---

## Deploy (about 20 minutes, same route as Haven)

### 1. GitHub
1. Open GitHub Desktop → File → **Add local repository** → choose this `ishkiy-era` folder (if it says "not a repository", click *create a repository* when offered).
2. Name it `ishkiy-era`. Commit everything ("ERA v1"). **Publish repository** (private is fine).

### 2. Netlify
1. Netlify → **Add new site → Import an existing project** → GitHub → `ishkiy-era`.
2. Build command and publish directory are read from `netlify.toml` automatically (`npm run build`, publish `.`). Just click **Deploy**.
3. Site settings → **Environment variables** → add `ANTHROPIC_API_KEY` with your key (same one Haven's function uses). Redeploy after adding it (Deploys → Trigger deploy).

### 3. Test with the founder code
Open the live site, tap **Begin**, enter code `PREVIEW`. Run the whole assessment yourself, end to end, and generate a real report. This is Gate 2's true review — the item bank read differently on paper than it will on your phone.

### 4. Stripe (when price is decided)
1. Stripe Dashboard → **Payment Links** → new link, one-off price, GBP.
2. Under *After payment*, choose **Show a confirmation page** and put the customer's access code in the custom message (see codes below).
3. Tick **Allow promotion codes** — your discount codes are then created under Products → Coupons, zero code changes here.
4. Copy the payment link URL and replace `STRIPE_PAYMENT_LINK` in `src/app.jsx` (one place, in the `Unlock` component). Commit → auto-deploys.

### 5. Founding access codes
```
node gen-codes.mjs 10
```
prints ten codes and their hashes. Paste the hashes into `CODE_HASHES` in `src/app.jsx`, commit, deploy. Send one code per customer with their payment confirmation.

**Simplest founding flow:** one code per Stripe confirmation message, rotated manually after each sale (you'll have five to ten customers — thirty seconds each). Automation comes when volume justifies a backend, not before.

**Before public launch:** delete the `PREVIEW` hash line from `CODE_HASHES`.

---

## Files

| File | What it is |
|---|---|
| `index.html` | Shell, fonts, all styling including print styles |
| `src/items.js` | The item bank — mirrors `ERA-v1-item-bank.md` exactly; edit wording here |
| `src/app.jsx` | Flow, scoring, glimmers, unlock, report generation |
| `netlify/functions/claude.js` | The shared iSHKiY AI proxy (key server-side) |
| `gen-codes.mjs` | Access-code generator |
| `icon.svg` / `favicon.svg` | **Placeholders** — replace with `ii-dark-primary.svg` from the canonical rebrand kit |

## Housekeeping before launch
- [ ] Replace placeholder icons with the canonical ii sub-mark from the rebrand kit
- [ ] Replace `STRIPE_PAYMENT_LINK` with the real link
- [ ] Generate real codes, remove `PREVIEW`
- [ ] Run one full assessment on the Pixel and one on Chrome desktop
- [ ] Read one full generated report out loud — the voice test

## What v1 deliberately does not have
Accounts, subscriptions, the free Glimpse tier, dashboards, the co-pilot, any backend. All of that waits behind the first paying customers — by design, per the roadmap.
