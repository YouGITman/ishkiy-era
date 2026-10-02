# iSHKiY ERA: context for anyone designing an enhancement

Read this first. It tells you what ERA is, who it is for, how it sounds, how it is built, and where it is safe to change things. It was written from the code in `ishkiy-era/` (repo `YouGITman/ishkiy-era`, branch `main` at the time of writing). Where something could not be confirmed from the code, it says so.

The founder is **Tarang** (admin email in the schema: `tarang@ishkiy.com`). The brand and every word of copy use **UK English**.

---

## 1. What iSHKiY is, and where ERA sits

**iSHKiY** is a startup building three things for people who feel boxed in by work and life:

1. **Psychometric assessment**: understand yourself properly.
2. **Matching to vetted humans**: therapists, counsellors, coaches, mentors, financial advisers, personal trainers and physios, chosen by how you work.
3. **An AI companion**: voices that have read your profile and remember what you tell them.

**ERA (Essence Recovery Assessment)** is the first product and the hub. It is a phone-first web app that takes someone through nine short parts, writes them a personal report, and then lets them talk it over with an AI Companion. Around it sits a **Library of You** (twelve extra "lenses"), a **human directory**, and a **Constellation** that connects ERA to sibling iSHKiY apps.

Brand line: **"You weren't built for a box."** The closing line of every report is exactly: **"The box was never you."**

Sibling apps (ERA lists them in `SIBLINGS` in `src/app.jsx`): **Haven** (money, "Money, without the dread."), **Kite** (ADHD days, "One thing. Not the list."), **Current** (flow, "Flow you build, not wait for."), **Forge** (training and recovery, "Train the body. Steady the mind."). A newer sibling, **iSHKiY Identity** (`ishkiy-identity/` in the same repo, see section 12), is not yet in that list.

### Who it is for
Adults at a crossroads, burnt out, stuck, or curious: people who have read the books and done the quizzes and still feel unseen. The tone assumes intelligence and tiredness. It never sells, never diagnoses, and never tells anyone what they "should" do.

### The promises ERA makes (do not break these)
- **No account required.** Answers live in `localStorage` on the phone.
- **Answers never leave the device unless the person asks.** The report and Companion send text to the AI proxy, and that is disclosed.
- **Event tracking counts taps, never words.** No answers, conversations or names are tracked.
- **Cloud backup is optional, readable by the user alone, and deletable.**
- **Sharing with a practitioner needs explicit consent**, recorded in a ledger (`share_grants`), and can be revoked.
- **It is a self-discovery tool, not a medical test.** Grounded in published frameworks, not clinically validated, and it says so.

---

## 2. Voice and copy rules (non-negotiable)

These are enforced in the AI prompts and apply equally to hand-written copy. The report prompt is `SYSTEM` and the Companion prompt is `COMPANION_SYSTEM` in `src/app.jsx`. Read both before writing any new AI feature.

- **UK English.** Short sentences. Fragments allowed. Most sentences under fifteen words. Vary rhythm like speech.
- Writes as "a wise friend with a pen": kind, unhurried, tells the truth gently. Not a coach, consultant or assistant.
- **Banned words**: leverage, optimise, journey, deliver, transform, unlock, empower, navigate, landscape, tapestry, testament, delve, moreover, furthermore, additionally, ultimately, holistic, comprehensive, resonate, foster, harness, elevate, robust.
- **Banned constructions**: "It's worth noting", "It's important to", "not just X but Y", "isn't merely X, it's Y", "In conclusion", "What's striking is", rhetorical questions, two consecutive paragraphs starting with the same word.
- At most one em-dash per section. **No bullet lists in prose. No exclamation marks.**
- Use the person's name at most twice per report. Be specific to *their* numbers and *their* words; if a line could sit in anyone's horoscope, cut it.
- One dry understatement per section is allowed; never ask for the laugh.
- End a section on a feeling or a plain truth, never a summary or a "consider".
- Say "your answers suggest" and "the pattern points to", never "you are" or any diagnosis.
- Never show raw scores to the person in prose ("you lean toward the long view", not "openness is 72"). Tiles and bars may show numbers.
- "Steadiness" is inverted Neuroticism, and explained plainly once if relevant.
- Report format: each section starts with a `### ` headline of six to ten words ("the truth of the section said the way a friend would say it across a kitchen table"), then short paragraphs.
- Companion boundary sentences (not a clinician, not therapy, not medical or legal advice) are wrapped in `[!` and `!]` so the UI can render them as a visible notice.

Some of the strongest copy in the app sits in `QUOTES` (the opening breath screen): "The box was never you." "Become more, not less." "Refuse the box. Build the way out." "Your weird is your wealth." "Stay yourself. The rest follows."

---

## 3. Look and feel

- **Palette**: ink `#0F1E3D`, bone `#F5F1E8`, gold `#D4A547`. Plus per-section accents: think `#5C7CA3`, heart `#C06B5C`, pull `#D4A547`, values `#6F8F5E`, work `#8A6FA0`, SOS `#C0504D`.
- **Type**: Lora (serif) for display and questions, Inter for body. Both from Google Fonts.
- **Wordmark**: "iSHKiY" in Lora 700 with the two i's as dotless "ı" carrying a gold tittle (dot). Implemented in `Wordmark` in `src/app.jsx` and the `.wm-i` and `.tittle` CSS.
- **Spirit**: calm, spacious, soft edges, space over lines. Dark screens for moments (welcome, warm-up, glimmers); bone ground for reading. A "dark mode" toggle exists in Settings (`body.dm`).
- **The Orb**: a small face that smiles and glows, the product's mascot. **Helper avatars** for the three Companion voices (`Avatar`).
- **Motion**: slow and optional. Respect `prefers-reduced-motion`. Nothing flashes.
- All styling is in the big `<style>` block in `index.html` (about 690 lines), with print styles for the PDF report.

---

## 4. Stack and how it is deployed

| Layer | What |
|---|---|
| App | One React 19 single-page app, `src/app.jsx` (about 2,570 lines), bundled with esbuild to `dist/app.js` |
| Data | `src/items.js` (the item bank), `src/mini.js` (the Library lenses) |
| Hosting | Netlify. Base directory `ishkiy-era`, `netlify.toml` gives `npm run build`, publish `.` |
| AI | `netlify/functions/claude.js`, a thin proxy at **`/api/claude`**. Key in env var `ANTHROPIC_API_KEY`. Model pinned in the function (`claude-sonnet-5`, thinking disabled). `max_tokens` is clamped to 2,000, `system` to 32,000 characters, and `messages` to the first 8 |
| Backend | Supabase (URL and public anon key are in `src/app.jsx`; row-level security guards it). Schema in `supabase/schema.sql` |
| Payments | Stripe Payment Link, **not yet wired**: the string `STRIPE_PAYMENT_LINK` in the `Unlock` component is a placeholder |
| Access | SHA-256-hashed one-time codes (`CODE_HASHES`), made with `gen-codes.mjs`. `PREVIEW` is a founder code that only works off the live hostname |

**Pattern name**: "Haven pattern", the same recipe the sibling app Haven uses. A single-page React app, Netlify hosting, and a serverless proxy that holds the key.

**Local run**: `npm install`, then `npm run preview` serves `http://127.0.0.1:5199` unminified. The Companion will not answer locally, because `/api/claude` only exists on Netlify.

### Repo traps
- The project folder is `ishkiy-era/` inside the repo. The README warns: **never put `src/`, `dist/` or `index.html` at the repo root.** It has happened four times and the copy at the root silently becomes the one that gets edited.
- `dist/app.js` is committed in this project and is the deployed bundle. Rebuild it (`npm run build`) after every change.
- Netlify publishes the whole folder (`publish = "."`). Anything you add to `ishkiy-era/` is publicly served. Put non-public files elsewhere (this `docs/` folder is outside it).

---

## 5. The user journey

**Phases** are the screens, held in `state.phase` and routed at the top of `App()` in `src/app.jsx`. The main ones:

`breath` (opening quote and Orb) → `explainer` (swipeable intro deck, first visit only) → `home` (the cockpit) → `welcome` → `unlock` (code) → `warmup` (breathing) → `chooseDepth` → `intro`/`run` per part → `glimmer` between parts → `badge` → `generating` → `report`.

Other phases: `companion`, `library`, `miniRun`, `miniResult`, `strength`, `humans`, `apply`, `constellation`, `account`, `settings`, `explainerAgain`.

### Home (the cockpit)
Tiles: **Your profile / Write my report / Continue / Take the assessment** (changes with state), **Profile strength**, **Your companion**, **A human, when ready**, **The Library of You**, **The Constellation**, **Your account**. A rotating quote strip sits at the bottom. "Save and pick up later" remembers exact position (`state.paused`).

### The assessment: nine parts, about 105 items, about 10 to 15 minutes for a first profile

| # | Part id | Title | What it measures |
|---|---|---|---|
| 1 | `arrival` | Arrival | Free text and context: name, role, hardest part of work, a good day, what brought them. No scores |
| 2 | `think1` | How you think: patterns and numbers | Numeric and spatial puzzles (CHC-inspired). Untimed |
| 3 | `think2` | How you think: words and logic | Verbal and logic puzzles |
| 4 | `ei1` | How you read the room | Emotional intelligence: self-awareness, social awareness (Goleman) |
| 5 | `ei2` | How you handle the heat | Self-management, relationship management |
| 6 | `riasec` | What pulls you | Holland RIASEC interests (enjoyment scale) |
| 7 | `values` | What you're for | Schwartz-style values, ranked plus forced choices |
| 8 | `big5` | How you work | Big Five (steadiness is inverted neuroticism) |
| 9 | `mirror` | The mirror | Free text plus an acknowledgement |

Item formats: `L5` (five-point agree), `E5` (five-point enjoy), `MC` (multiple choice, with `key` for puzzles), `FC` (forced choice), `FT` (free text), `ACK`. Items are written for iSHKiY and sample the ideas in the research; none copies a published scale's wording. The header of `items.js` names `ERA-v1-item-bank.md` as the signed-off source of truth ("Gate 1") and says `items.js` must mirror it exactly. **That document is not in this repo**, so ask Tarang for it before changing any item wording.

**Depth arcs** (`arcParts`): "starter" is `values`, `big5`, `think1` (about 12 minutes). "core" adds `riasec`, `ei1`, `ei2`. "more" is whatever is left. "full" is all nine. A partial profile is honest: untaken parts read as "not yet", never as zero.

**Glimmers**: a short moment between parts that reflects something back (a dot, a bar, a petal chart), written by `part.glimmer.line()`, not by the model.

### Scoring (`computeScores(answers)`)
Pure client-side. Returns `{ thinking, ei, riasec, values, big5, qc, measured }`. `measured` says which instruments actually have answers. `qc` holds quality checks: straight-lining (twelve of the same answer in a row) and a consistency gap. Only puzzles the person answered count, so an untaken puzzle never scores zero.

### Profile strength and levels
One number out of 100: **nine parts carry 70, the Library lenses carry 30.** Levels (`LEVELS`): **First Light** (6) → **In Focus** (38) → **Full Portrait** (70, needs all nine parts) → **In Colour** (85) → **Life Size** (100). Levels from Full Portrait up also require all nine parts, so a stack of lenses can never buy a name that claims a complete portrait. `nextStep()` returns the plain-words next action. There is a badge screen at the end of the parts. The design intent is that **the profile deepens for life and is never "finished"**.

### The report
`reportCalls(answers, scores)` builds several prompts, run in parallel through `/api/claude`, then stitched: Opening, Values and work, Think and feel, What pulls you, The tensions (full profile only), What this suggests. Every prompt carries a `SCOPE` line saying which parts were taken, so the writer never invents or blames. The report has results **tiles** (expandable), a **share card** (SVG, downloadable), **print to PDF** with ERA branding, a **Rewrite my report** button, and **retake** buttons per part. Partial profiles open with `ViewIntro`, which is written in the app, not by the model. The report is stored on-device and is the person's to keep.

### The Companion
- **Three voices** over **one shared memory**: **Sounding** (the default; listens, untangles, helps you hear yourself), **Coach** (one concrete step this week), **Mentor** (the long view, "people shaped like you often…"). Prompts are in `MODES`. A **router** (a small model call) picks the voice and decides whether a message continues an existing conversation or opens a new one.
- Each voice keeps its own stream; `centralMemory()` feeds summaries of *every* voice into each voice's context, so none repeats a question already answered elsewhere.
- **Limits**: `Q_CAP = 10` questions a day across all voices, and a **7-day founding window** (`COMPANION_DAYS`). After day seven the report stays forever; the Companion "returns with iSHKiY membership" (not built).
- A **Pulse** is a short running summary per voice. Every reply starts with a subject line (three to five words) used for topic dividers.
- Hard boundaries: not a clinician, never diagnoses, never advises on medication, medical or legal matters. Serious distress gets warmth, no lecture, and a gentle push to a person.
- The context sent to the model: the profile, the report text, the shared memory, and the current mode. The prompt truncation of the proxy matters here: the profile, report and memory together run past 20k characters, so `system` is allowed 32k (it was once 8k and silently cut off the instruction at the end).

### The Library of You
Twelve "lenses" (`MINIS` in `src/mini.js`), grouped into five subjects (`SUBJECTS`):

| Subject | Lenses (id: name) |
|---|---|
| Relationships (`closeness`) | `attachment` How you attach · `friend` The friend you are, and the one you need · `room` The room you walk into · `fight` How you fight |
| Drive | `approach` How you meet the world · `builder` The builder's pattern · `stuck` What you do when you're stuck |
| Mind | `pressure` How you carry pressure · `resilience` Getting back up |
| Money | `money` Money and you · `enough` Enough |
| Purpose (`becoming`) | `narrative` The life you meant to build · plus **The Partner Series**, a placeholder for lenses built with named thinkers (nothing signed yet) |

Each lens is 10 to 13 items, scored on named dimensions, with a `research` block (what it draws on, and *what it cannot claim*), a `read(r)` function that turns a result into words **at render time** (never stored, so wording can improve without retakes), and "try this" lines. Lenses unlock at **Full Portrait**. Three are labelled FREE and the rest MEMBERSHIP in the tier badge, but **all are open during the founding period** (membership does not exist yet). There is also a built-in **SOS** section of UK crisis lines (`SOS_LINES`), checked September 2026.

### Humans ("A human, when ready")
A directory of vetted practitioners (`practitioners` table; disciplines: therapist, counsellor, coach, mentor, IFA, PT, physio). Matching is by `matchScore(p, scores)`. A person can pick which report sections to share (`share_grants`). Practitioners apply through `ApplyScreen` and land as `pending`; the admin approves. The page `admin.html` plus `dist/admin.js` is the approval queue. Booking fees, when they exist, will be built into the session price, never added on top. The seed `PRACTITIONERS` list in the app is placeholder data.

### The Constellation
ERA as the command centre for the sibling apps. Gated by an invite code (`INVITE_HASHES`). Connections and consents are recorded **on-device only**; no live data flows yet. The comment in the code says live flow arrives with a future "iSHKiY bridge (Living Profile)". Until then, data only moves if the person carries a file across.

### Account (optional)
Supabase magic-link sign-in. Stores a cloud copy of the profile in `living_profiles` (RLS: owner only), deletable on demand. Settings has dark mode, the explainer replay, and data controls.

---

## 6. Data model (what is stored where)

**On-device (`localStorage` key `era-v1`)**: `phase`, `part`, `item`, `arc`, `answers` (keyed by item id, e.g. `AR-3`, `TH-7`, `BF-C1`), `completedAt` (per part), `unlocked`, `report`, `paused`, `dark`, `seenExplainer`, `miniAnswers`, `miniResults`, `miniId`, the Companion state (`streams` per voice, `pulses`, `mode`, start time, daily count), `constellation`, `constellationInvite`. Also `era-sid`, a random anonymous session id for event counts.

**Supabase (`supabase/schema.sql`)**:
- `living_profiles(user_id pk, payload jsonb, updated_at)`: the opt-in cloud copy. RLS owner-only.
- `practitioners(id, name, email, discipline, registration_body/number, insurance_confirmed, bio, booking_url, apps text[], status)`: public insert as `pending`; public read only when `approved`; admin (by JWT email) reads and updates all.
- `share_grants(id, user_id, practitioner_id, sections text[], created_at, revoked_at)`: the consent ledger. RLS owner-only.
- **`era_events` is written to by `track()` but is not in `schema.sql`.** The insert swallows errors, so if that table was not created by hand in Supabase, events are silently dropped. Verify before building anything that depends on analytics.

**Analytics**: `track(event, detail)` inserts `{ e, d (max 40 chars), sid, v: "1.10" }`. Counts only. If you add events, keep them content-free.

---

## 7. Safety and ethics (hold the line)

- No diagnosis, ever. No claims of clinical validity. "A self-discovery tool, not a medical test" appears on the welcome screen.
- The honest-limits notes on each lens are part of the product, not legal padding. Keep writing them.
- Anything that touches distress must keep a path to SOS and to a human.
- The Companion never invents a biography ("never invent personal anecdotes").
- Data minimisation: if a feature needs a new field about the person, ask whether it can be derived on the device instead.
- Practitioner features must keep consent explicit, granular (by section) and revocable.

---

## 8. Conventions and gotchas for engineers

- **One big component file.** Adding a screen means: a function component, a `state.phase` string, a route line in `App()`, and a way to reach it from `Home` or `Settings`. Keep the existing pattern rather than introducing a router or a state library.
- `update(patch)` merges into state **and** saves to `localStorage` in one go. Anything you put on `state` persists.
- **State migrations are idempotent and run on load** (see `migrate()` for the Companion's v1→v2→v3). Follow that approach for any stored-shape change, because real people have old data.
- Lens wording is computed at render time, so improve `read()` freely. Item wording is stored by id, so **changing what an item measures needs a new id**, not an edit.
- **AI calls**: go through `fetchAI`/`callClaude` and `/api/claude`. Always give the person a useful fallback if the call fails (the report has retry and the Companion shows an error state). Keep prompts under the proxy's limits.
- Pin facts in prompts rather than letting the model infer: the `SCOPE` line approach (what was taken, what was not, no name unless given) came from real bugs.
- **Print CSS matters**: the report is printed to PDF. Test any new report section with print preview.
- Accessibility: focus-visible gold outlines, `aria-label`s on art, reduced-motion respected. Keep it.
- `PREVIEW` code works only where the hostname is localhost or contains `--` (Netlify preview and branch deploys). Do not weaken that.
- Hard-coded placeholders still to resolve: `STRIPE_PAYMENT_LINK`, placeholder icons (`icon.svg`, `favicon.svg` should be the canonical ii sub-mark), the seed practitioner list, sibling app URLs (marked "edit when live addresses are confirmed"), `ops@ishkiy.com` mailto links.
- The README's housekeeping list is the live to-do for launch: real icons, real Stripe link, real codes, one full run on a Pixel and on desktop Chrome, and reading a full report out loud as a voice test.

---

## 9. Commercial context

- **Founding access: £29** (stated in the `Unlock` copy) gets the full assessment, the written report (kept for good), a share card, and **7 days of the Companion**. No Stripe link or codes are live yet; the plan is one code per sale, handled by hand for the first five to ten customers, then automated when volume justifies a backend ("not before").
- Membership (a subscription that brings back the Companion, opens all Library lenses and the Partner Series) is **planned, not built**. Several screens already say "returns with iSHKiY membership".
- The README says the roadmap deliberately waits on the first paying customers for: subscriptions, a free "Glimpse" tier, dashboards.
- The human layer is a marketplace in embryo: practitioners join free at first, with fees later folded into session prices.

---

## 10. Known gaps and natural places to extend

Things the code itself says are unfinished or intentionally deferred:

1. **Membership and payments.** Stripe link, code issuance, membership tiers, the Companion after day seven.
2. **The iSHKiY bridge ("Living Profile").** A shared profile that sibling apps can read with consent. Today the Constellation only records intent. `living_profiles` is the seed of it.
3. **The human layer.** Real practitioners, booking, the matching model beyond `matchScore`, and a practitioner-side view of shared sections.
4. **Partner Series lenses.** Needs signed partners; the screen is a placeholder.
5. **Longitudinal use.** ERA is largely a one-off assessment plus a seven-day Companion. There is *no* daily or weekly rhythm, no check-ins, no change-over-time view beyond retaking parts. This is the largest product gap and the one the Identity app begins to address (section 12).
6. **Analytics table.** Confirm `era_events` exists.
7. **Native shells.** It is installable from the browser; store listings and push notifications are not built.

### Good enhancement ideas fit these shapes
- A new **Library lens**: add an entry to `MINIS` with `dims`, `items`, `research`, `read()`, and slot it into `LENS_ORDER` and a subject. This is the lowest-risk way to add depth.
- A new **Home tile and screen**: new phase, route, tile.
- A new **Companion mode or router rule**: add to `MODES` and the routing prompt, and keep the shared memory.
- A new **report section**: add a call in `reportCalls` with a `SCOPE`-aware prompt, and check print styles.
- A **bridge** feature: use `living_profiles`, add a consent screen first, add an RLS policy second, write the UI last.

---

## 11. How to propose an enhancement (a template to follow)

When you design a change, state these seven things before any code:

1. **The person and the moment.** Who is this for, and what are they feeling when they reach it?
2. **The promise check.** Which of the section 1 promises does it touch? If it needs data to leave the device, say what, why, and what the consent screen says.
3. **Where it lives.** Which phase and tile, and what state it adds to `localStorage`.
4. **The voice.** Draft the key screen copy in the section 2 voice. If any of it fails the banned lists, rewrite it.
5. **The AI part, if any.** The prompt, its limits, its fallback, and what it must never claim.
6. **The strength and level impact.** Does it add to the 70/30 profile-strength split? If so, say how, and make sure it cannot buy a level it has not earned.
7. **How it is tested and shipped.** What you will run on a phone, what changes in the Supabase schema (with RLS), and what goes in the README housekeeping list.

---

## 12. The sibling to know about: iSHKiY Identity

`ishkiy-identity/` (same repo, own Netlify project) is a separate installable app: *let go of old identities, habits and beliefs, and live a new one for 21 days.* It borrows ERA's palette, fonts, wordmark and voice rules, and reuses the proxy pattern. It adds what ERA lacks: **a daily rhythm** (morning and night practice, optional daytime top-ups, weekly check-ins, a day-21 review), spoken guidance, and generated sound. Everything it stores stays on the phone.

It is the likely first consumer of an ERA "bridge": ERA's values and Big Five could seed Identity's "name the old you" prompts, and Identity's check-in trend could feed back into the Companion's memory. Neither link exists. Read `ishkiy-identity/README.md` for its design before proposing anything that crosses the two.

---

## 13. Where to look in the code

| You want | Look at |
|---|---|
| Any question text | `src/items.js` |
| Any Library lens | `src/mini.js` |
| Scoring | `computeScores` in `src/app.jsx` |
| Report voice and sections | `SYSTEM`, `reportCalls`, `Report` |
| Companion voices, memory, limits | `COMPANION_SYSTEM`, `MODES`, `centralMemory`, `Q_CAP`, `Companion` |
| Levels and strength | `LEVELS`, `profileStrength`, `nextStep`, `StrengthScreen` |
| Sibling apps | `SIBLINGS`, `ConstellationScreen` |
| Practitioners | `PRACTITIONERS`, `matchScore`, `HumansScreen`, `ApplyScreen`, `admin.html` |
| Styling | The `<style>` block in `index.html` |
| The AI proxy and its limits | `netlify/functions/claude.js` |
| Deploy steps and the launch to-do | `README.md` |
