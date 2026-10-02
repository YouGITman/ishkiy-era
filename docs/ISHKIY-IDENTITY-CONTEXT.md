# iSHKiY Identity: context for anyone designing an enhancement

Read this first. It tells you what Identity is, the idea behind it, how it sounds, how it is built and deployed, what is unfinished, and where it is safe to change things. It was written from the code in `ishkiy-identity/` as it stands on branch `claude/upbeat-knuth-s0xvxv`. Where something could not be verified, it says so.

Read `docs/ISHKIY-ERA-CONTEXT.md` too. Identity inherits ERA's brand, voice rules and privacy promises, and does not repeat them in full. The founder is **Tarang**. The brand and every word of copy use **UK English**.

---

## 1. What it is

**iSHKiY Identity** is a mobile-first, installable web app that helps someone **let go of old identities, habits and beliefs and live as a new self for 21 days**. It guides them to name the old lines they have lived by, thank them and release them, write the new self in the present tense, record that self in their own voice, and then hear and say it every morning and night, with optional daytime top-ups, weekly check-ins and a day-21 review.

It is the second iSHKiY product, after **ERA** (the assessment). ERA tells you who you are. Identity helps you become who you decide to be. Together they cover the two halves of the iSHKiY promise: *understand yourself*, then *change*.

### The idea it is built on
The founder supplied a video script (a "brainwash yourself" talk) whose argument is:

1. Motivation, habits and "information" fail because they target the *key* (new knowledge) when the problem is the *lock* (the nervous system's filter).
2. Beliefs are "apps"; the nervous system is the "firewall" that decides which ones get in. Most of it was set early, by what a child saw and felt.
3. People snap back like a rubber band when their results outrun their **self-image** (Maxwell Maltz, *Psychocybernetics*). The strongest pull in a person is to stay consistent with who they think they are.
4. So start with **who, not why** ("I'm not a smoker" beats "I'm trying to quit"). Be, then do, then have.
5. Change needs **safety first** (relaxation), then **re-imprinting** with intense feeling, in the drowsy brain states (waking and falling asleep), using the person's own voice, present tense, spoken aloud, with the feeling of the wish already fulfilled (Neville Goddard). Through the day: audit your input, and ask better questions.

Each idea maps to a feature (section 5). The app tells these ideas **as ideas** ("the story goes", "the idea is"). The frog story, "98% unconscious", the before-seven imprint window, and brainwave states are popular claims, not settled science, and 21 days is Maltz's observation, offered as a floor. Binaural beats have mixed evidence and are presented as a way to soften into the practice, never as treatment. **Keep that honesty.** Do not harden these into facts when adding copy.

### Who it is for
Adults who know what they want to change and have been through the books and the podcasts. They are tired of being told what to do, and the tone assumes it.

### The promises it keeps (inherited from ERA, do not break)
- **No account.** Everything lives on the phone: answers in `localStorage`, the voice recording in IndexedDB.
- **The mic only measures loudness** (to confirm a line was spoken aloud). Nothing is recorded except the person's own recording that they choose to make, which stays on the device. The camera (mirror work) is a live view only.
- **The only thing that leaves the phone** is text sent through the AI proxy when the person taps *Help me shape it* or finishes a weekly check-in.
- **Not therapy or medical treatment**, and it says so. There is an SOS screen and a "stop here" note while tracing beliefs.

---

## 2. Voice and look (same as ERA, with these additions)

- Use ERA's banned words and constructions (see the ERA context, section 2). Short sentences, plain words, no exclamation marks, no bullet lists in prose, no rhetorical questions in the AI prompts. The Identity AI prompt is `VOICE` in `src/app.jsx`.
- **Palette**: ink `#0F1E3D`, ink2 `#16284D`, bone `#F5F1E8`, gold `#D4A547`. **Identity is dark-first** (it is used at dawn and at bedtime, and a bright screen is wrong for both). ERA is bone-first.
- **Type**: Lora and Inter. The wordmark has a small gold "IDENTITY" label beside it.
- **Signature visuals** (`src/visuals.jsx`): the breathing **Orb** (a 10-second cycle, about six breaths a minute), a drifting gold dust **Field**, the **Dissolve** (words break into gold grains and drift away when an old line is released), line-art **ExplainArt** for the six explainer cards, and a **Spark** trend line.
- Motion is slow and stops under `prefers-reduced-motion`. Nothing flashes.
- Copy is **written for the ear as well as the eye**, because most of the experience is heard with eyes shut. If you add a spoken session, write the `say` text first and the on-screen `line` second.

All the app's words live in **`src/content.js`**. Edit voice there, not in components.

---

## 3. Stack, deployment, and the traps

| Layer | What |
|---|---|
| App | One React 19 single-page app, `src/app.jsx` (about 950 lines), plus `sessions.jsx` (practices), `audio.js` (sound), `visuals.jsx`, `store.js`, `content.js`. Bundled by esbuild |
| Build | `npm run build` bundles to `site/dist/app.js` and **copies only the real files** into `site/` (`index.html`, `manifest.json`, `sw.js`, icons, `audio/`). **Netlify publishes `site/`, never the project folder** |
| Hosting | Netlify, project **`stately-pika-8b9efc`** (not renamed yet). Branch to deploy: **`claude/upbeat-knuth-s0xvxv`**. Base directory: **`ishkiy-identity`**. Build command and publish directory are left blank; `netlify.toml` supplies them |
| AI | `netlify/functions/claude.js`, a copy of ERA's proxy at `/api/claude`. Needs `ANTHROPIC_API_KEY` in Netlify. Used for exactly two things (section 6) |
| Offline | `sw.js` caches the shell and every audio clip. **Bump the `CACHE` name (now `identity-v4`) whenever audio or app files change**, or installed phones keep the old ones |
| Package type | `"type": "module"`. The ElevenLabs build plugin dynamically imports `src/content.js` |

### Traps (each one has already cost time)
1. **Publishing the whole folder.** The first deploy hung for 20 minutes because Netlify tried to upload `node_modules`. Never set `publish = "."`.
2. **Blank base directory.** Without `ishkiy-identity` as the base directory, Netlify publishes the whole repo (both app folders) and the site shows "page not found".
3. **The branch is not `main`.** The app lives only on `claude/upbeat-knuth-s0xvxv` inside the **`ishkiy-era` repo** (folder `ishkiy-identity/`). A dedicated private repo, `ishkiy-identity`, was requested but could not be created because the integration lacked permission (HTTP 403). Moving the app into its own repo is still pending: Tarang creates an empty private repo, and the app is pushed across. Netlify's settings must then change (blank base directory, new repo and branch).
4. **Stale installs.** A home-screen app serves cached files. After any change, close the app fully and reopen it, possibly twice.
5. **The environment's network allow-list** blocks several hosts (Hugging Face, jsDelivr, ElevenLabs, artificialanalysis). It limits what the build assistant can download; it does not affect the live app.
6. **Do not edit `site/`.** It is generated and git-ignored.

**Local run**: `npm install`, `npm run preview` (serves `http://127.0.0.1:5299`, unminified). The AI features fall back to written text locally, because `/api/claude` only exists on Netlify. Test the built output by serving `site/` with any static server.

---

## 4. The user journey

### Screens (`view` in `App()`, a string, routed at the top of `src/app.jsx`)
`enter` → `welcome` → `explain` → `path` (the setup checklist) → `calm`, `audit`, `release`, `become`, `script`, `begin` → the era: `today`, `morning`, `evening`, `topups` / `topup`, `caught`, `weekly`, `review`, plus tabs `sound`, `evidence`, `you`, and `sos`.

### The Path: one-time setup, seven steps, about 45 minutes, spread over days if needed
| # | Step | What happens |
|---|---|---|
| 1 | **See the lock** (`explain`) | Six swipeable cards: the lock not the key, the frog, the firewall, the rubber band, who before why, safe first |
| 2 | **Feel safe** (`calm`) | *Calm body, calm mind*: a ten-minute **spoken** guide (balloon-valve release) over an alpha bed |
| 3 | **Name the old you** (`audit`) | Pick up to three areas (self-worth, body, money, love, work, habits); tap or write the "I am…" lines they have lived by; optionally trace each: how old they were, whose voice it is, what it protected them from, what it cost |
| 4 | **Let it go** (`release`) | Each old line is shown with "Thank you. I don't need you now"; the person says it, **holds a button**, the words dissolve into gold grains with a release sound |
| 5 | **Write the new you** (`become`) | A present-tense rewrite is drafted for every old line; the person edits each; a tense check flags "I will" and "trying"; then the moment it is already done in five senses; a name for the era; up to four **power questions** |
| 6 | **Make your recording** (`script`) | A script is assembled from their own words (relaxation, countdown, calm body calm mind, their lines, the scene, their lines again, a close that works at night or in the morning). They can edit it, get AI help, and record it in their own voice with the script as a teleprompter, listening back over the theta bed. They can skip and let the phone's voice read it |
| 7 | **Begin your era** (`begin`) | Set reminder times (waking, bedtime, optional midday), download a calendar file with 21 days of alarms, start day one |

### The era: 21 days
- **Today** shows the new-self line (rotating), a 21-dot tracker (half dot = one practice, full = two), and cards for morning, the day, and night. Missing a day shows "Nothing resets", never a penalty.
- **Morning**: listen to the recording, **say each line out loud** (the mic fills a ring when a second of voice is heard), then optional **mirror work** with the front camera.
- **Through the day**: a power question that rotates by the hour; **I caught the old voice** (pick the old line, say the new one to swap it); **Log evidence** (a list of votes for the new self); **Top-up sessions** (below).
- **Night**: a check-in (0 to 10 "how much did I feel like the new me", what went in today: clean, mixed or noise, one vote), a three-and-a-half-minute spoken calm, then the recording, which **starts automatically** (eyes still shut). The screen dims after 20 seconds and the bed plays on for ten minutes after the words end.
- **Daytime top-ups (optional)**: six spoken sessions of one to two minutes: *Two-minute reset*, *Before it matters*, *After the noise*, *Power questions*, *Two minutes of thank you*, *Your lines, out loud* (the voice hands over to the mic for the person's own lines, then carries on). The list highlights the one that fits the hour.
- **Weekly check-in** (days 7, 14, 21): self-image 0 to 10, where the old self pulled back ("the rubber band"), what the new self did, the line they need next week, and a short reflection.
- **Day 21 review**: old lines struck through beside the new, counts of mornings, nights, lines said aloud, top-ups, evidence; the nightly trend; then *Begin another 21 days*, *Rewrite my lines first*, or *Let go of something new*.

### Other screens
- **Sound room**: four beds (below), volume, sleep timer, **Download my mix** (the recording over the theta bed as a WAV that plays in any music app with the screen off), and the top-ups entry.
- **You**: the new lines, the released old lines, edit lines, re-record, reminders, **Download a backup** (JSON), **Delete everything**, safety note, SOS.
- **Evidence**: a dated list of votes. **SOS**: UK crisis lines (999, NHS 111, Samaritans 116 123, Shout 85258).

---

## 5. Where each idea from the source video lives

| Idea | In the app |
|---|---|
| The lock, not the key | `EXPLAIN` cards |
| Safety first, relax to receive | `CalmSession`, the evening calm, alpha and theta beds |
| Audit your beliefs | `audit` (areas, old lines, origin trace) |
| Re-imprint with intense feeling | `release` (physical hold, sound, dissolve), the five-sense scene in `become` |
| Present tense, "I am" | `REWRITES`, `tenseCheck`, `buildScript` (`present()` also rewrites future tense) |
| Your own voice, theta states, falling asleep to it | `Recorder`, `ListenSession`, the night flow, `renderMix` |
| Speak affirmations aloud | `SayAloud` (mic loudness check) |
| Mirror work | `Mirror` |
| Audit input / output; power questions | The "what went in" check-in, `POWER_QUESTIONS`, top-ups *After the noise* and *Power questions* |
| Feeling of the wish fulfilled | `SENSES`, the "it's already done" part of the script, top-up *Before it matters* |
| Rubber band / self-image | Weekly check-in, day-21 review |

---

## 6. The AI (two uses, both optional, both with fallbacks)

Through `askAI(system, prompt, max_tokens)` → `/api/claude`:
1. **Help me shape it** (script page): rewrites the person's draft script while keeping every "I am" line and the structure, marking pauses with " … ", 450 to 650 words, present tense. Fallback: their own draft is used unchanged and a gentle note appears.
2. **Weekly reflection**: 90 to 130 words, "you", reflects their own words, names one pattern kindly, frames a pull-back as the rubber band and never as failure, ends with a present-tense line. Fallback: a reflection assembled in the app from their answers.

Rules for any new AI feature: use the `VOICE` prompt, send only the words needed, give a written fallback, never diagnose, and keep the output short.

---

## 7. Audio: the most unusual part

### Generated live in the browser (`src/audio.js`), no files, no licences
- **Beds** (`BEDS`): *Theta* (6 Hz), *Alpha* (10 Hz), *Deep sleep* (2.5 Hz) binaural beats, and *No beat*. Each is a stereo pair of tones (binaural beats need headphones) over brown-noise "rain", a warm pad that breathes on slow LFOs, and a distant singing bowl every 40 to 70 seconds. The same graph runs live and inside an `OfflineAudioContext`, so the downloadable mix sounds identical to the live one.
- **Bowls and chimes** (`strike`, `bowl`) are inharmonic partials; `releaseSound` is a rising breath over a low bowl.
- `playSession` plays the person's recording over a bed with a short generated reverb and a configurable tail. `renderMix` bakes it into a 24 kHz WAV (a five-minute recording plus a three-minute tail is about 45 MB).
- `listenLevel` reads mic loudness only. `speakScript` is the phone's own voice, used as the fallback.

### Recorded guides (`audio/calm/`, `audio/topup/`: 17 + 38 clips, about 2.4 MB)
- The *calm* session and the six top-ups are **pre-recorded voice clips** scheduled on the audio clock (`scheduleGuide`, `loadClip`), so timing holds even if the phone throttles the page. `GuideSession` plays any list of steps; a step with `lines: true` pauses the voice for the person to say their own lines, then carries on.
- A step is `{ id, line, sub, say, gap, mantra? }`: `say` is the spoken text, `gap` the silence after it in seconds. The evening version drops steps marked `longOnly` and shortens gaps to 40%.
- If the clips fail to load (offline on first use), the phone's own voice reads the same `say` text with the same timings.

### The voice pipeline: current status
| Route | Status |
|---|---|
| **Kokoro-82M** (open source, Apache 2.0), `tools/make-voice.py`. Currently voice **`bm_george`**, speed 0.82, sentence by sentence with 0.55 s breaths | **Live.** Judged "a little robotic" by the founder, with some clipped word endings (the endings were partly caused by a fade-out that has since been shortened and given silence after the last word) |
| **ElevenLabs** via a Netlify build plugin, `plugins/eleven-voice/` | **Built, dormant.** It runs only if `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` are set in Netlify. Caches clips by a hash of text, voice and settings, so a deploy pays only for changed lines. Founder chose not to take this route yet |
| **Chatterbox** (Resemble AI, MIT), `tools/make-voice-chatterbox.py` | **Chosen by the founder, blocked.** Needs `huggingface.co` allowed in the build environment's network settings and a 10 to 20 second reference clip. `tools/voice-ref-george.wav` is a synthetic starting reference. Do not clone any real person's voice without their consent; the founder's own voice is the recommended reference |
| **The person's own voice** for their personal script | **Live** (Recorder) |
| A human voice artist for the calm and top-up scripts | Suggested as the best long-term route, not started |

Changing a voice means: edit `CALM_SCRIPT` / `TOPUPS` in `content.js`, run `node tools/calm-lines.mjs` to export the text, run a `make-voice*.py` script, bump the service-worker cache, build, push. There are 55 clip files in total (17 in `audio/calm/`, 38 in `audio/topup/`). Inside a folder, a step id that repeats (like `c11`, "Calm body.") is one clip played several times.

---

## 8. Data model

**`localStorage` key `ishkiy-identity-v1`** (`src/store.js`):

| Key | Holds |
|---|---|
| `started` | Day of first entry |
| `done` | `{ explain, calm, audit, release, become, script, begin }` → date completed (drives the Path) |
| `old` | `[{ id, area, text, age?, who?, kept?, cost?, released? }]` |
| `newSelf` | `{ statements: [{ id, from (old id), area, text }], seeded: [old ids], scene: { where, see, hear, feel, thanks }, eraName, questions: [...] }` |
| `script` | The recording script text |
| `voice` | `{ at, mime }` marker only; the audio itself is in IndexedDB |
| `era` | `{ start: 'YYYY-MM-DD', n }` (era number, for repeat eras) |
| `days` | `{ 'YYYY-MM-DD': { morning, evening, spoken (count), mirror, feel (0 to 10), input, checked, caught (count), topups: [ids] } }` |
| `evidence` | `[{ id, at, text }]` |
| `weekly` | `[{ week, era, at, self, pull, did, need, reflection }]` |
| `reminders` | `{ morning, evening, midday? }` |
| `calmCount` | How many calm sessions completed |

**IndexedDB** `ishkiy-identity` / store `voice` / key `induction`: the person's recording as a Blob.

Dates are local `YYYY-MM-DD` (`dayKey`), so "today" is the person's today. `eraDay(st)` is `daysBetween(start, today) + 1`.

There is **no analytics and no backend**. There is no event tracking at all (unlike ERA's `track()`).

---

## 9. Conventions and gotchas for engineers

- **State**: `update(patch)` accepts an object or a function of previous state, merges, and saves in one go. `setDay(patch)` merges into today's entry. Anything on state persists.
- **Adding a screen**: write the component, add a `view` string, add a route line in `App()`, link to it from `Today`, the Sound room or You. For a spoken session, build a step list in `content.js` and render it with `GuideSession`.
- **Adding a top-up**: add an object to `TOPUPS` (`id`, `name`, `when`, `mins`, `bed`, `line`, `steps`) with new unique step ids, record the clips, add the ids to the `sw.js` precache list, bump the cache name. The list screen picks it up automatically.
- **Release hold button** (`HoldButton`) uses pointer events plus a keyboard path (Enter or Space fires it), because a hold-only control would lock out keyboard and switch users. Keep an alternative whenever you add a gesture.
- **Wake lock** is requested during practices (`useWakeLock`) and tolerated if refused.
- Browser audio only starts after a tap. Every session begins on a button for that reason. The night flow chains calm into the recording with `autoStart`, which works because the first tap already unlocked audio.
- **Background audio is the weak point.** A web app cannot keep playing reliably with the screen off on every phone. The answer today is **Download my mix** (a WAV in the phone's own player). The proper answer is wrapping the app with Capacitor (section 10).
- Preview artifact for demos: a single-file build with React from a CDN was published as a Claude artifact. Mic, camera, downloads and installing do not work inside an artifact; it is for looking only.
- **Tested** in headless Chromium at phone size (the full path, 21 days of use, recording with a fake mic, the audio download, the voiced sessions) and on the founder's Android phone for the opening screens and the calm screen. **Not tested** on iOS Safari, on a real phone speaker or headphones for the audio quality of mixes, or with the live AI proxy.

---

## 10. Known gaps and natural next steps

1. **Its own repo.** Create the empty private `ishkiy-identity` repo and move the folder across (section 3, trap 3). Rename the Netlify project from `stately-pika-8b9efc`.
2. **A better voice.** Chatterbox once Hugging Face is allowed, or ElevenLabs, or a human voice artist. This is the founder's biggest quality complaint.
3. **Real reminders.** The calendar file gives scheduled alarms but no push. True push needs a server (web push) or a native wrapper.
4. **Native shell (Capacitor).** For App Store and Play listings, reliable background audio with the screen off, local notifications, and proper audio-session handling.
5. **Connect to ERA.** ERA's values and Big Five could seed the "name the old you" prompts and the choice of areas; Identity's weekly self-image and nightly feel scores could feed the ERA Companion's memory. This needs the "iSHKiY bridge" ERA already hints at, a consent screen first, and `living_profiles`-style storage. Also add Identity to ERA's `SIBLINGS` list.
6. **More content.** More areas and old-line prompts (relationships, parenting, identity at work), more top-ups, an era library (e.g. a 7-day starter, a 40-day deepening), seasonal or situational calm sessions.
7. **Content review by a professional.** The origin-tracing step touches early memories. A clinician's review of the prompts and safety flow is advisable before any wide launch.
8. **Payments and access.** None exists. Decide whether Identity is a paid product, bundled with ERA, or a membership perk.
9. **Accessibility pass** with a screen reader; captions for the spoken sessions already exist as on-screen lines, but a transcript view would help.
10. **iOS testing.** The PWA install, the mic, camera and audio-session behaviour on iPhone have not been tried.

---

## 11. How to propose an enhancement (a template)

State these before writing code:

1. **The person and the moment.** Who, where (in bed? on a walk? in the toilets at work?), feeling what? Remember that most use is with eyes shut, on a phone, in the dark.
2. **The promise check.** Does it need any data to leave the phone? If so: what, why, and the consent wording.
3. **The idea it serves.** Which of the section 5 ideas does it strengthen? If it contradicts one (for example it rewards streaks and shames gaps), redesign it. The app's stance is *nothing resets*.
4. **Where it lives.** View name, where it is reached from, and exactly which keys it adds to the stored state (section 8).
5. **The copy and the script.** Draft the key words in the ERA/Identity voice, spoken text first. Run it against the banned lists.
6. **The sound.** Does it need a voice clip, a bed, a new generated sound? How long? What does it do with the screen off?
7. **The honest-claims check.** What does it say about science or effectiveness? Rewrite until it says no more than the evidence does.
8. **Safety.** Could it surface something heavy? What is the way out, and does it link to SOS?
9. **How it is tested and shipped.** The phone check, the service-worker cache bump, and the README entry.

---

## 12. Where to look

| You want | Look at |
|---|---|
| Any word the app says; the calm and top-up scripts; the recording-script builder | `src/content.js` |
| Screens, flow, state, the AI calls | `src/app.jsx` |
| Calm / listen / say-aloud / mirror / recorder / the guided-session player | `src/sessions.jsx` |
| Generated beds, bowls, the voice engine, the WAV mix | `src/audio.js` |
| Orb, dust field, dissolve, explainer art, trend line | `src/visuals.jsx` |
| Storage, dates, the calendar-file builder | `src/store.js` |
| All styling | The `<style>` block in `index.html` |
| Offline behaviour and cached files | `sw.js` |
| Voice recording tools | `tools/make-voice.py`, `tools/make-voice-chatterbox.py`, `tools/calm-lines.mjs`, `plugins/eleven-voice/` |
| Deploy setup and the voice set-up steps | `README.md`, `netlify.toml` |
