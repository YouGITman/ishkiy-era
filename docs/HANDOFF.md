# iSHKiY Identity: handoff log

Newest entry first. Each entry: what was asked, what was done, and what is still open. Read `docs/ISHKIY-IDENTITY-CONTEXT.md` for how the app works.

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
