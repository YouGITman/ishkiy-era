// Two-way voice for the Companion, using only what the browser already has.
//
// Speaking uses the Web Speech synthesis voices on the device; listening uses
// the browser's speech recognition. Nothing is sent to iSHKiY but the words.
// Chrome and Edge do their recognition on Google's and Microsoft's servers,
// Safari on Apple's, so the app says so beside the mic. A paid voice service
// can replace either half later without touching the Companion itself.
import { useEffect, useRef, useState } from "react";

const synth = typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;
const Recognition = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
export const canSpeak = !!synth;
export const canListen = !!Recognition;

/* The best British voice the device has. The natural or neural voices sound
   far less robotic, so they win when present; then known good UK voices; then
   any UK English; then any English at all. */
const GOOD = /natural|neural|premium|enhanced|sonia|libby|ryan|serena|daniel|kate|arthur|martha|oliver|google uk/i;
let chosen = null;
const pickVoice = () => {
  if (!synth) return null;
  const all = synth.getVoices();
  if (!all.length) return null;
  const uk = all.filter((v) => /en[-_]GB/i.test(v.lang));
  return uk.find((v) => GOOD.test(v.name)) || uk[0] || all.find((v) => /^en/i.test(v.lang)) || null;
};
if (synth) {
  chosen = pickVoice();
  synth.addEventListener?.("voiceschanged", () => { chosen = pickVoice(); });
}

// Each voice sounds a little different: Sounding slow and soft, Coach brisker, Mentor lower.
const TONE = { companion: { rate: 0.92, pitch: 1 }, coach: { rate: 1.04, pitch: 1.04 }, mentor: { rate: 0.9, pitch: 0.92 }, auto: { rate: 0.96, pitch: 1 } };

/* What the eye reads and what the ear hears differ: markdown marks, the
   subject tag and the [! !] safety brackets are dropped, the words kept. */
export const speakable = (text) => String(text || "")
  .replace(/^\s*~[^~\n]{2,60}~\s*/, "")
  .replace(/\[!|!\]/g, "")
  .replace(/[*_#>`]+/g, "")
  .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
  .replace(/\s*\n+\s*/g, ". ")
  .replace(/\.\s*\./g, ".")
  .trim();

/* Long utterances get cut off part-way in Chrome, so a reply is spoken a
   sentence or two at a time. */
const chunks = (text) => {
  const parts = text.match(/[^.!?]+[.!?]+["')]*\s*|[^.!?]+$/g) || [text];
  const out = []; let cur = "";
  parts.forEach((p) => { if ((cur + p).length > 220 && cur) { out.push(cur.trim()); cur = p; } else cur += p; });
  if (cur.trim()) out.push(cur.trim());
  return out;
};

let current = null; // the key of whatever is being spoken now
const listeners = new Set();
const announce = () => listeners.forEach((fn) => fn(current));

export const stopSpeaking = () => { if (!synth) return; current = null; synth.cancel(); announce(); };

export const speak = (text, mode, key) => {
  if (!synth) return;
  synth.cancel();
  const pieces = chunks(speakable(text));
  if (!pieces.length) return;
  current = key; announce();
  const tone = TONE[mode] || TONE.companion;
  pieces.forEach((p, k) => {
    const u = new SpeechSynthesisUtterance(p);
    if (chosen) { u.voice = chosen; u.lang = chosen.lang; } else u.lang = "en-GB";
    u.rate = tone.rate; u.pitch = tone.pitch;
    if (k === pieces.length - 1) u.onend = u.onerror = () => { if (current === key) { current = null; announce(); } };
    synth.speak(u);
  });
};

/* iOS only lets a page speak after the person has touched something. A silent
   word spoken inside the mic tap opens that door, so the spoken reply that
   arrives seconds later is allowed to play. */
export const primeSpeech = () => {
  if (!synth) return;
  try { const u = new SpeechSynthesisUtterance(" "); u.volume = 0; synth.speak(u); } catch {}
};

/* Which reply is speaking, for the button that shows play or stop. */
export function useSpeaking() {
  const [key, setKey] = useState(current);
  useEffect(() => { listeners.add(setKey); return () => { listeners.delete(setKey); }; }, []);
  useEffect(() => () => { if (current != null) stopSpeaking(); }, []);
  return key;
}

/* Android Chrome's recogniser misbehaves in continuous mode: every update
   repeats all the words heard so far as a new entry, so joining the entries
   gives "this / this is / this is a / this is a test". Two guards:

   1. On Android it listens one phrase at a time, and when a phrase ends it
      keeps what was heard and starts listening again, until the mic is tapped.
   2. Everywhere, an entry that merely repeats or extends the one before it
      replaces it rather than being added on. */
const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
const plain = (t) => t.toLowerCase().replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
export const joinHeard = (parts) => {
  const out = [];
  parts.forEach((t) => {
    const n = plain(t);
    if (!n) return;
    const last = out.length ? plain(out[out.length - 1]) : null;
    if (last != null && n.startsWith(last)) out[out.length - 1] = t.trim();
    else if (last != null && last.startsWith(n)) return;
    else out.push(t.trim());
  });
  return out.join(" ");
};

/* Dictation into the message box. Words appear as they're heard, and nothing is
   sent until the person presses Ask, so they can read it back first. */
export function useDictation(setText) {
  const [on, setOn] = useState(false);
  const [error, setError] = useState(null);
  const rec = useRef(null);
  const base = useRef("");    // what was in the box, plus every finished phrase
  const heard = useRef("");   // the phrase being heard right now
  const want = useRef(false); // still listening, as far as the person is concerned
  const restarts = useRef(0);
  const quiet = useRef(0);    // phrases in a row that heard nothing
  const show = () => setText((base.current + (base.current && heard.current ? " " : "") + heard.current).replace(/\s+/g, " ").trimStart());
  const stop = () => { want.current = false; try { rec.current && rec.current.stop(); } catch {} };
  useEffect(() => () => { want.current = false; try { rec.current && rec.current.abort(); } catch {} }, []);

  const listen = () => {
    const r = new Recognition();
    r.lang = "en-GB"; r.continuous = !isAndroid; r.interimResults = true; r.maxAlternatives = 1;
    r.onresult = (e) => {
      const parts = [];
      for (let k = 0; k < e.results.length; k++) parts.push(e.results[k][0].transcript);
      heard.current = joinHeard(parts);
      show();
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") { want.current = false; setError("The mic is blocked. Allow it for this site in your browser settings, then try again."); }
      else if (e.error === "no-speech") { if (!base.current.trim() && !heard.current) { want.current = false; setError("I didn't catch anything. Tap the mic and try again."); } }
      else if (e.error === "network") { want.current = false; setError("Listening needs a connection. Check you're online and try again."); }
      else if (e.error !== "aborted") { want.current = false; setError("Listening stopped. Tap the mic to carry on."); }
    };
    r.onend = () => {
      // Keep the phrase that just finished, then listen again if they haven't tapped stop.
      // Two silent stretches in a row and it stops by itself, so Android's start chime doesn't repeat through a quiet room.
      if (heard.current) { base.current = (base.current ? base.current.replace(/\s*$/, " ") : "") + heard.current; heard.current = ""; quiet.current = 0; }
      else quiet.current += 1;
      if (want.current && restarts.current < 60 && quiet.current < 2) {
        restarts.current += 1;
        try { listen(); return; } catch {}
      }
      want.current = false; rec.current = null; setOn(false);
    };
    rec.current = r;
    r.start();
  };

  const start = (existing) => {
    if (!Recognition || on) return;
    stopSpeaking(); primeSpeech();
    setError(null);
    base.current = existing ? existing.trim() : "";
    heard.current = ""; restarts.current = 0; quiet.current = 0; want.current = true;
    try { listen(); setOn(true); } catch { want.current = false; setError("Listening couldn't start. Try again in a moment."); }
  };
  return { on, error, start, stop };
}
