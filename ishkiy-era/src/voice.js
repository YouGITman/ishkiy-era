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

/* Dictation into the message box. Words appear as they're heard, and nothing is
   sent until the person presses Ask, so they can read it back first. */
export function useDictation(setText) {
  const [on, setOn] = useState(false);
  const [error, setError] = useState(null);
  const rec = useRef(null);
  const base = useRef("");
  const stop = () => { try { rec.current && rec.current.stop(); } catch {} };
  useEffect(() => () => { try { rec.current && rec.current.abort(); } catch {} }, []);
  const start = (existing) => {
    if (!Recognition || on) return;
    stopSpeaking(); primeSpeech();
    setError(null);
    base.current = existing ? existing.replace(/\s*$/, " ") : "";
    const r = new Recognition();
    r.lang = "en-GB"; r.continuous = true; r.interimResults = true;
    r.onresult = (e) => {
      let said = "";
      for (let k = 0; k < e.results.length; k++) said += e.results[k][0].transcript;
      setText((base.current + said).replace(/\s+/g, " ").trimStart());
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") setError("The mic is blocked. Allow it for this site in your browser settings, then try again.");
      else if (e.error === "no-speech") setError("I didn't catch anything. Tap the mic and try again.");
      else if (e.error !== "aborted") setError("Listening stopped. Tap the mic to carry on.");
    };
    r.onend = () => { setOn(false); rec.current = null; };
    rec.current = r;
    try { r.start(); setOn(true); } catch { setError("Listening couldn't start. Try again in a moment."); }
  };
  return { on, error, start, stop };
}
