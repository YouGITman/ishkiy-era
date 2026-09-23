// iSHKiY — ERA v1. Single-component app, Haven pattern.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { PARTS, L5, E5, RIASEC_PHRASES } from "./items.js";
import { MINIS, scoreMini, readMini } from "./mini.js";
import { createClient } from "@supabase/supabase-js";

/* ---------------- backend (Supabase, connect-only v1) ----------------
   Paste your project URL and anon public key below (Settings -> API).
   The anon key is designed to be public; row-level security does the guarding.
   Until these are pasted, account features show as "coming online". */
const SUPA_URL = "https://rstyfrjtyvtxktnynnnw.supabase.co";
const SUPA_ANON = "sb_publishable_p-4dmXxdBcrO8oT6nlVjpw_ofYnapaS";
let _supa = null;
const getSupa = () => {
  if (SUPA_URL.startsWith("PASTE")) return null;
  if (!_supa) _supa = createClient(SUPA_URL, SUPA_ANON);
  return _supa;
};

/* ---------------- anonymous, content-free event counts ----------------
   We count taps (e.g. "assessment_start"), never words. No answers, no
   conversations, no names ever leave the device. */
const sid = (() => { try { let x = localStorage.getItem("era-sid"); if (!x) { x = Math.random().toString(36).slice(2, 10); localStorage.setItem("era-sid", x); } return x; } catch { return "anon"; } })();
const track = (e, d) => { try { const sp = getSupa(); if (!sp) return; sp.from("era_events").insert({ e, d: d == null ? null : String(d).slice(0, 40), sid, v: "1.10" }).then(() => {}, () => {}); } catch {} };

/* ---------------- profile strength, levels & badges ----------------
   Strength is one number out of 100, and it is deliberately not reachable by
   the assessment alone: the nine parts carry 70 of it, the Library lenses the
   other 30. Finishing the assessment is a real summit (Full Portrait) with
   somewhere further to go, which is the point — the profile is meant to deepen
   for life, not be finished in an hour.
   Levels above Full Portrait are gated on all nine parts as well as the score,
   so a stack of lenses can never buy a name that claims a complete portrait. */
const STARTER_PARTS = ["values", "big5", "think1"];   // ~12 min: what you're for, how you work, a thinking taste
const CORE_ADDED = ["riasec", "ei1", "ei2"];          // rounds the picture
// everything else (arrival, think2, mirror) completes the full ERA
const PARTS_WEIGHT = 70, LENS_WEIGHT = 30;
const LEVELS = [
  { id: "starter", name: "First Light", need: 6, blurb: "You've met yourself. The first honest look — your values and how you work.", accuracy: "a clear sketch", next: "Keep going. Each part you finish sharpens the picture." },
  { id: "core", name: "In Focus", need: 38, blurb: "The picture sharpens. Thinking, feeling, and what pulls you now sit alongside the rest.", accuracy: "a rounded read", next: "Finish the remaining parts and the portrait is complete." },
  { id: "full", name: "Full Portrait", need: 70, allParts: true, blurb: "Every part complete. The deepest, truest mirror the assessment alone can hold up.", accuracy: "the fullest picture", next: "The Library is where it goes further. Each lens adds a colour the assessment can't reach." },
  { id: "colour", name: "In Colour", need: 85, allParts: true, blurb: "The portrait has depth now. The lenses you've taken shade in what the nine parts could only outline.", accuracy: "a portrait with shading", next: "One or two more lenses and the picture is as full as iSHKiY can draw it today." },
  { id: "lifesize", name: "Life Size", need: 100, allParts: true, blurb: "Everything iSHKiY can ask, you've answered. Your Companion knows you as well as it is able to, and your report has every chapter open to it.", accuracy: "the whole of you, so far", next: "New lenses arrive in the Library. Your profile grows when they do." },
];
const partsDone = (completedAt) => Object.keys(completedAt || {}).length;
const LENS_IDS = Object.keys(MINIS);
/* One place that answers "how complete is this person's profile". */
const profileStrength = (state) => {
  const parts = partsDone(state && state.completedAt);
  const totalParts = PARTS.length;
  const totalLenses = LENS_IDS.length;
  const lenses = LENS_IDS.filter((id) => (state && state.miniResults || {})[id]).length;
  const score = Math.round((parts / totalParts) * PARTS_WEIGHT + (totalLenses ? (lenses / totalLenses) * LENS_WEIGHT : 0));
  return { score, parts, totalParts, lenses, totalLenses, allParts: parts >= totalParts };
};
const meets = (l, st) => st.score >= l.need && (!l.allParts || st.allParts);
const PART_IX = Object.fromEntries(PARTS.map((p, i) => [p.id, i]));
// Which part-indices a given arc walks, in order. "starter" walks a short set; anything else walks all.
const arcParts = (arc, completedAt) => {
  const done = completedAt || {};
  if (arc === "starter") return STARTER_PARTS.map((id) => PART_IX[id]);
  if (arc === "core") return [...STARTER_PARTS, ...CORE_ADDED].filter((id) => !done[id]).map((id) => PART_IX[id]);
  if (arc === "more") return PARTS.map((_, i) => i).filter((i) => !done[PARTS[i].id]); // remaining, for "go deeper"
  return PARTS.map((_, i) => i); // full
};
const levelFor = (st) => LEVELS.slice().reverse().find((l) => meets(l, st)) || null;
const nextLevel = (st) => LEVELS.find((l) => !meets(l, st)) || null;
/* What to actually do next, in plain words, for the level after this one. */
const nextStep = (st) => {
  const nx = nextLevel(st);
  if (!nx) return null;
  const partsShort = nx.allParts ? st.totalParts - st.parts : Math.max(0, Math.ceil(((nx.need - st.score) / PARTS_WEIGHT) * st.totalParts));
  if (partsShort > 0) return { level: nx, what: `Finish ${partsShort} more part${partsShort === 1 ? "" : "s"} of the assessment`, kind: "parts" };
  const per = st.totalLenses ? LENS_WEIGHT / st.totalLenses : 0;
  const lensShort = per ? Math.max(1, Math.ceil((nx.need - st.score) / per)) : 0;
  const canTake = st.totalLenses - st.lenses;
  if (lensShort > 0 && canTake > 0) return { level: nx, what: `Take ${Math.min(lensShort, canTake)} more lens${Math.min(lensShort, canTake) === 1 ? "" : "es"} in the Library`, kind: "lens" };
  return { level: nx, what: "More lenses are being written. This one opens when they land.", kind: "wait" };
};

/* ---------------- storage ---------------- */
const KEY = "era-v1";
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} };

/* ---------------- unlock ----------------
   Codes are checked as SHA-256 hashes so they aren't readable in source.
   Regenerate with gen-codes.mjs (see README).

   PREVIEW is the founder test code and it is deliberately NOT in CODE_HASHES.
   It works only where the app is not the live site — localhost, and Netlify
   deploy previews and branch deploys, which all carry "--" in the hostname
   that a production domain never does. That means the test code cannot be
   used against production even by someone who reads this source, and there is
   no launch-day checklist item to forget. */
const isPreviewHost = () => {
  try {
    const h = location.hostname;
    return h === "localhost" || h === "127.0.0.1" || h.endsWith(".local") || h.includes("--");
  } catch { return false; }
};
const PREVIEW_HASH = "59e1f415bf9d7761b450dcb4785daac53307323451bc453bfaa06a46d4649e2a";
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
const to100 = (mean) => mean == null ? null : Math.round(((mean - 1) / 4) * 100);

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

  const measured = {
    thinking: flat.some((i) => i.dim && i.key && get(i.id) != null),
    ei: ["sa","so","sm","rm"].some((d) => flat.some((i) => i.domain === d && get(i.id) != null)),
    riasec: flat.some((i) => i.code && get(i.id) != null),
    values: flat.some((i) => i.value && get(i.id) != null),
    big5: flat.some((i) => i.trait && get(i.id) != null),
  };
  return { thinking, ei, riasec, values, big5, qc, measured };
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
  const m = scores.measured || { thinking: true, ei: true, riasec: true, values: true, big5: true };
  const full = m.thinking && m.ei && m.riasec && m.values && m.big5;
  const calls = [];
  calls.push({ title: "Opening", prompt: `Data: ${ctx}\n\nWrite the OPENING section (~210 words) for ${name}. Start with the "### " headline line. Reflect their own words back where you have them — woven with one thing the data already confirms. Quote vivid phrases. Only discuss dimensions actually present in the scores. End on a sentence that earns trust.` });
  if (m.values || m.big5) calls.push({ title: "Values & work", prompt: `Data: ${ctx}\n\nWrite ${m.values && m.big5 ? "two sections" : "one section"}. ${m.values ? '"## What you\'re for" — their ranked values and especially the forced-choice pattern; name the trade they keep making.' : ""} ${m.big5 ? '"## How you work" — the Big Five in plain language (Steadiness = inverted Neuroticism, explain plainly if relevant).' : ""} Each starts with its "### " headline after the ## title. Discuss ONLY these.` });
  if (m.thinking || m.ei) calls.push({ title: "Think & feel", prompt: `Data: ${ctx}\n\nWrite ${m.thinking && m.ei ? "two sections" : "one section"}. ${m.thinking ? '"## How you think" — thinking-style profile, never IQ framing.' : ""} ${m.ei ? '"## How you carry yourself" — the four EI domains and what the scenario choices reveal.' : ""} Each starts with its "### " headline. Discuss ONLY these.` });
  if (m.riasec) calls.push({ title: "What pulls you", prompt: `Data: ${ctx}\n\nWrite "## What pulls you" (~180 words), "### " headline first — top two RIASEC inclinations in plain words, and what the lowest one quietly says.` });
  if (full) calls.push({ title: "The tensions", prompt: `Data: ${ctx}\n\nWrite "## The tensions" (~220 words), "### " headline first — the two or three places their dimensions pull against each other, and what living inside each tension feels like on a Tuesday. Be brave.` });
  calls.push({ title: "What this suggests", prompt: `Data: ${ctx}\n\nWrite the final section "## What this suggests" (~${full ? 260 : 180} words), "### " headline first. Read honestly against ${full ? "the whole profile" : "what's been measured so far, and gently note that going deeper would sharpen it"}. Offer ${full ? "two or three" : "one or two"} shapes of work that fit, each with one concrete first step. ${full ? "" : "Encourage them warmly to complete more parts when ready — more answers, truer mirror."} Close the whole report with this exact line on its own: The box was never you.` });
  return calls;
}

async function callClaude(prompt) {
  const res = await fetch("/api/claude", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system: SYSTEM, messages: [{ role: "user", content: prompt }], max_tokens: 1100 }),
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
  const scores = useMemo(() => (["glimmer", "generating", "report", "companion", "humans", "library", "account", "settings", "constellation"].includes(state.phase) && Object.keys(answers).length) ? computeScores(answers) : null, [state.phase, answers]);

  useEffect(() => { window.scrollTo(0, 0); }, [state.phase, state.part, state.item]);
  useEffect(() => { document.body.classList.toggle("dm", !!state.dark); }, [state.dark]);

  if (state.phase === "breath") return <Breath onEnter={() => update({ phase: state.seenExplainer ? "home" : "explainer" })} />;
  if (state.phase === "home") return <Home state={state} onResume={() => { const p = state.paused; update({ part: p.part, item: p.item, arc: p.arc, paused: null, phase: p.at === "run" ? "run" : "intro" }); }} onTheme={() => update({ dark: !state.dark })} go={(p) => update({ phase: p })} startAssessment={() => update({ phase: Object.keys(answers).length ? "chooseDepth" : "chooseDepth" })} />;
  if (state.phase === "companion") return <CompanionScreen state={state} scores={scores} onBack={() => update({ phase: "home" })} onRegenerate={() => update({ phase: "generating" })} onHuman={() => update({ phase: "humans" })} />;
  if (state.phase === "constellation") return <ConstellationScreen state={state} update={update} onBack={() => update({ phase: "home" })} />;
  if (state.phase === "humans") return <HumansScreen scores={scores} state={state} onBack={() => update({ phase: "home" })} onApply={() => update({ phase: "apply" })} />;
  if (state.phase === "account") return <AccountScreen state={state} scores={scores} onBack={() => update({ phase: "home" })} />;
  if (state.phase === "settings") return <SettingsScreen state={state} update={update} onBack={() => update({ phase: "home" })} />;
  if (state.phase === "apply") return <ApplyScreen onBack={() => update({ phase: "humans" })} />;
  if (state.phase === "strength") return <StrengthScreen state={state} onBack={() => update({ phase: "home" })} onAssessment={() => update({ phase: "chooseDepth" })} onLibrary={() => update({ phase: "library" })} />;
  if (state.phase === "library") return <LibraryScreen state={state} onBack={() => update({ phase: "home" })} onAssessment={() => update({ phase: "chooseDepth" })} onMini={(id) => update({ miniId: id, phase: (state.miniResults || {})[id] ? "miniResult" : "miniRun" })} onRetake={(id) => update({ miniId: id, phase: "miniRun" })} />;
  if (state.phase === "miniRun") return <MiniRunner miniId={state.miniId} answers={(state.miniAnswers || {})[state.miniId]} onBack={() => update({ phase: "library" })} onDone={(a) => { const res = scoreMini(state.miniId, a); track("mini_done", state.miniId); update({ miniAnswers: { ...(state.miniAnswers || {}), [state.miniId]: a }, miniResults: { ...(state.miniResults || {}), [state.miniId]: res }, phase: "miniResult" }); }} />;
  if (state.phase === "miniResult") return <MiniResult miniId={state.miniId} result={(state.miniResults || {})[state.miniId]} onBack={() => update({ phase: "library" })} onRetake={() => update({ phase: "miniRun" })} />;
  if (state.phase === "welcome") return <Welcome onStart={() => update({ phase: state.unlocked ? (Object.keys(answers).length ? "intro" : "warmup") : "unlock" })} resumable={state.part > 0 || state.item > 0} />;
  /* Answers save on every tap already; "Save & pick up later" also remembers
     exactly where someone was, so Home can drop them straight back in. */
  const saveExit = (at) => { track("save_exit", PARTS[state.part] && PARTS[state.part].id); update({ phase: "home", paused: { at, part: state.part, item: at === "run" ? state.item : 0, arc: state.arc } }); };
  if (state.phase === "unlock") return <Unlock onUnlock={() => update({ unlocked: true, phase: "warmup" })} onHome={() => update({ phase: "home" })} />;
  if (state.phase === "warmup") return <Warmup onDone={() => update({ phase: "intro" })} onExit={() => saveExit("intro")} />;
  if (state.phase === "explainer") return <Explainer onDone={() => update({ phase: "home", seenExplainer: true })} />;
  // Same deck, reachable any time from Home or Settings.
  if (state.phase === "explainerAgain") return <Explainer done="Done" onDone={() => update({ phase: state.explainerBack || "home" })} />;
  if (state.phase === "chooseDepth") return <ChooseDepth state={state} onPick={(arc) => { const parts = arcParts(arc, state.completedAt); const first = parts[0] ?? 0; update({ arc, part: first, item: 0, paused: null, phase: state.unlocked ? "warmup" : "unlock" }); }} onBack={() => update({ phase: "home" })} />;
  /* The badge comes straight after the last part, before any report exists for
     the answers just given, so "See my report" has to write it first. Going
     straight to "report" landed on an empty page. */
  if (state.phase === "badge") return <BadgeScreen state={state} onDone={() => update({ phase: "generating" })} />;
  if (state.phase === "intro") return <PartIntro part={PARTS[state.part]} n={state.part} onGo={() => update({ phase: "run" })} onExit={() => saveExit("intro")} />;
  if (state.phase === "run") return <Runner state={state} update={update} onExit={() => saveExit("run")} />;
  if (state.phase === "glimmer") return <Glimmer part={PARTS[state.part]} answers={answers} scores={scores} onNext={() => {
    const completedAt = { ...(state.completedAt || {}), [PARTS[state.part].id]: Date.now() };
    if (state.retaking) return update({ completedAt, retaking: false, phase: "generating", report: null });
    const arc = arcParts(state.arc, state.completedAt);
    const pos = arc.indexOf(state.part);
    const next = arc[pos + 1];
    update(next == null ? { completedAt, phase: "badge" } : { completedAt, part: next, item: 0, phase: "intro" });
  }} />;
  /* If the rewrite fails, keep a real report someone already has rather than
     swapping it for the sample. */
  const reportDone = (report) => update({ report: report.preview && state.report && !state.report.preview ? state.report : report, phase: "report", companionStart: state.companionStart || Date.now() });
  if (state.phase === "generating") return <Generating answers={answers} scores={scores} onDone={reportDone} />;
  // Never a blank page: no report yet means write one.
  if (state.phase === "report" && !state.report) return <Generating answers={answers} scores={scores || computeScores(answers)} onDone={reportDone} />;
  if (state.phase === "report") return <Report report={state.report} name={answers["AR-1"]} answers={answers} scores={scores} companionStart={state.companionStart} completedAt={state.completedAt || {}} strength={profileStrength(state)} onStrength={() => update({ phase: "strength" })} onBack={() => update({ phase: "home" })} onLibrary={() => update({ phase: "library" })} onDeeper={() => { const parts = arcParts("more", state.completedAt); if (parts.length) update({ arc: "more", part: parts[0], item: 0, phase: "intro" }); }} onRegenerate={() => update({ phase: "generating" })} onRetake={(idx) => update({ part: idx, item: 0, retaking: true, phase: "intro" })} onRestart={() => { localStorage.removeItem(KEY); location.reload(); }} />;
  return null;
}

function Shell({ dark, children, footer }) {
  return (<div className={"shell" + (dark ? " dark" : "")}><div className="col">{children}</div>{footer}</div>);
}

const WARMUP = [
  { line: "Take a breath. This isn't a test you can fail.", sub: "There are no wrong answers here. Only true ones and polite ones." },
  { line: "Answer as you are, not as the job advert wants you to be.", sub: "No one is scoring you against anyone. The only person who loses from a polished answer is you." },
  { line: "Ten to fifteen minutes to begin. Slow is fine.", sub: "You can stop after that with a real report in hand, or keep going. Your answers stay on this device." },
];

function SaveExit({ onExit, light }) {
  return <button className={"saveexit" + (light ? " light" : "")} onClick={onExit}>Save &amp; pick up later</button>;
}
function Warmup({ onDone, onExit }) {
  const [i, setI] = useState(0);
  const last = i === WARMUP.length - 1;
  return (
    <Shell dark>
      <div className="exitrow"><SaveExit onExit={onExit} light /></div>
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
        <p className="lede">This app helps you understand yourself — and use what you learn.</p>
        <div className="steps">
          <div className="step"><span className="stepn">1</span><span>Answer questions about yourself. Ten to fifteen minutes for your first profile, and you can go deeper whenever you want. It saves as you go.</span></div>
          <div className="step"><span className="stepn">2</span><span>Get a written report about you — how you think, what you enjoy, what matters to you. Yours to keep.</span></div>
          <div className="step"><span className="stepn">3</span><span>Talk it over with your AI Companion for 7 days. Ask it anything about your life and work.</span></div>
        </div>
        <p className="lede dim">Built on trusted psychology (Big Five, CHC, Goleman EI, RIASEC, Schwartz Values). A self-discovery tool, not a medical test. Your answers stay on your phone — no one can read them, iSHKiY included.</p>
        <button className="btn gold" onClick={onStart}>{resumable ? "Continue where you left off" : "Begin"}</button>
      </div>
    </Shell>
  );
}

function Unlock({ onUnlock, onHome }) {
  const [code, setCode] = useState(""); const [err, setErr] = useState(false); const [busy, setBusy] = useState(false);
  const check = async () => {
    setBusy(true); const h = await sha256(code); setBusy(false);
    if (CODE_HASHES.includes(h) || (isPreviewHost() && h === PREVIEW_HASH)) onUnlock(); else setErr(true);
  };
  return (
    <Shell dark>
      <div className="welcome">
        <button className="saveexit light" onClick={onHome}>← Home</button>
        <p className="kicker">Founding access</p>
        <h1 className="display sm">Enter your access code</h1>
        <p className="lede dim">Your code came with your payment confirmation. £29 gets you: the full assessment, your written report (yours to keep), a share card, and 7 days with your AI Companion — a coach, a mentor and a sounding voice that have actually read you.</p>
        <input className="code" value={code} onChange={(e) => { setCode(e.target.value); setErr(false); }} onKeyDown={(e) => e.key === "Enter" && code && check()} placeholder="e.g. ERA-XXXX-XXXX" autoFocus spellCheck="false" />
        {err && <p className="err">That code isn't recognised. Check for typos — codes aren't case-sensitive.</p>}
        {isPreviewHost() && <p className="tnote">This is a preview build, so the founder code <strong>PREVIEW</strong> works here. It does not work on the live site.</p>}
        <button className="btn gold" disabled={!code || busy} onClick={check}>{busy ? "Checking…" : "Continue"}</button>
        <a className="paylink" href="STRIPE_PAYMENT_LINK" target="_blank" rel="noreferrer">Don't have a code? Become a founding member →</a>
      </div>
    </Shell>
  );
}

function Dots({ n }) {
  return (<div className="dots" aria-hidden="true">{PARTS.map((p, i) => (<span key={p.id} className={"dot" + (i < n ? " done" : i === n ? " now" : "")} />))}</div>);
}

/* The breath cue stays put under the circle; only the advice below it turns,
   and slowly, so it can be read while breathing rather than chased. */
const MINDSET = [
  "Put your feet flat. Let your shoulders drop.",
  "There are no right answers here. Only true ones.",
  "Answer as you are today — not as you think you should be.",
];
const BREATH_HALF = 4000; // half of .mindpulse's 8s cycle: in as it grows, out as it settles
function BreathCue() {
  const [inhale, setInhale] = useState(true);
  useEffect(() => { const t = setInterval(() => setInhale((v) => !v), BREATH_HALF); return () => clearInterval(t); }, []);
  return <p className="breathcue" aria-hidden="true"><span className={inhale ? "on" : ""}>Breathe in</span><span className="breathsep">·</span><span className={inhale ? "" : "on"}>and out</span></p>;
}
function BreathDiagram() {
  return (
    <svg viewBox="0 0 160 160" className="mindart" aria-hidden="true">
      <circle cx="80" cy="80" r="54" fill="none" stroke="rgba(212,165,71,0.25)" strokeWidth="1.5" />
      <circle cx="80" cy="80" r="30" fill="rgba(212,165,71,0.10)" stroke="#D4A547" strokeWidth="2" className="mindpulse" />
      <circle cx="80" cy="80" r="7" fill="#D4A547" />
    </svg>
  );
}
function PartIntro({ part, n, onGo, onExit }) {
  const [ready, setReady] = useState(false);
  const [line, setLine] = useState(0);
  useEffect(() => { const t = setInterval(() => setLine((v) => (v + 1) % MINDSET.length), 9000); return () => clearInterval(t); }, []);
  const go = () => { setReady(true); setTimeout(onGo, 900); };
  return (
    <Shell>
      <div className="exitrow"><SaveExit onExit={onExit} /></div>
      <Dots n={n} />
      <div className={"intro mindset" + (ready ? " leaving" : "")}>
        <p className="kicker gold">{part.kicker}</p>
        <h1 className="display ink">{part.title}</h1>
        <p className="lede inkdim">{part.intro}</p>
        <div className="mindwrap">
          <BreathDiagram />
          <BreathCue />
          <p className="mindline" key={line}>{MINDSET[line]}</p>
        </div>
        <button className="btn ink" onClick={go}>I'm ready</button>
      </div>
    </Shell>
  );
}

function seeded(arr, seed) {
  const a = arr.slice(); let s = seed;
  for (let i = a.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor((s / 233280) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function QDots({ i, total }) {
  const half = Math.floor(total / 2);
  const push = i + 1 === half ? "Halfway. The rest goes quicker." : i + 1 === total - 1 ? "One more after this." : null;
  return (
    <div className="qdotswrap">
      <div className="qdots" aria-hidden="true">
        {Array.from({ length: total }).map((_, k) => (
          <span key={k} className={"qdot" + (k < i ? " done" : k === i ? " now" : "")} />
        ))}
      </div>
      {push && <p className="qpush">{push}</p>}
    </div>
  );
}
function Runner({ state, update, onExit }) {
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
      if (part.glimmer) { update({ answers, completedAt, item: 0, phase: "glimmer" }); return; }
      if (state.retaking) { update({ answers, completedAt, item: 0, retaking: false, phase: "generating", report: null }); return; }
      const arc = arcParts(state.arc, state.completedAt);
      const pos = arc.indexOf(state.part);
      const next = arc[pos + 1];
      update(next == null ? { answers, completedAt, item: 0, phase: "badge" } : { answers, completedAt, item: 0, part: next, phase: "intro" });
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
        <span className="count">{state.item + 1 > total / 2 ? (total - state.item - 1 === 0 ? "last one" : `${total - state.item - 1} to go`) : `${state.item + 1} of ${total}`}</span>
      </div>
    }>
      <div className="exitrow"><SaveExit onExit={onExit} /></div>
      <Dots n={state.part} />
      <QDots i={state.item} total={total} />
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
          let text = null, tries = 0;
          while (text == null && tries < 3) {
            tries += 1;
            try { text = await callClaude(calls[i].prompt); }
            catch (err) { if (tries >= 3) throw err; await new Promise((r) => setTimeout(r, 1200 * tries)); }
          }
          sections.push(text);
        }
        if (alive) { track("report_ok"); onDone({ text: sections.join("\n\n"), preview: false, when: new Date().toISOString() }); }
      } catch (e) {
        if (alive) { track("report_fail"); onDone({ text: SAMPLE, preview: true, when: new Date().toISOString() }); }
      }
    })();
    return () => { alive = false; };
  }, []);
  const lines = ["Reading your answers", "Writing how you think", "Finding what pulls you", "Naming the tensions", "Writing where this points"];
  return (
    <Shell dark>
      <div className="glimmer">
        <div className="orbwrap"><Orb size={100} /></div>
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

/* Every dimension is 0–100, but 100 means a different thing in each family:
   accuracy on puzzles, a self-rating, the strength of a pull, the weight of a
   value. One shared "high / moderate / low" made them all read like a grade,
   so each family gets wording that says what the number is actually measuring.
   Bands run low → very high across the same 25/40/60/75 cuts. */
const BANDS = {
  think:  ["few right", "some right", "about half", "most right", "nearly all"],
  heart:  ["rarely", "sometimes", "often", "usually", "almost always"],
  pull:   ["no pull", "faint pull", "some pull", "clear pull", "strong pull"],
  values: ["not a driver", "in the background", "matters", "important to you", "core to you"],
  work:   ["low", "lower", "balanced", "high", "very high"],
  lens:   ["low", "lower", "balanced", "high", "very high"],
};
const bandIx = (v) => v >= 75 ? 4 : v >= 60 ? 3 : v >= 40 ? 2 : v >= 25 ? 1 : 0;
const bandOf = (fam, v) => v == null ? "—" : (BANDS[fam] || BANDS.work)[bandIx(v)];
// "87 · strong" — the number, then what it means in this family's terms.
const scoreLine = (fam, v) => v == null ? "—" : `${v} · ${bandOf(fam, v)}`;
function Tiles({ scores }) {
  const [open, setOpen] = useState(null);
  const t = scores.thinking, ei = scores.ei, b5 = scores.big5;
  const tiles = [
    { id: "think", acc: "#5C7CA3", label: "How you think", stat: t.lean, art: <MiniBars pairs={[[t.lean, 100], ["", 55]].slice(0, 1).concat([["numerical", t.numerical], ["spatial", t.spatial], ["verbal", t.verbal], ["logical", t.logical]].sort((a, b) => b[1] - a[1]).slice(0, 3))} />, detail: [["Numerical", scoreLine("think", t.numerical)], ["Spatial", scoreLine("think", t.spatial)], ["Verbal", scoreLine("think", t.verbal)], ["Logical", scoreLine("think", t.logical)]], note: "Accuracy by problem type. The lean is your first language for a hard problem — not a ceiling on the others.", about: "Grounded in Cattell–Horn–Carroll (CHC) theory, the most widely used map of human cognitive abilities. Our short, untimed puzzles sample four problem types to read your thinking style. What it can't claim: this is a style indicator, not an IQ measure — a handful of puzzles can suggest how you approach problems, not the size of the engine." },
    { id: "heart", acc: "#C06B5C", label: "How you carry yourself", stat: "the compass", art: <MiniCompass ei={ei} />, detail: [["Self-awareness", scoreLine("heart", ei.selfAwareness)], ["Social awareness", scoreLine("heart", ei.socialAwareness)], ["Self-management", scoreLine("heart", ei.selfManagement)], ["With others", scoreLine("heart", ei.relationshipManagement)]], note: "Goleman's four domains, 0–100 from your answers. The needle points where you're strongest.", about: "Based on Daniel Goleman's four-domain model of emotional intelligence: knowing yourself, steadying yourself, reading others, and working with others. What it can't claim: this is self-report — it measures how you see yourself, which is itself useful information, but a colleague might score you differently." },
    { id: "pull", acc: "#D4A547", label: "What pulls you", stat: scores.riasec.top + " · " + scores.riasec.second, art: <MiniPetals riasec={scores.riasec} />, detail: ["R", "I", "A", "S", "E", "C"].map((c) => [{ R: "Making", I: "Understanding", A: "Creating", S: "People", E: "Starting", C: "Ordering" }[c], scoreLine("pull", scores.riasec.scores[c])]), note: "The gold petal is the strongest pull. The faint one is second. Low petals matter too — they're honest about what drains you.", about: "John Holland's RIASEC model — six themes of vocational interest, used in career guidance for over sixty years. People tend to thrive where their environment matches their strongest themes. What it can't claim: interests aren't abilities. Loving a thing and being built for it usually travel together, but not always." },
    { id: "values", acc: "#6F8F5E", label: "What you're for", stat: scores.values.ranked[0], art: <MiniBeam values={scores.values} />, detail: scores.values.ranked.map((v) => [v, scoreLine("values", scores.values.scores[v]) + (scores.values.fcWins[v] ? " · you chose it often" : "")]), note: "Ranked by importance, weighted by what you chose when forced to pick. Forced choices tell the truth.", about: "Drawn from Shalom Schwartz's theory of basic human values — a model validated across more than eighty countries. We sample six values most alive in working life, and weight the forced choices heavily because trade-offs reveal what ratings flatter. What it can't claim: values shift with seasons of life. This is your now, not your always." },
    { id: "work", acc: "#8A6FA0", label: "How you work", stat: Object.entries(b5).sort((a, b) => b[1] - a[1])[0][0].toLowerCase(), art: <MiniBars pairs={Object.entries(b5).sort((a, b) => b[1] - a[1])} />, detail: Object.entries(b5).map(([k, v]) => [k, scoreLine("work", v)]), note: "The Big Five, 0–100. Steadiness is Neuroticism turned right-side up: high means the weather passes through you quickly.", about: "The Big Five is the most replicated personality model in psychology — five broad traits that describe how people differ in daily working life. We present Neuroticism as Steadiness (same scale, inverted) because it reads truer that way. What it can't claim: five items per trait gives a sketch, not a portrait. The written report adds the shading." },
  ];
  const mk = { think: "thinking", heart: "ei", pull: "riasec", values: "values", work: "big5" };
  const shown = (scores.measured ? tiles.filter((t) => scores.measured[mk[t.id]]) : tiles);
  return (
    <div className="tiles">
      {shown.map((tile) => (
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
  "Some questions deserve more than a spare minute.",
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

/* The halo breathes on its own keyframes, sized to stay inside the drawing —
   it used to borrow the warm-up dot's 2.6x scale and got cut off square. The
   smile is separate: it grows from a flat line over four seconds each time the
   face appears, on no clock but its own. */
const reduceMotion = () => { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } };
const SMILE_FROM = "M43 56.5 q5 0 10 0", SMILE_TO = "M41 55.5 q7 5.5 14 0";
function Orb({ size = 96 }) {
  const still = useMemo(reduceMotion, []);
  const gid = useMemo(() => "orbg" + Math.random().toString(36).slice(2, 8), []);
  return (
    <svg viewBox="0 0 96 96" width={size} height={size} className="orb" aria-hidden="true">
      <defs>
        <radialGradient id={gid}>
          <stop offset="50%" stopColor="#D4A547" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#D4A547" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="48" cy="48" r="46" fill={`url(#${gid})`} className="orbhalo" />
      <circle cx="48" cy="48" r="27" fill="#D4A547" />
      <path d="M38 46 q4 -4 8 0" fill="none" stroke="#0F1E3D" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M52 46 q4 -4 8 0" fill="none" stroke="#0F1E3D" strokeWidth="2.6" strokeLinecap="round" />
      <path d={still ? SMILE_TO : SMILE_FROM} fill="none" stroke="#0F1E3D" strokeWidth="2.6" strokeLinecap="round">
        {!still && <animate attributeName="d" from={SMILE_FROM} to={SMILE_TO} dur="4s" begin="0.3s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.45 0 0.2 1" />}
      </path>
    </svg>
  );
}

function Breath({ onEnter }) {
  const quote = useMemo(qNext, []);
  return (
    <Shell dark>
      <div className="glimmer breathscreen">
        <div className="breath" aria-hidden="true"><span /></div>
        <p className="gline bquote">{quote}</p>
        <button className="btn gold" onClick={() => { track("enter"); onEnter(); }}>Enter</button>
        <div className="bfoot"><Wordmark light /></div>
      </div>
    </Shell>
  );
}


/* ---------------- the library of you ---------------- */
/* Subjects. Lenses arrive one at a time and a flat list of them reads like a
   catalogue; grouped by the part of life they're about, it reads like somewhere
   to go looking. Each subject leads with the question a person actually has,
   not the framework underneath it. */
const SUBJECTS = [
  { id: "closeness", name: "Relationships", line: "How you attach, how you fight, and what you need that you've never asked for.", ask: "Why do I keep having the same argument?" },
  { id: "drive", name: "Drive", line: "What moves you, what stops you, and what you do when it's hard.", ask: "Why do I stall on the things I say I want most?" },
  { id: "mind", name: "Mind", line: "How you think, and how you keep it in one piece.", ask: "Why does the same week wreck me and not them?" },
  { id: "money", name: "Money", line: "What it means to you, and what it quietly costs.", ask: "Why is this never really about the money?" },
  { id: "becoming", name: "Purpose", line: "What you're actually for, and whether the life you're building matches it.", ask: "Am I building this life, or just ending up in it?" },
];
/* Every lens, in the order it sits in its subject. Built lenses take their
   words from MINIS; anything still being made carries its own. Membership
   lenses are open to everyone during the founding period — the tier badge says
   where each will sit once membership exists. */
const LENS_TIER = { attachment: "FREE", friend: "FREE", approach: "FREE" };
const LENS_ORDER = ["attachment", "friend", "room", "fight", "approach", "builder", "stuck", "pressure", "resilience", "money", "enough", "narrative"];
const EXPANSIONS = [
  ...LENS_ORDER.map((id) => ({ subject: MINIS[id].subject, name: MINIS[id].name, mini: id, from: MINIS[id].from, research: MINIS[id].research, line: MINIS[id].blurb, tier: LENS_TIER[id] || "MEMBERSHIP" })),
  { subject: "becoming", name: "The Partner Series", from: "With thinkers you already trust", research: { what: "Each Partner lens is built with a writer, researcher or practitioner whose ideas have changed how people live and work. We distil their philosophy with them, test the questions together, and they sign off every word of the read you get back.", limits: "Partner lenses are grounded in one person's thinking, not a body of research, and we'll always say which is which. Names are announced once agreements are signed." }, line: "Their life's philosophy, distilled with them into a mirror you can take. Conversations underway — names when the ink is dry.", tier: "PARTNER", status: "In conversation" },
];
const SUBJ_ACC = { closeness: "#C06B5C", drive: "#5C7CA3", mind: "#6F8F5E", money: "#D4A547", becoming: "#8A6FA0", sos: "#C0504D" };
/* One symbol per subject, drawn on a 24-unit grid so the same paths serve the
   Library headings, its chips, and the intro deck. */
function SubjectGlyph({ id }) {
  const p = { fill: "none", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  if (id === "closeness") return <g {...p}><circle cx="9" cy="12" r="5.5" /><circle cx="15" cy="12" r="5.5" /></g>;
  if (id === "drive") return <g {...p}><path d="M4 18 L10 12 L13.5 15 L20 8" /><path d="M15 8 H20 V13" /></g>;
  if (id === "mind") return <g {...p}><circle cx="12" cy="12" r="8" /><path d="M7.5 12.5 Q9.75 9.5 12 12.5 T16.5 12.5" /></g>;
  if (id === "money") return <g {...p}><ellipse cx="12" cy="7" rx="7" ry="2.8" /><path d="M5 7 V12 C5 13.6 8.1 14.8 12 14.8 S19 13.6 19 12 V7" /><path d="M5 12 V17 C5 18.6 8.1 19.8 12 19.8 S19 18.6 19 17 V12" /></g>;
  if (id === "becoming") return <g {...p}><path d="M12 3 L13.8 10.2 L21 12 L13.8 13.8 L12 21 L10.2 13.8 L3 12 L10.2 10.2 Z" /></g>;
  if (id === "sos") return <g {...p}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3.6" /><path d="M6 6 L9.4 9.4 M18 6 L14.6 9.4 M6 18 L9.4 14.6 M18 18 L14.6 14.6" /></g>;
  return null;
}
function SubjectIcon({ id, size = 22 }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" stroke={SUBJ_ACC[id]} className="subjicon"><SubjectGlyph id={id} /></svg>;
}
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
/* ---------------- SOS ----------------
   UK services, checked September 2026. On a phone every number is a tap to
   call or text; on a computer the numbers show as plain text, because a tel:
   link that opens nothing is worse than no link at all. */
const SOS_LINES = [
  { name: "Emergency services", what: "If you or someone else is in immediate danger, or you've hurt yourself and need medical help.", call: "999", hours: "24/7" },
  { name: "NHS 111", what: "Urgent mental health help in England. Call and choose the mental health option, or use NHS 111 online.", call: "111", hours: "24/7", web: "https://111.nhs.uk", site: "111.nhs.uk" },
  { name: "Samaritans", what: "Whatever you're going through, someone to talk to. Free from any phone, and it won't show on your bill.", call: "116 123", hours: "24/7", web: "https://www.samaritans.org", site: "samaritans.org" },
  { name: "Shout", what: "If you'd rather text than talk. A trained volunteer texts back.", text: { to: "85258", body: "SHOUT", label: "Text SHOUT to 85258" }, hours: "24/7", web: "https://giveusashout.org", site: "giveusashout.org" },
  { name: "YoungMinds", what: "For young people struggling with their mental health, and for parents worried about a child.", text: { to: "85258", body: "YM", label: "Text YM to 85258" }, call: "0808 802 5544", callLabel: "Parents Helpline", hours: "Text 24/7 · Parents Helpline weekdays", web: "https://www.youngminds.org.uk", site: "youngminds.org.uk" },
  { name: "Childline", what: "For anyone under 19, about anything at all.", call: "0800 1111", hours: "24/7", web: "https://www.childline.org.uk", site: "childline.org.uk" },
  { name: "Papyrus HOPELINE247", what: "For anyone under 35 having thoughts of suicide, and anyone worried about a young person.", call: "0800 068 4141", text: { to: "88247", label: "Text 88247" }, hours: "24/7", web: "https://www.papyrus-uk.org", site: "papyrus-uk.org" },
  { name: "CALM", what: "Campaign Against Living Miserably. For anyone who's struggling or in crisis.", call: "0800 58 58 58", hours: "5pm to midnight, every day", web: "https://www.thecalmzone.net", site: "thecalmzone.net" },
  { name: "Mind", what: "Information on mental health and where to find support near you. Not a crisis line.", call: "0300 123 3393", callLabel: "Infoline", hours: "Weekdays", web: "https://www.mind.org.uk", site: "mind.org.uk" },
];
const SOS_REGIONS = [["Scotland", "Breathing Space", "0800 83 85 87"], ["Wales", "C.A.L.L.", "0800 132 737"], ["Northern Ireland", "Lifeline", "0808 808 8000"]];
const onPhone = () => { try { return window.matchMedia("(pointer: coarse)").matches || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent); } catch { return false; } };
function SOSNumber({ num, label, phone }) {
  const text = (label ? label + " " : "") + num;
  return phone ? <a className="sosbtn" href={"tel:" + num.replace(/\s/g, "")}>Call {text}</a> : <span className="sosnum">{label ? label + ": " : "Call "}<b>{num}</b></span>;
}
function SOSText({ t, phone }) {
  return phone ? <a className="sosbtn" href={"sms:" + t.to + (t.body ? "?&body=" + encodeURIComponent(t.body) : "")}>{t.label}</a> : <span className="sosnum"><b>{t.label}</b></span>;
}
function SOSSection() {
  const phone = onPhone();
  return (
    <section id="sos" className="subject sos">
      <div className="subjhead">
        <div className="subjtitle"><span className="subjbadge" style={{ background: SUBJ_ACC.sos + "1f" }}><SubjectIcon id="sos" /></span>
          <div><p className="subjname">SOS</p><p className="subjline">If things feel like too much right now, you don't have to hold it on your own.</p></div>
        </div>
      </div>
      <p className="sosnote">iSHKiY is a mirror, not a crisis service. These people are trained for exactly this, they're free, and none of them will judge you for calling. If you're in immediate danger, call <b>999</b> or go to A&amp;E.</p>
      <div className="sosgrid">
        {SOS_LINES.map((o) => (
          <div key={o.name} className="sostile">
            <p className="sosname">{o.name}</p>
            <p className="soswhat">{o.what}</p>
            <p className="soshours">{o.hours}</p>
            <div className="sosacts">
              {o.call && <SOSNumber num={o.call} label={o.callLabel} phone={phone} />}
              {o.text && <SOSText t={o.text} phone={phone} />}
              {o.web && <a className="soslink" href={o.web} target="_blank" rel="noopener noreferrer">{o.site} ↗</a>}
            </div>
          </div>
        ))}
      </div>
      <p className="sosregion">Elsewhere in the UK: {SOS_REGIONS.map(([place, name, num], k) => (
        <span key={place}>{k ? " · " : ""}{place}, {name} {phone ? <a href={"tel:" + num.replace(/\s/g, "")}>{num}</a> : <b>{num}</b>}</span>
      ))}</p>
    </section>
  );
}

/* The "Grounded in…" line, which opens to say what that grounding actually is. */
function ResearchNote({ from, research }) {
  const [open, setOpen] = useState(false);
  if (!research) return <p className="libfrom">{from}</p>;
  return (
    <div className="research">
      <button className="libfrom resbtn" aria-expanded={open} onClick={() => setOpen(!open)}>{from}<span className="resi" aria-hidden="true">{open ? "−" : "i"}</span></button>
      {open && <div className="resbody"><p>{research.what}</p><p><strong>What it can't claim.</strong> {research.limits}</p></div>}
    </div>
  );
}

/* A lens's read: the words, the bars, one thing to try. Used inline in the
   Library and on the lens's own page. */
function LensInsights({ id, result }) {
  const r = readMini(id, result);
  if (!r) return <p className="libline">This result was saved in an older format. Take the lens again to see your insights.</p>;
  return (
    <div className="insights">
      {r.tag && <p className="instag">{r.tag}</p>}
      <p className="inshead">{r.headline}</p>
      <div className="minibody">{r.bars.filter(([, v]) => v != null).map(([label, v]) => (
        <div key={label} className="insbar"><div className="insbarrow"><span>{label}</span><span className="tnum">{scoreLine("lens", v)}</span></div><div className="track"><div className="fill" style={{ width: `${v}%` }} /></div></div>
      ))}</div>
      {r.paras.map((t, k) => <p key={k} className="insp">{t}</p>)}
      {r.tryThis && <p className="instry"><strong>Try this.</strong> {r.tryThis}</p>}
      {r.care && <a className="rtbtn soscta" href="#sos">Talk to someone now →</a>}
    </div>
  );
}

function LensTile({ e, done, open, onMini, onRetake, mailto }) {
  const [showIns, setShowIns] = useState(false);
  const status = done ? "Taken" : !e.mini ? e.status : !open ? "Opens at Full Portrait" : e.tier === "MEMBERSHIP" ? "Open to founders" : "Ready";
  return (
    <div className={"libtile" + (e.mini ? " libready" : "") + (done ? " libdone" : "") + (e.mini && !open && !done ? " liblocked" : "")}>
      <div className="librow"><span className={"libtier t" + e.tier}>{e.tier}</span><span className={"libstatus" + (done ? " done" : "")}>{done ? "✓ " : ""}{status}</span></div>
      <p className="libname">{e.name}</p>
      <ResearchNote from={e.from} research={e.research} />
      <p className="libline">{e.line}</p>
      {done ? (
        <>
          <button className="insbtn" aria-expanded={showIns} onClick={() => { if (!showIns) track("view_insights", e.mini); setShowIns(!showIns); }}>Your insights <span aria-hidden="true">{showIns ? "▴" : "▾"}</span></button>
          {showIns && <div className="insfold"><LensInsights id={e.mini} result={done} /><div className="insacts"><button className="rtbtn" onClick={() => onMini(e.mini)}>Open the full read</button><button className="rtbtn ghostbtn" onClick={() => onRetake(e.mini)}>Take it again</button></div></div>}
        </>
      ) : e.mini ? (
        open ? <button className="rtbtn" onClick={() => onMini(e.mini)}>Take this lens</button>
          : <button className="rtbtn ghostbtn" disabled aria-disabled="true">🔒 Opens at Full Portrait</button>
      ) : <a className="rtbtn ghostbtn" href={mailto(e.name)}>Build this one first</a>}
    </div>
  );
}

function LibraryScreen({ state, onBack, onMini, onRetake, onAssessment }) {
  const mailto = (n) => "mailto:ops@ishkiy.com?subject=" + encodeURIComponent("Library vote — " + n) + "&body=" + encodeURIComponent("Build “" + n + "” first. I'd take it.");
  const miniDone = state.miniResults || {};
  const st = profileStrength(state);
  /* Deploy previews can open the Library early, so it can be checked without
     sitting all nine parts. Never on the live site — same rule as PREVIEW. */
  const [peek, setPeek] = useState(false);
  const open = st.allParts || peek;
  const built = EXPANSIONS.filter((e) => e.mini);
  const taken = built.filter((e) => miniDone[e.mini]).length;
  return (
    <div className="reportpage tint-heather">
      <div className="rhead noprint">
        <button className="ghost inkghost" onClick={onBack}>← Home</button>
        <Wordmark />
        <a className="sosjump" href="#sos" aria-label="SOS: urgent support">SOS</a>
      </div>
      <article className="report">
        <p className="kicker gold">The Library of You</p>
        <h1 className="display ink">One profile. Deepening for life.</h1>
        <Constellation />
        <p className="libnarr">Your report was the first light, the centre of the constellation. The Library is where the rest arrive: {built.length} lenses across five parts of life — how you attach and how you fight, what drives you and what stops you, how you carry pressure, what money means to you, and whether the life you're building is the one you meant. Each is ground from research psychologists actually use. Each one you complete adds a star to the same map: your Companion answers with more of you in the room, and what you choose to share with a human arrives richer.</p>
        {!st.allParts && (
          <div className="liblock">
            <p className="liblockk">🔒 Opens at Full Portrait</p>
            <p className="liblockt">You've finished {st.parts} of {st.totalParts} parts of the assessment. Finish the rest and every lens here opens — including how you attach, how you fight, and where your idea of 'enough' came from.</p>
            <div className="track"><div className="fill" style={{ width: `${Math.round((st.parts / st.totalParts) * 100)}%` }} /></div>
            <button className="btn gold" onClick={onAssessment}>{st.parts ? "Continue the assessment" : "Start the assessment"}</button>
            {isPreviewHost() && <button className="exskip libpeek" onClick={() => setPeek(!peek)}>{peek ? "Preview: lock it again" : "Preview build: open the Library anyway"}</button>}
          </div>
        )}
        <p className="libtally"><span className="tnum">{taken}</span> of <span className="tnum">{built.length}</span> lenses taken</p>
        <div className="subjnav" role="list">
          {SUBJECTS.map((s) => {
            const here = built.filter((e) => e.subject === s.id);
            const doneHere = here.filter((e) => miniDone[e.mini]).length;
            return (
              <a key={s.id} role="listitem" className="subjchip" href={"#subj-" + s.id}>
                <SubjectIcon id={s.id} size={16} />{s.name}<span className="subjcount">{doneHere}/{here.length}</span>
              </a>
            );
          })}
          <a role="listitem" className="subjchip sosclip" href="#sos"><SubjectIcon id="sos" size={16} />SOS</a>
        </div>

        {SUBJECTS.map((s) => {
          const inIt = EXPANSIONS.filter((e) => e.subject === s.id);
          if (!inIt.length) return null;
          const here = inIt.filter((e) => e.mini);
          const doneHere = here.filter((e) => miniDone[e.mini]).length;
          return (
            <section key={s.id} id={"subj-" + s.id} className="subject">
              <div className="subjhead">
                <div className="subjtitle">
                  <span className="subjbadge" style={{ background: SUBJ_ACC[s.id] + "1f" }}><SubjectIcon id={s.id} /></span>
                  <div><p className="subjname">{s.name}</p><p className="subjline">{s.line}</p></div>
                </div>
                <span className={"subjdone" + (doneHere ? " some" : "")}>{doneHere} of {here.length} taken</span>
              </div>
              <p className="subjask">“{s.ask}”</p>
              <div className="libgrid">
                {inIt.map((e) => <LensTile key={e.name} e={e} done={e.mini ? miniDone[e.mini] : null} open={open} onMini={onMini} onRetake={onRetake} mailto={mailto} />)}
              </div>
            </section>
          );
        })}
        <SOSSection />
        <p className="hquote">The future is not artificial; it's authentically human.</p>
      </article>
    </div>
  );
}

/* ---------------- the cockpit ---------------- */
function HomeTile({ title, sub, locked, lockNote, onClick, art, badge, acc, pulse }) {
  return (
    <button className={"htile" + (locked ? " locked" : "") + (pulse ? " pulse" : "")} style={acc ? { borderTopColor: acc, borderTopWidth: "4px", background: `linear-gradient(180deg, ${acc}14, transparent 55%)` } : undefined} onClick={locked ? undefined : onClick} aria-disabled={locked}>
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
function Home({ state, go, startAssessment, onTheme, onResume }) {
  const name = (state.answers["AR-1"] || "").trim();
  let compLeft = null;
  try { const cc = loadCompanion(); compLeft = Math.max(0, Q_CAP - (cc.count || 0)); } catch {}
  const hasReport = !!state.report;
  /* Finished at least the first look but no report on file — the old badge
     screen could leave people here. Offer to write it rather than asking them
     to carry on answering. */
  const reportDue = !hasReport && STARTER_PARTS.every((id) => (state.completedAt || {})[id]);
  const midway = !hasReport && !reportDue && Object.keys(state.answers).length > 0;
  const strength = profileStrength(state);
  const strengthStep = nextStep(strength);
  const gold = "#D4A547", faint = "rgba(15,30,61,0.18)";
  return (
    <Shell>
      <div className="home">
        <div className="hrow"><Wordmark /><button className="thememini" onClick={onTheme}>{state.dark ? "Light mode" : "Dark mode"}</button></div>
        <h1 className="display ink hgreet">{name ? `Welcome back, ${name}.` : "Welcome."}</h1>
        <p className="lede inkdim hsub">{hasReport ? "Your profile is waiting. So is the team." : reportDue ? "You've done the first look. Your report is ready to be written — the Companion and the rest open once it is." : midway ? "You're partway through. Pick up where you left off — your answers kept your place." : "Everything here begins with ten honest minutes. Start when you're ready."}</p>
        {state.paused && PARTS[state.paused.part] && (
          <button className="resumecard" onClick={() => { track("resume"); onResume(); }}>
            <span className="resumek">Saved for later</span>
            <span className="resumet">Pick up where you left off</span>
            <span className="resumes">{PARTS[state.paused.part].title}{state.paused.at === "run" ? ` · question ${state.paused.item + 1}` : ""} →</span>
          </button>
        )}
        <div className="hgrid">
          <HomeTile
            acc="#5C7CA3"
            title={hasReport ? "Your profile" : reportDue ? "Write my report" : midway ? "Continue the assessment" : "Take the assessment"}
            badge={hasReport ? (levelFor(strength) || {}).name : reportDue ? "Ready" : null}
            pulse={reportDue}
            sub={hasReport ? "Read your report. Save it, share it, retake parts." : reportDue ? "Your answers are in. Tap and it's written for you in about a minute. You can go deeper afterwards." : "Answer questions about yourself. Your first profile takes 10–15 minutes."}
            onClick={hasReport || reportDue ? () => { track(reportDue ? "report_recover" : "view_report"); go("report"); } : state.paused ? () => { track("resume"); onResume(); } : () => { track("assessment_start"); startAssessment(); }}
            art={<svg viewBox="0 0 60 40" className="hart"><circle cx="30" cy="20" r="12" fill="none" stroke={gold} strokeWidth="2"/><circle cx="30" cy="20" r="4" fill={gold}/></svg>}
          />
          <HomeTile
            acc="#D4A547"
            title="Profile strength"
            badge={`${strength.score} / 100`}
            sub={strengthStep ? `${strengthStep.what} to reach ${strengthStep.level.name}.` : "Everything iSHKiY can ask, you've answered."}
            onClick={() => { track("view_strength"); go("strength"); }}
            art={<svg viewBox="0 0 60 40" className="hart"><circle cx="30" cy="20" r="13" fill="none" stroke="currentColor" strokeWidth="3" opacity=".22"/><circle cx="30" cy="20" r="13" fill="none" stroke={gold} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(strength.score / 100) * 81.7} 81.7`} transform="rotate(-90 30 20)"/></svg>}
          />
          <HomeTile
            acc="#D4A547"
            title="Your companion"
            sub="Talk about your life and work with three AI voices that know your report and share one memory. Ten questions a day."
            locked={!hasReport} lockNote="Opens after your report is written."
            onClick={() => go("companion")}
            badge={hasReport && compLeft != null ? `${compLeft} left today` : null}
            art={<svg viewBox="0 0 60 40" className="hart"><circle cx="22" cy="20" r="9" fill="none" stroke={gold} strokeWidth="2"/><circle cx="38" cy="20" r="9" fill="none" stroke={faint} strokeWidth="2"/></svg>}
          />
          <HomeTile
            acc="#C06B5C"
            title="A human, when ready"
            sub="Real people to talk to, later. You choose what they see of you."
            locked={!hasReport} lockNote="Opens after your report is written."
            onClick={() => { track("view_humans"); go("humans"); }}
            art={<RotatingFaces />}
          />
          <HomeTile
            acc="#8A6FA0"
            title="The Library of You"
            sub={strength.allParts ? `Twelve lenses on relationships, drive, mind, money and purpose. ${strength.lenses} of ${strength.totalLenses} taken.` : "Twelve lenses on relationships, drive, mind, money and purpose. Browse now; they open at Full Portrait."}
            badge={strength.allParts ? `${strength.lenses}/${strength.totalLenses} taken` : "Opens at Full Portrait"}
            onClick={() => { track("view_library"); go("library"); }}
            art={<RotatingGlyphs />}
          />
          <HomeTile
            acc="#D4A547"
            title="The Constellation"
            sub="Your other iSHKiY apps, connected here. Only if you choose."
            onClick={() => go("constellation")}
            badge={(() => { if (!state.constellationInvite) return "Invite only"; const c = state.constellation || {}; const n = Object.values(c).filter((x) => x && x.linked).length; return n ? `${n} connected` : null; })()}
            art={<svg viewBox="0 0 60 40" className="hart"><circle cx="30" cy="20" r="4" fill={gold}/><circle cx="13" cy="12" r="2.5" fill="none" stroke={gold} strokeWidth="1.6"/><circle cx="47" cy="10" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" opacity=".4"/><circle cx="46" cy="31" r="2.5" fill="none" stroke={gold} strokeWidth="1.6"/><circle cx="12" cy="30" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" opacity=".4"/><line x1="26.5" y1="18" x2="15.3" y2="13" stroke={gold} strokeWidth="1.2" opacity=".6"/><line x1="33.5" y1="22" x2="43.8" y2="30" stroke={gold} strokeWidth="1.2" opacity=".6"/></svg>}
          />
          <HomeTile
            acc="#6F8F5E"
            title="Your account"
            sub="Back up your profile online. Optional. Delete it any time."
            onClick={() => go("account")}
            art={<svg viewBox="0 0 60 40" className="hart"><circle cx="30" cy="13" r="6.5" fill="none" stroke={gold} strokeWidth="2"/><path d="M17 34 Q30 24 43 34" fill="none" stroke="currentColor" strokeWidth="2" opacity=".4"/></svg>}
          />
        </div>
        <div className="hlinks">
          <button className="settingslink" onClick={() => { track("view_explainer"); go("explainerAgain"); }}>How iSHKiY works</button>
          <button className="settingslink" onClick={() => go("settings")}>Settings & your data</button>
        </div>
        <p className="hquote">The future is not artificial; it's authentically human.</p>
        <p className="privline">Everything here lives on your device. No one — iSHKiY included — sees your answers or conversations without your explicit say-so. We count anonymous taps (like “assessment started”) to improve the app — never your words.</p>
      </div>
    </Shell>
  );
}

/* ---------------- helper avatars ---------------- */
function Avatar({ kind, size = 34 }) {
  const g = "#D4A547", b = "#F5F1E8", i = "#0F1E3D";
  const inner = {
    // Sounding: ripples spreading from a dropped weight — how you find the depth.
    companion: <><circle cx="17" cy="17" r="4" fill={g}/><circle cx="17" cy="17" r="8" fill="none" stroke={g} strokeWidth="1.4" opacity=".55"/><circle cx="17" cy="17" r="12" fill="none" stroke={g} strokeWidth="1.2" opacity=".3"/></>,
    coach: <><circle cx="17" cy="17" r="11" fill="none" stroke={g} strokeWidth="1.8"/><path d="M11.5 20 L17 12.5 L22.5 20" fill="none" stroke={g} strokeWidth="2" strokeLinecap="round"/></>,
    mentor: <><path d="M7 22 A10 10 0 0 1 27 22" fill="none" stroke={g} strokeWidth="1.8"/><path d="M11 22 A6 6 0 0 1 23 22" fill="none" stroke={g} strokeWidth="1.8" opacity=".55"/><circle cx="17" cy="21" r="2.6" fill={g}/></>,
    // iSHKiY chooses: three arcs converging on one point.
    auto: <><circle cx="17" cy="17" r="3.2" fill={g}/><path d="M17 6 A11 11 0 0 1 26.5 22.5" fill="none" stroke={g} strokeWidth="1.6" opacity=".75"/><path d="M26.5 22.5 A11 11 0 0 1 7.5 22.5" fill="none" stroke={g} strokeWidth="1.6" opacity=".45"/><path d="M7.5 22.5 A11 11 0 0 1 17 6" fill="none" stroke={g} strokeWidth="1.6" opacity=".6"/></>,
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

Ground every answer in THEIR profile — their traits, values, interests, AND any Library lenses they have taken (attachment, closeness, conflict, drive, coping, pressure, resilience, money, aspiration, life story), plus their own words. If they have completed a lens, weave what it revealed into your answer when relevant. Describe what their profile shows in plain human language; never quote raw numbers or scores at them — they have no context for a number. Say "you lean toward the long view", not "your openness is 72". If a question can't be answered from the profile plus ordinary life-and-work wisdom, say so plainly rather than inventing.

Hard boundaries: you are not a clinician and the assessment is not clinically validated — never diagnose, never advise on medication or medical or legal matters; suggest a proper professional instead. If they express serious distress or thoughts of harming themselves, respond with warmth and care, don't lecture, and gently encourage them to talk to someone they trust or a professional soon. You may be honest that some questions deserve a human. Whenever you state a boundary or disclaimer — that you are not a clinician, that this is not therapy or medical or legal advice, or that a professional is the right next step — wrap that exact sentence in [! and !] markers so it can be shown clearly.

Always answer their newest message first — earlier turns are background only. If the newest message changes subject, follow the new subject fully; never drag the previous topic back in uninvited. You exist to help them think about decisions, work, and direction using what the assessment revealed.

FORMAT — always. Your first line must be a subject line in this exact form: ~three to five words naming what this exchange is about~ then a blank line, then your reply. The subject names THIS message's subject, not the conversation's history. End answers plainly, not with offers of further help.`;

const MODES = {
  /* Sounding is the old Guide and Sounding board merged — they were the same
     voice wearing two hats. A sounding is how you find the depth of the water
     you're actually in. It stays the default and the place you start. */
  companion: { label: "Sounding", colour: "#D4A547", vibe: "Quiet and roomy. Space to hear yourself think.", slogan: "Start here. Listens first, and helps you find the depth.", desc: "Reads you back. Good for untangling, and for decisions.", add: "\n\nMODE — SOUNDING: You are in sounding mode, the voice they start with. Your job is to help them hear themselves. Reflect back what they've said in cleaner words than they managed. Name the feeling underneath it if it's visible. Ask gentle questions that untangle rather than steer. Give less advice than Coach or Mentor would — but when they ask a direct question, or when a decision is genuinely on the table, answer it properly rather than hiding behind another question. Be explicit when relevant that this is thinking out loud, not counselling or therapy. If, and only if, what they raise clearly runs deeper than a chat can hold, you may once mention — gently, without selling — that iSHKiY can match them to a real person suited to how they work. Never pitch it twice, and never when it does not fit." },
  coach: { label: "Coach", colour: "#C06B5C", vibe: "Direct and kind. Believes in you enough to push.", slogan: "Pushes you to act. One step this week.", desc: "Forward motion. Expects you to act.", add: "\n\nMODE — COACH: You are in coach mode. Focus on the next concrete step, not the whole staircase. Hold them to what their profile says they're capable of — kindly, but without letting them off. Each reply should surface one specific action they could take this week, drawn from their scores and words. Ask at most one sharp question per reply. Do not comfort when a nudge serves better." },
  mentor: { label: "Mentor", colour: "#5C7CA3", vibe: "Unhurried. Sees the years, not just the week.", slogan: "The long view. What usually happens next.", desc: "The longer view. Been there, seen it.", add: "\n\nMODE — MENTOR: You are in mentor mode. Speak from experience and pattern: what tends to happen to people shaped like this, over years not weeks. Offer perspective before advice. Occasionally tell a short, plausible general truth about working life ('people with your pattern often…'). Never invent personal anecdotes or claim a biography. The gift of this mode is patience and the long view." },
};
const VOICES = Object.keys(MODES);

const COMPANION_DAYS = 7;
/* Two migrations, both idempotent and both safe to run on every load.
   v1 -> v2: one flat msgs array became a stream per voice.
   v2 -> v3: Guide and Sounding board merged into Sounding. Messages carry no
   timestamps, so the two histories can't be interleaved truthfully — the old
   sounding-board conversation is appended after the guide one behind a topic
   divider, which is honest about the seam rather than pretending there wasn't one. */
const migrate = (c) => {
  let out = c;
  if (!out.streams) {
    const streams = { companion: [], coach: [], mentor: [], sounding: [] };
    const home = streams[out.mode] ? out.mode : "companion";
    (out.msgs || []).forEach((m) => { const k = (m.m && streams[m.m]) ? m.m : home; streams[k].push(m); });
    out = { day: out.day, count: out.count || 0, mode: out.mode || "companion", streams, pulses: out.pulses || {} };
  }
  const old = (out.streams || {}).sounding;
  if (old) {
    const kept = [...(out.streams.companion || [])];
    const carried = old.filter((m) => !m.divider);
    if (carried.length) {
      if (kept.length) kept.push({ divider: true });
      carried.forEach((m) => kept.push(m.role === "assistant" ? { ...m, m: "companion" } : m));
    }
    const streams = { ...out.streams, companion: kept.slice(-40) };
    delete streams.sounding;
    const pulses = { ...(out.pulses || {}) };
    if (!pulses.companion && pulses.sounding) pulses.companion = pulses.sounding;
    delete pulses.sounding;
    out = { ...out, streams, pulses, mode: MODES[out.mode] ? out.mode : "companion" };
  }
  if (!MODES[out.mode]) out = { ...out, mode: "companion" };
  return out;
};
/* Migrate on read and write the result straight back, so the merge happens once
   rather than being redone from the old shape on every load. */
const loadCompanion = () => { const raw = loadC(); const m = migrate(raw); if (m !== raw) saveC(m); return m; };

/* Central memory. Every voice sees every conversation — the summaries first,
   then the last few lines verbatim so nothing important is lost to paraphrase.
   Deterministic on purpose: no extra API call, so it cannot fail or go stale. */
const centralMemory = (c, mode) => {
  const bits = [];
  VOICES.forEach((k) => {
    const st = (c.streams || {})[k] || [];
    const real = st.filter((m) => m.content && !m.divider);
    if (!real.length) return;
    const label = MODES[k].label;
    const pulse = (c.pulses || {})[k];
    const recent = real.slice(k === mode ? -2 : -4).map((m) =>
      (m.role === "user" ? "They said: " : label + " said: ") + String(m.content).replace(/\[!|!\]/g, "").replace(/\s+/g, " ").slice(0, 260));
    bits.push(`— With ${label}${k === mode ? " (this conversation)" : ""}, ${real.length} message${real.length === 1 ? "" : "s"} so far:`
      + (pulse ? `\n  Where it got to: ${pulse.replace(/\s+/g, " ")}` : "")
      + `\n  ${recent.join("\n  ")}`);
  });
  if (!bits.length) return "";
  return `\n\nSHARED MEMORY — everything this person has talked about with any voice:\n${bits.join("\n")}\n\nAll three voices share one memory. If something they raised elsewhere is relevant, use it as naturally as if they had told you directly — never announce that you are reading another conversation, never say "you mentioned to Coach". If they are picking up a thread from another voice, just continue it.`;
};

function Pulse({ mode, pulse, busy, onRefresh, canRefresh }) {
  return (
    <div className="pulse">
      <div className="pulsehead">
        <span className="mlabel"><Avatar kind={mode} size={15} /> Summary — the latest from this conversation</span>
        <button className="pulsebtn" disabled={busy || !canRefresh} onClick={onRefresh}>{busy ? "Listening…" : "Refresh"}</button>
      </div>
      {pulse
        ? <div className="pulsebody" dangerouslySetInnerHTML={{ __html: md(pulse) }} />
        : <p className="pulsebody dimtext">{canRefresh ? "A few exchanges in, the essence of this conversation gathers here — what you're circling, what you've decided, what's worth keeping." : "Start the conversation. The essence gathers here as you go."}</p>}
    </div>
  );
}

function Companion({ scores, answers, reportText, start, onHuman }) {
  const begun = start || Date.now();
  const dayNum = Math.min(COMPANION_DAYS, Math.floor((Date.now() - begun) / DAY) + 1);
  const ended = Date.now() - begun > COMPANION_DAYS * DAY;
  const [c, setC] = useState(() => loadCompanion());
  const [mode, setMode] = useState(() => c.mode || "companion");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyPulse, setBusyPulse] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [room, setRoom] = useState(null);
  const [routing, setRouting] = useState(false);
  const [choice, setChoice] = useState(null);
  const [dismissHuman, setDismissHuman] = useState(false);
  const endRef = useRef(null);
  const stream = c.streams[mode] || [];
  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [stream.length, busy]);
  useEffect(() => { setShowOld(false); }, [mode]);
  const left = Math.max(0, Q_CAP - c.count);
  const cRef = useRef(c); useEffect(() => { cRef.current = c; }, [c]);
  const commit = (fn) => setC((prev) => { const next = fn(prev); saveC(next); cRef.current = next; return next; });
const pick = (m) => { setMode(m); commit((prev) => ({ ...prev, mode: m })); };

  if (ended) return (
    <section className="companion noprint">
      <p className="kicker gold">Your Report Companion</p>
      <h2 className="ctitle">Your founding week has ended. Your report hasn't.</h2>
      <p className="cexplain">The report on this page is yours for good. The Companion — the three voices that read you properly — returns with iSHKiY membership, which founding members will hear about first. If a week of it earned a place in your thinking, tell us and we'll keep your seat.</p>
      <a className="rtbtn" href={"mailto:ops@ishkiy.com?subject=" + encodeURIComponent("Keep my Companion seat") + "&body=" + encodeURIComponent("My founding Companion week is over and I'd want it back when membership launches.")}>Keep my seat</a>
    </section>
  );

  /* commit: every state change goes through the freshest state, never a stale
     snapshot — this is what stops background writes erasing new messages. */
  
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

  const refreshPulse = async (streams, forMode) => {
    const target = forMode || mode;
    const st = (streams || cRef.current.streams)[target] || [];
    if (st.length < 2 || busyPulse) return;
    setBusyPulse(true);
    const transcript = st.slice(-12).map((m) => (m.role === "user" ? "You said: " : "Voice: ") + m.content).join("\n");
    const text = await fetchAI({
      system: "You summarise the LATEST part of a conversation for iSHKiY, speaking directly to the person it belongs to. Address them as \"you\" — never \"they\" or \"the user\". Weight the most recent exchanges heavily; older turns only if still live. UK English, plain, warm, no corporate words, no bullets, no headings. Return at most three short lines, each on its own line: what you just worked through; any decision or next step you named; one line worth keeping. If a line has nothing real to hold, leave it out. Nothing else.",
      messages: [{ role: "user", content: transcript }], max_tokens: 220,
    });
    if (text) commit((prev) => ({ ...prev, pulses: { ...(prev.pulses || {}), [target]: text } }));
    setBusyPulse(false);
  };

  const profileCtx = () => `PROFILE: ${JSON.stringify({ scores, minis: window.__eraMinis || null, theirWords: { role: answers["AR-2"], hardestPart: answers["AR-3"], goodDay: answers["AR-4"], neverTold: answers["MI-1"], atMyBest: answers["MI-3"] } })}\n\nTHEIR REPORT (for reference): ${String(reportText || "").slice(0, 5000)}`;

  /* ask({ q, to, fresh }) — `to` lets the router send a question to a voice the
     person isn't sitting in; `fresh` opens a new topic in that voice first. */
  const ask = async (opts = {}) => {
    const q = (opts.q != null ? opts.q : input).trim();
    const tm = opts.to && MODES[opts.to] ? opts.to : mode;
    if (!q || busy || left === 0) return;
    if (opts.q == null) setInput("");
    setBusy(true);
    const opening = (base) => {
      const b = [...base];
      if (opts.fresh && b.filter((m) => m.content).length) b.push({ divider: true });
      return [...b, { role: "user", content: q }].slice(-40);
    };
    commit((prev) => ({ ...prev, streams: { ...prev.streams, [tm]: opening(prev.streams[tm] || []) } }));
    /* Mirror the commit locally rather than reading cRef back — commit goes through
       a React state updater, which has not run yet at this point. */
    const before = cRef.current;
    const st = opening(before.streams[tm] || []);
    const ctx = profileCtx() + centralMemory(before, tm);
    const lastDiv = st.map((m, i) => (m.divider ? i : -1)).reduce((a, b) => Math.max(a, b), -1);
    const hist = st.slice(lastDiv + 1).filter((m) => !m.divider);
    track("ask", tm);
    const prevSubj = [...hist].reverse().find((m) => m.subj)?.subj || null;
    const focus = `\n\nTHE MESSAGE YOU MUST ANSWER NOW: "${q}"\nAnswer this and only this. Earlier turns are background. If this changes the subject${prevSubj ? ` from "${prevSubj}"` : ""}, follow it completely and do not return to the earlier subject unless asked.`;
    const raw = await fetchAI({ system: COMPANION_SYSTEM + MODES[tm].add + "\n\n" + ctx + focus, messages: hist.slice(-4).map(({ role, content }) => ({ role, content })), max_tokens: 500 });
    let subj = null, text = raw;
    if (raw) { const m0 = raw.match(/^\s*~([^~\n]{2,60})~\s*/); if (m0) { subj = m0[1].trim(); text = raw.slice(m0[0].length).trim(); } }
    if (text) {
      /* Same shape as `opening` above: computed here, not inside the updater, so
         the pulse refresh can see the result instead of reading a null. */
      const closing = (base) => {
        const b = [...base];
        for (let k = b.length - 1; k >= 0; k--) { if (b[k].role === "user") { b[k] = { ...b[k], subj }; break; } }
        return [...b, { role: "assistant", m: tm, subj, content: text }].slice(-40);
      };
      commit((prev) => ({ ...prev, day: today(), count: prev.count + 1, mode: tm, streams: { ...prev.streams, [tm]: closing(prev.streams[tm] || []) } }));
      const after = closing(st);
      if (after.length % 6 === 0) refreshPulse({ ...before.streams, [tm]: after }, tm);
    } else {
      commit((prev) => ({ ...prev, streams: { ...prev.streams, [tm]: [...(prev.streams[tm] || []), { role: "assistant", m: tm, err: true, content: "The line dropped before that reached me — a connection hiccup, not you. That question didn't use one of your ten. Give it a moment and ask again." }].slice(-40) } }));
    }
    setBusy(false);
  };

  /* The router. One cheap call decides which voice suits the question and whether
     it belongs to a conversation already running. It does not spend one of the
     ten — routing is plumbing, not an answer. If it fails for any reason we fall
     through to Sounding on a fresh topic, which is the safe default. */
  const routeQuestion = async (q) => {
    const running = VOICES.map((k) => {
      const real = ((cRef.current.streams || {})[k] || []).filter((m) => m.content && !m.divider);
      const lastDiv = ((cRef.current.streams || {})[k] || []).map((m, i) => (m.divider ? i : -1)).reduce((a, b) => Math.max(a, b), -1);
      const live = ((cRef.current.streams || {})[k] || []).slice(lastDiv + 1).filter((m) => m.content);
      const subj = [...live].reverse().find((m) => m.subj)?.subj;
      return real.length ? `${k} (${MODES[k].label}) — current topic: ${subj || "unnamed"}; ${live.length} messages in it` : `${k} (${MODES[k].label}) — no conversation yet`;
    }).join("\n");
    const raw = await fetchAI({
      system: `You route a question to one of three voices inside iSHKiY, then decide whether it continues a conversation already running or deserves a fresh one.

THE VOICES
companion (Sounding) — listening and untangling. Choose for feelings, confusion, "I don't know what I think", anything heavy, anything they need to hear themselves say. This is the default when it is not clearly one of the others.
coach (Coach) — pushes toward action. Choose when they want a decision made, a next step, accountability, or they are stuck in circles and need moving.
mentor (Mentor) — the long view. Choose for career shape, "where does this lead", patterns over years, questions about what usually happens to people like them.

CONVERSATIONS CURRENTLY RUNNING
${running}

Reply with exactly two lines and nothing else:
VOICE: <companion|coach|mentor>
NEW: <yes|no>

NEW is yes if the question opens a subject unrelated to that voice's current topic, or that voice has no conversation yet. NEW is no if it clearly continues the topic named above.`,
      messages: [{ role: "user", content: q }], max_tokens: 24,
    });
    const to = (String(raw || "").match(/VOICE:\s*(companion|coach|mentor)/i) || [])[1];
    const fresh = /NEW:\s*yes/i.test(String(raw || ""));
    const picked = to ? to.toLowerCase() : "companion";
    return { to: picked, fresh: to ? fresh : true, guessed: !to };
  };

  const askAuto = async () => {
    const q = input.trim(); if (!q || busy || left === 0) return;
    setInput(""); setRouting(true);
    const { to, fresh, guessed } = await routeQuestion(q);
    setRouting(false);
    track("auto_route", guessed ? "fallback" : to);
    setChoice({ to, fresh });
    pick(to); setRoom(to);
    await ask({ q, to, fresh });
  };

  const visible = showOld ? stream : stream.slice(-4);
  const hidden = stream.length - visible.length;
  const lastLine = (k) => { const st = c.streams[k] || []; const last = [...st].reverse().find((m) => m.content && !m.divider); return last ? String(last.content).replace(/\[!|!\]/g, "").slice(0, 64) : null; };
  const newTopic = () => commit((prev) => ({ ...prev, streams: { ...prev.streams, [mode]: [...(prev.streams[mode] || []), { divider: true }].slice(-40) } }));
  const enterRoom = (k) => { if (k !== "auto") pick(k); setChoice(null); setRoom(k); track("voice_open", k); };

  if (room === "auto") return (
    <section className="companion noprint room autoroom" style={{ borderTopColor: "#D4A547" }}>
      <button className="ghost inkghost" onClick={() => setRoom(null)}>← All voices</button>
      <div className="roomhead" style={{ background: "linear-gradient(180deg, #D4A5471f, transparent)" }}>
        <Avatar kind="auto" size={46} />
        <div>
          <p className="vcname big" style={{ color: "#D4A547" }}>Let iSHKiY choose</p>
          <p className="roomvibe">Say what's on your mind. We'll pick the voice that fits it.</p>
        </div>
      </div>
      <p className="cexplain">You don't have to know whether you need listening, pushing, or the long view. Ask, and we'll send it to whichever of the three suits — and start a new conversation if it's a new subject. Choosing costs you nothing; only the answer uses one of your {Q_CAP}.</p>
      {left > 0 ? (
        <div className="askrow">
          <textarea className="tarea askta" rows={3} value={input} placeholder="What's on your mind?" onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askAuto(); } }} />
          <button className="btn gold" disabled={busy || !input.trim()} onClick={askAuto}>{routing ? "Choosing…" : "Ask iSHKiY"}</button>
        </div>
      ) : (
        <p className="tnote">That's your {Q_CAP} for today. A night's thinking between conversations does more than an eleventh question would. It resets tomorrow.</p>
      )}
      <p className="tnote">{left} of {Q_CAP} questions left today, shared across all three voices.</p>
    </section>
  );

  if (!room) return (
    <section className="companion noprint">
      <p className="kicker gold">Your Companion</p>
      <h2 className="ctitle">Three voices. One memory between them.</h2>
      <p className="cexplain">Each voice keeps its own conversation, but all three remember everything you've said to any of them. They share {Q_CAP} questions a day between them — {left} left today. Day {dayNum} of your 7. No one can read these conversations, iSHKiY included.</p>
      <div className="voicehub">
        <button className="vcard vcauto" style={{ borderTopColor: "#D4A547" }} onClick={() => enterRoom("auto")}>
          <Avatar kind="auto" size={40} />
          <span className="vcname" style={{ color: "#D4A547" }}>Let iSHKiY choose</span>
          <span className="vcslogan">Not sure who you need? Just ask.</span>
          <span className="vclast dimtext">We'll pick the voice and the moment</span>
        </button>
        {Object.entries(MODES).map(([k, m]) => (
          <button key={k} className="vcard" style={{ borderTopColor: m.colour }} onClick={() => enterRoom(k)}>
            <Avatar kind={k} size={40} />
            <span className="vcname" style={{ color: m.colour }}>{m.label}</span>
            <span className="vcslogan">{m.slogan}</span>
            {lastLine(k) ? <span className="vclast">“{lastLine(k)}…”</span> : <span className="vclast dimtext">No conversation yet</span>}
          </button>
        ))}
      </div>
    </section>
  );

  const M = MODES[mode];
  return (
    <section className="companion noprint room" style={{ borderTopColor: M.colour }}>
      <button className="ghost inkghost" onClick={() => setRoom(null)}>← All voices</button>
      <div className="roomhead" style={{ background: `linear-gradient(180deg, ${M.colour}1f, transparent)` }}>
        <Avatar kind={mode} size={46} />
        <div>
          <p className="vcname big" style={{ color: M.colour }}>{M.label}</p>
          <p className="roomvibe">{M.vibe}</p>
        </div>
      </div>
      {choice && choice.to === mode && (
        <p className="routed"><Avatar kind="auto" size={14} /> iSHKiY sent this to {M.label}{choice.fresh ? ", on a new page" : ", carrying on where you left off"}.</p>
      )}
      <Pulse mode={mode} pulse={(c.pulses || {})[mode]} busy={busyPulse} onRefresh={() => refreshPulse()} canRefresh={stream.length >= 2} />
      {mode === "companion" && stream.length >= 8 && !dismissHuman && (
        <div className="humansignal">
          <span>Some things are easier with a person. When you're ready, iSHKiY can find one who fits how you work.</span>
          <div className="hsrow"><button className="rtbtn" onClick={onHuman}>See who fits</button><button className="hsdismiss" onClick={() => setDismissHuman(true)}>Not now</button></div>
        </div>
      )}
      <div className="chat">
        {hidden > 0 && !showOld && <button className="showold" onClick={() => setShowOld(true)}>Show the {hidden} earlier {hidden === 1 ? "message" : "messages"}</button>}
        {showOld && stream.length > 4 && <button className="showold" onClick={() => setShowOld(false)}>Fold the earlier messages away</button>}
        {visible.map((m, i) => m.divider
          ? <div key={i + (showOld ? 0 : hidden)} className="topicdiv"><span>new topic</span></div>
          : (<div key={i + (showOld ? 0 : hidden)} className={"msg " + m.role}>
          {m.role === "assistant" && !m.err && <span className="mlabel" style={{ color: M.colour }}><Avatar kind={m.m || "companion"} size={15} /> {(MODES[m.m] || MODES.companion).label}{m.subj ? <em className="msubj">· {m.subj}</em> : null}</span>}
          {m.role === "assistant" && m.err && <span className="mlabel dimmed">connection</span>}
          {m.role === "user" && m.subj && <span className="mlabel usubj">{m.subj}</span>}
          <div className={"bubble" + (m.err ? " errb" : "")} dangerouslySetInnerHTML={{ __html: md(m.content) }} />
        </div>))}
        {busy && <div className="msg assistant"><div className="bubble thinking">Reading you back…</div></div>}
        <div ref={endRef} />
      </div>
      {left > 0 ? (
        <>
        <div className="askrow">
          <textarea className="tarea askta" rows={3} value={input} placeholder={"Ask " + M.label + " anything…"} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); } }} />
          <button className="btn ink" disabled={busy || !input.trim()} onClick={() => ask()}>Ask</button>
        </div>
        {stream.length > 0 && <button className="showold" onClick={newTopic}>Start a new topic — fresh page, same voice</button>}
        </>
      ) : (
        <p className="tnote">That's your {Q_CAP} for today. A night's thinking between conversations does more than an eleventh question would. It resets tomorrow.</p>
      )}
      <p className="tnote">{left} of {Q_CAP} questions left today, shared across all three voices.</p>
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
  { name: "Maya Okafor", role: "Career counsellor", line: "Twenty years helping people leave roles that fit their CV but not their character.", fit: "when the problem is the path itself",
    suits: { values: ["Self-direction", "Stimulation"], riasec: ["A", "S"], forWho: "people ready to leave a box that no longer fits" } },
  { name: "David Hartley", role: "Mentor", line: "Built and sold two firms. Now sits with founders and lifers who suspect there's more.", fit: "when you know the direction but not the next move",
    suits: { values: ["Achievement", "Power"], riasec: ["E", "I"], forWho: "builders and starters weighing a bold next move" } },
  { name: "Priya Sharma", role: "Therapist, integrative", line: "Works where work and worth get tangled. Warm, unhurried, direct when it matters.", fit: "when the pattern is older than the job",
    suits: { values: ["Universalism", "Security"], big5Low: ["Steadiness"], forWho: "people whose pattern runs deeper than any one job" } },
  { name: "James Whitcombe", role: "Executive coach", line: "Former CFO who coaches the humans inside senior roles, not the roles.", fit: "when the title is fine and the Tuesday isn't",
    suits: { values: ["Achievement", "Security"], riasec: ["C", "E"], forWho: "senior people who look fine on paper and flat on Tuesday" } },
];

// Match score, described in words (never raw numbers to the user).
function matchScore(p, scores) {
  if (!scores || !scores.measured) return null;
  let pts = 0, max = 0; const reasons = [];
  const su = p.suits || {};
  if (su.values && scores.measured.values && scores.values) {
    max += 2; const top3 = scores.values.ranked.slice(0, 3);
    const hit = su.values.filter((v) => top3.includes(v));
    if (hit.length) { pts += Math.min(2, hit.length); reasons.push("shares what you care about most"); }
  }
  if (su.riasec && scores.measured.riasec && scores.riasec) {
    max += 2; const top2 = [scores.riasec.top, scores.riasec.second];
    const hit = su.riasec.filter((c) => top2.includes(c));
    if (hit.length) { pts += Math.min(2, hit.length); reasons.push("works where your interests point"); }
  }
  if (su.big5Low && scores.measured.big5 && scores.big5) {
    max += 1; const low = su.big5Low.some((t) => (scores.big5[t] ?? 100) < 45);
    if (low) { pts += 1; reasons.push("used to sitting with the harder weeks"); }
  }
  if (max === 0) return { band: null, reasons: [], forWho: su.forWho };
  const r = pts / max;
  const band = r >= 0.66 ? "Strong fit" : r >= 0.33 ? "Good fit" : "Worth a look";
  return { band, reasons: reasons.slice(0, 2), forWho: su.forWho };
}

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
      {scores && scores.measured
        ? <p className="tnote">Your matches below are worked out from your profile — and we show you why. The better we know you, the sharper they get.</p>
        : <p className="tnote">Finish your assessment and we'll match you to the people who fit how you actually work.</p>}
      <div className="praclist">
        {[...PRACTITIONERS].map((p) => ({ p, m: matchScore(p, scores) }))
          .sort((a, b) => (b.m?.pct ?? -1) - (a.m?.pct ?? -1))
          .map(({ p, m }) => (
          <div key={p.name} className="prac">
            <span className="demobadge">Illustrative profile — not yet a real practitioner</span>
            <div className="pmatchrow">
              <p className="pname">{p.name} <span className="prole">· {p.role}</span></p>
              {m && m.band && <span className="pmatch">{m.band}</span>}
            </div>
            <p className="pline">{p.line}</p>
            {m && m.reasons.length
              ? <p className="pwhy">Why you: {m.reasons.join("; ")}.</p>
              : <p className="pfit">For {p.suits.forWho}.</p>}
            <a className="rtbtn" href={mailto(p)}>Register interest</a>
          </div>
        ))}
      </div>
      <p className="tnote">When the circle is real, any booking fee will be built into the session price — never charged on top. Practitioners join free to begin with.</p>
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


function CompanionScreen({ state, scores, onBack, onRegenerate, onHuman }) {
  try {
    const mr = state.miniResults || {};
    window.__eraMinis = Object.keys(mr).length ? Object.fromEntries(Object.keys(mr).filter((id) => MINIS[id]).map((id) => { const r = readMini(id, mr[id]); return [id, { lens: MINIS[id].name, pattern: r && r.tag, read: r && r.headline, detail: r && r.bars.filter(([, v]) => v != null).map(([l, v]) => `${l}: ${bandOf("lens", v)}`).join("; ") }]; })) : null;
  } catch {}
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
        <h1 className="display ink">Three voices that read you.</h1>
        <p className="lede inkdim">Sounding, Coach, Mentor — ten questions a day, answered by voices that know your report line by line and remember everything you've told any of them.</p>
        <div className="teamrow">
          <Avatar kind="companion" /><Avatar kind="coach" /><Avatar kind="mentor" />
        </div>
        <p className="teamline">You don't have to know which one you need — iSHKiY can choose. Three voices, one memory, no judgement, and they've read every word you gave.</p>
        {state.report.preview
          ? <div className="previewnote"><p>Your report didn't finish writing, so the Companion is waiting. Your answers are safe — one tap tries again.</p><button className="btn gold" onClick={onRegenerate}>Write my real report</button></div>
          : <Companion scores={scores} answers={state.answers || {}} reportText={state.report.text} start={state.companionStart} onHuman={onHuman} />}
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

const useSession = () => {
  const [session, setSession] = useState(null);
  useEffect(() => {
    const sb = getSupa(); if (!sb) return;
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_e, sess) => setSession(sess));
    return () => sub.subscription.unsubscribe();
  }, []);
  return session;
};

function SectionHead({ kicker, title, line }) {
  return (<>
    <p className="kicker gold">{kicker}</p>
    <h1 className="display ink">{title}</h1>
    <p className="lede inkdim">{line}</p>
  </>);
}


/* ---------------- settings ---------------- */
function SettingsScreen({ state, update, onBack }) {
  const st = profileStrength(state);
  const done = st.parts;
  const level = levelFor(st);
  const exportAll = () => {
    const dump = { exportedAt: new Date().toISOString(), version: "1.14", answers: state.answers, completedAt: state.completedAt, report: state.report, miniResults: state.miniResults, level: level ? level.name : null, strength: st.score };
    const b = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(b); const a = document.createElement("a");
    a.href = url; a.download = "my-ishkiy-data.json"; a.click(); URL.revokeObjectURL(url);
    track("export");
  };
  const resetAssessment = () => { if (confirm("Reset your main assessment? Your answers, report and badges are cleared from this device. Your Library lenses stay. This can't be undone.")) { const n = { ...state, answers: {}, completedAt: {}, report: null, arc: null, part: 0, item: 0 }; save(n); location.reload(); } };
  const resetMini = (id) => { if (confirm("Reset this lens?")) { const mr = { ...(state.miniResults || {}) }; delete mr[id]; const ma = { ...(state.miniAnswers || {}) }; delete ma[id]; update({ miniResults: mr, miniAnswers: ma }); } };
  const resetAll = () => { if (confirm("Clear EVERYTHING on this device — assessment, report, lenses, conversations? This cannot be undone.")) { localStorage.clear(); location.reload(); } };
  return (
    <div className="reportpage tint-sage">
      <div className="rhead noprint"><button className="ghost inkghost" onClick={onBack}>← Home</button><Wordmark /><span /></div>
      <article className="report">
        <p className="kicker gold">Settings</p>
        <h1 className="display ink">Your space, your say.</h1>

        <div className="setgroup">
          <p className="setlabel">Your assessment</p>
          <div className="setrow"><span>Progress</span><span className="tnum">{done} of {PARTS.length} parts{level ? " · " + level.name : ""}</span></div>
          {done > 0 && done < PARTS.length && <button className="setbtn" onClick={() => update({ arc: "more", phase: "chooseDepth" })}>Continue the assessment →</button>}
          <button className="setbtn warn" onClick={resetAssessment}>Reset main assessment</button>
        </div>

        <div className="setgroup">
          <p className="setlabel">Your Library lenses</p>
          {Object.keys(MINIS).map((id) => (
            <div key={id} className="setrow"><span>{MINIS[id].name}</span>
              {(state.miniResults || {})[id]
                ? <button className="setmini" onClick={() => resetMini(id)}>Reset</button>
                : <span className="tnote" style={{margin:0}}>Not taken</span>}
            </div>
          ))}
        </div>

        <div className="setgroup">
          <p className="setlabel">Appearance</p>
          <button className="setbtn" onClick={() => update({ dark: !state.dark })}>{state.dark ? "Switch to light mode" : "Switch to dark mode"}</button>
          <button className="setbtn" onClick={() => update({ phase: "explainer" })}>Watch the intro again</button>
        </div>

        <div className="setgroup">
          <p className="setlabel">Your data</p>
          <p className="tnote">Everything lives on this device. No one — iSHKiY included — can read your answers or conversations. We count anonymous taps to improve the app, never your words.</p>
          <button className="setbtn" onClick={exportAll}>Export my data (a file I keep)</button>
          <button className="setbtn warn" onClick={resetAll}>Delete everything from this device</button>
        </div>

        <p className="hquote">Stay yourself. The rest follows.</p>
      </article>
    </div>
  );
}

function AccountScreen({ state, scores, onBack }) {
  const sb = getSupa();
  const session = useSession();
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const sendLink = async () => {
    if (!email.trim() || busy) return; setBusy(true);
    const { error } = await sb.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: window.location.origin } });
    setNote(error ? "That didn't send — check the address and try again." : "A sign-in link is on its way to your inbox. Tap it and you'll land back here, signed in.");
    setBusy(false);
  };
  const syncUp = async () => {
    if (busy) return; setBusy(true);
    const payload = { report: state.report ? { text: state.report.text, preview: !!state.report.preview } : null, scores, name: (state.answers || {})["AR-1"] || null, savedAt: Date.now() };
    const { error } = await sb.from("living_profiles").upsert({ user_id: session.user.id, payload, updated_at: new Date().toISOString() });
    setNote(error ? "The copy didn't take — try again in a moment." : "Backed up. Your device is still home; the cloud is just a copy.");
    setBusy(false);
  };
  const burn = async () => {
    if (busy) return;
    if (!confirm("Delete your cloud copy? Your device keeps everything.")) return;
    setBusy(true);
    const { error } = await sb.from("living_profiles").delete().eq("user_id", session.user.id);
    setNote(error ? "That didn't delete — try again." : "Gone. Nothing of you remains in the cloud.");
    setBusy(false);
  };
  return (
    <div className="reportpage">
      <div className="rhead noprint"><button className="ghost inkghost" onClick={onBack}>← Home</button><Wordmark /><span /></div>
      <article className="report" style={{ maxWidth: 520 }}>
        <SectionHead kicker="Your account" title="A copy you can burn." line="ERA lives on your device — that doesn't change. An account adds one thing: a cloud copy of your profile, so a lost phone doesn't mean a lost you. Optional. Deletable. Yours." />
        {!sb && <p className="cbridge">Accounts are coming online shortly. Everything else in ERA works fully without one — this screen simply isn't wired to the cloud yet.</p>}
        {sb && !session && (<>
          <input className="codeinput" style={{ textTransform: "none", letterSpacing: 0, maxWidth: 320 }} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" onKeyDown={(e) => e.key === "Enter" && sendLink()} />
          <button className="btn gold" disabled={busy || !email.trim()} onClick={sendLink}>{busy ? "Sending…" : "Email me a sign-in link"}</button>
          <p className="cfoot" style={{ textAlign: "left", marginTop: 14 }}>No passwords here. A link arrives, you tap it, you're in.</p>
        </>)}
        {sb && session && (<>
          <p className="cline">Signed in as <b>{session.user.email}</b>.</p>
          <div className="cactions" style={{ justifyContent: "flex-start" }}>
            <button className="btn gold" disabled={busy || !state.report} onClick={syncUp}>Back up my profile</button>
            <button className="ghost inkghost" disabled={busy} onClick={burn}>Delete cloud copy</button>
            <button className="ghost inkghost" onClick={() => sb.auth.signOut()}>Sign out</button>
          </div>
          {!state.report && <p className="cfoot" style={{ textAlign: "left" }}>Complete your assessment first and there'll be something worth copying.</p>}
        </>)}
        {note && <p className="cbridge" style={{ marginTop: 18 }}>{note}</p>}
        <p className="integrity">Your email is used for sign-in and nothing else. Your cloud copy is readable by you alone — not practitioners, not iSHKiY — until the day you explicitly share it, and it deletes the moment you say so.</p>
      </article>
    </div>
  );
}

const DISCIPLINES = { therapist: "Therapist", counsellor: "Counsellor", coach: "Coach", mentor: "Mentor", ifa: "Independent financial adviser", pt: "Personal trainer", physio: "Physiotherapist" };

function Directory({ state, scores }) {
  const sb = getSupa();
  const session = useSession();
  const [rows, setRows] = useState(null);
  const [share, setShare] = useState(null); // practitioner being shared with
  const [picks, setPicks] = useState([]);
  useEffect(() => { if (!sb) return; sb.from("practitioners").select("*").then(({ data }) => setRows(data || [])); }, []);
  if (!sb || rows === null) return null;
  if (!rows.length) return <p className="cbridge">The first vetted humans are being welcomed now — this space fills as each one is approved by hand.</p>;
  const SECTIONS = [
    { id: "scores", label: "My dimension scores" },
    { id: "report", label: "My full written report" },
    { id: "words", label: "My own words (key answers)" },
  ];
  const buildPack = (p) => {
    const a = state.answers || {};
    let out = `iSHKiY ERA — shared by its owner with ${p.name} (${DISCIPLINES[p.discipline] || p.discipline})\nShared: ${new Date().toLocaleDateString("en-GB")}\nThis was shared deliberately and can be revoked. Treat it with care.\n\n`;
    if (picks.includes("scores")) out += "== DIMENSION SCORES ==\n" + JSON.stringify(scores, null, 2) + "\n\n";
    if (picks.includes("words")) out += `== IN THEIR OWN WORDS ==\nRole: ${a["AR-2"] || "—"}\nHardest part: ${a["AR-3"] || "—"}\nA good day: ${a["AR-4"] || "—"}\nAt my best: ${a["MI-3"] || "—"}\n\n`;
    if (picks.includes("report")) out += "== THE REPORT ==\n" + (state.report ? state.report.text : "(no report yet)") + "\n";
    const b = new Blob([out], { type: "text/plain" });
    const el = document.createElement("a"); el.href = URL.createObjectURL(b); el.download = "era-share-pack.txt"; el.click(); URL.revokeObjectURL(el.href);
    if (session) sb.from("share_grants").insert({ user_id: session.user.id, practitioner_id: p.id, sections: picks }).then(() => {});
    setShare(null); setPicks([]);
  };
  return (
    <div style={{ marginTop: 8 }}>
      {rows.map((p) => (
        <div key={p.id} className="capp" style={{ opacity: 1, filter: "none", cursor: "default", width: "100%", marginBottom: 12 }}>
          <span className="cname">{p.name}</span>
          <span className="ctag">{DISCIPLINES[p.discipline] || p.discipline}</span>
          {p.bio && <span className="cstate">{p.bio}</span>}
          <div className="cactions" style={{ justifyContent: "flex-start", marginTop: 10 }}>
            {p.booking_url && <button className="btn ink" onClick={() => window.open(p.booking_url, "_blank")}>Book a conversation</button>}
            <button className="ghost inkghost" onClick={() => { setShare(share === p.id ? null : p.id); setPicks([]); }}>Share my profile with them</button>
          </div>
          {share === p.id && (
            <div style={{ marginTop: 10, width: "100%" }}>
              {SECTIONS.map((sec) => (
                <label key={sec.id} className="crow"><input type="checkbox" checked={picks.includes(sec.id)} onChange={() => setPicks((v) => v.includes(sec.id) ? v.filter((x) => x !== sec.id) : [...v, sec.id])} /><span><b>{sec.label}</b></span></label>
              ))}
              <button className="btn gold" style={{ marginTop: 12 }} disabled={!picks.length} onClick={() => buildPack(p)}>Download the share pack</button>
              <p className="cfoot" style={{ textAlign: "left" }}>The pack downloads to your device and you hand it over yourself — by email, in person, however you choose. Nothing is sent anywhere automatically.{session ? " A record of this consent is kept in your account." : ""}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ApplyScreen({ onBack }) {
  const sb = getSupa();
  const [f, setF] = useState({ name: "", email: "", discipline: "coach", registration_body: "", registration_number: "", insurance_confirmed: false, bio: "", booking_url: "", apps: ["era"] });
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const submit = async () => {
    if (busy || !f.name.trim() || !f.email.trim()) return; setBusy(true);
    const { error } = await sb.from("practitioners").insert({ ...f, status: "pending" });
    if (!error) setSent(true);
    setBusy(false);
  };
  return (
    <div className="reportpage">
      <div className="rhead noprint"><button className="ghost inkghost" onClick={onBack}>← Back</button><Wordmark /><span /></div>
      <article className="report" style={{ maxWidth: 520 }}>
        <SectionHead kicker="For practitioners" title="Join the human layer." line="iSHKiY introduces people to vetted humans — therapists, coaches, mentors, advisers — at the moment they're ready. Every application is read and approved by a person. That's the point." />
        {!sb && <p className="cbridge">Applications open shortly — this form isn't wired to the backend yet.</p>}
        {sb && sent && <p className="cbridge">Received, with thanks. Every application is read personally — you'll hear back by email either way. What you build with people from here matters to us.</p>}
        {sb && !sent && (<>
          <input className="codeinput" style={{ textTransform: "none", letterSpacing: 0, maxWidth: "100%" }} placeholder="Your name" value={f.name} onChange={(e) => set("name", e.target.value)} />
          <input className="codeinput" style={{ textTransform: "none", letterSpacing: 0, maxWidth: "100%" }} type="email" placeholder="Email" value={f.email} onChange={(e) => set("email", e.target.value)} />
          <select className="codeinput" style={{ textTransform: "none", letterSpacing: 0, maxWidth: "100%" }} value={f.discipline} onChange={(e) => set("discipline", e.target.value)}>
            {Object.entries(DISCIPLINES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input className="codeinput" style={{ textTransform: "none", letterSpacing: 0, maxWidth: "100%" }} placeholder="Professional body (e.g. BACP, UKCP, EMCC, ICF)" value={f.registration_body} onChange={(e) => set("registration_body", e.target.value)} />
          <input className="codeinput" style={{ textTransform: "none", letterSpacing: 0, maxWidth: "100%" }} placeholder="Registration number" value={f.registration_number} onChange={(e) => set("registration_number", e.target.value)} />
          <input className="codeinput" style={{ textTransform: "none", letterSpacing: 0, maxWidth: "100%" }} placeholder="Booking link (Calendly or similar)" value={f.booking_url} onChange={(e) => set("booking_url", e.target.value)} />
          <textarea className="codeinput" style={{ textTransform: "none", letterSpacing: 0, maxWidth: "100%", minHeight: 90, resize: "vertical" }} placeholder="A few lines on how you work, in your own voice — this is what people will read." value={f.bio} onChange={(e) => set("bio", e.target.value)} />
          <label className="crow"><input type="checkbox" checked={f.insurance_confirmed} onChange={(e) => set("insurance_confirmed", e.target.checked)} /><span><b>I hold current professional indemnity insurance</b></span></label>
          <button className="btn gold" style={{ marginTop: 14 }} disabled={busy || !f.name.trim() || !f.email.trim()} onClick={submit}>{busy ? "Sending…" : "Send my application"}</button>
        </>)}
      </article>
    </div>
  );
}

function HumansScreen({ scores, state, onBack, onApply }) {
  return (
    <div className="reportpage tint-clay">
      <div className="rhead noprint">
        <button className="ghost inkghost" onClick={onBack}>← Home</button>
        <Wordmark />
        <span />
      </div>
      <article className="report">
        <p className="kicker gold">A human, when ready</p>
        <h1 className="display ink">Real people, on your terms.</h1>
        <p className="lede inkdim">Counsellors, mentors and coaches — because human connection brings what AI never can. You choose who sees what, and when. Or no one, and that's fine too.</p>
        <Directory state={state} scores={scores} />
        <Practitioners scores={scores} />
        <p className="cfoot" style={{ marginTop: 26 }}>Are you a therapist, coach, mentor or adviser? <button className="cimport" style={{ display: "inline", margin: 0 }} onClick={onApply}>Apply to join the human layer →</button></p>
      </article>
    </div>
  );
}


/* ---------------- explainer (what iSHKiY is) ---------------- */
/* The opening deck. Slides two and three say what it's for before the rest
   says how it works — nobody cares how a thing is built until they know which
   of their problems it answers. */
const EXPLAIN = [
  { art: "orb", line: "iSHKiY is a place to understand yourself.", sub: "Not to fix you. You were never broken." },
  { art: "storm", line: "For getting back up.", sub: "A setback is easier to carry when you know how you're built — what steadies you, what drains you, what you reach for when it's hard." },
  { art: "shield", line: "For protecting your mind.", sub: "Most of what wears people down at work isn't the work. It's doing it in a shape that doesn't fit them. Knowing your shape is how you stop paying that tax." },
  { art: "fork", line: "For the choices that keep you up.", sub: "Hard decisions are usually hard because you don't yet know what you actually want. This is how you find out." },
  { art: "mirror", line: "It starts with a few honest questions.", sub: "What you're for. How you work. What pulls you." },
  { art: "report", line: "You get a report written just for you.", sub: "Yours to keep. No one else can read it." },
  { art: "library", line: "Finish it, and the Library opens.", sub: "Twelve more lenses across Relationships, Drive, Mind, Money and Purpose. How you attach. How you fight. Where your idea of ‘enough’ came from. They unlock when your portrait is full." },
  { art: "voices", line: "Then a team who have read it — standing behind you.", sub: "One to listen, one to push, one for the long view. They share one memory of you, and they don't forget." },
  { art: "heart", line: "And, when you're ready, a real human to talk to.", sub: "Chosen to fit you — because they understand how you work." },
];
function ExplainArt({ kind }) {
  if (kind === "orb") return <Orb size={104} />;
  if (kind === "mirror") return <svg viewBox="0 0 120 104" className="exart"><ellipse cx="60" cy="50" rx="30" ry="40" fill="none" stroke="#D4A547" strokeWidth="2.4"/><ellipse cx="60" cy="50" rx="20" ry="30" fill="rgba(212,165,71,0.12)"/></svg>;
  if (kind === "report") return <svg viewBox="0 0 120 104" className="exart"><rect x="38" y="24" width="44" height="56" rx="5" fill="none" stroke="#D4A547" strokeWidth="2.4"/><line x1="46" y1="38" x2="74" y2="38" stroke="#D4A547" strokeWidth="2"/><line x1="46" y1="48" x2="70" y2="48" stroke="#F5F1E8" strokeWidth="2" opacity="0.6"/><line x1="46" y1="58" x2="72" y2="58" stroke="#F5F1E8" strokeWidth="2" opacity="0.6"/></svg>;
  /* A team standing behind one person — three of them, at their back. */
  if (kind === "voices") return (
    <svg viewBox="0 0 120 104" className="exart">
      <g fill="none" stroke="rgba(245,241,232,0.38)" strokeWidth="2">
        <circle cx="28" cy="34" r="7" /><path d="M17 52 A11 11 0 0 1 39 52" />
        <circle cx="60" cy="28" r="7" /><path d="M49 46 A11 11 0 0 1 71 46" />
        <circle cx="92" cy="34" r="7" /><path d="M81 52 A11 11 0 0 1 103 52" />
      </g>
      <circle cx="60" cy="64" r="12" fill="none" stroke="#D4A547" strokeWidth="2.6" />
      <path d="M40 92 A20 20 0 0 1 80 92" fill="none" stroke="#D4A547" strokeWidth="2.6" />
    </svg>
  );
  /* The five Library subjects in a ring around a keyhole: what finishing opens. */
  if (kind === "library") {
    const ring = ["closeness", "drive", "mind", "money", "becoming"];
    return (
      <svg viewBox="0 0 120 104" className="exart">
        {ring.map((id, k) => {
          const a = -Math.PI / 2 + (k * 2 * Math.PI) / ring.length, x = 60 + 38 * Math.cos(a), y = 52 + 38 * Math.sin(a);
          return <g key={id} transform={`translate(${x - 12} ${y - 12})`} stroke={SUBJ_ACC[id]}><SubjectGlyph id={id} /></g>;
        })}
        <circle cx="60" cy="52" r="15" fill="rgba(212,165,71,0.14)" stroke="#D4A547" strokeWidth="2" />
        <circle cx="60" cy="48.5" r="3.6" fill="#D4A547" /><path d="M58 51 L56.8 59 H63.2 L62 51 Z" fill="#D4A547" />
      </svg>
    );
  }
  // A line knocked down, and rising past where it fell.
  if (kind === "storm") return <svg viewBox="0 0 120 104" className="exart"><path d="M22 46 L44 46 L56 72 L70 30 L82 58 L98 58" fill="none" stroke="rgba(245,241,232,0.35)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M70 30 L82 58 L98 58" fill="none" stroke="#D4A547" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/><circle cx="98" cy="58" r="4" fill="#D4A547"/></svg>;
  // Something held around something soft.
  if (kind === "shield") return <svg viewBox="0 0 120 104" className="exart"><path d="M60 22 L86 32 V54 C86 70 74 80 60 84 C46 80 34 70 34 54 V32 Z" fill="none" stroke="#D4A547" strokeWidth="2.4" strokeLinejoin="round"/><circle cx="60" cy="53" r="9" fill="rgba(212,165,71,0.16)" stroke="rgba(245,241,232,0.45)" strokeWidth="1.8"/></svg>;
  // One road becoming two, one of them chosen.
  if (kind === "fork") return <svg viewBox="0 0 120 104" className="exart"><path d="M60 84 V56" fill="none" stroke="#D4A547" strokeWidth="2.6" strokeLinecap="round"/><path d="M60 56 L36 28" fill="none" stroke="rgba(245,241,232,0.35)" strokeWidth="2.2" strokeLinecap="round"/><path d="M60 56 L84 28" fill="none" stroke="#D4A547" strokeWidth="2.6" strokeLinecap="round"/><circle cx="84" cy="28" r="4.5" fill="#D4A547"/><circle cx="36" cy="28" r="3.5" fill="none" stroke="rgba(245,241,232,0.35)" strokeWidth="1.8"/></svg>;
  return <svg viewBox="0 0 120 104" className="exart"><path d="M60 76 C30 56 34 34 50 34 C58 34 60 42 60 42 C60 42 62 34 70 34 C86 34 90 56 60 76 Z" fill="none" stroke="#D4A547" strokeWidth="2.4" strokeLinejoin="round"/></svg>;
}
/* Swipeable, draggable, and driveable from the keyboard — all three, because a
   carousel that only answers to a thumb locks out anyone not using one.
   `done` is the label on the last slide: "Begin" on first run, "Done" when
   somebody has come back to re-read it. */
function Explainer({ onDone, done = "Begin" }) {
  const [i, setI] = useState(0);
  const [drag, setDrag] = useState(0);
  const startX = useRef(null);
  /* The live drag distance lives in a ref as well as state: state drives the
     visual nudge, but touchend can land in the same frame as touchmove, and a
     state read there would still be the previous render's zero. */
  const dragRef = useRef(0);
  const region = useRef(null);
  const n = EXPLAIN.length;
  const last = i === n - 1;
  const go = (k) => setI(Math.max(0, Math.min(n - 1, k)));

  const down = (x) => { startX.current = x; dragRef.current = 0; setDrag(0); };
  const move = (x) => { if (startX.current == null) return; dragRef.current = x - startX.current; setDrag(dragRef.current); };
  const up = () => {
    if (startX.current == null) return;
    const d = dragRef.current;
    startX.current = null; dragRef.current = 0; setDrag(0);
    if (Math.abs(d) > 45) go(i + (d < 0 ? 1 : -1));
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); go(i + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(i - 1); }
      else if (e.key === "Home") { e.preventDefault(); go(0); }
      else if (e.key === "End") { e.preventDefault(); go(n - 1); }
      else if (e.key === "Escape") onDone();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, n]);

  const s = EXPLAIN[i];
  return (
    <Shell dark>
      <div
        className="glimmer explainer"
        ref={region}
        role="region"
        aria-roledescription="carousel"
        aria-label="What iSHKiY is"
        onTouchStart={(e) => down(e.touches[0].clientX)}
        onTouchMove={(e) => move(e.touches[0].clientX)}
        onTouchEnd={up}
        onMouseDown={(e) => down(e.clientX)}
        onMouseMove={(e) => (startX.current != null ? move(e.clientX) : null)}
        onMouseUp={up}
        onMouseLeave={up}
      >
        <div className="exslide" style={{ transform: `translateX(${drag * 0.35}px)` }}>
          <div className="exwrap" key={i}><ExplainArt kind={s.art} /></div>
          <div aria-live="polite" aria-atomic="true">
            <p className="exstep">{i + 1} of {n}</p>
            <p className="gline exline" key={"l" + i}>{s.line}</p>
            <p className="gsub" key={"s" + i}>{s.sub}</p>
          </div>
        </div>
        <div className="exdots" role="tablist" aria-label="Slides">
          {EXPLAIN.map((sl, k) => (
            <button key={k} role="tab" aria-selected={k === i} aria-label={`Slide ${k + 1}: ${sl.line}`}
              className={"exdot" + (k === i ? " on" : "")} onClick={() => go(k)} />
          ))}
        </div>
        <div className="exnav">
          <button className="exback" onClick={() => go(i - 1)} disabled={i === 0} aria-label="Previous slide">← Back</button>
          <button className="btn gold" onClick={() => (last ? onDone() : go(i + 1))}>{last ? done : "Next"}</button>
        </div>
        {!last && <button className="exskip" onClick={onDone}>Skip</button>}
        <p className="exhint">Swipe, or use the arrow keys.</p>
      </div>
    </Shell>
  );
}

/* ---------------- choose your depth ---------------- */
function ChooseDepth({ state, onPick, onBack }) {
  const done = partsDone(state.completedAt);
  const hasStarter = (state.completedAt || {})["values"] && (state.completedAt || {})["big5"];
  return (
    <Shell>
      <div className="intro">
        <button className="ghost inkghost" onClick={onBack}>← Home</button>
        <p className="kicker gold">How deep, today?</p>
        <h1 className="display ink">Start small. Go deeper when you want.</h1>
        <p className="lede inkdim">You don't have to do it all at once. Every part you finish makes your report truer — and you can always come back.</p>
        <div className="depthgrid">
          <button className="depthcard" onClick={() => onPick("starter")}>
            <span className="depthtime">10–15 min</span>
            <span className="depthname">A first look</span>
            <span className="depthsub">Your values and how you work. Enough for a real report and your first badge.</span>
          </button>
          <button className="depthcard" onClick={() => onPick("core")}>
            <span className="depthtime">+15 min</span>
            <span className="depthname">A fuller picture</span>
            <span className="depthsub">Adds how you think, how you feel, and what pulls you.</span>
          </button>
          <button className="depthcard" onClick={() => onPick("full")}>
            <span className="depthtime">+15–20 min</span>
            <span className="depthname">The whole portrait</span>
            <span className="depthsub">Every part. The deepest, truest mirror.</span>
          </button>
        </div>
        <p className="tnote">Most people start with the first look and come back. Nothing is lost between visits, and each part you add makes the report truer.</p>
      </div>
    </Shell>
  );
}

/* ---------------- profile strength ----------------
   The one screen that answers "how much of me is in here, and what would
   adding more actually get me". Every rung says what it changes, not just
   what it's called — a level nobody can cash in is just a sticker. */
function StrengthMeter({ score }) {
  const r = 54, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 130 130" className="smeter" role="img" aria-label={`Profile strength ${score} out of 100`}>
      <circle cx="65" cy="65" r={r} fill="none" stroke="var(--ink12)" strokeWidth="9" />
      <circle cx="65" cy="65" r={r} fill="none" stroke="#D4A547" strokeWidth="9" strokeLinecap="round"
        strokeDasharray={`${(score / 100) * c} ${c}`} transform="rotate(-90 65 65)" />
      <text x="65" y="62" textAnchor="middle" className="smetern">{score}</text>
      <text x="65" y="82" textAnchor="middle" className="smeterl">of 100</text>
    </svg>
  );
}
function StrengthScreen({ state, onBack, onAssessment, onLibrary }) {
  const st = profileStrength(state);
  const level = levelFor(st);
  const step = nextStep(st);
  const partPct = Math.round((st.parts / st.totalParts) * 100);
  const lensPct = st.totalLenses ? Math.round((st.lenses / st.totalLenses) * 100) : 0;
  return (
    <div className="reportpage tint-heather">
      <div className="rhead noprint"><button className="ghost inkghost" onClick={onBack}>← Home</button><Wordmark /><span /></div>
      <article className="report">
        <p className="kicker gold">Profile strength</p>
        <h1 className="display ink">{level ? level.name : "Not started yet"}</h1>
        <StrengthMeter score={st.score} />
        <p className="lede inkdim">{level ? level.blurb : "Answer your first part and the picture begins."}</p>

        {step && (
          <div className="nextrung">
            <p className="nextrungk">Next</p>
            <p className="nextrungn">{step.level.name} — {step.level.accuracy}</p>
            <p className="nextrungw">{step.what}.</p>
            {step.kind === "parts" && <button className="rtbtn" onClick={onAssessment}>Continue the assessment</button>}
            {step.kind === "lens" && <button className="rtbtn" onClick={onLibrary}>Open the Library</button>}
          </div>
        )}

        <div className="sbreak">
          <div className="sbrow">
            <div className="sbhead"><span>The assessment</span><span className="tnum">{st.parts} of {st.totalParts} parts</span></div>
            <div className="track"><div className="fill" style={{ width: `${partPct}%` }} /></div>
            <p className="sbnote">Worth {PARTS_WEIGHT} of your 100. This is the spine of the profile — every part adds a dimension your report and your Companion can actually use.</p>
          </div>
          <div className="sbrow">
            <div className="sbhead"><span>The Library</span><span className="tnum">{st.lenses} of {st.totalLenses} lenses</span></div>
            <div className="track"><div className="fill" style={{ width: `${lensPct}%` }} /></div>
            <p className="sbnote">Worth {LENS_WEIGHT} of your 100. Lenses reach where the assessment can't — relationships, drive, mind, money and purpose. They open at Full Portrait.</p>
          </div>
        </div>

        <div className="rungs">
          {LEVELS.map((L) => {
            const got = meets(L, st);
            const here = level && level.id === L.id;
            return (
              <div key={L.id} className={"rung" + (got ? " got" : "") + (here ? " here" : "")}>
                <i className="rungdot" />
                <div>
                  <p className="rungn">{L.name}{here ? <em className="rungyou"> — you are here</em> : null}</p>
                  <p className="rungb">{got ? L.next : L.blurb}</p>
                </div>
              </div>
            );
          })}
        </div>
        <p className="integrity">Strength measures how much of yourself you've put in — not how well you scored. There are no good or bad profiles here, only fuller and thinner ones.</p>
      </article>
    </div>
  );
}

/* ---------------- badge earned ---------------- */
function BadgeScreen({ state, onDone }) {
  const st = profileStrength(state);
  const level = levelFor(st);
  const step = nextStep(st);
  const lit = level ? LEVELS.findIndex((l) => l.id === level.id) + 1 : 0;
  return (
    <Shell dark>
      <div className="glimmer">
        <div className="badgeorb"><Orb size={92} /><span className="badgestars" aria-hidden="true">{LEVELS.map((_, k) => <i key={k} className={"bstar" + (k < lit ? " lit" : "")} />)}</span></div>
        <p className="kicker gold">Badge earned</p>
        <p className="gline">{level ? level.name : "First steps"}</p>
        <p className="gsub">{level ? level.blurb : "You've begun."}</p>
        <p className="badgestrength">Profile strength <strong>{st.score}</strong> / 100</p>
        {step && <p className="badgenext">{step.what} to earn <strong>{step.level.name}</strong> — {step.level.accuracy}.</p>}
        <button className="btn gold" onClick={onDone}>See my report</button>
      </div>
    </Shell>
  );
}


/* ---------------- mini-assessment runner ---------------- */
function MiniRunner({ miniId, answers, onDone, onBack }) {
  const m = MINIS[miniId];
  const [i, setI] = useState(0);
  const [a, setA] = useState(answers || {});
  const item = m.items[i];
  const total = m.items.length;
  const set = (val, auto) => {
    const na = { ...a, [item.id]: val }; setA(na);
    const adv = () => { if (i + 1 >= total) onDone(na); else setI(i + 1); };
    if (auto) setTimeout(adv, 220); else adv();
  };
  const chosen = a[item.id];
  return (
    <Shell footer={<div className="foot"><button className="ghost" onClick={() => (i > 0 ? setI(i - 1) : onBack())}>← Back</button><span className="count">{i + 1} / {total}</span></div>}>
      <div className={"col tint-" + m.tint}>
        <div className="track"><div className="fill" style={{ width: `${(i / total) * 100}%` }} /></div>
        <div className="qwrap" key={item.id}>
          <p className="kicker gold">{m.kicker}</p>
          <h2 className="question">{item.text}</h2>
          {item.format === "L5" && <div className="opts">{L5.map((o, k) => (<button key={o} className={"opt" + (chosen === k ? " sel" : "")} onClick={() => set(k, true)}><span className="odot" />{o}</button>))}</div>}
          {item.format === "PK" && <div className="opts">{item.options.map((o) => (<button key={o.key} className={"opt" + (chosen === o.key ? " sel" : "")} onClick={() => set(o.key, true)}><span className="odot" />{o.text}</button>))}</div>}
          {item.format === "FC" && <div className="fc">{["a", "b"].map((kk) => (<button key={kk} className={"fccard" + (chosen === kk ? " sel" : "")} onClick={() => set(kk, true)}>{item[kk].text}</button>))}</div>}
        </div>
      </div>
    </Shell>
  );
}
function MiniResult({ miniId, result, onBack, onRetake }) {
  const [revealing, setRevealing] = useState(false);
  const again = () => { setRevealing(true); setTimeout(() => setRevealing(false), 1600); };
  const m = MINIS[miniId];
  if (!m || !result) return null;
  return (
    <div className={"reportpage tint-" + m.tint}>
      <div className="rhead noprint"><button className="ghost inkghost" onClick={onBack}>← Library</button><Wordmark /><span /></div>
      <article className="report">
        <p className="kicker gold">{m.kicker}</p>
        <h1 className="display ink">{m.name}</h1>
        {revealing && <div className="revealveil"><Orb size={84} /><p className="revealline">Looking again…</p></div>}
        <p className="kicker">Your insights</p>
        <LensInsights id={miniId} result={result} />
        <div className="minihelp"><ResearchNote from={m.from} research={m.research} /></div>
        <button className="setbtn" onClick={again}>Reveal this insight again</button>
        <button className="setbtn" onClick={onRetake}>Take this lens again</button>
        {readMini(miniId, result)?.care && <div className="noprint"><SOSSection /></div>}
        <p className="integrity">A short lens, {m.from.toLowerCase()}. It adds to your profile — your Companion now knows this about you too. A self-discovery tool, not a clinical measure.</p>
      </article>
    </div>
  );
}

function Report({ report, name, answers, scores, companionStart, completedAt, strength, onBack, onLibrary, onDeeper, onRegenerate, onRetake, onRestart, onStrength }) {
  if (!report) return null;
  return (
    <div className="reportpage">
      <div className="rhead noprint">
        <button className="ghost inkghost" onClick={onBack}>← Home</button>
        <Wordmark />
        <div className="ractions">
          <button className="btn ink" onClick={() => { track("pdf"); window.print(); }}>Save as PDF</button>
          <button className="btn gold" onClick={() => { track("share_card"); downloadShareCard(scores, name); }}>Share card</button>
        </div>
      </div>
      <article className="report">
        <div className="printonly phead"><Wordmark /><p className="kicker gold">Essence Recovery Assessment &amp; Companion</p></div>
        {(() => { const lvl = levelFor(strength); const step = nextStep(strength); return (
          <div className="badgestrip noprint">
            <div className="badgechips">
              {LEVELS.map((L) => (<span key={L.id} className={"bchip" + (meets(L, strength) ? " earned" : "")}><i className="bchipdot" />{L.name}</span>))}
            </div>
            <p className="badgeexplain">{lvl ? `You've earned ${lvl.name} — ${lvl.accuracy}.` : "Answer a few parts to earn your first badge."}{step ? ` ${step.what} to unlock ${step.level.name}.` : ""}</p>
            <button className="strengthlink" onClick={onStrength}>Profile strength {strength.score} / 100 — see what's next</button>
          </div>
        ); })()}
        <p className="kicker gold noprint">Essence Recovery Assessment</p>
        <h1 className="display ink">{name ? `${name}, this is you.` : "This is you."}</h1>
        <p className="lede inkdim noprint">Your report, your dimension tiles, your share card — the centre everything else here orbits.</p>
        {report.preview && <div className="previewnote"><p>Your real report didn't finish writing — usually just a connection blip. Your answers are safe on this phone. One tap tries again.</p><button className="btn gold" onClick={onRegenerate}>Write my real report</button></div>}
        {scores && <Tiles scores={scores} />}
        <div className="rbody" dangerouslySetInnerHTML={{ __html: md(report.text) }} />
        <p className="integrity">Grounded in established psychological frameworks — CHC, Big Five, Goleman EI, RIASEC and Schwartz Values. A structured self-discovery tool, not a clinical or validated psychometric instrument. Your answers never left your device, and no one — iSHKiY included — can see them or your conversations without your explicit permission. This report was written for you alone, and it belongs to you.</p>
        {onDeeper && scores && scores.measured && !(scores.measured.thinking && scores.measured.ei && scores.measured.riasec && scores.measured.values && scores.measured.big5) && (
          <button className="deeperband noprint" onClick={onDeeper}>
            <span className="libctak">Your report is real — and it can go deeper</span>
            <span className="libctat">Answer more parts to sharpen it. Each one earns a badge. →</span>
          </button>
        )}
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
