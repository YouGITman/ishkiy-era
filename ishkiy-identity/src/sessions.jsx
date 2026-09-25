// The practices themselves: calm body calm mind, listening, saying it out
// loud, the mirror, and recording your own voice.
import React, { useEffect, useRef, useState } from "react";
import { CALM_STEPS } from "./content.js";
import { startBed, stopBed, playSession, speakScript, listenLevel, bowl, getCtx } from "./audio.js";
import { Orb } from "./visuals.jsx";
import { getVoice } from "./store.js";

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/* Keep the screen awake during a practice, where the phone allows it. */
function useWakeLock(on = true) {
  useEffect(() => {
    if (!on || !("wakeLock" in navigator)) return;
    let lock = null, dead = false;
    const get = () => navigator.wakeLock.request("screen").then((l) => { if (dead) l.release(); else lock = l; }, () => {});
    get();
    const vis = () => document.visibilityState === "visible" && get();
    document.addEventListener("visibilitychange", vis);
    return () => { dead = true; document.removeEventListener("visibilitychange", vis); lock && lock.release().catch(() => {}); };
  }, [on]);
}

function useElapsed(running) {
  const [s, setS] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t0 = Date.now() - s * 1000;
    const t = setInterval(() => setS((Date.now() - t0) / 1000), 250);
    return () => clearInterval(t);
  }, [running]);
  return s;
}

/* ---------------- calm body, calm mind ---------------- */
export function CalmSession({ short = false, onDone, onExit }) {
  const [on, setOn] = useState(false);
  const elapsed = useElapsed(on);
  const scale = short ? 0.35 : 1; // the evening version runs about three and a half minutes
  const steps = CALM_STEPS.filter((s) => !short || s.t <= 420).map((s) => ({ ...s, t: s.t * scale }));
  const cur = steps.filter((s) => s.t <= elapsed).pop() || steps[0];
  const total = short ? 210 : 600;
  const out = Math.floor(elapsed / 5) % 2 === 1; // the orb breathes in five, out five
  const word = Math.floor(elapsed / 10) % 2 === 0 ? "calm body" : "calm mind";
  useWakeLock(on);
  useEffect(() => () => stopBed(2), []);
  const begin = () => { getCtx(); startBed("alpha", { volume: 0.7 }); bowl(174.6, 0.12); setOn(true); };
  const finish = () => { stopBed(3); bowl(261.6, 0.1); onDone && onDone(Math.round(elapsed)); };
  if (!on) return (
    <div className="session center">
      <Orb size={180} still />
      <p className="kicker">Calm body, calm mind</p>
      <h1 className="display sm">{short ? "A few minutes to soften." : "Ten minutes to feel safe."}</h1>
      <p className="lede dim">Nothing new gets in while your body is braced. So this comes first, every time. Headphones if you have them. Lie down or sit back.</p>
      <button className="btn gold" onClick={begin}>Start</button>
      {onExit && <button className="ghost light" onClick={onExit}>Not now</button>}
    </div>
  );
  return (
    <div className="session center">
      <Orb size={220} />
      <p className="gline" key={cur.line}>{cur.line}</p>
      {cur.sub && <p className="gsub">{cur.sub}</p>}
      {elapsed * (1 / scale) >= 180 && <p className="mantra" aria-live="off">{out ? "breathe out · " + word : "breathe in"}</p>}
      <div className="meter"><div className="meterfill" style={{ width: Math.min(100, (elapsed / total) * 100) + "%" }} /></div>
      <p className="count light">{mmss(elapsed)} {elapsed < total ? "of " + mmss(total) : ""}</p>
      <button className="btn gold" onClick={finish}>{elapsed >= total ? "I'm here" : "Finish"}</button>
    </div>
  );
}

/* ---------------- listening ---------------- */
export function ListenSession({ script, night = false, bedKey = "theta", onDone, onExit }) {
  const [phase, setPhase] = useState("ready"); // ready | playing | tail | done
  const [line, setLine] = useState("");
  const [dim, setDim] = useState(false);
  const [dur, setDur] = useState(0);
  const handle = useRef(null);
  const elapsed = useElapsed(phase === "playing" || phase === "tail");
  const [hasVoice, setHasVoice] = useState(null);
  useEffect(() => { getVoice().then((b) => setHasVoice(!!b)); return () => { handle.current && handle.current.stop(); stopBed(2); }; }, []);
  useWakeLock(phase === "playing" || phase === "tail");

  const start = async () => {
    getCtx();
    const blob = await getVoice();
    setPhase("playing");
    if (blob) {
      const h = await playSession({ bedKey, voiceBlob: blob, tailMin: night ? 10 : 0.5, onVoiceEnd: () => setPhase("tail"), onEnd: () => setPhase("done") });
      handle.current = h; setDur(h.duration);
    } else {
      startBed(bedKey, { volume: 0.55 });
      const sp = speakScript(script, { onLine: (l) => setLine(l), onDone: () => { setPhase("tail"); setLine(""); } });
      handle.current = { stop: () => { sp.stop(); stopBed(2); } };
    }
    if (night) setTimeout(() => setDim(true), 20000);
  };
  const finish = () => { handle.current && handle.current.stop(); handle.current = null; onDone && onDone(); };

  if (phase === "ready") return (
    <div className="session center">
      <Orb size={170} still />
      <p className="kicker">{night ? "Before sleep" : "On waking"}</p>
      <h1 className="display sm">{night ? "Fall asleep as the new you." : "Before the phone. You first."}</h1>
      <p className="lede dim">{hasVoice === false ? "You haven't recorded yet, so the phone will read your words for now. Your own voice lands deeper. Record it when you can." : "Your voice, over the theta bed. Don't try to follow it. Let it wash over you."} {night ? "The bed keeps playing softly for ten minutes after the words stop." : ""}</p>
      <p className="tnote light">Headphones for the beat. Never while driving.</p>
      <button className="btn gold" onClick={start}>Play</button>
      {onExit && <button className="ghost light" onClick={onExit}>Skip this today</button>}
    </div>
  );
  return (
    <div className={"session center" + (dim ? " sleepdim" : "")} onClick={() => dim && setDim(false)}>
      <Orb size={dim ? 90 : 210} />
      {line ? <p className="gline small" key={line}>{line}</p> : <p className="gsub">{phase === "tail" ? (night ? "The words are done. Stay in the feeling. Let sleep come." : "Take one more breath. Open your eyes when you're ready.") : "Feel it done. Rest there."}</p>}
      {!dim && <>
        {dur > 0 && <div className="meter"><div className="meterfill" style={{ width: Math.min(100, (elapsed / dur) * 100) + "%" }} /></div>}
        <p className="count light">{mmss(elapsed)}{dur ? " of " + mmss(dur) : ""}</p>
        <button className="btn gold" onClick={finish}>{phase === "playing" ? "Stop and mark done" : "Done"}</button>
        {night && <p className="tnote light">The screen dims on its own. Tap to bring it back. For a whole night with the screen off, download your mix in the Sound room.</p>}
      </>}
    </div>
  );
}

/* ---------------- say it out loud ----------------
   The mic listens for loudness only, nothing is recorded or sent. A second
   of voice counts as said. If the mic isn't allowed, the person says so. */
export function SayAloud({ lines, title = "Say it out loud", sub, onDone, onExit }) {
  const [i, setI] = useState(0);
  const [level, setLevel] = useState(0);
  const [heard, setHeard] = useState(0);
  const [mic, setMic] = useState("off"); // off | on | denied
  const [said, setSaid] = useState(0);
  const stop = useRef(null);
  const acc = useRef(0), last = useRef(0), lock = useRef(false);
  useEffect(() => () => stop.current && stop.current(), []);
  const next = (counted) => {
    const n = said + (counted ? 1 : 0);
    setSaid(n);
    acc.current = 0; setHeard(0); lock.current = false;
    if (i + 1 >= lines.length) { stop.current && stop.current(); onDone && onDone(n); } else setI(i + 1);
  };
  const nextRef = useRef(next); nextRef.current = next;
  const startMic = async () => {
    try {
      getCtx();
      stop.current = await listenLevel((v) => {
        const now = performance.now(); const dt = last.current ? (now - last.current) / 1000 : 0; last.current = now;
        setLevel(v);
        if (v > 0.03 && !lock.current) { acc.current += dt; setHeard(Math.min(1, acc.current / 1.1)); }
        if (acc.current > 1.1 && !lock.current) { lock.current = true; bowl(392, 0.08); setTimeout(() => nextRef.current(true), 900); }
      });
      setMic("on");
    } catch { setMic("denied"); }
  };
  if (!lines.length) return null;
  return (
    <div className="session center">
      <p className="kicker">{title} · {i + 1} of {lines.length}</p>
      <div className="sayring" style={{ "--p": heard }}>
        <Orb size={150} level={mic === "on" ? level : 0} still={mic !== "on"} />
      </div>
      <p className="sayline" key={i}>{lines[i]}</p>
      {sub && <p className="gsub">{sub}</p>}
      {mic === "off" && <>
        <p className="lede dim">Out loud, in the present tense. Spoken words carry further than thought ones. The mic only listens for loudness, and nothing is recorded.</p>
        <button className="btn gold" onClick={startMic}>I'm ready to say it</button>
        <button className="ghost light" onClick={() => setMic("denied")}>I'd rather not use the mic</button>
      </>}
      {mic === "on" && <p className="gsub">{heard >= 1 ? "Heard." : "Say it like you mean it. Say it like it's already true."}</p>}
      {mic === "denied" && <button className="btn gold" onClick={() => next(true)}>I said it out loud</button>}
      {mic === "on" && <button className="ghost light" onClick={() => next(false)}>Skip this one</button>}
      {onExit && <button className="ghost light" onClick={() => { stop.current && stop.current(); onExit(said); }}>Stop here</button>}
    </div>
  );
}

/* ---------------- the mirror ----------------
   Front camera, flipped like a real mirror. Nothing is recorded. */
export function Mirror({ line, onDone }) {
  const v = useRef(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let stream = null;
    navigator.mediaDevices && navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false }).then((s) => { stream = s; if (v.current) { v.current.srcObject = s; v.current.play().catch(() => {}); } }, () => setErr(true));
    return () => stream && stream.getTracks().forEach((t) => t.stop());
  }, []);
  return (
    <div className="session center">
      <p className="kicker">Mirror work</p>
      {!err ? <div className="mirror"><video ref={v} playsInline muted /><p className="mirrorline">{line}</p></div>
        : <p className="lede dim">No camera here, so use a real mirror. Look yourself in the eye and say it.</p>}
      <p className="lede dim">Look into your own eyes, not at your face. Say it slowly. You may be the only person who says something kind to you today. Nothing is recorded.</p>
      <button className="btn gold" onClick={onDone}>Done</button>
    </div>
  );
}

/* ---------------- recording your voice ---------------- */
const pickMime = () => {
  const c = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac", "audio/ogg;codecs=opus"];
  try { return c.find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || ""; } catch { return ""; }
};
export function Recorder({ script, onSaved, onSkip }) {
  const [state, setState] = useState("idle"); // idle | rec | review | denied
  const [level, setLevel] = useState(0);
  const [blob, setBlob] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const rec = useRef(null), stopLevel = useRef(null), chunks = useRef([]), prev = useRef(null);
  const elapsed = useElapsed(state === "rec");
  useWakeLock(state === "rec");
  useEffect(() => () => { stopLevel.current && stopLevel.current(); prev.current && prev.current.stop(); try { rec.current && rec.current.state !== "inactive" && rec.current.stop(); } catch {} }, []);

  const start = async () => {
    try {
      getCtx();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      const mime = pickMime();
      const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      r.ondataavailable = (e) => e.data && e.data.size && chunks.current.push(e.data);
      r.onstop = () => { stream.getTracks().forEach((t) => t.stop()); setBlob(new Blob(chunks.current, { type: r.mimeType || mime || "audio/webm" })); setState("review"); };
      r.start(1000);
      rec.current = r;
      stopLevel.current = await listenLevel(setLevel);
      setState("rec");
    } catch { setState("denied"); }
  };
  const stop = () => { stopLevel.current && stopLevel.current(); stopLevel.current = null; rec.current && rec.current.stop(); };
  const preview = async () => {
    if (previewing) { prev.current && prev.current.stop(); setPreviewing(false); return; }
    setPreviewing(true);
    prev.current = await playSession({ bedKey: "theta", voiceBlob: blob, tailMin: 0.2, onEnd: () => setPreviewing(false) });
  };
  const again = () => { prev.current && prev.current.stop(); setPreviewing(false); setBlob(null); setState("idle"); };
  const keep = () => { prev.current && prev.current.stop(); onSaved(blob); };

  return (
    <div className="recorder">
      {state === "idle" && <>
        <p className="lede dim">Somewhere quiet. Phone about a hand's width from your mouth. Read slowly, slower than feels natural, and pause at every "…". Speak to yourself as "you", warmly, the way someone who loves you would. About five minutes.</p>
        <button className="btn gold" onClick={start}>Start recording</button>
        {onSkip && <button className="ghost light" onClick={onSkip}>Use the phone's voice for now</button>}
      </>}
      {state === "denied" && <>
        <p className="lede dim">The microphone isn't available. Check the browser's permission for this site, or use the phone's voice for now and record later from the Sound room.</p>
        <button className="btn gold" onClick={start}>Try again</button>
        {onSkip && <button className="ghost light" onClick={onSkip}>Use the phone's voice for now</button>}
      </>}
      {state === "rec" && <div className="recbar"><span className="recdot" style={{ transform: `scale(${1 + Math.min(1.5, level * 14)})` }} /><span className="count light">Recording · {mmss(elapsed)}</span><button className="btn gold" onClick={stop}>Stop</button></div>}
      {(state === "idle" || state === "rec") && <div className={"prompter" + (state === "rec" ? " live" : "")}>{script.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}</div>}
      {state === "review" && <>
        <p className="lede dim">Listen back over the theta bed. If it sounds rushed, do it again. Slow is the whole trick.</p>
        <div className="row"><button className="btn ink2" onClick={preview}>{previewing ? "Stop" : "Listen back"}</button><button className="btn gold" onClick={keep}>Keep this one</button></div>
        <button className="ghost light" onClick={again}>Record it again</button>
      </>}
    </div>
  );
}
