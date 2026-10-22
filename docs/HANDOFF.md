# iSHKiY Identity: handoff log

Newest entry first. Each entry: what was asked, what was done, and what is still open. Read `docs/ISHKIY-IDENTITY-CONTEXT.md` for how the app works.

---

## 22 October 2026

### A. Re-record (prerequisite): already done, reused
Checked first, as asked. The 4 October build already covers it: one recording per kind, a commit overwrites with no history, and the listen-and-commit step (*Listen to the new take*, *Listen to my current recording*, **Commit: replace my recording**, *Discard this take*). The Identity recording uses the same `Recorder`, unchanged. Re-tested: a discarded take leaves the stored one byte-for-byte as it was; a committed take replaces it.

### B. Identity reinforcement: done
Asked: a present-tense identity feature in three stages (Create, Integrate, Daily Practice), every piece editable, superseding the standalone Vision (1 October).

Done (`src/identity.jsx`, words in `src/content.js` under *Identity reinforcement*):
- **Present tense only.** Every prompt, placeholder and example says "I am", "I do" or "My life is". `presentCheck` flags future, wish, attempt and past wording ("want to", "will be", "trying", "becoming", "goal", "old me", "used to", "no longer"…) on every field in the feature. The only line about the past is `HISTORY_LINE`, shown once, at the top of the first Create screen (`identity.seenHistory` stops it showing again).
- **Life domains**: Wealth, Relationships, Mind mastery, Habit mastery, Self-control, Spirituality, plus any the person adds. Rename, hide, reorder (↑ ↓) from the hub or from the traits step. Hidden domains keep their traits and affirmations but leave the daily practice.
- **Stage 1, Create** (`idcreate`, five steps): one-line statement ("I am someone who…"); 3 to 5 traits, each with a name, a domain and how it shows up; a day in my life, with an optional paragraph per domain; the recording, built from those words (`buildIdentityScript`: statement, traits by name, the day, the domain paragraphs, "This is who I am. This is my life."), editable, recorded with the listen-and-commit `Recorder`; affirmations per domain, seeded with two editable suggestions for each domain a trait lives in, more as tap-to-add chips, plus their own.
- **Stage 2, Integrate** (`idintegrate`, three steps): one proof action per trait (verb first, shown as "I …"); an if-then plan per action, previewed live as "When [cue], I [action]." (`ifThen`); morning and evening anchor times, with a calendar file of two daily alarms, no end date, linking to `/#practice` (`identityICS`).
- **Stage 3, Daily Practice** (`practice`): one prominent button on the home screen, at the top of the Path and under the identity card on Today (`PracticeButton`). It knows the stage (create, integrate, or practice), picks morning or evening by the halfway point between the anchors, and turns solid gold once an anchor time has passed and that half isn't done. Morning: play the recording (moves on by itself when the words end), today's affirmations with the week's proof beside each, confirm today's proof actions. Evening: tick the actions ("This is what I do", never "task complete"), add your own entry (something I did, a moment, or a new affirmation, optionally linked to a trait or domain; a new affirmation also joins the affirmation list), and a one-line reflection.
- **Affirmations beside the evidence**: `ProofGrid` puts each domain's affirmations on the left and that week's proof (ticks and custom entries in that domain) on the right, in the morning, in the hub, and with a count. It stacks on phones under 360px wide.
- **Weekly review** (`idweek`): seven days as evidence, grouped by domain then trait (ticks out of 7, dot row), custom entries by domain; every day opens to edit ticks, entries and the reflection; then buttons to sharpen traits, actions, if-then plans or affirmations. Offered on the hub and at the end of the evening once seven days have passed since creation or the last review.
- **Edit everything**: the hub (`identity`, reached from the home button, the Path's *Who I am* and You) shows every element with an edit route back into the same step screens. Edits overwrite; no history.
- **Vision superseded**: the `vision` screen, card and `visionICS` are gone. `migrateVision` runs once on load: the vision text becomes *a day in my life*, its time the morning anchor, and its recording carries straight over (the identity recording kept IndexedDB key `"vision"`). The script isn't carried over, so it is built fresh from the new statement and traits, and the screen says the old take has different words until it's re-recorded. Old calendar links to `/#vision` open the daily practice. The day-21 review counts days that began with either.
- Shared UI pieces (`Shell`, `Back`, `Card`, …) moved to `src/ui.jsx` so the new file could use them. Offline cache bumped to `identity-v8`.
- Tested in headless Chromium at 390px and 340px with a fake mic (35 checks): migration from a stored vision, the history line once only, the tense check, traits and a custom domain, the built script, discard then commit, seeded affirmations, actions, cues and the calendar file, morning and evening saves, custom affirmations joining the list, the weekly review editing a past day, hide, reorder and rename, the `#vision` link, no sideways scroll, no console errors.

### Still open
- **The app's framing clashes with the brief.** The rest of Identity is built on "let the old you go, become the new one": the welcome, the Path ("Name the old you", "Let it go"), the Today card ("The new you"). The new feature keeps strictly to present tense, but the screens around it don't. Decide whether the wider app should be reworded to match.
- **Two morning practices.** Inside the 21-day era, Today now has the identity Daily Practice and the original morning and night practices. Worth watching on a phone whether that feels like too much, and whether they should merge.
- Try it on a real phone, Android first: the recording plays and the morning moves on by itself; the anchor reminders' link opens the app.
- Out of scope, as agreed: cloud sync or ERA Living Profile sharing, AI-written affirmations or analysis, streaks beyond the weekly summary.

---

## 15 October 2026

### 1. Recordings that start quiet and swell: fixed
Asked: recordings seem to start at a very low volume and ratchet up after a few seconds. Find whether it's the recording or the playback, and fix it.

Found: mostly the recording. `Recorder` asked the browser for `autoGainControl: true`. Phone gain control opens the mic at a cautious level and only turns it up once it has heard a few seconds of speech, so that swell was baked into every take. Two things made it worse. Echo cancellation was on, which puts Android into "call" mode, and that mode changes the levels and turns playback down until the mic is let go. And the level dot opened a second mic stream mid-take (`listenLevel` called `getUserMedia` again), which can make the phone re-tune the first. Playback itself had no fade on the voice.

Done:
- `openMic()` in `src/audio.js`: echo cancellation, noise suppression and auto gain all off, mono. It falls back to plain `{ audio: true }` if a phone refuses the constraints, but not when permission is refused.
- `Recorder` uses one stream for both the take and the level dot (`listenLevel(fn, { stream })` measures a given stream and leaves it open). The mic opens, then settles for 0.9 s ("Getting the mic ready…", gold dot) before capture starts. The take's tracks are released exactly once, on stop or on leaving the screen.
- `levelVoice()` in `src/audio.js` evens out a take on every play and in the downloadable mix (`decodeVoice` = decode + level). It follows the speaking level over under a second, eases each stretch towards the take's own typical level (gain clamped 0.5x to 6x, smoothed so it never pumps), brings the whole take to about -18 dBFS (at most 8x), and has a soft ceiling so nothing clips. The stored recording is never changed, so **takes already recorded before this fix also play back even**. Tested on a synthetic take that starts 14 dB low and swells over 4 s: before, -31.7 / -25.7 / -21.4 / -20.0 dB in seconds 0 to 4, then -18; after, -21.4 / -19.3 / -18.3 / -19.5, then -18.5 ±0.5. The first second can't be fully rescued without making normal speech pump. New takes don't have the swell at all.
- `SayAloud`'s loudness check (`listenLevel` with no stream) is unchanged. It keeps echo cancellation so the sound bed isn't mistaken for the person's voice.

### 2. Gratitude: done
Asked: a section for gratitude logging, gratitude reminders that circle round, and a voice recording of a gratitude script.

Done (`Gratitude` and `GratitudeCard` in `src/app.jsx`, view `gratitude`, link `/#gratitude`):
- **Log**: a rotating prompt (ten in `GRATITUDE_PROMPTS`, "A different prompt" moves on), a line at a time, timestamped. Today's entries can be removed. Everything earlier is listed under *Before today* (latest 12, then *Show all*).
- **Reminders that come back round**: Morning 08:00, Midday 13:00 and Evening 21:00 presets (each toggles), plus any custom times. The Today card turns gold at each chosen time until a thank-you is added after it, then quietens until the next time passes. So it comes back round through the day. *Add the reminders to my calendar* downloads an `.ics` (`gratitudeICS` in `src/store.js`): for each time, one event per prompt, repeating every 10 days and starting a day apart, so each day's reminder asks something different and the cycle repeats with no end date. Times are offset by three prompts, so morning and evening never ask the same thing. Each links to `/#gratitude`.
- **Coming back round on screen**: earlier thank-yous circle through the Today card and a panel on the gratitude page, one every few seconds, with the date.
- **Thank-you recording**: a script drafted from the latest eight thank-yous (`draftGratitude`, `thanksLine` in `src/content.js`: "I'm grateful for my sister" becomes "Thank you for my sister", "I finished the report" becomes "I'm thankful that I finished the report"), editable, recorded with the same listen-and-commit `Recorder`, stored in IndexedDB under `"gratitude"`, and played over the alpha bed (phone's voice if not recorded). If the words change after recording, it says so.
- Reached from Today (card under the vision), You (*Gratitude*) and the Path (*Gratitude*). The day-21 review counts the thank-yous written in the era. *Delete everything* removes the gratitude recording too.
- Offline cache bumped to `identity-v7`.
- Tested in headless Chromium at phone size with a fake mic: logging, the gold card turning quiet after a thank-you, the calendar file (30 events for three times, `INTERVAL=10`), drafting and saving the script, recording, playing, re-recording with compare-and-discard, and the `/#gratitude` link both with the app open and from a fresh load.

### Still open
- Try both on a real phone, Android first: record a take and listen to the first few seconds, and listen to an old take to hear the levelling. If a phone's raw mic is very quiet, the levelling lifts it up to 8x (+18 dB).
- With noise suppression off, a noisy room will be audible in a take. Somewhere quiet is already what the recorder asks for. If it becomes a complaint, turning noise suppression back on alone is safe (it isn't what caused the swell).
- Calendar links opening the installed app rather than a browser tab varies by phone, as with the vision reminder.

---

## 4 October 2026

### 1. Re-record function (daily recording): done
Asked: a re-record for the daily recording. Overwrite, no version history. A "listen and commit" step: preview the new take, then commit (overwrite) or discard. One recording, not separate morning and evening files.

Found: about half of it already existed. *Record it again* in the Sound room went back through the script page to the recorder, which had *Listen back* and *Keep this one*. Three gaps: no way to discard a take and keep the old one, no way to compare with the current recording, and no warning that keeping replaces it. Also a bug: *Use the phone's voice for now* still showed while re-recording and marked the person as having no recording.

Done:
- `Recorder` (`src/sessions.jsx`) takes `existing`. With a current recording it shows *Listen to the new take*, *Listen to my current recording*, **Commit: replace my recording** (says there's no undo), *Discard this take* (the old one stays exactly as it was) and *Record another take*. Nothing is written until the person commits.
- *Re-record* opens the recorder directly (`go("script", "rerecord")`), with *Change the words first* if wanted. Reached from the Sound room (*Re-record it*) and You (*Re-record*).
- The phone's-voice button is hidden while re-recording.
- Storage (`src/store.js`): `putVoice`, `getVoice` and `delVoice` take a key, defaulting to `"induction"`. Each key holds one take, so a commit overwrites.
- Tested: a discarded take leaves the stored recording byte-for-byte unchanged; a committed take replaces it.

### 2. Vision feature: done
Asked: a daily vision statement stored as text and audio, with a daily reminder (morning, midday, or the person's choice) that prompts playback. Similar in spirit to ERA's daily check-in.

Done:
- New `vision` screen (`Vision` in `src/app.jsx`): write the statement (present tense, with the same tense check as the new lines), or *Start from my lines* to get a draft from their new-self lines, scene and era name (`draftVision` in `src/content.js`).
- Audio: record it in their own voice, using the same listen-and-commit recorder. Stored as IndexedDB key `"vision"`, separate from the daily recording. Played over the alpha bed; if not recorded yet, the phone's voice reads it. If the words change after recording, the screen says the recording no longer matches.
- Daily reminder: presets *Morning 07:00*, *Midday 12:30*, *Evening 19:00*, or any time. *Add a daily reminder to my calendar* downloads an `.ics` with a daily alarm, no end date, and a link to `/#vision` that opens the vision screen whether the app was closed or already open.
- Today: a *Your vision* card. It turns gold once the chosen time has passed and the vision hasn't been played today, then shows *Vision heard*. Reached also from You (*My vision*) and the Path (*Vision*).
- Stored as `vision: { text, at, time, audio: { at, mime, text } }`; a play logs `days[date].vision = true`. The day-21 review counts the days it was heard.
- Offline cache bumped to `identity-v6`.

### Still open
- Neither feature has been tried on a real phone yet. Check: recording and re-recording on Android and iPhone, and that tapping the calendar reminder's link opens the installed app rather than a browser tab (this varies by phone; on some it opens the browser).
- A push notification at the vision time would need a server or a native wrapper. The calendar alarm is the reminder for now.
- Carried over: the Chatterbox voice is waiting on `huggingface.co` being allowed in the environment's network settings, and on a reference voice sample. The app still has its own repo to move into.
