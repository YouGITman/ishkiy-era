# iSHKiY Identity v1

Let the old you go. Become the new one.

A mobile-first app that you install from the browser, in the ERA look and voice. It takes someone through letting go of the identities, habits and beliefs they've been living by, writing a new self in the present tense, hearing it in their own voice morning and night, and checking in on it for 21 days. It uses the Haven pattern: single-page React, Netlify hosting, and one optional serverless proxy for AI writing help.

**No account. Everything stays on the phone.** Answers live in `localStorage`, the voice recording in IndexedDB. The mic's loudness check and the mirror camera run on the device and record nothing. The only time anything leaves the phone is when someone taps *Help me shape it* or finishes a weekly check-in, and then only the words involved go through the proxy. Without the proxy, both of those fall back to written text, and the app works the same.

---

## The flow

**The path (one-off setup, about 45 minutes, can be spread over days)**

| Step | What happens |
|---|---|
| See the lock | Six cards: the frog, the firewall, the rubber band, who before why, safe first. Why nothing has stuck so far. |
| Feel safe | *Calm body, calm mind.* A ten-minute guided balloon-valve release over an alpha bed. The nervous system has to feel safe before anything new gets in. |
| Name the old you | Pick up to three areas (self-worth, body, money, love, work, habits), tap or write the "I am…" lines they've lived by, and optionally trace each one: how old they were, whose voice it is, what it protected them from, and what it's cost. |
| Let it go | Each old line is shown. They say "Thank you. I don't need you now", hold the button, and the words break into gold dust and drift away, with a released-breath sound. |
| Write the new you | A present-tense rewrite is drafted for every old line ("I'm bad with money" becomes "I am calm and capable with money") and they make it their own. A tense check flags "I will" and "trying". Then the moment it's already done, in five senses, a name for the era, and up to four power questions. |
| Make your recording | A script built from their own words: relaxation, a countdown from ten, calm body calm mind, their lines, the scene, their lines again, and a close that works for night or morning. They can edit it or get AI help, then record it in their own voice with the script as a teleprompter, and listen back over the theta bed. They can also skip and let the phone's voice read it for now. |
| Begin your era | Set the wake-up and bedtime times, add the reminders to the calendar (an `.ics` file with 21 days of alarms), and begin. |

**The era (21 days)**

- **On waking.** Listen to the recording, then say each line out loud. The mic checks it was spoken, not just thought: a second of voice fills the ring. Then optional mirror work with the front camera.
- **Through the day.** A power question that rotates by the hour. *I caught the old voice*: pick the old line and say the new one out loud to swap it. *Log evidence*: votes for the new self.
- **Before sleep.** A check-in (how much they felt like the new self, from 0 to 10; what went in today, clean or noise; one vote), then a three-minute calm, then the recording. The screen dims itself and the bed plays on for ten minutes after the words stop.
- **Every 7 days.** A weekly check-in: self-image from 0 to 10, where the old self pulled back (the rubber band), what the new self did, and the line they need next week. It ends with a short written reflection.
- **Day 21.** The era review: the old lines struck through beside the new ones, counts of mornings, nights, lines said aloud and pieces of evidence, the nightly trend, and then run another 21 days, rewrite the lines, or let go of something new.

Missed days never reset anything. The copy says so.

## Sound and visuals

Everything is generated in the browser, so there are no audio or image files, no licences, and it all works offline.

- **Beds** (`src/audio.js`): theta at 6 Hz, alpha at 10 Hz and deep sleep at 2.5 Hz binaural beats, plus a *No beat* bed. Each is a stereo pair of tones over brown noise ("soft rain"), a warm pad that breathes on slow LFOs, and a distant singing bowl every 40 to 70 seconds. The beats need headphones.
- **Singing bowls**, the **release sound** and small chimes are synthesised from inharmonic partials.
- **The voice** plays through a light generated reverb.
- **Download my mix** (Sound room) renders the voice over the theta bed with `OfflineAudioContext` into a WAV file that plays in any music app with the screen off. A five-minute recording plus three minutes of bed comes to about 45 MB.
- **Visuals** (`src/visuals.jsx`): a breathing orb (ten-second cycle, roughly six breaths a minute), a drifting gold dust field, the particle dissolve, and line drawings for the explainer cards. Nothing flashes. All motion stops when the phone asks for reduced motion.

If you'd rather use recorded music later, anything licensed CC0 or royalty-free can be dropped in, but you don't need to: the generated beds are yours outright.

## Deploy

This app now lives in its own repo (`ishkiy-identity`), so Netlify's **Base directory** is left blank.

1. Netlify → **Add new site → Import an existing project** → GitHub → `ishkiy-identity`. The build command and publish directory come from `netlify.toml`.
2. Site settings → **Environment variables** → add `ANTHROPIC_API_KEY` (the same key as ERA). Redeploy. This only powers *Help me shape it* and the weekly reflection.
3. Open the site on your phone → browser menu → **Add to Home Screen**. It opens full screen and works offline after the first load.

Run it locally with `npm install`, then `npm run preview` → `http://127.0.0.1:5299`. The AI help falls back to written text locally, because `/api/claude` only exists on Netlify.

## Files

| File | What it is |
|---|---|
| `index.html` | Shell, fonts, all styling |
| `src/content.js` | **Every word the app says**: explainer cards, areas and old lines, rewrites, senses, power questions, the calm script, and the recording-script builder. Edit the voice here. |
| `src/app.jsx` | Flow and screens: path, audit, release, become, script, begin, today, morning, evening, caught, evidence, weekly, review, sound room, you, SOS |
| `src/sessions.jsx` | The practices: calm body calm mind, listening, say it out loud, mirror, recorder |
| `src/audio.js` | The sound engine and the WAV mix |
| `src/visuals.jsx` | Orb, dust field, dissolve, explainer drawings, trend line |
| `src/store.js` | Storage, IndexedDB for the voice, calendar reminders |
| `sw.js` | Offline cache |
| `netlify/functions/claude.js` | The shared iSHKiY AI proxy (the model is pinned here) |

## Honest notes

- The explainer tells the ideas as ideas ("the story goes", "the idea is"). The frog story, the 0 to 7 imprint window and "98% unconscious" are popular claims, not settled science, so the app never states them as fact. Maltz's 21 days is framed as his observation and a floor.
- Binaural beats have mixed evidence. The app presents them as a way to soften into the practice, not as a treatment.
- Tracing old beliefs can surface painful memories. There's a safety line on the welcome screen and under You, a "stop here" note while tracing, and an SOS screen with UK lines.

## What v1 deliberately doesn't have

- **Push notifications.** Real background pushes need a server. The calendar file does the same job on every phone with nothing to run.
- **App Store and Play Store builds.** The code is ready to wrap with Capacitor when you want store listings. Background audio with the screen off would then work natively too. Until then, the downloadable mix covers all-night listening.
- **Accounts or sync.** *Download a backup* under You exports everything as JSON.
- **A link to ERA.** A natural next step: feed ERA's values and Big Five into the "name the old you" prompts.
