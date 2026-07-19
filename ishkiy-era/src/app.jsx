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
  "d6afc90d0d2e75e35418f883fae0a10f7cdfe70f6dd9ec7fbcecceb31be3f28f", // COMP — founder giveaway
  "dcf9f89d2a5da4ac2a42aea2e481c1f6f492b96c042f5aea4e422ed7631ec4e5",
  "8ff233677117b0cda39c909858986a708f5cc41f5f04796a27fe5a77617a5aab",
  "5da05478c51a48e5f9226a0b8ca04c8f8ff9c18ddbf9f2eddd5c3a6e520277dd",
  "08fc79cae8a48b024a350c62aa07b1350c187ac566ab5afa4cad0e7fad3548dc",
  "0ab4340288060090d776911e8ede1dcd0a088346a08b9cb107111ac23e7414b2",
  "bca58786d0c58df6a4be12bedca8ed7d374a0562bccba6dcd96c599214398e59",
  "00a9105f0f50a0690542a651f9210a57647fccfab6ae2478ab417c23d3fe9e7a",
  "6f5c3af4a9b69fc9e4180bc2fc03940a8b14f181c1054ddc3728c3e19e9ea97c",
  "ae8a69e183e8543e67b9380531f47448f52b981969e76d18176c41abb0c785b3",
  "cb41298b76f3c97cd4258fd7912ad03b1cb4dba28176730bab242b98cb6c6e51",
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
    lean: (leans[0][1] === 0 || leans[0][1] - leans[1][1] < 0.15) ? "balanced" : leans[0][0],
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
  const ACCENTS = { "How you think": "acc-think", "How you carry yourself": "acc-heart", "What pulls you": "acc-pull", "What you're for": "acc-values", "How you work": "acc-work", "The tensions": "acc-tension", "What this suggests": "acc-gold" };
  let cur = "";
  return esc(text).split(/\n{2,}/).map((block) => {
    const b = block.trim(); if (!b) return "";
    if (b.startsWith("## ")) { const title = b.slice(3).trim(); cur = ACCENTS[title] || ""; return `<h2 class="${cur}">${inline(title)}</h2>`; }
    if (b.startsWith("### ")) return `<p class="pull ${cur}">${inline(b.slice(4))}</p>`;
    return `<p>${inline(b).replace(/\n/g, "<br/>")}</p>`;
  }).join("");
  function inline(s) { return s.replace(/\[!(.+?)!\]/g, '<mark class="disc">$1</mark>').replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>"); }
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
  const ink = "var(--ink)";
  return (<svg viewBox="0 0 300 90" className="qart" aria-hidden="true">
    <rect x="15" y="15" width="60" height="60" fill="none" stroke={ink} strokeWidth="2" /><circle cx="45" cy="45" r="16" fill="none" stroke={ink} strokeWidth="2" />
    <path d="M115 75 L145 17 L175 75 Z" fill="none" stroke={ink} strokeWidth="2" /><rect x="131" y="46" width="26" height="26" fill="none" stroke={ink} strokeWidth="2" />
    <circle cx="245" cy="45" r="32" fill="none" stroke={ink} strokeWidth="2" /><text x="245" y="53" textAnchor="middle" fontSize="26" fill="#D4A547" fontFamily="Lora, serif">?</text>
  </svg>);
}

/* ---------------- app ---------------- */
function App() {
  const [state, setState] = useState(() => ({ part: 0, item: 0, answers: {}, unlocked: false, report: null, ...load(), phase: "breath" }));
  const update = (patch) => setState((s) => { const n = { ...s, ...patch }; save(n); return n; });
  const answers = state.answers;
  const scores = useMemo(() => (["glimmer", "generating", "report", "companion", "humans"].includes(state.phase)) ? computeScores(answers) : null, [state.phase, answers]);

  useEffect(() => { window.scrollTo(0, 0); }, [state.phase, state.part, state.item]);
  useEffect(() => { document.body.classList.toggle("dm", !!state.dark); }, [state.dark]);

  if (state.phase === "breath") return <Breath onEnter={() => update({ phase: "home" })} />;
  if (state.phase === "home") return <Home state={state} onTheme={() => update({ dark: !state.dark })} go={(p) => update({ phase: p })} startAssessment={() => update({ phase: state.unlocked ? (Object.keys(answers).length ? "intro" : "warmup") : "unlock" })} />;
  if (state.phase === "companion") return <CompanionScreen state={state} scores={scores} onBack={() => update({ phase: "home" })} />;
  if (state.phase === "constellation") return <ConstellationScreen state={state} update={update} onBack={() => update({ phase: "home" })} />;
  if (state.phase === "humans") return <HumansScreen scores={scores} onBack={() => update({ phase: "home" })} />;
  if (state.phase === "library") return <LibraryScreen onBack={() => update({ phase: "home" })} />;
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
  if (state.phase === "generating") return <Generating answers={answers} scores={scores} onDone={(report) => update({ report, phase: "report", companionStart: state.companionStart || Date.now() })} />;
  if (state.phase === "report") return <Report report={state.report} name={answers["AR-1"]} answers={answers} scores={scores} companionStart={state.companionStart} completedAt={state.completedAt || {}} onBack={() => update({ phase: "home" })} onLibrary={() => update({ phase: "library" })} onRetake={(idx) => update({ part: idx, item: 0, retaking: true, phase: "intro" })} onRestart={() => { localStorage.removeItem(KEY); location.reload(); }} />;
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
    <span className="wm-i">{"ı"}<span className="tittle" /></span>SHK<span className="wm-i">{"ı"}<span className="tittle" /></span>Y
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
        <p className="lede dim">Your code arrived with your payment confirmation. £29 founding access: the full assessment, your written report — yours to keep — the share card, and seven days with your Report Companion, an AI coach, mentor and sounding board that has actually read you.</p>
        <input className="code" value={code} onChange={(e) => { setCode(e.target.value); setErr(false); }} onKeyDown={(e) => e.key === "Enter" && code && check()} placeholder="e.g. ERA-XXXX-XXXX" autoFocus spellCheck="false" />
        {err && <p className="err">That code isn't recognised. Check for typos — codes aren't case-sensitive.</p>}
        <button className="btn gold" disabled={!code || busy} onClick={check}>{busy ? "Checking…" : "Continue"}</button>
        <a className="paylink" href="STRIPE_PAYMENT_LINK" target="_blank" rel="noreferrer">Don't have a code? Become a founding member →</a>
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
        <button className="ghost" onClick={back}>← Back</button>
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
        <p className="gsub">{lines[Math.min(step, lines.length - 1)]}…</p>
      </div>
    </Shell>
  );
}

/* ---------------- results tiles ---------------- */
const GOLD = "#D4A547", INK = "var(--ink)", INK18 = "var(--ink12)";

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
    { id: "think", acc: "#5C7CA3", label: "How you think", stat: t.lean, art: <MiniBars pairs={[[t.lean, 100], ["", 55]].slice(0, 1).concat([["numerical", t.numerical], ["spatial", t.spatial], ["verbal", t.verbal], ["logical", t.logical]].sort((a, b) => b[1] - a[1]).slice(0, 3))} />, detail: [["Numerical", t.numerical + "%"], ["Spatial", t.spatial + "%"], ["Verbal", t.verbal + "%"], ["Logical", t.logical + "%"]], note: "Accuracy by problem type. The lean is your first language for a hard problem — not a ceiling on the others.", about: "Grounded in Cattell–Horn–Carroll (CHC) theory, the most widely used map of human cognitive abilities. Our short, untimed puzzles sample four problem types to read your thinking style. What it can't claim: this is a style indicator, not an IQ measure — a handful of puzzles can suggest how you approach problems, not the size of the engine." },
    { id: "heart", acc: "#C06B5C", label: "How you carry yourself", stat: "the compass", art: <MiniCompass ei={ei} />, detail: [["Self-awareness", ei.selfAwareness], ["Social awareness", ei.socialAwareness], ["Self-management", ei.selfManagement], ["With others", ei.relationshipManagement]], note: "Goleman's four domains, 0–100 from your answers. The needle points where you're strongest.", about: "Based on Daniel Goleman's four-domain model of emotional intelligence: knowing yourself, steadying yourself, reading others, and working with others. What it can't claim: this is self-report — it measures how you see yourself, which is itself useful information, but a colleague might score you differently." },
    { id: "pull", acc: "#D4A547", label: "What pulls you", stat: scores.riasec.top + " · " + scores.riasec.second, art: <MiniPetals riasec={scores.riasec} />, detail: ["R", "I", "A", "S", "E", "C"].map((c) => [{ R: "Making (R)", I: "Understanding (I)", A: "Creating (A)", S: "People (S)", E: "Starting (E)", C: "Ordering (C)" }[c], scores.riasec.scores[c]]), note: "The gold petal is the strongest pull. The faint one is second. Low petals matter too — they're honest about what drains you.", about: "John Holland's RIASEC model — six themes of vocational interest, used in career guidance for over sixty years. People tend to thrive where their environment matches their strongest themes. What it can't claim: interests aren't abilities. Loving a thing and being built for it usually travel together, but not always." },
    { id: "values", acc: "#6F8F5E", label: "What you're for", stat: scores.values.ranked[0], art: <MiniBeam values={scores.values} />, detail: scores.values.ranked.map((v) => [v, scores.values.scores[v] + (scores.values.fcWins[v] ? ` · chose it ${scores.values.fcWins[v]}×` : "")]), note: "Ranked by importance, weighted by what you chose when forced to pick. Forced choices tell the truth.", about: "Drawn from Shalom Schwartz's theory of basic human values — a model validated across more than eighty countries. We sample six values most alive in working life, and weight the forced choices heavily because trade-offs reveal what ratings flatter. What it can't claim: values shift with seasons of life. This is your now, not your always." },
    { id: "work", acc: "#8A6FA0", label: "How you work", stat: Object.entries(b5).sort((a, b) => b[1] - a[1])[0][0].toLowerCase(), art: <MiniBars pairs={Object.entries(b5).sort((a, b) => b[1] - a[1])} />, detail: Object.entries(b5).map(([k, v]) => [k, v]), note: "The Big Five, 0–100. Steadiness is Neuroticism turned right-side up: high means the weather passes through you quickly.", about: "The Big Five is the most replicated personality model in psychology — five broad traits that describe how people differ in daily working life. We present Neuroticism as Steadiness (same scale, inverted) because it reads truer that way. What it can't claim: five items per trait gives a sketch, not a portrait. The written report adds the shading." },
  ];
  return (
    <div className="tiles">
      {tiles.map((tile) => (
        <div key={tile.id} className={"tile" + (open === tile.id ? " open" : "")} style={{ borderTopColor: tile.acc, borderTopWidth: "4px" }}>
          <button className="tilehead" onClick={() => setOpen(open === tile.id ? null : tile.id)} aria-expanded={open === tile.id}>
            {tile.art}
            <span className="tlabel">{tile.label}</span>
            <span className="tstat" style={{ color: tile.acc }}>{tile.stat}</span>
          </button>
          <div className={"tbody" + (open === tile.id ? "" : " closed")}>
              {tile.detail.map(([k, v]) => (<div key={k} className="trow"><span>{k}</span><span className="tnum">{v}</span></div>))}
              <p className="tnote">{tile.note}</p>
              <p className="tabout"><strong>About this framework.</strong> {tile.about}</p>
          </div>
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
  <text x="90" y="300" font-family="Inter,Arial,sans-serif" font-size="25" letter-spacing="5" fill="#D4A547">ESSENCE RECOVERY ASSESSMENT &amp; COMPANION</text>
  ${pullT}${chooseT}
  <text x="90" y="1130" font-family="Georgia,serif" font-style="italic" font-size="46" fill="#D4A547">The box was never you.</text>\n  <text x="90" y="1178" font-family="Inter,Arial,sans-serif" font-size="27" fill="rgba(245,241,232,0.55)">What would it read in you? — ishkiy-era.netlify.app</text>
  <text x="90" y="1250" font-family="Georgia,serif" font-weight="700" font-size="40" fill="#F5F1E8">${"ı"}SHK${"ı"}Y</text>
  <circle cx="96" cy="1214" r="5.5" fill="#D4A547"/><circle cx="190" cy="1214" r="5.5" fill="#D4A547"/>
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


/* ---------------- opening breath & quotes ---------------- */
const QUOTES = [
  "The box was never you.",
  "The future is not artificial; it's authentically human.",
  "Become more, not less.",
  "Refuse the box. Build the way out.",
  "Your weird is your wealth.",
  "Stay yourself. The rest follows.",
  "Notice. Name it. Leave the box.",
  "You were someone before the job title. You still are.",
  "A good Tuesday is not too much to ask.",
  "Quiet is not empty. It's where you hear yourself.",
  "The ladder isn't the only shape a life can take.",
  "What drains you is data. What lights you is direction.",
  "You don't need fixing. You need finding.",
  "The costume comes off. The person was always underneath.",
  "Slow is fine. Honest is everything.",
  "Nobody else has your pattern. That's the point.",
  "The cage door was never locked.",
  "Ambition without self-knowledge is just running.",
  "You can be grateful and still want more.",
  "The work should fit the human, not the other way round.",
  "Some questions deserve fifty minutes of your life.",
  "What you avoid is a map too.",
  "Belonging starts with belonging to yourself.",
  "You are allowed to outgrow what once fit.",
  "The hardest person to meet is yourself. Worth it, though.",
  "Rest is not a reward. It's a requirement.",
  "Your story isn't behind you. You're holding the pen.",
  "Being good at it and being for it are different things.",
  "The world needs what you almost didn't say.",
  "Comparison is a box with mirrors for walls.",
  "Start where you are. It's the only place that works.",
  "Courage mostly looks like one small honest step.",
  "You can't read the label from inside the jar. So we look together.",
  "What pulls you was never random.",
  "A life is built on Tuesdays.",
  "Home is a direction, not an address.",
];
const qNext = () => {
  try {
    const q = JSON.parse(localStorage.getItem("era-quotes") || "{}");
    let order = q.order, pos = q.pos ?? 0;
    if (!order || order.length !== QUOTES.length || pos >= order.length) {
      order = QUOTES.map((_, i) => i).sort(() => Math.random() - 0.5); pos = 0;
    }
    localStorage.setItem("era-quotes", JSON.stringify({ order, pos: pos + 1 }));
    return QUOTES[order[pos]];
  } catch { return QUOTES[Math.floor(Math.random() * QUOTES.length)]; }
};

function Breath({ onEnter }) {
  const quote = useMemo(qNext, []);
  return (
    <Shell dark>
      <div className="glimmer breathscreen">
        <div className="breath" aria-hidden="true"><span /></div>
        <p className="gline bquote">{quote}</p>
        <button className="btn gold" onClick={onEnter}>Enter</button>
        <div className="bfoot"><Wordmark light /></div>
      </div>
    </Shell>
  );
}


/* ---------------- the library of you ---------------- */
const EXPANSIONS = [
  { name: "How you attach", from: "Grounded in attachment theory", line: "The patterns you carry into closeness — at work, at home, and in every room between.", tier: "FREE", status: "In design" },
  { name: "The habit architecture", from: "Grounded in behavioural science", line: "What you repeat is what you become. Where your days are built, and where they quietly leak.", tier: "FREE", status: "In design" },
  { name: "Money and you", from: "Grounded in wealth psychology", line: "What money means to you, what it protects you from, and what that protection costs.", tier: "MEMBERSHIP", status: "In design" },
  { name: "The builder's pattern", from: "Grounded in entrepreneurial disposition research", line: "Some people can't stop starting things. An honest measure of whether you're one of them.", tier: "MEMBERSHIP", status: "In design" },
  { name: "The Partner Series", from: "With thinkers you already trust", line: "Their life's philosophy, distilled with them into a mirror you can take. Conversations underway — names when the ink is dry.", tier: "PARTNER", status: "In conversation" },
];
function Constellation() {
  const g = "#D4A547", f = "rgba(212,165,71,0.35)", d = "var(--ink12)";
  return (<svg viewBox="0 0 300 130" className="constel" aria-hidden="true">
    <line x1="150" y1="65" x2="70" y2="30" stroke={f} strokeWidth="1"/><line x1="150" y1="65" x2="235" y2="38" stroke={f} strokeWidth="1"/>
    <line x1="150" y1="65" x2="95" y2="105" stroke={f} strokeWidth="1"/><line x1="150" y1="65" x2="220" y2="100" stroke={f} strokeWidth="1"/>
    <line x1="235" y1="38" x2="272" y2="70" stroke={d} strokeWidth="1" strokeDasharray="3 4"/><line x1="70" y1="30" x2="34" y2="62" stroke={d} strokeWidth="1" strokeDasharray="3 4"/>
    <circle cx="150" cy="65" r="9" fill={g}/>
    <circle cx="70" cy="30" r="5" fill={g} opacity=".8"/><circle cx="235" cy="38" r="5" fill={g} opacity=".8"/>
    <circle cx="95" cy="105" r="4" fill={g} opacity=".6"/><circle cx="220" cy="100" r="4" fill={g} opacity=".6"/>
    <circle cx="272" cy="70" r="3" fill="none" stroke={d} strokeWidth="1.2"/><circle cx="34" cy="62" r="3" fill="none" stroke={d} strokeWidth="1.2"/>
  </svg>);
}
function LibraryScreen({ onBack }) {
  const mailto = (n) => "mailto:ops@ishkiy.com?subject=" + encodeURIComponent("Library vote — " + n) + "&body=" + encodeURIComponent("Build \u201C" + n + "\u201D first. I'd take it.");
  return (
    <div className="reportpage">
      <div className="rhead noprint">
        <button className="ghost inkghost" onClick={onBack}>← Home</button>
        <Wordmark />
        <span />
      </div>
      <article className="report">
        <p className="kicker gold">The Library of You</p>
        <h1 className="display ink">One profile. Deepening for life.</h1>
        <Constellation />
        <p className="libnarr">Your report was the first light — the centre of the constellation. The Library is where the rest arrive. Every assessment here is a lens ground from something proven: the frameworks psychologists actually use, the ideas from the books that changed how people work, and — in time — the thinkers you already trust, distilling their philosophy with us into something you can take. Each one you complete adds a star to the same map: your Companion answers with more of you in the room, your report grows new chapters, and what you choose to share with a human across the table arrives richer. Some lenses will be free. Some will come with membership. All of them make the mirror truer.</p>
        <div className="libgrid">
          {EXPANSIONS.map((e) => (
            <div key={e.name} className="libtile">
              <div className="librow"><span className={"libtier t" + e.tier}>{e.tier}</span><span className="libstatus">{e.status}</span></div>
              <p className="libname">{e.name}</p>
              <p className="libfrom">{e.from}</p>
              <p className="libline">{e.line}</p>
              <a className="rtbtn" href={mailto(e.name)}>Build this one first</a>
            </div>
          ))}
        </div>
        <p className="hquote">The future is not artificial; it's authentically human.</p>
      </article>
    </div>
  );
}

/* ---------------- the cockpit ---------------- */
function HomeTile({ title, sub, locked, lockNote, onClick, art, badge }) {
  return (
    <button className={"htile" + (locked ? " locked" : "")} onClick={locked ? undefined : onClick} aria-disabled={locked}>
      {badge != null && <span className="htbadge">{badge}</span>}
      {art}
      <span className="httitle">{title}</span>
      <span className="htsub">{locked ? lockNote : sub}</span>
    </button>
  );
}

function Rotator({ items, every = 3800 }) {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((v) => (v + 1) % items.length), every); return () => clearInterval(t); }, [items.length, every]);
  return <div className="rotwrap" key={i}>{items[i]}</div>;
}

const FACE_GOLD = "#D4A547";
const FACES = [
  // the mentor — glasses
  (<svg key="f1" viewBox="0 0 60 40" className="hart"><circle cx="30" cy="14" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.8" opacity=".55"/><path d="M14 36 Q30 23 46 36" fill="none" stroke="currentColor" strokeWidth="1.8" opacity=".55"/><circle cx="27" cy="14" r="2.6" fill="none" stroke={FACE_GOLD} strokeWidth="1.4"/><circle cx="33.5" cy="14" r="2.6" fill="none" stroke={FACE_GOLD} strokeWidth="1.4"/><line x1="29.6" y1="14" x2="30.9" y2="14" stroke={FACE_GOLD} strokeWidth="1.4"/></svg>),
  // the counsellor — long hair
  (<svg key="f2" viewBox="0 0 60 40" className="hart"><circle cx="30" cy="14" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.8" opacity=".55"/><path d="M22.5 12 Q22 24 19 28 M37.5 12 Q38 24 41 28" fill="none" stroke={FACE_GOLD} strokeWidth="1.6" strokeLinecap="round"/><path d="M14 36 Q30 23 46 36" fill="none" stroke="currentColor" strokeWidth="1.8" opacity=".55"/></svg>),
  // the coach — cap of hair, forward tilt
  (<svg key="f3" viewBox="0 0 60 40" className="hart"><circle cx="30" cy="14" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.8" opacity=".55"/><path d="M23 11 Q30 5 37 11" fill="none" stroke={FACE_GOLD} strokeWidth="2" strokeLinecap="round"/><path d="M14 36 Q30 23 46 36" fill="none" stroke="currentColor" strokeWidth="1.8" opacity=".55"/><circle cx="30" cy="14" r="1.4" fill={FACE_GOLD}/></svg>),
  // the elder — beard
  (<svg key="f4" viewBox="0 0 60 40" className="hart"><circle cx="30" cy="13.5" r="7" fill="none" stroke="currentColor" strokeWidth="1.8" opacity=".55"/><path d="M25 18 Q30 24 35 18" fill="none" stroke={FACE_GOLD} strokeWidth="1.8" strokeLinecap="round"/><path d="M14 36 Q30 24 46 36" fill="none" stroke="currentColor" strokeWidth="1.8" opacity=".55"/></svg>),
];
const GLYPHS = [
  // the open book
  (<svg key="g1" viewBox="0 0 60 40" className="hart"><path d="M30 10 Q22 6 14 9 L14 30 Q22 27 30 31 Q38 27 46 30 L46 9 Q38 6 30 10 Z" fill="none" stroke="currentColor" strokeWidth="1.8" opacity=".55"/><line x1="30" y1="10" x2="30" y2="31" stroke={FACE_GOLD} strokeWidth="1.6"/></svg>),
  // the idea
  (<svg key="g2" viewBox="0 0 60 40" className="hart"><circle cx="30" cy="16" r="8" fill="none" stroke={FACE_GOLD} strokeWidth="1.8"/><line x1="26.5" y1="27" x2="33.5" y2="27" stroke="currentColor" strokeWidth="1.8" opacity=".55"/><line x1="27.5" y1="31" x2="32.5" y2="31" stroke="currentColor" strokeWidth="1.8" opacity=".55"/><line x1="30" y1="3" x2="30" y2="6" stroke={FACE_GOLD} strokeWidth="1.5"/><line x1="18" y1="16" x2="21" y2="16" stroke={FACE_GOLD} strokeWidth="1.5"/><line x1="39" y1="16" x2="42" y2="16" stroke={FACE_GOLD} strokeWidth="1.5"/></svg>),
  // the thinker — head with a star inside
  (<svg key="g3" viewBox="0 0 60 40" className="hart"><path d="M24 34 L24 29 Q16 25 18 16 Q20 7 30 7 Q40 7 42 16 L44 21 L41 22 L41 27 Q41 30 36 30 L36 34" fill="none" stroke="currentColor" strokeWidth="1.8" opacity=".55" strokeLinejoin="round"/><circle cx="29" cy="17" r="2.6" fill={FACE_GOLD}/></svg>),
];
function RotatingFaces() { return <Rotator items={FACES} every={3600} />; }
function RotatingGlyphs() { return <Rotator items={GLYPHS} every={4200} />; }
function Home({ state, go, startAssessment, onTheme }) {
  const name = (state.answers["AR-1"] || "").trim();
  let compLeft = null;
  try { const cc = migrate(loadC()); compLeft = Math.max(0, Q_CAP - (cc.count || 0)); } catch {}
  const hasReport = !!state.report;
  const midway = !hasReport && Object.keys(state.answers).length > 0;
  const gold = "#D4A547", faint = "rgba(15,30,61,0.18)";
  return (
    <Shell>
      <div className="home">
        <div className="hrow"><Wordmark /><button className="thememini" onClick={onTheme}>{state.dark ? "Light mode" : "Dark mode"}</button></div>
        <h1 className="display ink hgreet">{name ? `Welcome back, ${name}.` : "Welcome."}</h1>
        <p className="lede inkdim hsub">{hasReport ? "Your profile is waiting. So is the team." : midway ? "You're partway through. Pick up where you left off — your answers kept your place." : "Everything here begins with one honest hour. Start when you're ready."}</p>
        <div className="hgrid">
          <HomeTile
            title={hasReport ? "Your profile" : midway ? "Continue the assessment" : "Take the assessment"}
            sub={hasReport ? "Your report, tiles, share card and retakes." : "Nine parts, about fifty minutes, at your pace."}
            onClick={hasReport ? () => go("report") : startAssessment}
            art={<svg viewBox="0 0 60 40" className="hart"><circle cx="30" cy="20" r="12" fill="none" stroke={gold} strokeWidth="2"/><circle cx="30" cy="20" r="4" fill={gold}/></svg>}
          />
          <HomeTile
            title="The Companion"
            sub="Four voices that have read you. Ten questions a day."
            locked={!hasReport} lockNote="Opens after your report is written."
            onClick={() => go("companion")}
            badge={hasReport && compLeft != null ? `${compLeft} left today` : null}
            art={<svg viewBox="0 0 60 40" className="hart"><circle cx="22" cy="20" r="9" fill="none" stroke={gold} strokeWidth="2"/><circle cx="38" cy="20" r="9" fill="none" stroke={faint} strokeWidth="2"/></svg>}
          />
          <HomeTile
            title="A human, when ready"
            sub="Counsellors, mentors and coaches — sharing on your terms."
            locked={!hasReport} lockNote="Opens after your report is written."
            onClick={() => go("humans")}
            art={<RotatingFaces />}
          />
          <HomeTile
            title="The Library of You"
            sub="New lenses for the same profile — frameworks, ideas, and thinkers you trust."
            onClick={() => go("library")}
            art={<RotatingGlyphs />}
          />
          <HomeTile
            title="The Constellation"
            sub="Your other iSHKiY apps — connected here, on your terms."
            onClick={() => go("constellation")}
            badge={(() => { if (!state.constellationInvite) return "Invite only"; const c = state.constellation || {}; const n = Object.values(c).filter((x) => x && x.linked).length; return n ? `${n} connected` : null; })()}
            art={<svg viewBox="0 0 60 40" className="hart"><circle cx="30" cy="20" r="4" fill={gold}/><circle cx="13" cy="12" r="2.5" fill="none" stroke={gold} strokeWidth="1.6"/><circle cx="47" cy="10" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" opacity=".4"/><circle cx="46" cy="31" r="2.5" fill="none" stroke={gold} strokeWidth="1.6"/><circle cx="12" cy="30" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" opacity=".4"/><line x1="26.5" y1="18" x2="15.3" y2="13" stroke={gold} strokeWidth="1.2" opacity=".6"/><line x1="33.5" y1="22" x2="43.8" y2="30" stroke={gold} strokeWidth="1.2" opacity=".6"/></svg>}
          />
        </div>
        <p className="hquote">The future is not artificial; it's authentically human.</p>
        <p className="privline">Everything here lives on your device. No one — iSHKiY included — sees your answers or conversations without your explicit say-so.</p>
      </div>
    </Shell>
  );
}

/* ---------------- helper avatars ---------------- */
function Avatar({ kind, size = 34 }) {
  const g = "#D4A547", b = "#F5F1E8", i = "#0F1E3D";
  const inner = {
    companion: <><circle cx="17" cy="17" r="11" fill="none" stroke={g} strokeWidth="1.8"/><circle cx="17" cy="17" r="3.6" fill={g}/></>,
    coach: <><circle cx="17" cy="17" r="11" fill="none" stroke={g} strokeWidth="1.8"/><path d="M11.5 20 L17 12.5 L22.5 20" fill="none" stroke={g} strokeWidth="2" strokeLinecap="round"/></>,
    mentor: <><path d="M7 22 A10 10 0 0 1 27 22" fill="none" stroke={g} strokeWidth="1.8"/><path d="M11 22 A6 6 0 0 1 23 22" fill="none" stroke={g} strokeWidth="1.8" opacity=".55"/><circle cx="17" cy="21" r="2.6" fill={g}/></>,
    sounding: <><circle cx="17" cy="17" r="4" fill={g}/><circle cx="17" cy="17" r="8" fill="none" stroke={g} strokeWidth="1.4" opacity=".55"/><circle cx="17" cy="17" r="12" fill="none" stroke={g} strokeWidth="1.2" opacity=".3"/></>,
  }[kind];
  return <svg viewBox="0 0 34 34" width={size} height={size} className="avatar"><circle cx="17" cy="17" r="16" fill="rgba(212,165,71,0.10)" className="halo"/>{inner}</svg>;
}

/* ---------------- report companion ---------------- */
const Q_CAP = 10;
const CKEY = "era-companion-v1";
const today = () => new Date().toISOString().slice(0, 10);
const loadC = () => { try { const c = JSON.parse(localStorage.getItem(CKEY)) || {}; return c.day === today() ? c : { ...c, day: today(), count: 0 }; } catch { return { day: today(), count: 0 }; } };
const saveC = (c) => { try { localStorage.setItem(CKEY, JSON.stringify(c)); } catch {} };

const COMPANION_SYSTEM = `You are the Report Companion inside iSHKiY's Essence Recovery Assessment. You have read this person's full profile and you speak as someone who knows them properly — plain, warm, honest. UK English. Short sentences. Under 170 words per reply. Same banned words and constructions as the report voice: no leverage/optimise/journey/unlock/delve/navigate, no "it's worth noting", no "not just X but Y", no bullet lists, no exclamation marks.

Ground every answer in THEIR profile — quote their scores and their own words when relevant. If a question can't be answered from the profile plus ordinary life-and-work wisdom, say so plainly rather than inventing.

Hard boundaries: you are not a clinician and the assessment is not clinically validated — never diagnose, never advise on medication or medical or legal matters; suggest a proper professional instead. If they express serious distress or thoughts of harming themselves, respond with warmth and care, don't lecture, and gently encourage them to talk to someone they trust or a professional soon. You may be honest that some questions deserve a human. Whenever you state a boundary or disclaimer — that you are not a clinician, that this is not therapy or medical or legal advice, or that a professional is the right next step — wrap that exact sentence in [! and !] markers so it can be shown clearly.

You exist to help them think about decisions, work, and direction using what the assessment revealed. End answers plainly, not with offers of further help.`;

const MODES = {
  companion: { label: "Companion", desc: "Reads you back. Good for decisions and direction.", add: "" },
  coach: { label: "Coach", desc: "Forward motion. Expects you to act.", add: "\n\nMODE — COACH: You are in coach mode. Focus on the next concrete step, not the whole staircase. Hold them to what their profile says they're capable of — kindly, but without letting them off. Each reply should surface one specific action they could take this week, drawn from their scores and words. Ask at most one sharp question per reply. Do not comfort when a nudge serves better." },
  mentor: { label: "Mentor", desc: "The longer view. Been there, seen it.", add: "\n\nMODE — MENTOR: You are in mentor mode. Speak from experience and pattern: what tends to happen to people shaped like this, over years not weeks. Offer perspective before advice. Occasionally tell a short, plausible general truth about working life ('people with your pattern often…'). Never invent personal anecdotes or claim a biography. The gift of this mode is patience and the long view." },
  sounding: { label: "Sounding board", desc: "Untangling, out loud. Not counselling.", add: "\n\nMODE — SOUNDING BOARD: You are in sounding-board mode. Your job is to help them hear themselves: reflect back what they've said in cleaner words, name the feeling underneath if it's visible, ask gentle questions that untangle rather than steer. Give less advice than in any other mode. Be explicit when relevant that this is thinking-out-loud, not counselling or therapy — and if what they're carrying runs deeper than untangling, warmly suggest the kind of human support that fits, including the practitioner circle when it's live." },
};

const COMPANION_DAYS = 7;
const migrate = (c) => {
  if (c.streams) return c;
  const streams = { companion: [], coach: [], mentor: [], sounding: [] };
  const home = streams[c.mode] ? c.mode : "companion";
  (c.msgs || []).forEach((m) => { const k = (m.m && streams[m.m]) ? m.m : home; streams[k].push(m); });
  return { day: c.day, count: c.count || 0, mode: c.mode || "companion", streams, pulses: c.pulses || {} };
};

function Pulse({ mode, pulse, busy, onRefresh, canRefresh }) {
  return (
    <div className="pulse">
      <div className="pulsehead">
        <span className="mlabel"><Avatar kind={mode} size={15} /> Pulse — {MODES[mode].label}</span>
        <button className="pulsebtn" disabled={busy || !canRefresh} onClick={onRefresh}>{busy ? "Listening…" : "Refresh"}</button>
      </div>
      {pulse
        ? <div className="pulsebody" dangerouslySetInnerHTML={{ __html: md(pulse) }} />
        : <p className="pulsebody dimtext">{canRefresh ? "A few exchanges in, the essence of this conversation gathers here — what you're circling, what you've decided, what's worth keeping." : "Start the conversation. The essence gathers here as you go."}</p>}
    </div>
  );
}

function Companion({ scores, answers, reportText, start }) {
  const begun = start || Date.now();
  const dayNum = Math.min(COMPANION_DAYS, Math.floor((Date.now() - begun) / DAY) + 1);
  const ended = Date.now() - begun > COMPANION_DAYS * DAY;
  const [c, setC] = useState(() => migrate(loadC()));
  const [mode, setMode] = useState(() => c.mode || "companion");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyPulse, setBusyPulse] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const endRef = useRef(null);
  const stream = c.streams[mode] || [];
  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [stream.length, busy]);
  useEffect(() => { setShowOld(false); }, [mode]);
  const left = Math.max(0, Q_CAP - c.count);
  const pick = (m) => { setMode(m); const next = { ...c, mode: m }; setC(next); saveC(next); };

  if (ended) return (
    <section className="companion noprint">
      <p className="kicker gold">Your Report Companion</p>
      <h2 className="ctitle">Your founding week has ended. Your report hasn't.</h2>
      <p className="cexplain">The report on this page is yours for good. The Companion — the four voices that read you properly — returns with iSHKiY membership, which founding members will hear about first. If a week of it earned a place in your thinking, tell us and we'll keep your seat.</p>
      <a className="rtbtn" href={"mailto:ops@ishkiy.com?subject=" + encodeURIComponent("Keep my Companion seat") + "&body=" + encodeURIComponent("My founding Companion week is over and I'd want it back when membership launches.")}>Keep my seat</a>
    </section>
  );

  /* commit: every state change goes through the freshest state, never a stale
     snapshot — this is what stops background writes erasing new messages. */
  const commit = (fn) => setC((prev) => { const next = fn(prev); saveC(next); return next; });

  /* fetchAI: one automatic retry and a hard timeout, so a single slow response
     or mobile blip doesn't surface as a dropped line. */
  const fetchAI = async (body) => {
    for (let attempt = 0; attempt < 2; attempt++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 30000);
      try {
        const res = await fetch("/api/claude", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body), signal: ctrl.signal,
        });
        clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          const text = (data.content || []).filter((x) => x.type === "text").map((x) => x.text).join("\n").trim();
          if (text) return text;
        }
      } catch {} finally { clearTimeout(timer); }
      if (attempt === 0) await new Promise((r) => setTimeout(r, 1500));
    }
    return null;
  };

  const refreshPulse = async (streams) => {
    const st = (streams || c.streams)[mode] || [];
    if (st.length < 2 || busyPulse) return;
    setBusyPulse(true);
    const transcript = st.slice(-12).map((m) => (m.role === "user" ? "You said: " : "Voice: ") + m.content).join("\n");
    const text = await fetchAI({
      system: "You distil a conversation for iSHKiY, speaking directly to the person it belongs to. Address them as \"you\" — never \"they\", \"them\" or \"the user\". UK English, plain, warm, no corporate words, no bullets, no headings. Return at most three short lines, each on its own line: what you are circling; any goal or decision you have named; one line worth remembering. If a line has nothing real to hold, leave it out. Nothing else.",
      messages: [{ role: "user", content: transcript }], max_tokens: 220,
    });
    if (text) commit((prev) => ({ ...prev, pulses: { ...(prev.pulses || {}), [mode]: text } }));
    setBusyPulse(false);
  };

  const ask = async () => {
    const q = input.trim(); if (!q || busy || left === 0) return;
    setInput(""); setBusy(true);
    commit((prev) => ({ ...prev, streams: { ...prev.streams, [mode]: [...(prev.streams[mode] || []), { role: "user", content: q }].slice(-40) } }));
    const st = [...stream, { role: "user", content: q }].slice(-40);
    const ctx = `PROFILE: ${JSON.stringify({ scores, theirWords: { role: answers["AR-2"], hardestPart: answers["AR-3"], goodDay: answers["AR-4"], neverTold: answers["MI-1"], atMyBest: answers["MI-3"] } })}\n\nTHEIR REPORT (for reference): ${String(reportText || "").slice(0, 5000)}`;
    const text = await fetchAI({ system: COMPANION_SYSTEM + MODES[mode].add + "\n\n" + ctx, messages: st.slice(-8).map(({ role, content }) => ({ role, content })), max_tokens: 500 });
    if (text) {
      let after = null;
      commit((prev) => {
        const st2 = [...(prev.streams[mode] || []), { role: "assistant", m: mode, content: text }].slice(-40);
        after = st2;
        return { ...prev, day: today(), count: prev.count + 1, mode, streams: { ...prev.streams, [mode]: st2 } };
      });
      if (after && after.length % 6 === 0) refreshPulse({ ...c.streams, [mode]: after });
    } else {
      commit((prev) => ({ ...prev, streams: { ...prev.streams, [mode]: [...(prev.streams[mode] || []), { role: "assistant", m: mode, err: true, content: "The line dropped before that reached me — a connection hiccup, not you. That question didn't use one of your ten. Give it a moment and ask again." }].slice(-40) } }));
    }
    setBusy(false);
  };

  const visible = showOld ? stream : stream.slice(-4);
  const hidden = stream.length - visible.length;

  return (
    <section className="companion noprint">
      <p className="kicker gold">Your Report Companion</p>
      <h2 className="ctitle">This report isn't the product. It's the beginning of one.</h2>
      <p className="cexplain">Four voices, each with its own thread — switch below and the conversation switches with you. All four share the same {Q_CAP} questions a day. These conversations live on this device and nowhere else — no one reads them, iSHKiY included, and nothing is shared unless you explicitly choose to share it. Your founding purchase includes seven days; this is day {dayNum}.</p>
      <div className="moderow">
        {Object.entries(MODES).map(([k, m]) => (
          <button key={k} className={"modebtn" + (mode === k ? " sel" : "")} onClick={() => pick(k)} title={m.desc}><Avatar kind={k} size={26} />{m.label}{(c.streams[k] || []).length ? <span className="mcount">{Math.ceil((c.streams[k] || []).length / 2)}</span> : null}</button>
        ))}
      </div>
      <p className="modedesc">{MODES[mode].desc}</p>
      <Pulse mode={mode} pulse={(c.pulses || {})[mode]} busy={busyPulse} onRefresh={() => refreshPulse()} canRefresh={stream.length >= 2} />
      <div className="chat">
        {hidden > 0 && !showOld && <button className="showold" onClick={() => setShowOld(true)}>Show the {hidden} earlier {hidden === 1 ? "message" : "messages"}</button>}
        {showOld && stream.length > 4 && <button className="showold" onClick={() => setShowOld(false)}>Fold the earlier messages away</button>}
        {visible.map((m, i) => (<div key={i + (showOld ? 0 : hidden)} className={"msg " + m.role}>
          {m.role === "assistant" && !m.err && <span className="mlabel"><Avatar kind={m.m || "companion"} size={15} /> {MODES[m.m || "companion"].label}</span>}
          {m.role === "assistant" && m.err && <span className="mlabel dimmed">connection</span>}
          <div className={"bubble" + (m.err ? " errb" : "")} dangerouslySetInnerHTML={{ __html: md(m.content) }} />
        </div>))}
        {busy && <div className="msg assistant"><div className="bubble thinking">Reading you back…</div></div>}
        <div ref={endRef} />
      </div>
      {left > 0 ? (
        <div className="askrow">
          <textarea className="tarea askta" rows={3} value={input} placeholder="Ask about a decision, a doubt, a direction…" onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); } }} />
          <button className="btn ink" disabled={busy || !input.trim()} onClick={ask}>Ask</button>
        </div>
      ) : (
        <p className="tnote">That's your {Q_CAP} for today. A night's thinking between conversations does more than an eleventh question would. It resets tomorrow.</p>
      )}
      <p className="tnote">{left} of {Q_CAP} questions left today, shared across all four voices.</p>
    </section>
  );
}

/* ---------------- practitioner branch (honest demo) ---------------- */
const TIERS = [
  { id: "basic", name: "Basic", shares: ["Your strongest pull (one line)", "Your leading value (one line)", "Your thinking lean (one word)"] },
  { id: "detailed", name: "Detailed", shares: ["Everything in Basic", "All dimension scores (the numbers)", "The Tensions section of your report"] },
  { id: "full", name: "Full", shares: ["Everything in Detailed", "Your complete written report", "Your own written answers, word for word"] },
];
const PRACTITIONERS = [
  { name: "Maya Okafor", role: "Career counsellor", line: "Twenty years helping people leave roles that fit their CV but not their character.", fit: "when the problem is the path itself" },
  { name: "David Hartley", role: "Mentor", line: "Built and sold two firms. Now sits with founders and lifers who suspect there's more.", fit: "when you know the direction but not the next move" },
  { name: "Priya Sharma", role: "Therapist, integrative", line: "Works where work and worth get tangled. Warm, unhurried, direct when it matters.", fit: "when the pattern is older than the job" },
  { name: "James Whitcombe", role: "Executive coach", line: "Former CFO who coaches the humans inside senior roles, not the roles.", fit: "when the title is fine and the Tuesday isn't" },
];

function Practitioners({ scores }) {
  const [tier, setTier] = useState("basic");
  const chosen = TIERS.find((t) => t.id === tier);
  const mailto = (p) => `mailto:ops@ishkiy.com?subject=${encodeURIComponent(`Practitioner interest — ${p.role}`)}&body=${encodeURIComponent(`I'd like to be matched with a ${p.role.toLowerCase()} when iSHKiY practitioners launch.\n\nSharing preference: ${chosen.name}\n\nNothing is shared yet — this registers interest only, and I'll confirm consent before anything moves.`)}`;
  return (
    <section className="pracs noprint">
      <p className="kicker gold">When you're ready for a human</p>
      <h2 className="ctitle">Some questions deserve a person across the table.</h2>
      <p className="cexplain">We're building a vetted circle of counsellors, mentors, coaches and therapists who can read your profile — with your say-so, at the depth you choose — before you ever meet. The circle isn't live yet. The profiles below show how it will work, and registering interest shapes who we bring in first.</p>
      <div className="tierbox">
        <p className="tlabel">What would you be willing to share?</p>
        <div className="tierrow">{TIERS.map((t) => (<button key={t.id} className={"tierbtn" + (tier === t.id ? " sel" : "")} onClick={() => setTier(t.id)}>{t.name}</button>))}</div>
        <ul className="tierlist">{chosen.shares.map((s) => (<li key={s}>{s}</li>))}</ul>
        <p className="tnote">Nothing leaves this device today. This sets your preference for when the circle is real — and you'd confirm again before anything is shared.</p>
      </div>
      <div className="praclist">
        {PRACTITIONERS.map((p) => (
          <div key={p.name} className="prac">
            <span className="demobadge">Illustrative profile — not yet a real practitioner</span>
            <p className="pname">{p.name} <span className="prole">· {p.role}</span></p>
            <p className="pline">{p.line}</p>
            <p className="pfit">Works well {p.fit}.</p>
            <a className="rtbtn" href={mailto(p)}>Register interest</a>
          </div>
        ))}
      </div>
    </section>
  );
}

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
                  ? <button className="rtbtn" onClick={() => { if (confirm(`Retake “${p.title}”? Your previous answers for this part are replaced, and your report is rewritten.`)) onRetake(idx); }}>Retake</button>
                  : <span className="tnum">in {hrs}h</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


function CompanionScreen({ state, scores, onBack }) {
  if (!state.report || !scores) return null;
  return (
    <div className="reportpage">
      <div className="rhead noprint">
        <button className="ghost inkghost" onClick={onBack}>← Home</button>
        <Wordmark />
        <span />
      </div>
      <article className="report">
        <p className="kicker gold">The Companion</p>
        <h1 className="display ink">Four voices that read you.</h1>
        <p className="lede inkdim">Coach, mentor, companion, sounding board — ten questions a day, answered by voices that know your report line by line.</p>
        <div className="teamrow">
          <Avatar kind="companion" /><Avatar kind="coach" /><Avatar kind="mentor" /><Avatar kind="sounding" />
        </div>
        <p className="teamline">You don't have to navigate alone. Four voices, no judgement, and they've read every word you gave.</p>
        {state.report.preview
          ? <p className="previewnote">The Companion opens once a real report has been generated.</p>
          : <Companion scores={scores} answers={state.answers || {}} reportText={state.report.text} start={state.companionStart} />}
        <p className="hquote">The future is not artificial; it's authentically human.</p>
      </article>
    </div>
  );
}
/* ---------------- the constellation ----------------
   ERA as command centre for the iSHKiY sibling apps.
   Connections and consents are recorded on-device now; live data flow
   arrives with the iSHKiY bridge (Living Profile). Until then, data
   moves only when the user carries a file across themselves.
   EDIT THE URLS BELOW when live addresses are confirmed. */
const SIBLINGS = [
  {
    id: "haven", name: "Haven", tag: "Money, without the dread.",
    line: "Psychology-first personal finance. It reads how money feels before it reads the numbers.",
    url: "https://ishkiy-haven.netlify.app", accent: "#4E7A5A",
    offers: [
      { id: "mindset", label: "Money mindset", desc: "Your archetype and how it shifts." },
      { id: "goals", label: "Goals & pots", desc: "What you're building towards — names and progress, not balances." },
      { id: "rhythm", label: "Engagement rhythm", desc: "When you lean in and when you look away." },
    ],
  },
  {
    id: "kite", name: "Kite", tag: "One thing. Not the list.",
    line: "A companion for ADHD days — task untangling, gentle focus, wins that count.",
    url: "https://shiny-zabaione-08b761.netlify.app", accent: "#4A7BA6",
    offers: [
      { id: "wins", label: "Wins & strengths", desc: "The patterns in what you finish." },
      { id: "energy", label: "Energy check-ins", desc: "How the wind's been blowing, over time." },
    ],
  },
  {
    id: "current", name: "Current", tag: "Flow you build, not wait for.",
    line: "One task, one tap. A quiet engine for getting into motion.",
    url: "https://current-ishkiy.netlify.app", accent: "#6B7FA8",
    offers: [
      { id: "flow", label: "Flow sessions", desc: "When you find your current, and for how long." },
      { id: "goals", label: "Goals", desc: "What you're aiming at." },
    ],
  },
  {
    id: "forge", name: "Forge", tag: "Train the body. Steady the mind.",
    line: "Training, recovery and daily check-ins in one place. Android now; every screen soon.",
    url: "https://ishkiy-forge.netlify.app", accent: "#C77B3A", native: true,
    offers: [
      { id: "recovery", label: "Recovery trend", desc: "How rested you actually are, week on week." },
      { id: "consistency", label: "Training consistency", desc: "The showing-up, not the splits." },
      { id: "mood", label: "Mind check-ins", desc: "The daily word you gave your state." },
    ],
  },
];

function ConstellationScreen({ state, update, onBack }) {
  const links = state.constellation || {};
  const [open, setOpen] = useState(null); // sibling id being connected/managed
  const [code, setCode] = useState(""); const [err, setErr] = useState(false); const [busy, setBusy] = useState(false);
  const setLink = (id, patch) => update({ constellation: { ...links, [id]: { ...(links[id] || {}), ...patch } } });
  const app = SIBLINGS.find((s) => s.id === open);
  const tryInvite = async () => {
    setBusy(true); const h = await sha256(code); setBusy(false);
    if (INVITE_HASHES.includes(h)) { update({ constellationInvite: true }); setErr(false); } else setErr(true);
  };
  if (!state.constellationInvite) return (
    <div className="reportpage">
      <div className="rhead noprint">
        <button className="ghost inkghost" onClick={onBack}>← Home</button>
        <Wordmark />
        <span />
      </div>
      <article className="report" style={{ maxWidth: 480 }}>
        <p className="kicker gold">The Constellation</p>
        <h1 className="display ink">Invitation only, for now.</h1>
        <p className="lede inkdim">The Constellation connects your other iSHKiY apps to ERA. While it's in beta, it opens by invitation — a small circle, on purpose, so we get the trust architecture right before the doors widen.</p>
        <input className="codeinput" value={code} onChange={(e) => { setCode(e.target.value); setErr(false); }} placeholder="ORBIT-XXXX" autoCapitalize="characters" onKeyDown={(e) => e.key === "Enter" && tryInvite()} />
        {err && <p className="codeerr">That code didn't open the door. Check it and try once more.</p>}
        <button className="btn gold" disabled={busy || !code.trim()} onClick={tryInvite}>{busy ? "Checking…" : "Open the Constellation"}</button>
        <p className="cfoot" style={{ marginTop: 20 }}>No code? Nothing else in ERA is held back — your assessment, report and Companion are all yours already. Invites come from Tarang directly.</p>
      </article>
    </div>
  );
  return (
    <div className="reportpage">
      <div className="rhead noprint">
        <button className="ghost inkghost" onClick={onBack}>← Home</button>
        <Wordmark />
        <span />
      </div>
      <article className="report">
        <p className="kicker gold">The Constellation</p>
        <h1 className="display ink">One family. Your say-so.</h1>
        <p className="lede inkdim">Each iSHKiY app does one job well, and each keeps its data on your device. Connect them here and ERA becomes the place where the whole of you comes into view — but nothing joins unless you say it may, and you can unsay it any time.</p>
        <div className="constgrid">
          {SIBLINGS.map((s) => {
            const l = links[s.id];
            const linked = l && l.linked;
            return (
              <button key={s.id} className={"capp" + (linked ? "" : " dim")} onClick={() => setOpen(s.id)} style={linked ? { borderColor: s.accent } : undefined}>
                <span className="cdot" style={{ background: linked ? s.accent : "transparent", borderColor: linked ? s.accent : "currentColor" }} />
                <span className="cname">{s.name}</span>
                <span className="ctag">{s.tag}</span>
                <span className="cstate">{linked
                  ? `Sharing: ${(l.shares || []).length ? s.offers.filter((o) => l.shares.includes(o.id)).map((o) => o.label).join(", ") : "nothing yet"}${l.enhance ? " · teaching your Companion" : ""}`
                  : "Not yet connected — tap to begin."}</span>
              </button>
            );
          })}
        </div>
        <p className="cbridge">Honesty first: your choices are recorded on this device today, and live sharing switches on when the iSHKiY bridge ships. Until then, the only way anything crosses is if you carry it — each app will offer a small export file you can bring here yourself.</p>
        <p className="integrity">Every iSHKiY app keeps your data on your device. Nothing moves between them without your explicit permission, and iSHKiY never sees any of it. Connection is always reversible. The data is yours — that isn't a feature, it's the deal.</p>
      </article>
      {app && <ConnectSheet app={app} link={links[app.id]} onClose={() => setOpen(null)} onSave={(patch) => { setLink(app.id, patch); setOpen(null); }} />}
    </div>
  );
}

function ConnectSheet({ app, link, onClose, onSave }) {
  const [shares, setShares] = useState((link && link.shares) || []);
  const [enhance, setEnhance] = useState(!!(link && link.enhance));
  const linked = link && link.linked;
  const toggle = (id) => setShares((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
  const importRef = useRef(null);
  const doImport = (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    f.text().then((t) => { try { const j = JSON.parse(t); onSave({ linked: true, shares, enhance, imported: { at: Date.now(), data: j } }); } catch { alert("That file didn't read as an iSHKiY export. Try again from the app's share screen."); } });
  };
  return (
    <div className="csheetwrap" onClick={onClose}>
      <div className="csheet" onClick={(e) => e.stopPropagation()}>
        <p className="kicker" style={{ color: app.accent }}>{app.name}</p>
        <p className="cline">{app.line}</p>
        {app.url
          ? <button className="btn ink cfull" onClick={() => window.open(app.url, "_blank")}>{"Open " + app.name + (app.native ? "" : " — installs if it isn't on this device")}</button>
          : <button className="btn ink cfull" disabled>Link coming — {app.name} isn't live at a public address yet</button>}
        <p className="csheethead">What may flow into ERA?</p>
        <p className="csub">Nothing is ticked for you. Choose only what you want ERA to know.</p>
        {app.offers.map((o) => (
          <label key={o.id} className="crow">
            <input type="checkbox" checked={shares.includes(o.id)} onChange={() => toggle(o.id)} />
            <span><b>{o.label}</b><em>{o.desc}</em></span>
          </label>
        ))}
        <label className="crow cenh">
          <input type="checkbox" checked={enhance} onChange={() => setEnhance((v) => !v)} />
          <span><b>May it also teach your Companion?</b><em>A separate yes. If ticked, what flows in can deepen your Companion's sense of you and your central profile here. If not, it stays as numbers on a screen.</em></span>
        </label>
        <button className="cimport" onClick={() => importRef.current && importRef.current.click()}>Bring a file across from {app.name} →</button>
        <input ref={importRef} type="file" accept=".json,application/json" style={{ display: "none" }} onChange={doImport} />
        <div className="cactions">
          {linked && <button className="ghost inkghost" onClick={() => onSave({ linked: false, shares: [], enhance: false, imported: null })}>Disconnect</button>}
          <button className="btn gold" onClick={() => onSave({ linked: true, shares, enhance, at: Date.now() })}>{linked ? "Save changes" : "Connect " + app.name}</button>
        </div>
        <p className="cfoot">You can change or withdraw any of this whenever you like. Withdrawing removes what was shared from ERA on this device.</p>
      </div>
    </div>
  );
}

function HumansScreen({ scores, onBack }) {
  return (
    <div className="reportpage">
      <div className="rhead noprint">
        <button className="ghost inkghost" onClick={onBack}>← Home</button>
        <Wordmark />
        <span />
      </div>
      <article className="report">
        <p className="kicker gold">A human, when ready</p>
        <h1 className="display ink">Real people, on your terms.</h1>
        <p className="lede inkdim">Counsellors, mentors and coaches — because human connection brings what AI never can. You choose who sees what, and when. Or no one, and that's fine too.</p>
        <Practitioners scores={scores} />
      </article>
    </div>
  );
}

function Report({ report, name, answers, scores, companionStart, completedAt, onBack, onLibrary, onRetake, onRestart }) {
  if (!report) return null;
  return (
    <div className="reportpage">
      <div className="rhead noprint">
        <button className="ghost inkghost" onClick={onBack}>← Home</button>
        <Wordmark />
        <div className="ractions">
          <button className="btn ink" onClick={() => window.print()}>Save as PDF</button>
          <button className="btn gold" onClick={() => downloadShareCard(scores, name)}>Share card</button>
        </div>
      </div>
      <article className="report">
        <div className="printonly phead"><Wordmark /><p className="kicker gold">Essence Recovery Assessment &amp; Companion</p></div>
        <p className="kicker gold noprint">Essence Recovery Assessment</p>
        <h1 className="display ink">{name ? `${name}, this is you.` : "This is you."}</h1>
        <p className="lede inkdim noprint">Your report, your dimension tiles, your share card — the centre everything else here orbits.</p>
        {report.preview && <p className="previewnote">Preview report — deploy with the API key to generate the real one.</p>}
        {scores && <Tiles scores={scores} />}
        <div className="rbody" dangerouslySetInnerHTML={{ __html: md(report.text) }} />
        <p className="integrity">Grounded in established psychological frameworks — CHC, Big Five, Goleman EI, RIASEC and Schwartz Values. A structured self-discovery tool, not a clinical or validated psychometric instrument. Your answers never left your device, and no one — iSHKiY included — can see them or your conversations without your explicit permission. This report was written for you alone, and it belongs to you.</p>
        <button className="libcta noprint" onClick={onLibrary}>
          <span className="libctak">The Library of You</span>
          <span className="libctat">Take more assessments — new lenses, one deepening profile →</span>
        </button>
        <p className="printonly printfoot">ishkiy-era.netlify.app · #NotBuiltForABox · <em>The box was never you.</em></p>
        <Retakes completedAt={completedAt} onRetake={onRetake} />
        <button className="ghost inkghost noprint" onClick={() => { if (confirm("Start over? This clears your answers and report from this device.")) onRestart(); }}>Start over</button>
      </article>
    </div>
  );
}

const rootEl = typeof document !== "undefined" && document.getElementById("root");
if (rootEl) createRoot(rootEl).render(<App />);
