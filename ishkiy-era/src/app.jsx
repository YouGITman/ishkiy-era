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
const SYSTEM = `You are writing an Essence Recovery Assessment report for iSHKiY. You write as a person: someone kind and unhurried who has spent twenty-five years watching what work does to people, and who tells the truth gently. Not a coach, not a consultant, not an assistant. A wise friend with a pen.

Voice rules, non-negotiable:
- UK English. Short sentences. Fragments allowed. Most sentences under fifteen words.
- Vary rhythm like speech: a long sentence, then a short one. Sometimes three words.
- Plain Anglo-Saxon words. BANNED: leverage, optimise, journey, deliver, transform, unlock, empower, navigate, landscape, tapestry, testament, delve, moreover, furthermore, additionally, ultimately, holistic, comprehensive, resonate, foster, harness, elevate, robust.
- BANNED constructions: "It's worth noting", "It's important to", "not just X but Y", "isn't merely X — it's Y", "In conclusion", "What's striking is", rhetorical questions, starting two consecutive paragraphs with the same word.
- At most one em-dash per section. No bullet lists, ever. No exclamation marks.
- Use their name at most twice in the entire report. Address them as "you".
- Be specific to THEIR numbers and THEIR words. If a line could sit in anyone's horoscope, cut it.
- One dry understatement per section is allowed. Never ask for the laugh.
- End each section on a feeling or a plain truth, never a summary or a recommendation to "consider".
- This tool is grounded in established frameworks (CHC, Goleman EI, RIASEC, Schwartz, Big Five), not clinically validated: write "your answers suggest", "the pattern points to", never diagnose or claim certainty. "Steadiness" is inverted Neuroticism — if relevant, explain that plainly once.

Format: begin every section with one headline line formatted exactly as "### " followed by six to ten words — the truth of the section said the way a friend would say it across a kitchen table, not a corporate title. Then flowing short paragraphs. Nothing else.`;

function reportCalls(answers, scores) {
  const ctx = JSON.stringify({
    theirWords: { role: answers["AR-2"], hardestPart: answers["AR-3"], goodDay: answers["AR-4"], broughtHere: answers["AR-5"] != null ? PARTS[0].items[4].options[answers["AR-5"]] : null, energy: answers["AR-6"] != null ? PARTS[0].items[5].options[answers["AR-6"]] : null, neverTold: answers["MI-1"], fiveYears: answers["MI-2"] != null ? PARTS[8].items[1].options[answers["MI-2"]] : null, atMyBest: answers["MI-3"], extra: answers["MI-4"] },
    scores,
  });
  const name = (answers["AR-1"] || "").trim() || "friend";
  return [
    { title: "Opening", prompt: `Data: ${ctx}\n\nWrite the OPENING section (~230 words) for ${name}. Start with the "### " headline line. Then reflect their own words back — the hardest part, the good day, what brought them here — woven with one thing the data already confirms. Quote their actual phrases in quotation marks where they're vivid. End on a sentence that earns trust for what follows.` },
    { title: "How you think & how you feel", prompt: `Data: ${ctx}\n\nWrite two sections (~190 words each). "## How you think" — their thinking-style profile (numerical/spatial/verbal/logical accuracy and the two approach answers); describe HOW they move through problems, never an IQ framing. "## How you carry yourself" — the four EI domains and what the scenario choices reveal about them under heat. Each section starts with its "### " headline after the ## title. One insight per section they could not get from a horoscope.` },
    { title: "What pulls you & what you're for", prompt: `Data: ${ctx}\n\nWrite two sections (~190 words each). "## What pulls you" — top two RIASEC inclinations in plain words, and what the lowest one quietly says. "## What you're for" — their ranked values and especially the forced-choice pattern; name the trade they keep making, and what it costs. Each section starts with its "### " headline after the ## title.` },
    { title: "How you work & the tensions", prompt: `Data: ${ctx}\n\nWrite two sections. "## How you work" (~170 words) — the Big Five profile in plain language (Steadiness = inverted Neuroticism, explain plainly if their score makes it relevant). "## The tensions" (~220 words) — the two or three places their dimensions pull against each other, and what living inside each tension probably feels like on a Tuesday. Each section starts with its "### " headline after the ## title. Tensions are where the real story lives — be brave here.` },
    { title: "What this suggests", prompt: `Data: ${ctx}\n\nWrite the final section "## What this suggests" (~290 words), starting with its "### " headline after the ## title. Read their current path honestly against the profile. Offer two or three shapes of work that fit the pattern — not job titles pulled from air — each with one concrete first step they could take this month. Close the whole report with this exact line on its own: The box was never you.` },
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
    if (b.startsWith("### ")) return `<p class="pull">${inline(b.slice(4))}</p>`;
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

  if (state.phase === "welcome") return <Welcome onStart={() => update({ phase: state.unlocked ? (Object.keys(answers).length ? "intro" : "warmup") : "unlock" })} resumable={state.part > 0 || state.item > 0} />;
  if (state.phase === "unlock") return <Unlock onUnlock={() => update({ unlocked: true, phase: "warmup" })} />;
  if (state.phase === "warmup") return <Warmup onDone={() => update({ phase: "intro" })} />;
  if (state.phase === "intro") return <PartIntro part={PARTS[state.part]} n={state.part} onGo={() => update({ phase: "run" })} />;
  if (state.phase === "run") return <Runner state={state} update={update} />;
  if (state.phase === "glimmer") return <Glimmer part={PARTS[state.part]} answers={answers} scores={scores} onNext={() => {
    const completedAt = { ...(state.completedAt || {}), [PARTS[state.part].id]: Date.now() };
    if (state.retaking) return update({ completedAt, retaking: false, phase: "generating", report: null });
    const next = state.part + 1;
    update(next >= PARTS.length ? { completedAt, phase: "generating" } : { completedAt, part: next, item: 0, phase: "intro" });
  }} />;
  if (state.phase === "generating") return <Generating answers={answers} scores={scores} onDone={(report) => update({ report, phase: "report" })} />;
  if (state.phase === "report") return <Report report={state.report} name={answers["AR-1"]} scores={scores} completedAt={state.completedAt || {}} onRetake={(idx) => update({ part: idx, item: 0, retaking: true, phase: "intro" })} onRestart={() => { localStorage.removeItem(KEY); location.reload(); }} />;
  return null;
}

function Shell({ dark, children, footer }) {
  return (<div className={"shell" + (dark ? " dark" : "")}><div className="col">{children}</div>{footer}</div>);
}

const WARMUP = [
  { line: "Take a breath. This isn't a test you can fail.", sub: "There are no wrong answers here. Only true ones and polite ones." },
  { line: "Answer as you are, not as the job advert wants you to be.", sub: "No one is scoring you against anyone. The only person who loses from a polished answer is you." },
  { line: "Fifty minutes, at your own pace. Slow is fine.", sub: "Your answers stay on this device. Honest is everything." },
];

function Warmup({ onDone }) {
  const [i, setI] = useState(0);
  const last = i === WARMUP.length - 1;
  return (
    <Shell dark>
      <div className="glimmer">
        <div className="breath" aria-hidden="true"><span /></div>
        <p className="gline" key={i}>{WARMUP[i].line}</p>
        <p className="gsub">{WARMUP[i].sub}</p>
        <button className="btn gold" onClick={() => (last ? onDone() : setI(i + 1))}>{last ? "I'm ready" : "Go on"}</button>
      </div>
    </Shell>
  );
}

function Wordmark({ light }) {
  return (<div className={"wordmark" + (light ? " light" : "")} aria-label="iSHKiY">
    <span className="wm-i">{"\u0131"}<span className="tittle" /></span>SHK<span className="wm-i">{"\u0131"}<span className="tittle" /></span>Y
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
    if (next >= total) {
      const completedAt = { ...(state.completedAt || {}), [part.id]: Date.now() };
      if (part.glimmer) update({ answers, completedAt, item: 0, phase: "glimmer" });
      else update({ answers, completedAt, item: 0, retaking: false, phase: "generating", report: null });
    }
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

/* ---------------- results tiles ---------------- */
const GOLD = "#D4A547", INK = "#0F1E3D", INK18 = "rgba(15,30,61,0.18)";

function MiniBars({ pairs, max = 100 }) {
  return (<svg viewBox={`0 0 120 ${pairs.length * 16}`} className="mini">{pairs.map(([label, v], i) => (
    <g key={label} transform={`translate(0 ${i * 16})`}>
      <rect x="0" y="4" width="120" height="6" rx="3" fill={INK18} />
      <rect x="0" y="4" width={Math.max(6, (v / max) * 120)} height="6" rx="3" fill={i === 0 ? GOLD : INK} opacity={i === 0 ? 1 : 0.55} />
    </g>))}</svg>);
}
function MiniPetals({ riasec }) {
  const codes = ["R", "I", "A", "S", "E", "C"];
  return (<svg viewBox="0 0 120 100" className="mini">{codes.map((c, i) => {
    const ang = (i * 60 - 90) * Math.PI / 180; const x = 60 + 30 * Math.cos(ang), y = 50 + 30 * Math.sin(ang);
    const on = c === riasec.top, second = c === riasec.second;
    return <ellipse key={c} cx={x} cy={y} rx="11" ry="17" fill={on ? GOLD : second ? "rgba(212,165,71,0.35)" : "transparent"} stroke={on || second ? GOLD : INK18} strokeWidth="1.4" transform={`rotate(${i * 60} ${x} ${y})`} />;
  })}<circle cx="60" cy="50" r="4" fill={INK} /></svg>);
}
function MiniCompass({ ei }) {
  const vals = [ei.selfAwareness, ei.socialAwareness, ei.selfManagement, ei.relationshipManagement];
  const best = Math.max(...vals); const angle = vals.indexOf(best) * 90 + 45;
  return (<svg viewBox="0 0 120 100" className="mini"><circle cx="60" cy="50" r="34" fill="none" stroke={INK18} strokeWidth="1.5" />
    <path d="M60 22 L66 50 L60 78 L54 50 Z" fill={GOLD} transform={`rotate(${angle} 60 50)`} /><circle cx="60" cy="50" r="3.5" fill={INK} /></svg>);
}
function MiniBeam({ values }) {
  return (<svg viewBox="0 0 120 100" className="mini"><line x1="20" y1="42" x2="100" y2="58" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
    <line x1="60" y1="50" x2="60" y2="78" stroke={INK18} strokeWidth="2" /><circle cx="28" cy="43" r="7" fill={GOLD} /><circle cx="93" cy="57" r="5" fill="none" stroke={INK18} strokeWidth="1.5" /></svg>);
}

function Tiles({ scores }) {
  const [open, setOpen] = useState(null);
  const t = scores.thinking, ei = scores.ei, b5 = scores.big5;
  const tiles = [
    { id: "think", label: "How you think", stat: t.lean, art: <MiniBars pairs={[[t.lean, 100], ["", 55]].slice(0, 1).concat([["numerical", t.numerical], ["spatial", t.spatial], ["verbal", t.verbal], ["logical", t.logical]].sort((a, b) => b[1] - a[1]).slice(0, 3))} />, detail: [["Numerical", t.numerical + "%"], ["Spatial", t.spatial + "%"], ["Verbal", t.verbal + "%"], ["Logical", t.logical + "%"]], note: "Accuracy by problem type. The lean is your first language for a hard problem — not a ceiling on the others." },
    { id: "heart", label: "How you carry yourself", stat: "the compass", art: <MiniCompass ei={ei} />, detail: [["Self-awareness", ei.selfAwareness], ["Social awareness", ei.socialAwareness], ["Self-management", ei.selfManagement], ["With others", ei.relationshipManagement]], note: "Goleman's four domains, 0–100 from your answers. The needle points where you're strongest." },
    { id: "pull", label: "What pulls you", stat: scores.riasec.top + " · " + scores.riasec.second, art: <MiniPetals riasec={scores.riasec} />, detail: ["R", "I", "A", "S", "E", "C"].map((c) => [{ R: "Making (R)", I: "Understanding (I)", A: "Creating (A)", S: "People (S)", E: "Starting (E)", C: "Ordering (C)" }[c], scores.riasec.scores[c]]), note: "The gold petal is the strongest pull. The faint one is second. Low petals matter too — they're honest about what drains you." },
    { id: "values", label: "What you're for", stat: scores.values.ranked[0], art: <MiniBeam values={scores.values} />, detail: scores.values.ranked.map((v) => [v, scores.values.scores[v] + (scores.values.fcWins[v] ? ` · chose it ${scores.values.fcWins[v]}\u00D7` : "")]), note: "Ranked by importance, weighted by what you chose when forced to pick. Forced choices tell the truth." },
    { id: "work", label: "How you work", stat: Object.entries(b5).sort((a, b) => b[1] - a[1])[0][0].toLowerCase(), art: <MiniBars pairs={Object.entries(b5).sort((a, b) => b[1] - a[1])} />, detail: Object.entries(b5).map(([k, v]) => [k, v]), note: "The Big Five, 0–100. Steadiness is Neuroticism turned right-side up: high means the weather passes through you quickly." },
  ];
  return (
    <div className="tiles">
      {tiles.map((tile) => (
        <div key={tile.id} className={"tile" + (open === tile.id ? " open" : "")}>
          <button className="tilehead" onClick={() => setOpen(open === tile.id ? null : tile.id)} aria-expanded={open === tile.id}>
            {tile.art}
            <span className="tlabel">{tile.label}</span>
            <span className="tstat">{tile.stat}</span>
          </button>
          {open === tile.id && (
            <div className="tbody">
              {tile.detail.map(([k, v]) => (<div key={k} className="trow"><span>{k}</span><span className="tnum">{v}</span></div>))}
              <p className="tnote">{tile.note}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------------- share card ---------------- */
function shareCardSvg(scores, name) {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const wrap = (text, width) => { // naive word wrap
    const words = text.split(" "); const lines = []; let cur = "";
    words.forEach((w) => { if ((cur + " " + w).trim().length > width) { lines.push(cur.trim()); cur = w; } else cur += " " + w; });
    if (cur.trim()) lines.push(cur.trim()); return lines;
  };
  const pull = wrap(`Something keeps pulling me toward ${scores.riasec.topPhrase}.`, 26);
  const choose = wrap(`When it comes to it, I choose ${scores.values.fcPhrase}.`, 30);
  let y = 400;
  const pullT = pull.map((l) => `<text x="90" y="${y += 86}" font-family="Georgia,serif" font-weight="700" font-size="64" fill="#F5F1E8">${esc(l)}</text>`).join("");
  y += 70;
  const chooseT = choose.map((l) => `<text x="90" y="${y += 52}" font-family="Georgia,serif" font-size="38" fill="rgba(245,241,232,0.75)">${esc(l)}</text>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <rect width="1080" height="1350" fill="#0F1E3D"/>
  <circle cx="152" cy="180" r="26" fill="#D4A547"/>
  <line x1="60" y1="180" x2="1020" y2="180" stroke="rgba(245,241,232,0.14)" stroke-width="2"/>
  <text x="90" y="300" font-family="Inter,Arial,sans-serif" font-size="26" letter-spacing="6" fill="#D4A547">ESSENCE RECOVERY ASSESSMENT</text>
  ${pullT}${chooseT}
  <text x="90" y="1130" font-family="Georgia,serif" font-style="italic" font-size="46" fill="#D4A547">The box was never you.</text>
  <text x="90" y="1250" font-family="Georgia,serif" font-weight="700" font-size="40" fill="#F5F1E8">${"\u0131"}SHK${"\u0131"}Y</text>
  <circle cx="99" cy="1216" r="7" fill="#D4A547"/><circle cx="216" cy="1216" r="7" fill="#D4A547"/>
  <text x="990" y="1250" text-anchor="end" font-family="Inter,Arial,sans-serif" font-size="28" fill="rgba(245,241,232,0.6)">#NotBuiltForABox</text>
</svg>`;
}
function downloadShareCard(scores, name) {
  const svg = shareCardSvg(scores, name);
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas"); c.width = 1080; c.height = 1350;
    c.getContext("2d").drawImage(img, 0, 0);
    c.toBlob((png) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(png); a.download = "ishkiy-glimpse.png"; a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };
  img.src = url;
}

/* ---------------- retakes ---------------- */
const DAY = 24 * 60 * 60 * 1000;
function Retakes({ completedAt, onRetake }) {
  const [openList, setOpenList] = useState(false);
  const now = Date.now();
  return (
    <div className="retakes noprint">
      <button className="ghost inkghost" onClick={() => setOpenList(!openList)}>{openList ? "Hide retakes" : "Retake a part"}</button>
      {openList && (
        <div className="rtlist">
          <p className="tnote">A part can be retaken 24 hours after you last completed it — a night's sleep between attempts keeps the answers honest. Retaking rewrites your report.</p>
          {PARTS.map((p, idx) => {
            const done = completedAt[p.id]; if (!done) return null;
            const ready = now - done > DAY;
            const hrs = Math.ceil((DAY - (now - done)) / 3600000);
            return (
              <div key={p.id} className="trow">
                <span>{p.title}</span>
                {ready
                  ? <button className="rtbtn" onClick={() => { if (confirm(`Retake \u201C${p.title}\u201D? Your previous answers for this part are replaced, and your report is rewritten.`)) onRetake(idx); }}>Retake</button>
                  : <span className="tnum">in {hrs}h</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Report({ report, name, scores, completedAt, onRetake, onRestart }) {
  if (!report) return null;
  return (
    <div className="reportpage">
      <div className="rhead noprint">
        <Wordmark />
        <div className="ractions">
          <button className="btn ink" onClick={() => window.print()}>Save as PDF</button>
          <button className="btn gold" onClick={() => downloadShareCard(scores, name)}>Share card</button>
        </div>
      </div>
      <article className="report">
        <p className="kicker gold">Essence Recovery Assessment</p>
        <h1 className="display ink">{name ? `${name}, this is you.` : "This is you."}</h1>
        {report.preview && <p className="previewnote">Preview report — deploy with the API key to generate the real one.</p>}
        {scores && <Tiles scores={scores} />}
        <div className="rbody" dangerouslySetInnerHTML={{ __html: md(report.text) }} />
        <p className="integrity">Grounded in established psychological frameworks — CHC, Big Five, Goleman EI, RIASEC and Schwartz Values. A structured self-discovery tool, not a clinical or validated psychometric instrument. Your answers never left your device; this report was written for you alone.</p>
        <Retakes completedAt={completedAt} onRetake={onRetake} />
        <button className="ghost inkghost noprint" onClick={() => { if (confirm("Start over? This clears your answers and report from this device.")) onRestart(); }}>Start over</button>
      </article>
    </div>
  );
}

const rootEl = typeof document !== "undefined" && document.getElementById("root");
if (rootEl) createRoot(rootEl).render(<App />);
