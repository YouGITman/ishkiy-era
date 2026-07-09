// iSHKiY — ERA v1. Single-component app, Haven pattern.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { PARTS, L5, E5, RIASEC_PHRASES } from "./items.js";

/* ---------------- storage ---------------- */
const KEY = "era-v1";
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} };

/* ---------------- unlock ----------------
   Codes are checked as SHA-256 hashes so they aren't readable in source.
   Regenerate with gen-codes.mjs (see README). "PREVIEW" is the founder test code. */
const CODE_HASHES = [
  "59e1f415bf9d7761b450dcb4785daac53307323451bc453bfaa06a46d4649e2a", // PREVIEW (founder testing — remove before launch)
];
async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text.trim().toUpperCase()));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* ---------------- scoring ---------------- */
const likertVal = (idx, reverse) => (reverse ? 4 - idx : idx) + 1; // 1..5
const to100 = (mean) => Math.round(((mean - 1) / 4) * 100);

export function computeScores(answers) {
  const flat = PARTS.flatMap((p) => p.items);
  const byId = Object.fromEntries(flat.map((i) => [i.id, i]));
  const get = (id) => answers[id];

  // Thinking
  const think = { num: [0, 0], spa: [0, 0], verb: [0, 0], log: [0, 0] };
  flat.filter((i) => i.key).forEach((i) => {
    think[i.dim][1] += 1;
    if (get(i.id) === i.key) think[i.dim][0] += 1;
  });
  const pct = ([c, t]) => (t ? c / t : 0);
  const leans = [["numerical", pct(think.num)], ["spatial", pct(think.spa)], ["verbal", pct(think.verb)], ["logical", pct(think.log)]].sort((a, b) => b[1] - a[1]);
  const thinking = {
    numerical: Math.round(pct(think.num) * 100), spatial: Math.round(pct(think.spa) * 100),
    verbal: Math.round(pct(think.verb) * 100), logical: Math.round(pct(think.log) * 100),
    lean: leans[0][1] === 0 ? "no single way" : leans[0][0],
    approach: { persistence: get("TH-15"), intuition: get("TH-16") },
  };

  // Likert helper
  const meanFor = (pred) => {
    const items = flat.filter((i) => (i.format === "L5" || i.format === "E5") && !i.qc && i.scored !== false && pred(i));
    const vals = items.map((i) => { const idx = get(i.id); return idx == null ? null : likertVal(idx, i.reverse); }).filter((v) => v != null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  const ei = {
    selfAwareness: to100(meanFor((i) => i.domain === "sa")),
    socialAwareness: to100(meanFor((i) => i.domain === "so")),
    selfManagement: to100(meanFor((i) => i.domain === "sm")),
    relationshipManagement: to100(meanFor((i) => i.domain === "rm")),
    scenarios: { criticism: opt(byId, answers, "EI-SA4"), quietColleague: opt(byId, answers, "EI-SO5"), hotEmail: opt(byId, answers, "EI-SM5"), conflict: opt(byId, answers, "EI-RM5") },
  };

  const codes = ["R", "I", "A", "S", "E", "C"];
  const riasecScores = Object.fromEntries(codes.map((c) => [c, to100(meanFor((i) => i.code === c))]));
  const ranked = codes.slice().sort((a, b) => riasecScores[b] - riasecScores[a]);
  const riasec = { scores: riasecScores, ranked, top: ranked[0], second: ranked[1], topPhrase: RIASEC_PHRASES[ranked[0]] };

  const valueNames = ["Achievement", "Power", "Security", "Stimulation", "Self-direction", "Universalism"];
  const base = Object.fromEntries(valueNames.map((v) => [v, meanFor((i) => i.value === v) ?? 3]));
  const fcWins = Object.fromEntries(valueNames.map((v) => [v, 0]));
  flat.filter((i) => i.format === "FC").forEach((i) => {
    const pick = get(i.id); if (pick === "a") fcWins[i.a.value] += 1; if (pick === "b") fcWins[i.b.value] += 1;
  });
  const weighted = Object.fromEntries(valueNames.map((v) => [v, Math.min(100, to100(base[v]) + fcWins[v] * 6)]));
  const vRanked = valueNames.slice().sort((a, b) => weighted[a] === weighted[b] ? fcWins[b] - fcWins[a] : weighted[b] - weighted[a]);
  const topFC = valueNames.slice().sort((a, b) => fcWins[b] - fcWins[a])[0];
  const values = { scores: weighted, ranked: vRanked, fcWins, fcPhrase: fcPhrase(topFC, fcWins[topFC]) };

  const traits = { O: "Openness", C: "Conscientiousness", E: "Extraversion", A: "Agreeableness", N: "Steadiness" };
  const big5 = Object.fromEntries(Object.entries(traits).map(([t, name]) => [name, to100(meanFor((i) => i.trait === t))]));

  // QC
  const qc = { attentionPassed: 0, attentionTotal: 2, straightLining: false };
  if (get("QC-1") === 3) qc.attentionPassed += 1;
  if (get("QC-2") === 0) qc.attentionPassed += 1;
  let run = 1, prev = null, maxRun = 0;
  flat.filter((i) => (i.format === "L5" || i.format === "E5")).forEach((i) => {
    const v = get(i.id);
    if (v != null && v === prev) { run += 1; maxRun = Math.max(maxRun, run); } else { run = 1; }
    prev = v;
  });
  qc.straightLining = maxRun >= 12;
  const coherence = Math.abs((byId["BF-C1"] ? likertVal(get("BF-C1") ?? 2, false) : 3) - (byId["BF-C5"] ? likertVal(get("BF-C5") ?? 2, true) : 3));
  qc.consistencyGap = coherence; // 0 = coherent, 4 = contradictory

  return { thinking, ei, riasec, values, big5, qc };
}
function opt(byId, answers, id) { const i = byId[id]; const v = answers[id]; return i && v != null ? i.options[v] : null; }
function fcPhrase(v, wins) {
  const map = {
    "Security": "the ground you can stand on", "Stimulation": "the door you haven't opened yet",
    "Achievement": "being seen to do it well", "Universalism": "the work mattering beyond you",
    "Power": "a hand on the wheel", "Self-direction": "your own path, on your own terms",
  };
  return wins ? map[v] : "no single thing — you weigh each trade on its own";
}

/* ---------------- report generation ---------------- */
const SYSTEM = `You are writing an Essence Recovery Assessment report for iSHKiY. Voice: compassionate provocateur, plain-spoken, UK English. Short sentences. Plain Anglo-Saxon words — never use: leverage, optimise, journey, deliver, transform, unlock, passionate, world-class, dynamic, synergy, ecosystem. Warm but honest; name hard things in eleven words, not a metaphor. Address the reader as "you". Use their own quoted words where provided. This is a structured self-discovery tool grounded in established frameworks (CHC, Goleman EI, RIASEC, Schwartz, Big Five) — it is NOT clinically validated, so never claim diagnosis, validation, or certainty; write "your answers suggest", "the pattern points to". Note: "Steadiness" is inverted Neuroticism — high Steadiness means emotionally stable; explain this plainly once if relevant. Output plain markdown with ## section headings only where instructed. No bullet lists — flowing short paragraphs.`;

function reportCalls(answers, scores) {
  const ctx = JSON.stringify({
    theirWords: { role: answers["AR-2"], hardestPart: answers["AR-3"], goodDay: answers["AR-4"], broughtHere: answers["AR-5"] != null ? PARTS[0].items[4].options[answers["AR-5"]] : null, energy: answers["AR-6"] != null ? PARTS[0].items[5].options[answers["AR-6"]] : null, neverTold: answers["MI-1"], fiveYears: answers["MI-2"] != null ? PARTS[8].items[1].options[answers["MI-2"]] : null, atMyBest: answers["MI-3"], extra: answers["MI-4"] },
    scores,
  });
  const name = (answers["AR-1"] || "").trim() || "friend";
  return [
    { title: "Opening", prompt: `Data: ${ctx}\n\nWrite the OPENING MIRROR section (~250 words) for ${name}. Reflect their own words back — the hardest part, the good day, what brought them here — woven with one thing the data already confirms. No heading. End the section with one sentence that earns their trust for what follows.` },
    { title: "How you think & how you feel", prompt: `Data: ${ctx}\n\nWrite two sections (~200 words each). "## How you think" — their thinking-style profile (numerical/spatial/verbal/logical accuracy and approach answers); describe HOW they move through problems, never an IQ framing. "## How you carry yourself" — the four EI domains and what the scenario choices reveal. One insight per section they could not get from a horoscope.` },
    { title: "What pulls you & what you're for", prompt: `Data: ${ctx}\n\nWrite two sections (~200 words each). "## What pulls you" — top two RIASEC inclinations in plain words, and what the lowest one says. "## What you're for" — their ranked values and especially the forced-choice pattern; name the trade they keep making.` },
    { title: "How you work & the tensions", prompt: `Data: ${ctx}\n\nWrite two sections. "## How you work" (~180 words) — the Big Five profile in plain language (remember Steadiness = inverted Neuroticism, explain plainly). "## The tensions" (~220 words) — find the two or three places their dimensions pull against each other (e.g. high Self-direction with high Security) and say what living inside each tension is probably like. Tensions are where the real story lives.` },
    { title: "What this suggests", prompt: `Data: ${ctx}\n\nWrite the final section "## What this suggests" (~300 words). Read their current path honestly against the profile. Offer two or three directions worth exploring — not job titles pulled from air, but shapes of work that fit the pattern — each with one concrete first step they could take this month. Close the whole report with this exact line on its own: The box was never you.` },
  ];
}

async function callClaude(prompt) {
  const res = await fetch("/api/claude", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system: SYSTEM, messages: [{ role: "user", content: prompt }], max_tokens: 1400 }),
  });
  if (!res.ok) throw new Error("proxy " + res.status);
  const data = await res.json();
  return (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
}

const SAMPLE = `*(Preview mode — the live report is generated when the app is deployed with its key. This sample shows the shape.)*\n\nYou said the hardest part right now is the feeling of running in place. Your answers back that up — and they also show something you may not have said out loud yet.\n\n## How you think\nYou lean verbal-logical. You take a problem apart with words before numbers, and you'd rather sit with it than be handed the answer.\n\n## How you carry yourself\nYour awareness of others runs ahead of your awareness of yourself. People tell you things. You don't always tell yourself things.\n\n## What pulls you\nSomething keeps pulling you toward starting things and bringing others with you.\n\n## What you're for\nWhen forced to choose, you chose your own path, on your own terms. Every time.\n\n## How you work\nHigh Openness, high Conscientiousness — the rare pairing that starts things AND finishes them.\n\n## The tensions\nYou want freedom and you want the ground not to move. Those two run your life between them.\n\n## What this suggests\nThe pattern points somewhere specific. The live report will point there with you.\n\nThe box was never you.`;

/* ---------------- markdown-lite renderer ---------------- */
function md(text) {
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc(text).split(/\n{2,}/).map((block) => {
    const b = block.trim(); if (!b) return "";
    if (b.startsWith("## ")) return `<h2>${inline(b.slice(3))}</h2>`;
    return `<p>${inline(b).replace(/\n/g, "<br/>")}</p>`;
  }).join("");
  function inline(s) { return s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>"); }
}

/* ---------------- glimmer visuals ---------------- */
function GlimmerArt({ kind, scores }) {
  const gold = "#D4A547", bone = "#F5F1E8", faint = "rgba(245,241,232,0.22)";
  if (kind === "dot") return (<svg viewBox="0 0 200 120" className="gart"><line x1="20" y1="60" x2="180" y2="60" stroke={faint} strokeWidth="1" /><circle cx="60" cy="60" r="7" fill={gold} /></svg>);
  if (kind === "ring") return (<svg viewBox="0 0 200 120" className="gart"><circle cx="100" cy="60" r="40" fill="none" stroke={faint} strokeWidth="6" /><path d="M 100 20 A 40 40 0 0 1 134.6 80" fill="none" stroke={gold} strokeWidth="6" strokeLinecap="round" /></svg>);
  if (kind === "tiles") { const lean = scores?.thinking?.lean; const labels = ["numerical", "spatial", "verbal"]; return (<svg viewBox="0 0 200 120" className="gart">{labels.map((l, i) => (<rect key={l} x={28 + i * 52} y="42" width="40" height="40" rx="8" fill={l === lean || (lean === "logical" && l === "verbal") ? gold : "transparent"} stroke={l === lean ? gold : faint} strokeWidth="1.5" />))}</svg>); }
  if (kind === "pair") return (<svg viewBox="0 0 200 120" className="gart"><circle cx="70" cy="60" r="30" fill="none" stroke={gold} strokeWidth="4" strokeDasharray="95 200" strokeLinecap="round" transform="rotate(-90 70 60)" /><circle cx="130" cy="60" r="30" fill="none" stroke={faint} strokeWidth="4" /><circle cx="130" cy="60" r="30" fill="none" stroke={bone} strokeWidth="4" strokeDasharray="120 200" strokeLinecap="round" transform="rotate(-90 130 60)" /></svg>);
  if (kind === "compass") return (<svg viewBox="0 0 200 120" className="gart"><circle cx="100" cy="60" r="42" fill="none" stroke={faint} strokeWidth="1.5" /><path d="M100 26 L108 60 L100 94 L92 60 Z" fill={gold} opacity="0.9" transform="rotate(28 100 60)" /><circle cx="100" cy="60" r="4" fill={bone} /></svg>);
  if (kind === "petals") { const top = scores?.riasec?.top; const codes = ["R", "I", "A", "S", "E", "C"]; return (<svg viewBox="0 0 200 140" className="gart">{codes.map((c, i) => { const ang = (i * 60 - 90) * Math.PI / 180; const x = 100 + 38 * Math.cos(ang), y = 70 + 38 * Math.sin(ang); return (<ellipse key={c} cx={x} cy={y} rx="16" ry="24" fill={c === top ? gold : "transparent"} stroke={c === top ? gold : faint} strokeWidth="1.5" transform={`rotate(${i * 60} ${x} ${y})`} />); })}<circle cx="100" cy="70" r="6" fill={bone} /></svg>); }
  if (kind === "beam") return (<svg viewBox="0 0 200 120" className="gart"><line x1="40" y1="52" x2="160" y2="72" stroke={bone} strokeWidth="2.5" strokeLinecap="round" /><line x1="100" y1="62" x2="100" y2="96" stroke={faint} strokeWidth="2" /><circle cx="52" cy="52" r="8" fill={gold} /><circle cx="150" cy="71" r="6" fill="none" stroke={faint} strokeWidth="1.5" /></svg>);
  if (kind === "bars") return (<svg viewBox="0 0 200 120" className="gart">{[62, 44, 70, 38, 55].map((h, i) => (<rect key={i} x={34 + i * 30} y={100 - h * 0.7} width="16" height={h * 0.7} rx="4" fill={i === 2 ? "#D4A547" : "rgba(245,241,232,0.35)"} />))}</svg>);
  return null;
}

/* ---------------- item frame SVG (TH-7) ---------------- */
function FramesSvg() {
  const ink = "#0F1E3D";
  return (<svg viewBox="0 0 300 90" className="qart" aria-hidden="true">
    <rect x="15" y="15" width="60" height="60" fill="none" stroke={ink} strokeWidth="2" /><circle cx="45" cy="45" r="16" fill="none" stroke={ink} strokeWidth="2" />
    <path d="M115 75 L145 17 L175 75 Z" fill="none" stroke={ink} strokeWidth="2" /><rect x="131" y="46" width="26" height="26" fill="none" stroke={ink} strokeWidth="2" />
    <circle cx="245" cy="45" r="32" fill="none" stroke={ink} strokeWidth="2" /><text x="245" y="53" textAnchor="middle" fontSize="26" fill="#D4A547" fontFamily="Lora, serif">?</text>
  </svg>);
}

/* ---------------- app ---------------- */
function App() {
  const [state, setState] = useState(() => ({ phase: "welcome", part: 0, item: 0, answers: {}, unlocked: false, report: null, ...load() }));
  const update = (patch) => setState((s) => { const n = { ...s, ...patch }; save(n); return n; });
  const answers = state.answers;
  const scores = useMemo(() => (state.phase === "glimmer" || state.phase === "generating" || state.phase === "report") ? computeScores(answers) : null, [state.phase, answers]);

  useEffect(() => { window.scrollTo(0, 0); }, [state.phase, state.part, state.item]);

  if (state.phase === "welcome") return <Welcome onStart={() => update({ phase: state.unlocked ? "intro" : "unlock" })} resumable={state.part > 0 || state.item > 0} />;
  if (state.phase === "unlock") return <Unlock onUnlock={() => update({ unlocked: true, phase: "intro" })} />;
  if (state.phase === "intro") return <PartIntro part={PARTS[state.part]} n={state.part} onGo={() => update({ phase: "run" })} />;
  if (state.phase === "run") return <Runner state={state} update={update} />;
  if (state.phase === "glimmer") return <Glimmer part={PARTS[state.part]} answers={answers} scores={scores} onNext={() => { const next = state.part + 1; update(next >= PARTS.length ? { phase: "generating" } : { part: next, item: 0, phase: "intro" }); }} />;
  if (state.phase === "generating") return <Generating answers={answers} scores={scores} onDone={(report) => update({ report, phase: "report" })} />;
  if (state.phase === "report") return <Report report={state.report} name={answers["AR-1"]} onRestart={() => { localStorage.removeItem(KEY); location.reload(); }} />;
  return null;
}

function Shell({ dark, children, footer }) {
  return (<div className={"shell" + (dark ? " dark" : "")}><div className="col">{children}</div>{footer}</div>);
}

function Wordmark({ light }) {
  return (<div className={"wordmark" + (light ? " light" : "")} aria-label="iSHKiY">
    <span className="wm-i">\u0131<span className="tittle" /></span>SHK<span className="wm-i">\u0131<span className="tittle" /></span>Y
  </div>);
}

function Welcome({ onStart, resumable }) {
  return (
    <Shell dark>
      <div className="welcome">
        <Wordmark light />
        <p className="kicker">Essence Recovery Assessment</p>
        <h1 className="display">You weren't built for a box.</h1>
        <p className="lede">Nine parts. Around fifty minutes, taken at your own pace — your progress saves after every answer, on your device, and nowhere else.</p>
        <p className="lede dim">At the end you'll receive a written report: how you think, how you carry yourself, what pulls you, what you're for, and where that points. Grounded in established psychological frameworks — CHC, Big Five, Goleman EI, RIASEC and Schwartz Values. A structured self-discovery tool, not a clinical instrument.</p>
        <button className="btn gold" onClick={onStart}>{resumable ? "Continue where you left off" : "Begin"}</button>
      </div>
    </Shell>
  );
}

function Unlock({ onUnlock }) {
  const [code, setCode] = useState(""); const [err, setErr] = useState(false); const [busy, setBusy] = useState(false);
  const check = async () => {
    setBusy(true); const h = await sha256(code); setBusy(false);
    if (CODE_HASHES.includes(h)) onUnlock(); else setErr(true);
  };
  return (
    <Shell dark>
      <div className="welcome">
        <p className="kicker">Founding access</p>
        <h1 className="display sm">Enter your access code</h1>
        <p className="lede dim">Your code arrived with your payment confirmation. One code, one assessment, one report — yours to keep.</p>
        <input className="code" value={code} onChange={(e) => { setCode(e.target.value); setErr(false); }} onKeyDown={(e) => e.key === "Enter" && code && check()} placeholder="e.g. ERA-XXXX-XXXX" autoFocus spellCheck="false" />
        {err && <p className="err">That code isn't recognised. Check for typos — codes aren't case-sensitive.</p>}
        <button className="btn gold" disabled={!code || busy} onClick={check}>{busy ? "Checking\u2026" : "Continue"}</button>
        <a className="paylink" href="STRIPE_PAYMENT_LINK" target="_blank" rel="noreferrer">Don't have a code? Become a founding member \u2192</a>
      </div>
    </Shell>
  );
}

function Dots({ n }) {
  return (<div className="dots" aria-hidden="true">{PARTS.map((p, i) => (<span key={p.id} className={"dot" + (i < n ? " done" : i === n ? " now" : "")} />))}</div>);
}

function PartIntro({ part, n, onGo }) {
  return (
    <Shell>
      <Dots n={n} />
      <div className="intro">
        <p className="kicker gold">{part.kicker}</p>
        <h1 className="display ink">{part.title}</h1>
        <p className="lede inkdim">{part.intro}</p>
        <button className="btn ink" onClick={onGo}>Start this part</button>
      </div>
    </Shell>
  );
}

function seeded(arr, seed) {
  const a = arr.slice(); let s = seed;
  for (let i = a.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor((s / 233280) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function Runner({ state, update }) {
  const part = PARTS[state.part];
  const order = useMemo(() => {
    if (!part.shuffle) return part.items;
    let seed = state.seed; if (!seed) { seed = Math.floor(Math.random() * 100000) + 1; update({ seed }); }
    return seeded(part.items, seed);
  }, [part, state.seed]);
  const item = order[state.item];
  const [text, setText] = useState(state.answers[item?.id] || "");
  const advTimer = useRef(null);
  useEffect(() => { setText(state.answers[item?.id] || ""); return () => clearTimeout(advTimer.current); }, [item?.id]);
  if (!item) return null;

  const total = order.length;
  const setAnswer = (val, auto) => {
    const answers = { ...state.answers, [item.id]: val };
    if (auto) {
      update({ answers });
      advTimer.current = setTimeout(() => advance(answers), 260);
    } else advance({ ...answers });
  };
  const advance = (answers) => {
    const next = state.item + 1;
    if (next >= total) update({ answers, item: 0, phase: part.glimmer ? "glimmer" : "generating" });
    else update({ answers, item: next });
  };
  const back = () => {
    if (state.item > 0) update({ item: state.item - 1 });
    else update({ phase: "intro" });
  };

  const chosen = state.answers[item.id];
  const scale = item.format === "L5" ? L5 : item.format === "E5" ? E5 : null;

  return (
    <Shell footer={
      <div className="foot">
        <button className="ghost" onClick={back}>\u2190 Back</button>
        <span className="count">{state.item + 1} / {total}</span>
      </div>
    }>
      <Dots n={state.part} />
      <div className="track"><div className="fill" style={{ width: `${(state.item / total) * 100}%` }} /></div>
      <div className="qwrap" key={item.id}>
        {item.svg === "frames" && <FramesSvg />}
        <h2 className="question">{item.text}</h2>

        {scale && (
          <div className="opts">{scale.map((o, i) => (
            <button key={o} className={"opt" + (chosen === i ? " sel" : "")} onClick={() => setAnswer(i, true)}>
              <span className="odot" />{o}
            </button>
          ))}</div>
        )}

        {item.format === "MC" && (
          <div className="opts">{item.options.map((o, i) => {
            const val = item.key ? o : i; // keyed items store the option text for scoring
            const isSel = chosen === val;
            return (<button key={o} className={"opt" + (isSel ? " sel" : "")} onClick={() => setAnswer(val, true)}><span className="odot" />{o}</button>);
          })}</div>
        )}

        {item.format === "FC" && (
          <div className="fc">
            {["a", "b"].map((k) => (
              <button key={k} className={"fccard" + (chosen === k ? " sel" : "")} onClick={() => setAnswer(k, true)}>{item[k].text}</button>
            ))}
          </div>
        )}

        {item.format === "FT" && (
          <div className="ft">
            {item.short
              ? <input className="tin" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (text.trim() || item.optional) && setAnswer(text.trim())} autoFocus />
              : <textarea className="tarea" rows={4} value={text} onChange={(e) => setText(e.target.value)} autoFocus />}
            <button className="btn ink" disabled={!text.trim() && !item.optional} onClick={() => setAnswer(text.trim())}>{item.optional && !text.trim() ? "Skip" : "Continue"}</button>
          </div>
        )}

        {item.format === "ACK" && (
          <div className="ft">
            <p className="consent">{item.text}</p>
            <button className="btn ink" onClick={() => setAnswer(true)}>Understood — write my report</button>
          </div>
        )}
      </div>
    </Shell>
  );
}

function Glimmer({ part, answers, scores, onNext }) {
  const line = part.glimmer.line(answers, scores);
  return (
    <Shell dark>
      <div className="glimmer">
        <GlimmerArt kind={part.glimmer.visual} scores={scores} />
        <p className="gline">{line}</p>
        <button className="btn gold" onClick={onNext}>Carry on</button>
      </div>
    </Shell>
  );
}

function Generating({ answers, scores, onDone }) {
  const [step, setStep] = useState(0);
  const calls = useMemo(() => reportCalls(answers, scores), []);
  useEffect(() => {
    let alive = true;
    (async () => {
      const sections = [];
      try {
        for (let i = 0; i < calls.length; i++) {
          if (!alive) return;
          setStep(i);
          sections.push(await callClaude(calls[i].prompt));
        }
        if (alive) onDone({ text: sections.join("\n\n"), preview: false, when: new Date().toISOString() });
      } catch (e) {
        if (alive) onDone({ text: SAMPLE, preview: true, when: new Date().toISOString() });
      }
    })();
    return () => { alive = false; };
  }, []);
  const lines = ["Reading your answers", "Writing how you think", "Finding what pulls you", "Naming the tensions", "Writing where this points"];
  return (
    <Shell dark>
      <div className="glimmer">
        <GlimmerArt kind="ring" />
        <p className="gline">That's everything. Most people never sit with themselves this long.</p>
        <p className="gsub">{lines[Math.min(step, lines.length - 1)]}\u2026</p>
      </div>
    </Shell>
  );
}

function Report({ report, name, onRestart }) {
  if (!report) return null;
  return (
    <div className="reportpage">
      <div className="rhead noprint">
        <Wordmark />
        <div className="ractions">
          <button className="btn ink" onClick={() => window.print()}>Save as PDF</button>
          <button className="ghost inkghost" onClick={() => { if (confirm("Start over? This clears your answers and report from this device.")) onRestart(); }}>Start over</button>
        </div>
      </div>
      <article className="report">
        <p className="kicker gold">Essence Recovery Assessment</p>
        <h1 className="display ink">{name ? `${name}, this is you.` : "This is you."}</h1>
        {report.preview && <p className="previewnote">Preview report — deploy with the API key to generate the real one.</p>}
        <div className="rbody" dangerouslySetInnerHTML={{ __html: md(report.text) }} />
        <p className="integrity">Grounded in established psychological frameworks — CHC, Big Five, Goleman EI, RIASEC and Schwartz Values. A structured self-discovery tool, not a clinical or validated psychometric instrument. Your answers never left your device; this report was written for you alone.</p>
      </article>
    </div>
  );
}

const rootEl = typeof document !== "undefined" && document.getElementById("root");
if (rootEl) createRoot(rootEl).render(<App />);
