// The practices themselves: calm body calm mind, listening, saying it out
// loud, the mirror, and recording your own voice.
import React, { useEffect, useRef, useState } from "react";
import { CALM_SCRIPT } from "./content.js";
import { startBed, stopBed, playSession, speakScript, listenLevel, bowl, getCtx, loadClip, scheduleGuide, audioNow } from "./audio.js";
import { Orb } from "./visuals.jsx";
import { getVoice } from "./store.js";

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/* Keep the screen awake during a practice, where the phone allows it. */
export function useWakeLock(on = true) {
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

/* ---------------- guided sessions ----------------
   One player for everything spoken: calm body calm mind and the daytime
   top-ups. Recorded clips (audio/<dir>/<id>.mp3) are scheduled on the audio
   clock, so timing holds even if the phone throttles the page. If they can't
   load (offline on first use), the phone's own voice reads the same words.
   A { lines: true } step pauses the voice while the person says their own
   lines out loud, then the voice carries on. */
export function GuideSession({ steps, dir, bed = "alpha", bedVolume = 0.45, kicker, title, lede, lines = [], autoNext = false, autoStart = false, finishLabel = "I'm here", onDone, onExit }) {
  const [on, setOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [idx, setIdx] = useState(0);
  const [total, setTotal] = useState(steps.reduce((a, s) => a + (s.gap || 0) + 6, 0));
  const [saying, setSaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const elapsed = useElapsed(on && !saying);
  const segs = [];
  steps.forEach((s, i) => { if (s.lines) segs.push({ lines: true }); else { const last = segs[segs.length - 1]; if (last && !last.lines) last.items.push({ ...s, i }); else segs.push({ items: [{ ...s, i }] }); } });
  const guide = useRef(null), timer = useRef(null), dead = useRef(false), bufs = useRef(null), spoken = useRef(0);
  useWakeLock(on);
  useEffect(() => () => { dead.current = true; clearInterval(timer.current); clearTimeout(timer.current); guide.current && guide.current.stop(); stopBed(2); }, []);
  const finish = () => { if (dead.current) return; dead.current = true; clearInterval(timer.current); guide.current && guide.current.stop(); stopBed(3); onDone && onDone({ secs: Math.round(elapsed), spoken: spoken.current }); };
  const finishRef = useRef(finish); finishRef.current = finish;
  const reachEnd = () => { setEnded(true); bowl(261.6, 0.1); if (autoNext) setTimeout(() => finishRef.current(), 4000); };

  const runSeg = (k) => {
    if (dead.current) return;
    const seg = segs[k];
    if (!seg) { reachEnd(); return; }
    if (seg.lines) { if (lines.length) { setSaying(true); guide.current = null; } else runSeg(k + 1); return; }
    const next = () => runSeg(k + 1);
    if (bufs.current) {
      const g = scheduleGuide(seg.items.map((s) => ({ buf: bufs.current[s.i], gap: s.gap })));
      guide.current = g;
      timer.current = setInterval(() => {
        const t = audioNow() - g.t0;
        let j = 0; g.starts.forEach((st, n) => { if (t >= st) j = n; });
        setIdx(seg.items[j].i);
        if (t >= g.total - 0.3) { clearInterval(timer.current); next(); }
      }, 400);
    } else {
      let j = 0;
      const run = () => {
        if (dead.current) return;
        if (j >= seg.items.length) { next(); return; }
        const step = seg.items[j]; setIdx(step.i); j++;
        const sp = speakScript(step.say, { rate: 0.8, onDone: () => { timer.current = setTimeout(run, step.gap * 1000); } });
        guide.current = { stop: () => { sp.stop(); clearTimeout(timer.current); } };
      };
      run();
    }
  };
  const segAfterLines = () => segs.findIndex((s) => s.lines) + 1;

  const begin = async () => {
    getCtx(); setLoading(true);
    startBed(bed, { volume: bedVolume }); bowl(174.6, 0.12);
    try { bufs.current = await Promise.all(steps.map((s) => (s.lines ? null : loadClip(`/audio/${dir}/${s.id}.mp3`)))); } catch { bufs.current = null; }
    if (dead.current) return;
    if (bufs.current) setTotal(Math.round(steps.reduce((a, s, i) => a + (s.lines ? 0 : bufs.current[i].duration + s.gap), 1.2)));
    setLoading(false); setOn(true);
    runSeg(0);
  };
  // started by a timer or another session, so there is no button to find
  useEffect(() => { if (autoStart) begin(); }, []);

  if (!on) return (
    <div className="session center">
      <Orb size={170} still={!loading} />
      <p className="kicker">{kicker}</p>
      <h1 className="display sm">{title}</h1>
      <p className="lede dim">{lede}</p>
      <button className="btn gold" onClick={begin} disabled={loading}>{loading ? "Getting ready…" : "Start"}</button>
      {onExit && <button className="ghost light" onClick={onExit}>Not now</button>}
    </div>
  );
  if (saying) return <SayAloud lines={lines} sub="Say it like it's already true." onDone={(n) => { spoken.current += n; setSaying(false); runSeg(segAfterLines()); }} onExit={(n) => { spoken.current += n; setSaying(false); runSeg(segAfterLines()); }} />;
  const cur = steps[idx] || steps[0];
  return (
    <div className="session center">
      <Orb size={210} />
      <p className={"gline" + (cur.mantra ? " mantra-big" : "")} key={idx}>{ended ? "Welcome back." : cur.line}</p>
      {!ended && cur.sub && <p className="gsub">{cur.sub}</p>}
      <div className="meter"><div className="meterfill" style={{ width: Math.min(100, (elapsed / total) * 100) + "%" }} /></div>
      <p className="count light">{mmss(Math.min(elapsed, total))} of {mmss(total)}</p>
      <button className="btn gold" onClick={finish}>{ended ? (autoNext ? "Carry on" : finishLabel) : "Finish early"}</button>
    </div>
  );
}

/* Calm body, calm mind: the full ten minutes, or the evening three and a half. */
export function CalmSession({ short = false, autoNext = false, onDone, onExit }) {
  const steps = CALM_SCRIPT.filter((s) => (short ? !s.longOnly : !s.shortOnly)).map((s) => ({ ...s, gap: short ? Math.max(3, Math.round(s.gap * 0.4)) : s.gap }));
  return <GuideSession steps={steps} dir="calm" kicker="Calm body, calm mind" title={short ? "A few minutes to soften." : "Ten minutes to feel safe."}
    lede="Nothing new gets in while your body is braced. So this comes first, every time. A voice will talk you through it, so you can close your eyes. Headphones if you have them."
    autoNext={autoNext} onExit={onExit} onDone={(r) => onDone && onDone(r.secs)} />;
}

/* ---------------- listening ---------------- */
export function ListenSession({ script, night = false, bedKey = "theta", autoStart = false, onDone, onExit }) {
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
  // straight on from the calm, eyes still shut: no button to find
  useEffect(() => { if (autoStart) start(); }, []);

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
/* Records one take. With an existing recording it becomes a re-record:
   nothing is overwritten until the person has heard the new take and chosen
   to commit it; discarding leaves the old one exactly as it was. There is
   only ever one recording per kind, so committing has no undo, and says so. */
export function Recorder({ script, onSaved, onSkip, existing = null, onDiscard, bed = "theta", what = "recording", intro }) {
  const [state, setState] = useState("idle"); // idle | rec | review | denied
  const [level, setLevel] = useState(0);
  const [blob, setBlob] = useState(null);
  const [previewing, setPreviewing] = useState(null); // null | "new" | "old"
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
  const stopPreview = () => { prev.current && prev.current.stop(); prev.current = null; setPreviewing(null); };
  const preview = async (which) => {
    const was = previewing; stopPreview();
    if (was === which) return;
    setPreviewing(which);
    prev.current = await playSession({ bedKey: bed, voiceBlob: which === "old" ? existing : blob, tailMin: 0.2, onEnd: () => setPreviewing(null) });
  };
  const again = () => { stopPreview(); setBlob(null); setState("idle"); };
  const keep = () => { stopPreview(); onSaved(blob); };
  const discard = () => { stopPreview(); setBlob(null); onDiscard ? onDiscard() : setState("idle"); };

  return (
    <div className="recorder">
      {state === "idle" && <>
        <p className="lede dim">{intro || `Somewhere quiet. Phone about a hand's width from your mouth. Read slowly, slower than feels natural, and pause at every "…". Speak to yourself as "you", warmly, the way someone who loves you would. About five minutes.`}{existing ? ` Your current ${what} stays as it is until you choose to replace it.` : ""}</p>
        <button className="btn gold" onClick={start}>{existing ? "Start the new take" : "Start recording"}</button>
        {onSkip && !existing && <button className="ghost light" onClick={onSkip}>Use the phone's voice for now</button>}
        {existing && onDiscard && <button className="ghost light" onClick={onDiscard}>Keep my current {what}</button>}
      </>}
      {state === "denied" && <>
        <p className="lede dim">The microphone isn't available. Check the browser's permission for this site, or use the phone's voice for now and record later from the Sound room.</p>
        <button className="btn gold" onClick={start}>Try again</button>
        {onSkip && !existing && <button className="ghost light" onClick={onSkip}>Use the phone's voice for now</button>}
        {existing && onDiscard && <button className="ghost light" onClick={onDiscard}>Keep my current {what}</button>}
      </>}
      {state === "rec" && <div className="recbar"><span className="recdot" style={{ transform: `scale(${1 + Math.min(1.5, level * 14)})` }} /><span className="count light">Recording · {mmss(elapsed)}</span><button className="btn gold" onClick={stop}>Stop</button></div>}
      {(state === "idle" || state === "rec") && <div className={"prompter" + (state === "rec" ? " live" : "")}>{script.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}</div>}
      {state === "review" && !existing && <>
        <p className="lede dim">Listen back. If it sounds rushed, do it again. Slow is the whole trick.</p>
        <div className="row"><button className="btn ink2" onClick={() => preview("new")}>{previewing === "new" ? "Stop" : "Listen back"}</button><button className="btn gold" onClick={keep}>Keep this one</button></div>
        <button className="ghost light" onClick={again}>Record it again</button>
      </>}
      {state === "review" && existing && <>
        <p className="lede dim">Listen to the new take before you decide. Committing it replaces your current {what}, and there's no undo. Discarding it leaves your current {what} exactly as it is.</p>
        <div className="row wrap">
          <button className="btn ink2" onClick={() => preview("new")}>{previewing === "new" ? "Stop" : "Listen to the new take"}</button>
          <button className="btn ink2" onClick={() => preview("old")}>{previewing === "old" ? "Stop" : `Listen to my current ${what}`}</button>
        </div>
        <button className="btn gold" onClick={keep}>Commit: replace my {what}</button>
        <div className="row wrap"><button className="ghost light" onClick={discard}>Discard this take</button><button className="ghost light" onClick={again}>Record another take</button></div>
      </>}
    </div>
  );
}
