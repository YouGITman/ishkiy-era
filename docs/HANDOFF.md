# iSHKiY Identity: handoff log

Newest entry first. Each entry: what was asked, what was done, and what is still open. Read `docs/ISHKIY-IDENTITY-CONTEXT.md` for how the app works.

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
