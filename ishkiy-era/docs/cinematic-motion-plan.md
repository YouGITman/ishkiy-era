# Cinematic motion for iSHKiY ERA — research and plan

*Working document. Written August 2026. Prices and model availability move fast — re-check anything with a number in it before you spend.*

---

## 1. The one-paragraph version

ERA's problem is not that it lacks video. It is that **the app has no public surface on which to sell anything.** The first screen a stranger meets is `Breath` (a quote and a dot), then `Explainer` (eight slides), then `Home`. The only screen that mentions money is `Unlock` — a code box for people who have *already paid*, with a `STRIPE_PAYMENT_LINK` placeholder still in it. So there is currently nowhere for a cinematic film to do the job you want it to do.

The recommendation is a **hybrid**: one short, genuinely cinematic film (~65 seconds, with sound) living on a new public sell page, plus **coded motion** — not video — everywhere inside the app. The film buys the emotional case for the problem. Coded motion carries the product, stays reactive to the user's own data, weighs nothing, and never looks generated. The most valuable piece of motion in the whole product is not the landing page at all: it is the 20–40 seconds of dead air in `Generating` while Claude writes the report.

---

## 2. What we are actually working with

### The existing visual system is good, and it is already a storyboard

| Token | Value | Reads as |
|---|---|---|
| `--ink` | `#0F1E3D` | Deep navy. Night, depth, the inside of something. |
| `--bone` | `#F5F1E8` | Warm paper. Daylight, relief, the page. |
| `--gold` | `#D4A547` | Brass, not yellow. The single light source. |
| Type | Lora 700 / Inter | Editorial, not SaaS. |

That is a filmable palette. It is close to a *single-source, warm-key, deep-shadow* look — the one thing generative video models are reliably excellent at. It is also, deliberately, not the flat neon of every other AI-era wellness app.

The motion vocabulary already in the codebase:

- `@keyframes breathe` — the 4.6s gold dot, `.breath span` (index.html)
- `@keyframes halo`, `mindbreathe` (8s), `screenfade`, `rise`, `rotfade`
- `GlimmerArt` (`src/app.jsx:275`) — eight data-reactive SVGs, one per part
- `ExplainArt` (`src/app.jsx:1982`) — eight hand-drawn narrative SVGs
- `Orb` (`src/app.jsx:800`), `Constellation` (`:853`), `BreathDiagram` (`:426`)
- `prefers-reduced-motion` honoured on **every** animation, without exception

That last point matters more than it looks. Whoever built this has motion discipline already. The plan must not break it.

### The eight `EXPLAIN` slides are the film script, already written

```
1. iSHKiY is a place to understand yourself.   — Not to fix you. You were never broken.
2. For getting back up.                        — a setback…
3. For protecting your mind.                   — …doing it in a shape that doesn't fit them.
4. For the choices that keep you up.           — hard decisions are hard because…
5. It starts with a few honest questions.
6. You get a report written just for you.
7. Then a team who have read it.
8. And, when you're ready, a real human.
```

Slides 2–4 are the **problems**. Slides 5–8 are the **opportunity**. That is a film. The copy in this repo (`QUOTES`, `MINDSET`, `WARMUP`, the glimmer lines) is the strongest asset in the project and should be the script — not new copy written for a video.

---

## 3. On "Claude isn't good at this aesthetic" — an honest division of labour

You are right, and it is worth being precise about *why*, because the fix follows from it.

**What a language model genuinely cannot do here**

- Originate a film look. Taste in grade, grain, falloff and lens is trained by looking at thousands of hours of film, and it does not survive being described in text.
- Judge timing. Whether a cut lands at 1.9s or 2.3s is the whole job, and it is felt, not reasoned.
- Sound design. The MasterClass thing you are describing is at least half sound — the low sustained note under the cold open, the room tone, the moment everything drops out before the logo.
- Produce footage. No pixels come out of this tool.

**What it does do well, and should be pointed at**

- The shot list, beat sheet and timing spec — the *document* the film gets made from.
- Prompt packets for generative video: per-shot, with camera, lens, light, palette hex values, duration, and negative prompts. This is a text-engineering job and it is squarely in scope.
- Copy and voice. Already proven by the existing item bank and glimmer lines.
- Deterministic coded motion — SVG path animation, CSS timelines, Canvas/WebGL, Rive integration, scroll choreography. This is code, and code is the strong suit.
- Delivery engineering: codec ladders, poster-first LCP, reduced-motion fallbacks, instrumentation.

**The bridge.** Claude writes the spec and the prompt packets → a generative model renders the shots → a human (or Runway's timeline) edits and grades → Claude wires it into the app and instruments it. The taste stays with a person. The volume, precision and plumbing come from here. Do not ask this tool to "make it beautiful"; ask it to make the thing a person with taste can direct in one afternoon.

---

## 4. What the research says (and one finding that should change the plan)

### Hero background video does not sell. Click-to-play video does.

This is the finding worth acting on. Recent A/B evidence: **muted autoplay background video produces no measurable conversion lift** — it is atmosphere, and video heroes that reliably converted in the early 2020s now "sit at noise in many categories." But **a lightbox modal triggered from a thumbnail measured the largest lift of any placement (6.5% → 13%)**, ahead of inline embedded video (6.5% → 11%).

The implication: the ambition should not be "put a film behind the headline." It should be **"make a film worth deliberately pressing play on, with the sound up."** That is also, incidentally, exactly what MasterClass does — their film is an *event*, not wallpaper. And it solves the browser problem for free: autoplay-with-sound is blocked, but a user-initiated play is not, so the film can open with sound on because the user asked for it.

### Generative video, August 2026

| Model | ~Cost | Why it matters here |
|---|---|---|
| **Google Veo 3.1** | ~$0.15/s (fast) | Best current cinematic quality; native synchronised audio at 48kHz. The default choice. |
| **Kling 3.0** | ~$0.10/s | Cheapest premium tier. Multi-shot consistency via *subject binding* — separate reference images for character, environment and style. Best for volume iteration. |
| **Runway Gen-4.5** | varies | Weaker generation, but the only one with a real timeline. Use it as the edit suite, not the generator. |
| **OpenAI Sora 2** | — | **Deprecated April 2026; API shuts 24 Sept 2026. Do not build on it.** |

Practical craft notes from the research: image-to-video with a locked first frame beats text-to-video for brand consistency; **2–3 reference images is the sweet spot** and quality degrades past that; no model guarantees consistency across generations without controlled references. Budget a 1-in-4 to 1-in-5 hit rate.

### Sound, and the licence trap

For a product whose entire promise is trustworthiness, the licence position on the music is not a footnote.

- **ElevenLabs Music** — trained on licensed catalogue (Merlin, Kobalt deals), **clean commercial terms from day one.** Quality is a step behind the leaders. **This is the right choice for ERA.**
- **Suno / Udio** — better output, but the terms are unsettled after the 2024 RIAA suits and the late-2025 label settlements. Not worth the exposure on a paid product.

### Animation runtimes

- **CSS / SVG** — zero bytes, GPU-composited, already in use here. Correct default.
- **CSS scroll-driven animations** — Chrome/Edge 115+, Safari 18+, Firefox 132+; ~84% global support, still behind a flag in Firefox stable as of 152. Compositor-threaded. Usable *with a fallback*, not as a load-bearing dependency.
- **Rive** — ~10–15× smaller than Lottie, GPU-rendered, real state machines. But **~200KB of WASM**, which the research is blunt about: "for applications that have one or two interactive animations, this overhead is significant." ERA would have eight. It is a genuine call — see §6.
- **Lottie** — ~50KB, but a `requestAnimationFrame` loop *per instance*, running even when nothing changes. Poor fit for eight simultaneous carousel slides on a phone.
- **GSAP** — still the only thing that does real scrub, pin and complex timelines.

### Delivery

The **poster image is the LCP element, always** — video is progressive enhancement. Target LCP ≤2.5s. Ship AV1/WebM plus an H.264 MP4 fallback; `muted autoplay loop playsinline` together or autoplay silently fails on iOS. Keep any autoplaying loop ≤4MB.

Hosting, for reference: Cloudflare Stream ~$1/1,000 min stored + $5/1,000 min delivered; Bunny Stream roughly half that; Mux $0.07/min encode + $0.025/min delivery with a 100K min/month free tier.

---

## 5. Do not copy MasterClass's grammar

MasterClass's film works because it is selling **a named person's face** — Scorsese, Gordon Ramsay. The cinematography is built around a human being you already trust, shot like a portrait.

ERA has no celebrity, and its whole proposition is the opposite: *you* are the subject. Borrowing that grammar would make ERA look like a course, and put a stock-looking stranger in the place where the customer is supposed to see themselves.

**So: no faces.** Or at most one, in silhouette and out of focus, in the final warm beat. The film's subject is *material* — light, paper, ink, glass, dust, architecture, the edge of a box. This is not only truer to the brand, it is a hard-nosed technical decision: generative models are superb at materials and light and tell-tale bad at synthetic humans. The single biggest risk in this project is a film that reads as AI-generated, on a product whose pitch is "built on trusted psychology, and your answers never leave your device." Shooting materials instead of people removes that risk almost entirely.

### The look book (one page, hand this to whoever directs)

- **Palette locked to brand:** shadow `#0F1E3D`, key `#D4A547`, resolve to `#F5F1E8`.
- **One practical source per shot.** Hard falloff into navy. Brass specular on edges.
- **Slow.** Push-ins under 5% over three seconds. No whip pans, no drone, no time-lapse.
- **2.39:1**, framed safe for a 9:16 crop.
- **No burnt-in text** except the final wordmark. Captions are HTML over the video — reusable, localisable, accessible, indexable.
- **Shot length 3–5s.** Generative video degrades past ~8s; cut on motion.
- **Negative prompt, every shot:** *smiling stock people, office stock footage, lens flare, neon, teal-and-orange, 3D render look, text overlay, watermark, fast cuts.*

---

## 6. The plan

### Beat sheet — "The Box", ~65 seconds

| # | Time | Beat | Picture | Sound | Line |
|---|---|---|---|---|---|
| 1 | 0:00–0:08 | Cold open | Black. One brass point of light, breathing. | Room tone, one low sustained note. | — |
| 2 | 0:08–0:22 | **The box** | Forms. A dropdown. A job title on a lanyard. A school report. A four-letter personality code. Straight edges closing in. | Note tightens. Paper, a pen, a click. | *Somewhere along the way, someone put you in a box.* |
| 3 | 0:22–0:36 | **The cost** | Not drama — flatness. A Tuesday. Light through a blind, unmoving. | Everything thins out. | *It doesn't hurt. That's the problem.* — then: *A life is built on Tuesdays.* (already in `QUOTES`) |
| 4 | 0:36–0:46 | **The turn** | The box's edge is just a line. The line bends into a question. The brass dot returns and **begins to breathe at exactly 4.6s** — the app's own `@keyframes breathe`. | The note resolves. | *You weren't built for a box.* |
| 5 | 0:46–1:00 | **The opportunity** | Bone light arrives. Paper, ink, a page being written. Three quiet presences at the shoulder. A door. | Warmth. First and only major chord. | *Understand how you're built. Then use it.* |
| 6 | 1:00–1:08 | The mark | Bone. The wordmark. Both gold tittles land, one beat apart. | Silence, then nothing. | — |

**Beat 4 is the whole trick, and it is nearly free.** The film's climax is a motif the live app then continues in code: same colour, same 4.6-second cycle, video dissolving into an SVG that is already in `index.html`. Handled well, the film does not feel bolted on — it feels like the product started before the page loaded. Nobody will consciously notice. Everybody will feel it.

### Where motion goes — mapped to real code

| Surface | Code | Today | Proposed | Track |
|---|---|---|---|---|
| **Public sell page** | *does not exist* | — | New pre-`Unlock` route. Poster + play button → lightbox film with sound. Beats 2–5 restated as scrolling sections. | **Film** |
| `Breath` | `app.jsx:812` | CSS dot + rotating quote | Leave code-only, or a ≤4MB muted 6s ambient loop behind it. Low priority. | Code |
| `Explainer` | `app.jsx:2010` | 8 static SVGs | Animate the existing `ExplainArt` paths — `stroke-dasharray` draw-on, 700ms, staggered. **Reuse the film's beat-2/3/4 shots as 3s alpha loops only if the film gets made.** | Code |
| `Glimmer` | `app.jsx:275` | 8 static SVGs | Draw-on animation. **Must stay SVG** — these are data-reactive (they read `scores`). Video cannot do this. | Code |
| **`Generating`** | `app.jsx:589` | Static orb, 5 text lines, 20–40s of waiting | **The highest-value motion in the product.** A slow 30s coded sequence: the eight glimmer marks the user has already earned, drifting in, connecting into the `Constellation` figure. Their own data assembling itself. | Code |
| Report reveal | `app.jsx` report | Appears | 1.2s settle: rule draws, headline rises. | Code |
| `PartIntro` | `app.jsx:435` | Breathing diagram | Correct already. Leave alone. | — |

Note what this table says: **six of the seven surfaces want code, not video.** The film has exactly one job — selling to someone who has not paid — and it should not leak into the app beyond beat 4's handoff.

### Three tracks, costed

**Track A — Motion only (no film).** Animate `ExplainArt` and `GlimmerArt`, build the `Generating` constellation sequence, add the report settle. Pure SVG/CSS, no new dependency, no new bytes, nothing to host. **~3–4 days of build. £0 running cost.** Delivers most of the *felt* quality improvement inside the app and none of the sell.

**Track B — Film only.** 12 usable shots at ~5s. At a 1-in-4.5 hit rate that is ~55 generations. Kling 3.0 at ~$0.10/s ≈ **$28**; Veo 3.1 fast at ~$0.15/s ≈ **$41**. Add first-frame stills (~£25), one month of ElevenLabs Music (~£20–80), and either Runway for the edit or 1–2 days of a freelance editor/grader (**£400–£900** — this is the real cost and the one that buys the quality). Hosting on Bunny or Cloudflare Stream: pennies at this volume. **Realistic all-in: £500–£1,100 and about two weeks elapsed.**

**Track C — Hybrid. ← recommended.** Track A first, then Track B. Same total cost as B plus A's build time. The ordering matters: Track A is cheap, is entirely within Claude's competence, improves the paid product for existing customers, and produces the visual language the film then has to match. Making the film first and the motion second means the app spends a month failing to live up to its own advert.

### Phasing, with gates

**Phase 0 — Decide (this week, no spend).** Confirm the public sell page is in scope at all. Confirm no-faces. Confirm the £29 price and the Stripe link, since the film's only call to action is "Begin". *Gate: if there is no sell page, stop at Track A.*

**Phase 1 — Track A, coded motion (week 1).** Animate the eight `ExplainArt` and eight `GlimmerArt` marks. Build the `Generating` constellation. Report settle. Every one behind `prefers-reduced-motion`, matching the discipline already in the file. *Gate: run it on the Pixel and on Chrome desktop, as the README's launch checklist already demands. Nothing may drop frames.*

**Phase 2 — Look development (week 2).** Two still frames per beat, generated as first-frame anchors and graded to the brand hexes. This is the cheapest possible place to fail, and where a director's eye earns its keep. *Gate: a human who is not you looks at six stills and says whether it reads as ERA or as AI. If AI — restart here, not later.*

**Phase 3 — Film (weeks 3–4).** Image-to-video off the locked frames, 2–3 references per shot. Score from ElevenLabs Music. Edit and grade. Export AV1/WebM + H.264 MP4, 2.39:1 and 9:16, plus a poster JPEG for LCP. *Gate: watch it on a phone, on speakers, sound up, cold.*

**Phase 4 — Ship the sell page (week 5).** Poster-first, click-to-play lightbox, sound on because the user asked. Scroll sections beneath restating beats 2–5 in HTML. Reduced-motion users get poster + captions and never an autoplay.

**Phase 5 — Measure (ongoing).** See below.

### Engineering constraints, specific to this repo

- **Keep video out of git.** `netlify.toml` publishes `.` — the whole folder ships. A 40MB master in the repo bloats every clone and burns Netlify bandwidth on every view. Masters live off-repo; the deployed site references a CDN URL; only the poster JPEG (≤120KB) is committed. Add `*.mov`, `*.mp4`, `*.prores` to `.gitignore`.
- **Poster is the LCP element.** Never let the `<video>` be it.
- **`muted autoplay loop playsinline` together** for any ambient loop, or iOS silently refuses.
- **Reduced motion is non-negotiable here.** Every existing animation in `index.html` has a `prefers-reduced-motion` escape. New ones must too, and the film must never autoplay for those users.
- **Rive: probably not.** ~200KB of WASM to animate marks that are already inline SVG, in an app whose entire bundle is currently one esbuild output. Reach for it only if Phase 1 proves CSS genuinely cannot express the `Generating` sequence.
- **Instrument with what already exists.** `track()` (`app.jsx:25`) writes to Supabase `era_events` and counts taps, never words — so it is already privacy-clean for this. Add: `film_open`, `film_25`, `film_50`, `film_75`, `film_done`, `film_to_begin`.

### What success looks like

- **Film completion rate** ≥40% of opens. Below that, the edit is too long — cut beat 3.
- **`film_open` → `Begin`** versus the same conversion for people who never opened it. This is the number that justifies the spend. If the film does not beat no-film, it is decoration, and the honest research above says that is a real possible outcome.
- **LCP stays ≤2.5s** on the sell page, on a mid-range Android over 4G.
- **Qualitative, and the one that matters most:** five people watch it cold and none of them say "is that AI?"

---

## 7. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **The film reads as AI-generated** — fatal on a trust product | High | Materials not people. No faces. Human grade pass. Phase 2 gate exists precisely for this. |
| Spend, then no conversion lift | Medium | The evidence genuinely is mixed. Track A first — it is cheap and helps regardless. Measure `film_open → Begin` before spending again. |
| Video bloats the repo / Netlify bill | Medium | Off-repo hosting, `.gitignore`, poster-only in git. |
| Motion undermines the app's calm | Medium | ERA's whole register is *slow*. Nothing new may be faster than the existing 4.6s breathe. When in doubt, halve the speed. |
| Music licensing exposure | Low–Medium | ElevenLabs Music, licensed catalogue, commercial terms from day one. Keep the receipt. |
| Building on a deprecated model | Low | Sora 2's API is off on 24 Sept 2026. Veo 3.1 or Kling 3.0. |
| The eight `Explainer` slides get orphaned | Low | The film's beats 2–5 *are* slides 2–8. Keep one script; if a line changes in the film, change it in `EXPLAIN` too. |

---

## 8. The single next action

Phase 1, Track A: animate the eight `GlimmerArt` marks and build the `Generating` constellation sequence. It is three or four days, costs nothing, needs no decision from anyone, improves the product for customers who have already paid, and produces the motion language the film will have to match.

Everything cinematic downstream is better for having that done first.
