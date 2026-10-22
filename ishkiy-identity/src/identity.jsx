// Identity reinforcement: who the person IS, in the present tense, and the
// daily proof that backs it up. Three stages. Create (one-off): a statement,
// three to five traits, a day in the life, a recording in their own voice,
// and affirmations per life domain. Integrate: one small proof action per
// trait, an if-then plan for each, and morning and evening anchor times.
// Daily practice: hear it and choose the day's proof in the morning, tick it
// off as "this is what I do" in the evening, and a weekly look back.
// Everything is editable at any time; edits overwrite, with no history.
import React, { useEffect, useRef, useState } from "react";
import { HISTORY_LINE, ID_DOMAINS, ID_SEEDS, ID_TRAIT_EXAMPLES, ID_ACTION_EXAMPLES, ID_CUE_EXAMPLES, ID_TIMES, ID_CUSTOM_KINDS, ID_LIFE_HINT, ID_RECORD_INTRO, ID_PRACTICE, presentCheck, ifThen, buildIdentityScript, draftVision } from "./content.js";
import { putVoice, getVoice, dayKey, daysBetween, uid, identityICS, download } from "./store.js";
import { playSession, speakScript, startBed, stopBed, bowl, getCtx } from "./audio.js";
import { Orb } from "./visuals.jsx";
import { Recorder } from "./sessions.jsx";
import { Shell, Back, Steps, Card, nowHM } from "./ui.jsx";

const VOICE_KEY = "vision"; // the identity recording took over the vision's slot
const MIN_TRAITS = 3, MAX_TRAITS = 5;

/* ---------------- reading the state ---------------- */
export const domainsOf = (idn) => idn.domains || ID_DOMAINS;
const shownDomains = (idn) => domainsOf(idn).filter((d) => !d.hidden);
const domainName = (idn, id) => (domainsOf(idn).find((d) => d.id === id) || {}).name || "";
const idDay = (st, k) => (((st.days || {})[k] || {}).identity) || {};
const traitOf = (idn, id) => (idn.traits || []).find((t) => t.id === id);
const lastDays = (n, from = new Date()) => [...Array(n)].map((_, i) => { const d = new Date(from); d.setDate(d.getDate() - i); return dayKey(d); });
const shortDate = (k) => new Date(k + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
const dayNumber = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
const mins = (hm) => { const [h, m] = (hm || "0:0").split(":").map(Number); return h * 60 + m; };
const anchorsOf = (idn) => ({ ...ID_TIMES, ...(idn.anchors || {}) });
/* Morning until halfway between the two anchors, evening after. */
export const practiceMode = (idn) => { const a = anchorsOf(idn); const now = mins(nowHM()); return now < (mins(a.morning) + mins(a.evening)) / 2 ? "morning" : "evening"; };
/* One morning. Once Identity is set up, its morning is the morning: it
   counts for the era, and the identity anchor and the era's wake-up reminder
   are one time, written together so a phone never rings twice. */
export const integrated = (st) => !!(st.identity && st.identity.integrated);
export const morningDone = (x = {}) => !!(x.morning || (x.identity || {}).morning);
export const morningTime = (st) => (integrated(st) ? anchorsOf(st.identity).morning : (st.reminders || {}).morning || "06:45");
export const withMorning = (s, t) => ({
  reminders: { morning: "06:45", evening: "22:00", ...(s.reminders || {}), morning: t },
  ...(s.identity ? { identity: { ...s.identity, anchors: { ...anchorsOf(s.identity), morning: t } } } : {}),
});
export const weeklyDueId = (idn) => !!idn.created && daysBetween(idn.reviewed || idn.created, dayKey()) >= 7;
/* Where to pick Create back up: the first step without its piece. */
const createFrom = (idn) => (!idn.statement ? 0 : (idn.traits || []).length < MIN_TRAITS ? 1 : !(idn.life || {}).text ? 2 : !idn.script ? 3 : 4);
const integrateFrom = (idn) => ((idn.traits || []).some((t) => !(t.action || "").trim()) ? 0 : 1);

/* Writing back. Both merge, so a screen only says what it changes. */
const writer = (update) => ({
  setId: (patch) => update((s) => ({ identity: { ...(s.identity || {}), ...(typeof patch === "function" ? patch(s.identity || {}) : patch) } })),
  setIdDay: (k, patch) => update((s) => {
    const d = (s.days || {})[k] || {}, cur = d.identity || {};
    return { days: { ...(s.days || {}), [k]: { ...d, identity: { ...cur, ...(typeof patch === "function" ? patch(cur) : patch) } } } };
  }),
});

/* The proof behind each domain: ticked actions and custom entries, newest
   first. A tick counts for its trait's domain; a custom entry for the domain
   it was linked to, directly or through a trait. */
function proofFor(st, idn, domain, keys) {
  const out = [];
  keys.forEach((k) => {
    const d = idDay(st, k);
    (d.ticks || []).forEach((id) => { const t = traitOf(idn, id); if (t && t.domain === domain && t.action) out.push({ k, text: ifThen("", t.action) }); });
    (d.custom || []).forEach((e) => { const dm = e.domain || (traitOf(idn, e.trait) || {}).domain || null; if (dm === domain) out.push({ k, text: e.text }); });
  });
  return out;
}
/* One affirmation per domain for today, turning over day by day. */
function todaysAffirmations(idn) {
  const n = dayNumber(), all = idn.affirmations || [];
  const rows = [...shownDomains(idn).map((d) => d.id), null].map((id) => { const list = all.filter((a) => (a.domain || null) === id); return list.length ? { domain: id, a: list[n % list.length] } : null; });
  return rows.filter(Boolean);
}

/* Their recording (or the phone reading the script until there is one). The
   bed fades once the words end, so a morning stays short. */
function useIdentityVoice() {
  const [blob, setBlob] = useState(null);
  const [playing, setPlaying] = useState(false);
  const h = useRef(null);
  useEffect(() => { let live = true; getVoice(VOICE_KEY).then((b) => live && setBlob(b || null)); return () => { live = false; h.current && h.current.stop(); stopBed(1.5); }; }, []);
  const stop = () => { h.current && h.current.stop(); h.current = null; setPlaying(false); };
  const play = async (text, onDone) => {
    if (playing) { stop(); return; }
    getCtx(); setPlaying(true);
    const end = () => { h.current && h.current.stop(); h.current = null; setPlaying(false); onDone && onDone(); };
    if (blob) h.current = await playSession({ bedKey: "alpha", voiceBlob: blob, volume: 0.45, tailMin: 0.05, onVoiceEnd: () => setTimeout(end, 2500) });
    else {
      startBed("alpha", { volume: 0.4 });
      const sp = speakScript(text || "", { onDone: () => setTimeout(end, 1500) });
      h.current = { stop: () => { sp.stop(); stopBed(1.5); } };
    }
  };
  return { blob, setBlob, playing, play, stop };
}

function Hint({ text }) { const h = presentCheck(text); return h ? <p className="hint">{h}</p> : null; }
function WizTop({ onBack, n, of, label = "Back" }) { return <div className="toprow"><Back onClick={onBack} label={label} />{of > 1 && <Steps n={n} of={of} />}</div>; }

/* ================================================================
   The home-screen button: one, prominent, and it always knows where to go. */
export function PracticeButton({ st, go }) {
  const idn = st.identity || {};
  const d = idDay(st, dayKey());
  if (!idn.created) return (
    <button className="bigpractice" onClick={() => go("identity")}>
      <span className="bpk">Who I am</span>
      <span className="bpt">{idn.statement ? "Finish writing who you are" : "Write who you are"}</span>
      <span className="bpl">A line, your traits, an ordinary day, in your own voice. About fifteen minutes, once.</span>
    </button>);
  if (!idn.integrated) return (
    <button className="bigpractice" onClick={() => go("idintegrate", { step: integrateFrom(idn) })}>
      <span className="bpk">Who I am</span>
      <span className="bpt">Add your daily proof</span>
      <span className="bpl">One small action per trait, and when you do it. Five minutes.</span>
    </button>);
  const mode = practiceMode(idn), a = anchorsOf(idn);
  const done = mode === "morning" ? d.morning : d.evening;
  const due = !done && nowHM() >= a[mode];
  return (
    <button className={"bigpractice" + (done ? " done" : "") + (due ? " due" : "")} onClick={() => go("practice")}>
      <span className="bpk">{done && <span className="tick">✓</span>}Daily practice · {mode === "morning" ? "morning" : "evening"}</span>
      <span className="bpt">{done ? (mode === "morning" ? "Morning done" : "Evening done") : mode === "morning" ? "Who I am" : "This is what I do"}</span>
      <span className="bpl">{idn.statement}</span>
      <span className="bpgo">{done ? "Open it again" : mode === "morning" ? "Start · under 2 minutes" : "Start · under a minute"} →</span>
    </button>);
}

/* ================================================================
   The hub: everything in one place, every piece editable. */
export function IdentityHub({ st, update, go, back }) {
  const idn = st.identity || {};
  const { setId } = writer(update);
  const v = useIdentityVoice();
  const a = anchorsOf(idn);
  const [added, setAdded] = useState(false);
  const edit = (step, extra) => go("idcreate", { step, edit: true, ...extra });
  const editI = (step) => go("idintegrate", { step, edit: true });

  if (!idn.created) {
    const from = createFrom(idn);
    return (
      <Shell>
        <div className="toprow"><Back onClick={back} /></div>
        <div className="flow">
          <p className="kicker">Who I am</p>
          <h1 className="display sm">Write down who you are.</h1>
          <p className="lede dim">Not a wish list. A plain record of the person you are, in the present tense, backed every day by small proof.</p>
          <div className="steps">
            <div className="step"><span className="stepn">1</span><span>Create: one line, three to five traits, an ordinary day, your own voice, and affirmations for each part of your life. About fifteen minutes, once.</span></div>
            <div className="step"><span className="stepn">2</span><span>Integrate: one small daily proof for each trait, and the moment you do it. Five minutes.</span></div>
            <div className="step"><span className="stepn">3</span><span>Daily practice: under two minutes each morning, under one each evening.</span></div>
          </div>
          <button className="btn gold" onClick={() => go("idcreate", { step: from })}>{from ? "Pick up where you left off" : "Begin"}</button>
        </div>
      </Shell>);
  }
  const traits = idn.traits || [];
  const life = idn.life || {};
  const stale = idn.audio && idn.script && idn.audio.text !== idn.script;
  const keys = lastDays(7);
  const ics = () => { download(new Blob([identityICS({ ...a, url: location.origin + "/#practice" })], { type: "text/calendar" }), "ishkiy-identity-anchors.ics"); setAdded(true); };
  const setAnchor = (k, t) => { setAdded(false); k === "morning" ? update((s) => withMorning(s, t || ID_TIMES.morning)) : setId((s) => ({ anchors: { ...anchorsOf(s), [k]: t || ID_TIMES[k] } })); };
  return (
    <Shell>
      <div className="toprow"><Back onClick={back} /></div>
      <div className="flow">
        <p className="kicker">Who I am</p>
        <p className="visiontext">{idn.statement}</p>
        <button className="ghost light" onClick={() => edit(0)}>Edit my statement</button>
        <PracticeButton st={st} go={go} />
        {weeklyDueId(idn) && <Card kicker="Weekly review" title="Your week, as evidence" line="What you did, by trait and by part of your life. Then sharpen anything that's ready." cta="Open it" onClick={() => go("idweek")} accent />}

        <div className="panel">
          <p className="kicker">My traits and their proof</p>
          {traits.map((t) => (
            <div key={t.id} className="trait">
              <p className="trname">{t.name} <span className="trdom">{domainName(idn, t.domain)}</span></p>
              <p className="trhow">{t.how}</p>
              {t.action ? <p className="trif">{ifThen(t.cue, t.action)}</p> : <p className="tnote light">No daily proof yet.</p>}
            </div>))}
          <div className="row wrap">
            <button className="btn ink2 small" onClick={() => edit(1)}>Edit traits</button>
            <button className="btn ink2 small" onClick={() => editI(0)}>Edit proof actions</button>
            <button className="btn ink2 small" onClick={() => editI(1)}>Edit if-then plans</button>
          </div>
        </div>

        <div className="panel">
          <p className="kicker">Affirmations, and the proof beside them</p>
          <ProofGrid st={st} idn={idn} rows={(idn.affirmations || []).map((x) => ({ domain: x.domain || null, a: x }))} keys={keys} />
          <button className="btn ink2 small" onClick={() => edit(4)}>Edit affirmations</button>
        </div>

        <div className="panel">
          <p className="kicker">A day in my life</p>
          <p className="lifetext">{life.text}</p>
          {domainsOf(idn).filter((d) => (life.by || {})[d.id]).map((d) => <p key={d.id} className="lifetext"><span className="trdom">{d.name}</span> {life.by[d.id]}</p>)}
          <button className="btn ink2 small" onClick={() => edit(2)}>Edit</button>
        </div>

        <div className="panel">
          <p className="kicker">In my own voice</p>
          <button className="btn gold" onClick={() => v.play(idn.script)}>{v.playing ? "Stop" : v.blob ? "Play my recording" : "Play it (phone's voice)"}</button>
          {!v.blob && <p className="tnote light">Your own voice lands deeper than the phone's. Record it when you're ready.</p>}
          {stale && <p className="tnote light">The words have changed since you recorded it. Re-record to match.</p>}
          <div className="row wrap">
            <button className="btn ink2 small" onClick={() => { v.stop(); edit(3, { rec: true }); }}>{v.blob ? "Re-record" : "Record it in my voice"}</button>
            <button className="btn ink2 small" onClick={() => { v.stop(); edit(3); }}>Edit the words</button>
          </div>
        </div>

        <div className="panel">
          <p className="kicker">Anchor times</p>
          <p className="lede dim">When the practice is due. The home screen turns gold at each time until it's done.</p>
          <div className="times">
            <label>Morning<input type="time" className="tin" value={a.morning} onChange={(e) => setAnchor("morning", e.target.value)} /></label>
            <label>Evening<input type="time" className="tin" value={a.evening} onChange={(e) => setAnchor("evening", e.target.value)} /></label>
          </div>
          <button className="btn ink2 small" onClick={ics}>{added ? "Added. Open the file to save it" : "Add both to my calendar"}</button>
          <p className="tnote light">Every day at {a.morning} and {a.evening}, with no end date. The link in each opens the practice. Nothing is sent anywhere.</p>
        </div>

        <div className="panel">
          <p className="kicker">Areas of my life</p>
          <DomainEditor idn={idn} setId={setId} />
        </div>

        <button className="btn ink2" onClick={() => go("idweek")}>Weekly review</button>
      </div>
    </Shell>
  );
}

/* Add, rename, hide and reorder. Hiding keeps a domain's traits and
   affirmations but takes it out of the daily practice. */
function DomainEditor({ idn, setId }) {
  const list = domainsOf(idn);
  const [name, setName] = useState("");
  const put = (fn) => setId((s) => ({ domains: fn(domainsOf(s).map((d) => ({ ...d }))) }));
  const move = (i, by) => put((l) => { const j = i + by; if (j < 0 || j >= l.length) return l; [l[i], l[j]] = [l[j], l[i]]; return l; });
  const add = () => { const n = name.trim(); if (!n) return; put((l) => [...l, { id: "d" + uid(), name: n, custom: true }]); setName(""); };
  return (
    <div className="domains">
      {list.map((d, i) => (
        <div key={d.id} className={"domrow" + (d.hidden ? " off" : "")}>
          <input className="tin" value={d.name} aria-label={`Rename ${d.name}`} onChange={(e) => { const v = e.target.value; put((l) => l.map((x) => (x.id === d.id ? { ...x, name: v } : x))); }} onBlur={(e) => { if (!e.target.value.trim()) put((l) => l.map((x) => (x.id === d.id ? { ...x, name: (ID_DOMAINS.find((y) => y.id === d.id) || {}).name || "My area" } : x))); }} />
          <button className="domb" onClick={() => move(i, -1)} disabled={!i} aria-label={`Move ${d.name} up`}>↑</button>
          <button className="domb" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label={`Move ${d.name} down`}>↓</button>
          <button className="domb wide" onClick={() => put((l) => l.map((x) => (x.id === d.id ? { ...x, hidden: !x.hidden } : x)))} aria-pressed={!d.hidden}>{d.hidden ? "Show" : "Hide"}</button>
        </div>))}
      <div className="askrow"><input className="tin" value={name} onChange={(e) => setName(e.target.value)} placeholder="Add your own area" aria-label="A new area of your life" onKeyDown={(e) => e.key === "Enter" && add()} /><button className="btn ink2" onClick={add} disabled={!name.trim()}>Add</button></div>
    </div>);
}

/* Affirmations on the left, the evidence for that part of life on the right.
   Kept side by side on purpose: a present-tense line lands better with the
   proof beside it. */
function ProofGrid({ st, idn, rows, keys }) {
  if (!rows.length) return <p className="lede dim">No affirmations yet.</p>;
  const proof = {};
  rows.forEach((r) => { if (!(r.domain in proof)) proof[r.domain] = r.domain ? proofFor(st, idn, r.domain, keys) : []; });
  const byDomain = [];
  rows.forEach((r) => { let g = byDomain.find((x) => x.domain === r.domain); if (!g) byDomain.push(g = { domain: r.domain, list: [] }); g.list.push(r.a); });
  return (
    <div className="pgrid">
      <div className="phead"><span>I am</span><span>The proof, this week</span></div>
      {byDomain.map((g) => { const p = proof[g.domain] || []; return (
        <div key={g.domain || "all"} className="prow">
          <div className="paff"><span className="trdom">{g.domain ? domainName(idn, g.domain) : "Across my life"}</span>{g.list.map((x) => <p key={x.id}>{x.text}</p>)}</div>
          <div className="pproof">{p.length ? <>
            <b>{p.length}</b>
            {[...new Set(p.map((e) => e.text))].slice(0, 2).map((t) => <p key={t}>{t}</p>)}
          </> : <p className="dimtext">Tonight's ticks show up here.</p>}</div>
        </div>); })}
    </div>);
}

/* ================================================================
   Stage 1: Create. Five steps, the same screens used to edit later. */
const CREATE = ["statement", "traits", "life", "voice", "affirmations"];
export function IdCreate({ st, update, go, arg = {} }) {
  const idn = st.identity || {};
  const { setId } = writer(update);
  const step = Math.min(arg.step || 0, CREATE.length - 1), edit = !!arg.edit;
  const hub = () => go("identity");
  const next = () => {
    if (edit) return hub();
    if (step === CREATE.length - 1) { setId({ created: idn.created || dayKey() }); bowl(329.6, 0.1); return go("idintegrate", { step: 0 }); }
    go("idcreate", { step: step + 1 });
  };
  const back = () => (edit || !step ? hub() : go("idcreate", { step: step - 1 }));
  const p = { st, idn, setId, next, back, edit, n: step, of: edit ? 0 : CREATE.length };
  const S = { statement: StepStatement, traits: StepTraits, life: StepLife, voice: StepVoice, affirmations: StepAffirmations }[CREATE[step]];
  return <S key={step} {...p} rec={!!arg.rec} />;
}
const nextLabel = (edit) => (edit ? "Save" : "Next");

function StepStatement({ idn, setId, next, back, edit, n, of }) {
  // the one line about the past, shown once, the first time Create opens
  const [history] = useState(!idn.seenHistory && !edit);
  useEffect(() => { if (history) setId({ seenHistory: dayKey() }); }, []);
  const [t, setT] = useState(idn.statement || "I am someone who ");
  const ok = t.trim().replace(/^i am someone who$/i, "").length > 2;
  return (
    <Shell>
      <WizTop onBack={back} n={n} of={of} />
      <div className="flow">
        {history && <p className="history">{HISTORY_LINE}</p>}
        <p className="kicker">Who I am</p>
        <h1 className="display sm">Who you are, in one line.</h1>
        <p className="lede dim">Plain and true. The person who is already here.</p>
        <textarea className="tarea big" rows="3" value={t} onChange={(e) => setT(e.target.value)} aria-label="Your identity statement" />
        <Hint text={t} />
        <p className="tnote light">For example: I am someone who keeps my word, stays calm under pressure and makes people feel welcome.</p>
        <button className="btn gold" disabled={!ok} onClick={() => { setId({ statement: t.trim().replace(/\s+/g, " ") }); next(); }}>{nextLabel(edit)}</button>
      </div>
    </Shell>);
}

function StepTraits({ idn, setId, next, back, edit, n, of }) {
  const blank = () => ({ id: uid(), name: "", domain: "", how: "" });
  const [list, setList] = useState(() => { const t = (idn.traits || []).map((x) => ({ ...x })); while (t.length < MIN_TRAITS) t.push(blank()); return t; });
  const [areas, setAreas] = useState(false);
  const set = (id, patch) => setList((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const complete = list.filter((x) => x.name.trim() && x.domain && x.how.trim());
  const ok = complete.length >= MIN_TRAITS && complete.length === list.filter((x) => x.name.trim() || x.how.trim()).length;
  const save = () => { setId({ traits: complete.map((x) => ({ ...x, name: x.name.trim(), how: x.how.trim() })) }); next(); };
  const doms = shownDomains(idn);
  return (
    <Shell>
      <WizTop onBack={back} n={n} of={of} />
      <div className="flow">
        <p className="kicker">My traits</p>
        <h1 className="display sm">Three to five traits that are you.</h1>
        <p className="lede dim">A name, the part of life it lives in, and how it shows up on an ordinary day.</p>
        {list.map((x, i) => { const ex = ID_TRAIT_EXAMPLES[i % ID_TRAIT_EXAMPLES.length]; return (
          <div key={x.id} className="traitedit">
            <div className="askrow"><input className="tin big" value={x.name} onChange={(e) => set(x.id, { name: e.target.value })} placeholder={ex.name} aria-label={`Trait ${i + 1}`} />
              {list.length > 1 && <button className="evx" onClick={() => setList((l) => l.filter((y) => y.id !== x.id))} aria-label={`Remove trait ${x.name || i + 1}`}>×</button>}</div>
            <div className="chips">{doms.map((d) => <button key={d.id} className={"chip" + (x.domain === d.id ? " on" : "")} aria-pressed={x.domain === d.id} onClick={() => set(x.id, { domain: d.id })}>{d.name}</button>)}</div>
            <textarea className="tarea" rows="2" value={x.how} onChange={(e) => set(x.id, { how: e.target.value })} placeholder={ex.how} aria-label={`How ${x.name || "this trait"} shows up`} />
            <Hint text={x.name + " " + x.how} />
          </div>); })}
        {list.length < MAX_TRAITS && <button className="ghost light" onClick={() => setList((l) => [...l, blank()])}>Add a trait</button>}
        <button className="ghost light" onClick={() => setAreas(!areas)}>{areas ? "Done with the areas" : "Rename, add or hide areas of life"}</button>
        {areas && <div className="panel"><DomainEditor idn={idn} setId={setId} /></div>}
        <p className="tnote light">{complete.length} of {MIN_TRAITS} to {MAX_TRAITS} ready. Each needs a name, an area and how it shows up.</p>
        <button className="btn gold" disabled={!ok} onClick={save}>{nextLabel(edit)}</button>
      </div>
    </Shell>);
}

function StepLife({ st, idn, setId, next, back, edit, n, of }) {
  const life = idn.life || {};
  const [t, setT] = useState(life.text || "");
  const [by, setBy] = useState({ ...(life.by || {}) });
  const [open, setOpen] = useState(() => Object.keys(life.by || {}).filter((k) => life.by[k]));
  const ns = st.newSelf || {};
  const doms = shownDomains(idn);
  return (
    <Shell>
      <WizTop onBack={back} n={n} of={of} />
      <div className="flow">
        <p className="kicker">A day in my life</p>
        <h1 className="display sm">An ordinary day, as it is.</h1>
        <p className="lede dim">{ID_LIFE_HINT}</p>
        <textarea className="tarea big" rows="7" value={t} onChange={(e) => setT(e.target.value)} placeholder="I wake up before the alarm…" aria-label="A day in your life" />
        <Hint text={t} />
        {(ns.statements || []).some((x) => x.text) && <button className="ghost light" onClick={() => setT(draftVision(ns))}>{t.trim() ? "Replace with a draft from my lines" : "Start from my lines"}</button>}
        <p className="q">A paragraph for any part of life (optional)</p>
        <div className="chips">{doms.map((d) => <button key={d.id} className={"chip" + (open.includes(d.id) ? " on" : "")} aria-pressed={open.includes(d.id)} onClick={() => setOpen((o) => (o.includes(d.id) ? o.filter((x) => x !== d.id) : [...o, d.id]))}>{d.name}</button>)}</div>
        {doms.filter((d) => open.includes(d.id)).map((d) => (
          <div key={d.id}>
            <label className="q" htmlFor={"life-" + d.id}>{d.name}</label>
            <textarea id={"life-" + d.id} className="tarea" rows="3" value={by[d.id] || ""} onChange={(e) => setBy((b) => ({ ...b, [d.id]: e.target.value }))} placeholder="My days here are…" />
            <Hint text={by[d.id]} />
          </div>))}
        <button className="btn gold" disabled={!t.trim()} onClick={() => {
          const clean = {}; Object.keys(by).forEach((k) => { if (open.includes(k) && (by[k] || "").trim()) clean[k] = by[k].trim(); });
          setId({ life: { text: t.trim(), by: clean } }); next();
        }}>{nextLabel(edit)}</button>
      </div>
    </Shell>);
}

function StepVoice({ idn, setId, next, back, edit, n, of, rec }) {
  const v = useIdentityVoice();
  const built = buildIdentityScript({ statement: idn.statement, traits: idn.traits, life: idn.life, domains: domainsOf(idn) });
  const [script, setScript] = useState(idn.script || built);
  const [stage, setStage] = useState(rec && idn.script ? "rec" : "script"); // script | rec
  const keepScript = () => setId({ script: script.trim() });
  if (stage === "rec") return (
    <Shell className="practice">
      <WizTop onBack={() => setStage("script")} n={n} of={of} label="The words" />
      <div className="flow">
        <p className="kicker">{v.blob ? "Re-record who I am" : "Record who I am"}</p>
        <h1 className="display sm">Say it like you're telling a friend about your life.</h1>
        <Recorder script={idn.script || script} existing={v.blob} what="recording" bed="alpha" intro={ID_RECORD_INTRO}
          onDiscard={() => (edit ? next() : setStage("script"))} onSkip={next}
          onSaved={async (b) => { await putVoice(b, VOICE_KEY); v.setBlob(b); setId((s) => ({ audio: { at: dayKey(), mime: b.type, text: s.script } })); bowl(261.6, 0.1); next(); }} />
      </div>
    </Shell>);
  return (
    <Shell>
      <WizTop onBack={back} n={n} of={of} />
      <div className="flow">
        <p className="kicker">In my own voice</p>
        <h1 className="display sm">What you'll hear each morning.</h1>
        <p className="lede dim">Built from what you've written. Change anything. Read aloud slowly it runs about a minute, and it's yours to play every day.</p>
        <textarea className="tarea script" value={script} onChange={(e) => setScript(e.target.value)} aria-label="Your recording script" />
        <Hint text={script} />
        {script.trim() !== built && <button className="ghost light" onClick={() => setScript(built)}>Rebuild it from what I've written</button>}
        {idn.audio && script.trim() !== (idn.audio.text || "") && <p className="tnote light">Your recording says different words. Re-record once you've saved.</p>}
        <button className="btn gold" disabled={!script.trim()} onClick={() => { keepScript(); setStage("rec"); }}>{v.blob ? "Save and re-record" : "Record it in my voice"}</button>
        <button className="ghost light" disabled={!script.trim()} onClick={() => { keepScript(); next(); }}>{edit ? "Save the words only" : v.blob ? "Keep my current recording" : "Record later. The phone's voice reads it until then"}</button>
      </div>
    </Shell>);
}

function StepAffirmations({ idn, setId, next, back, edit, n, of }) {
  const doms = shownDomains(idn);
  // seeded the first time: two editable suggestions for each domain a trait lives in
  const [list, setList] = useState(() => {
    if (idn.affirmations) return idn.affirmations.map((x) => ({ ...x }));
    const used = [...new Set((idn.traits || []).map((t) => t.domain))];
    return used.flatMap((d) => (ID_SEEDS[d] || []).slice(0, 2).map((text) => ({ id: uid(), domain: d, text })));
  });
  const [own, setOwn] = useState({});
  const add = (domain, text) => { const t = (text || "").trim(); if (!t) return; setList((l) => [...l, { id: uid(), domain, text: t }]); };
  const set = (id, text) => setList((l) => l.map((x) => (x.id === id ? { ...x, text } : x)));
  const rows = [...doms.map((d) => ({ id: d.id, name: d.name })), ...(list.some((x) => !x.domain) ? [{ id: null, name: "Across my life" }] : [])];
  const kept = list.filter((x) => x.text.trim());
  return (
    <Shell>
      <WizTop onBack={back} n={n} of={of} />
      <div className="flow">
        <p className="kicker">Affirmations</p>
        <h1 className="display sm">What's true, in each part of your life.</h1>
        <p className="lede dim">Statements of how things are, in the present tense. Edit the suggestions until they sound like you, or write your own. Every evening, the proof goes next to them.</p>
        {rows.map((d) => { const mine = list.filter((x) => (x.domain || null) === d.id); const seeds = (ID_SEEDS[d.id] || []).filter((s) => !list.some((x) => x.text.trim() === s)); return (
          <div key={d.id || "all"} className="affdom">
            <p className="q">{d.name}</p>
            {mine.map((x) => (<div key={x.id}>
              <div className="askrow"><input className="tin" value={x.text} onChange={(e) => set(x.id, e.target.value)} aria-label={`Affirmation for ${d.name}`} /><button className="evx" onClick={() => setList((l) => l.filter((y) => y.id !== x.id))} aria-label={`Remove: ${x.text}`}>×</button></div>
              <Hint text={x.text} />
            </div>))}
            {seeds.length > 0 && <div className="chips seeds">{seeds.map((s) => <button key={s} className="chip" onClick={() => add(d.id, s)}>+ {s}</button>)}</div>}
            {d.id && <div className="askrow"><input className="tin" value={own[d.id] || ""} onChange={(e) => setOwn((o) => ({ ...o, [d.id]: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") { add(d.id, own[d.id]); setOwn((o) => ({ ...o, [d.id]: "" })); } }} placeholder="I am…" aria-label={`Your own affirmation for ${d.name}`} /><button className="btn ink2" disabled={!(own[d.id] || "").trim()} onClick={() => { add(d.id, own[d.id]); setOwn((o) => ({ ...o, [d.id]: "" })); }}>Add</button></div>}
          </div>); })}
        <button className="btn gold" disabled={!kept.length} onClick={() => { setId({ affirmations: kept.map((x) => ({ ...x, text: x.text.trim() })) }); next(); }}>{edit ? "Save" : "That's me"}</button>
      </div>
    </Shell>);
}

/* ================================================================
   Stage 2: Integrate. The proof, when it happens, and the anchor times. */
const INTEGRATE = ["actions", "cues", "anchors"];
export function IdIntegrate({ st, update, go, arg = {} }) {
  const idn = st.identity || {};
  const { setId } = writer(update);
  const step = Math.min(arg.step || 0, INTEGRATE.length - 1), edit = !!arg.edit;
  const hub = () => go("identity");
  const next = () => {
    if (edit) return hub();
    if (step === INTEGRATE.length - 1) { setId({ integrated: idn.integrated || dayKey() }); bowl(392, 0.1); return hub(); }
    go("idintegrate", { step: step + 1 });
  };
  const back = () => (edit || !step ? hub() : go("idintegrate", { step: step - 1 }));
  const p = { st, update, idn, setId, next, back, edit, n: step, of: edit ? 0 : INTEGRATE.length };
  const S = { actions: StepActions, cues: StepCues, anchors: StepAnchors }[INTEGRATE[step]];
  return <S key={step} {...p} />;
}
const saveTraits = (setId, list) => setId((s) => ({ traits: (s.traits || []).map((t) => ({ ...t, ...(list.find((x) => x.id === t.id) || {}) })) }));

function StepActions({ idn, setId, next, back, edit, n, of }) {
  const [list, setList] = useState(() => (idn.traits || []).map((t) => ({ id: t.id, action: t.action || "" })));
  const ok = list.length && list.every((x) => x.action.trim());
  return (
    <Shell>
      <WizTop onBack={back} n={n} of={of} />
      <div className="flow">
        <p className="kicker">Daily proof</p>
        <h1 className="display sm">One small action for each trait.</h1>
        <p className="lede dim">Small enough to do on your worst day, starting with a verb. Each one is evidence of who you are.</p>
        {list.map((x, i) => { const t = traitOf(idn, x.id) || {}; return (
          <div key={x.id} className="traitedit">
            <p className="trname">{t.name} <span className="trdom">{domainName(idn, t.domain)}</span></p>
            <p className="trhow">{t.how}</p>
            <label className="cuerow"><span>I</span><input className="tin" value={x.action} onChange={(e) => { const v = e.target.value; setList((l) => l.map((y) => (y.id === x.id ? { ...y, action: v } : y))); }} placeholder={ID_ACTION_EXAMPLES[i % ID_ACTION_EXAMPLES.length]} aria-label={`Daily proof for ${t.name}`} /></label>
            <Hint text={x.action} />
          </div>); })}
        <button className="btn gold" disabled={!ok} onClick={() => { saveTraits(setId, list.map((x) => ({ ...x, action: x.action.trim() }))); next(); }}>{nextLabel(edit)}</button>
      </div>
    </Shell>);
}

function StepCues({ idn, setId, next, back, edit, n, of }) {
  const [list, setList] = useState(() => (idn.traits || []).map((t) => ({ id: t.id, cue: t.cue || "" })));
  const ok = list.every((x) => x.cue.trim());
  return (
    <Shell>
      <WizTop onBack={back} n={n} of={of} />
      <div className="flow">
        <p className="kicker">If-then plans</p>
        <h1 className="display sm">When does each one happen?</h1>
        <p className="lede dim">Tie each action to something you already do every day. "When I put the kettle on, I…"</p>
        {list.map((x, i) => { const t = traitOf(idn, x.id) || {}; return (
          <div key={x.id} className="traitedit">
            <p className="trname">{t.name}</p>
            <label className="cuerow"><span>When</span><input className="tin" value={x.cue} onChange={(e) => { const v = e.target.value; setList((l) => l.map((y) => (y.id === x.id ? { ...y, cue: v } : y))); }} placeholder={ID_CUE_EXAMPLES[i % ID_CUE_EXAMPLES.length]} aria-label={`When you do: ${t.action}`} /></label>
            <p className="trif">{ifThen(x.cue || "…", t.action)}</p>
          </div>); })}
        <button className="btn gold" disabled={!ok} onClick={() => { saveTraits(setId, list.map((x) => ({ ...x, cue: x.cue.trim() }))); next(); }}>{nextLabel(edit)}</button>
      </div>
    </Shell>);
}

function StepAnchors({ st, update, idn, setId, next, back, edit, n, of }) {
  const [a, setA] = useState(() => ({ ...anchorsOf(idn), ...(!(idn.anchors || {}).morning && (st.reminders || {}).morning ? { morning: st.reminders.morning } : {}) }));
  const [added, setAdded] = useState(false);
  const ics = () => { download(new Blob([identityICS({ ...a, url: location.origin + "/#practice" })], { type: "text/calendar" }), "ishkiy-identity-anchors.ics"); setAdded(true); };
  return (
    <Shell>
      <WizTop onBack={back} n={n} of={of} />
      <div className="flow">
        <p className="kicker">Anchor times</p>
        <h1 className="display sm">Morning and evening.</h1>
        <p className="lede dim">In the morning you hear who you are and choose the day's proof: under two minutes. In the evening you tick it off: under one.</p>
        <div className="times">
          <label>Morning<input type="time" className="tin" value={a.morning} onChange={(e) => { setAdded(false); setA({ ...a, morning: e.target.value || ID_TIMES.morning }); }} /></label>
          <label>Evening<input type="time" className="tin" value={a.evening} onChange={(e) => { setAdded(false); setA({ ...a, evening: e.target.value || ID_TIMES.evening }); }} /></label>
        </div>
        <button className="btn ink2" onClick={ics}>{added ? "Added. Open the file to save it" : "Add both to my calendar"}</button>
        <p className="tnote light">Two daily reminders with no end date. The link in each opens the practice. Nothing is sent anywhere.</p>
        <p className="tnote light">The morning time is your wake-up reminder for the 21 days too. There's one morning, not two.</p>
        <button className="btn gold" onClick={() => { setId({ anchors: a }); update((s) => withMorning(s, a.morning)); next(); }}>{edit ? "Save" : "Done"}</button>
      </div>
    </Shell>);
}

/* ================================================================
   Stage 3: the daily practice. */
export function Practice({ st, update, go, home, arg }) {
  const idn = st.identity || {};
  const { setIdDay, setId } = writer(update);
  const today = dayKey();
  const d = idDay(st, today);
  const [mode, setMode] = useState(arg === "morning" || arg === "evening" ? arg : practiceMode(idn));
  useEffect(() => { if (!idn.created) go("identity"); else if (!idn.integrated) go("idintegrate", { step: integrateFrom(idn) }); }, []);
  if (!idn.created || !idn.integrated) return null;
  const set = (patch) => setIdDay(today, patch);
  return (
    <Shell className="practice">
      <div className="toprow"><Back onClick={home} label="Home" />
        <div className="modes" role="tablist">{[["morning", "Morning"], ["evening", "Evening"]].map(([k, l]) => <button key={k} role="tab" aria-selected={mode === k} className={"mode" + (mode === k ? " on" : "")} onClick={() => setMode(k)}>{l}{(k === "morning" ? d.morning : d.evening) ? " ✓" : ""}</button>)}</div>
      </div>
      {mode === "morning" ? <MorningId key="m" st={st} idn={idn} d={d} set={set} onDone={home} go={go} /> : <EveningId key="e" st={st} idn={idn} d={d} set={set} setId={setId} onDone={home} go={go} />}
    </Shell>);
}

function MorningId({ st, idn, d, set, onDone, go: goTo }) {
  const [stage, setStage] = useState("hear"); // hear | affirm | confirm | done
  const v = useIdentityVoice();
  const traits = (idn.traits || []).filter((t) => t.action);
  const [chosen, setChosen] = useState(() => d.confirmed || traits.map((t) => t.id));
  const go = (s) => { v.stop(); setStage(s); };
  if (stage === "hear") return (
    <div className="glimmer">
      <Orb size={130} />
      <p className="kicker">Morning · who I am</p>
      <p className="gline">{idn.statement}</p>
      <button className="btn gold" onClick={() => { set({ heard: true }); v.play(idn.script, () => setStage("affirm")); }}>{v.playing ? "Stop" : v.blob ? "Play my recording" : "Play it (phone's voice)"}</button>
      <button className="ghost light" onClick={() => go("affirm")}>{v.playing ? "Go on to my affirmations" : "Skip to my affirmations"}</button>
      <p className="gsub">{ID_PRACTICE.morning}</p>
    </div>);
  if (stage === "affirm") return (
    <div className="flow">
      <p className="kicker">Today's affirmations</p>
      <h1 className="display sm">This is true, and here's the proof.</h1>
      <ProofGrid st={st} idn={idn} rows={todaysAffirmations(idn)} keys={lastDays(7)} />
      <button className="btn gold" onClick={() => setStage("confirm")}>Next</button>
    </div>);
  if (stage === "confirm") return (
    <div className="flow">
      <p className="kicker">Today's proof</p>
      <h1 className="display sm">What I do today.</h1>
      <div className="proofs">{traits.map((t) => { const on = chosen.includes(t.id); return (
        <button key={t.id} className={"proof" + (on ? " on" : "")} aria-pressed={on} onClick={() => setChosen((c) => (on ? c.filter((x) => x !== t.id) : [...c, t.id]))}>
          <span className="pbox" aria-hidden="true">{on ? "✓" : ""}</span>
          <span className="ptxt"><span className="pif">{ifThen(t.cue, t.action)}</span><span className="pname2">{t.name}</span></span>
        </button>); })}</div>
      <button className="btn gold" onClick={() => { set({ morning: true, confirmed: chosen }); bowl(329.6, 0.1); setStage("done"); }}>This is my day</button>
    </div>);
  return (
    <div className="glimmer">
      <Orb size={120} />
      <p className="kicker">Morning done</p>
      <p className="gline">Go and be it.</p>
      <p className="gsub">{chosen.length ? `${chosen.length} proof ${chosen.length === 1 ? "action" : "actions"} today. Tick them tonight.` : "Tonight, tick whatever you did."}</p>
      <button className="btn gold" onClick={onDone}>Into the day</button>
      {st.script && <button className="ghost light" onClick={() => goTo("morning")}>Go deeper: my full recording, my lines out loud, the mirror. About ten minutes</button>}
    </div>);
}

function EveningId({ st, idn, d, set, setId, onDone, go }) {
  const traits = (idn.traits || []).filter((t) => t.action);
  const confirmed = d.confirmed || [];
  const order = [...traits.filter((t) => confirmed.includes(t.id)), ...traits.filter((t) => !confirmed.includes(t.id))];
  const ticks = d.ticks || [];
  const [refl, setRefl] = useState(d.reflection || "");
  const [done, setDone] = useState(false);
  const toggle = (id) => { const on = ticks.includes(id); set((x) => ({ ticks: on ? (x.ticks || []).filter((y) => y !== id) : [...(x.ticks || []), id] })); if (!on) bowl(392, 0.06); };
  if (done) return (
    <div className="glimmer">
      <Orb size={120} />
      <p className="kicker">Evening done</p>
      <p className="gline">{ticks.length ? "This is who I am." : "Tomorrow is another day of proof."}</p>
      <p className="gsub">{ticks.length ? `${ticks.length} ${ticks.length === 1 ? "piece" : "pieces"} of proof today${(d.custom || []).length ? `, plus ${(d.custom || []).length} of your own` : ""}.` : "Nothing resets."}</p>
      <button className="btn gold" onClick={onDone}>Goodnight</button>
    </div>);
  return (
    <div className="flow">
      <p className="kicker">Evening · the evidence</p>
      <h1 className="display sm">{ID_PRACTICE.ticked}</h1>
      <div className="proofs">{order.map((t) => { const on = ticks.includes(t.id); return (
        <button key={t.id} className={"proof" + (on ? " on" : "")} aria-pressed={on} onClick={() => toggle(t.id)}>
          <span className="pbox" aria-hidden="true">{on ? "✓" : ""}</span>
          <span className="ptxt"><span className="pif">{ifThen("", t.action)}</span><span className="pname2">{on ? `${t.name} · ${ID_PRACTICE.ticked}` : `${t.name} · ${ID_PRACTICE.unticked}`}</span></span>
        </button>); })}</div>
      <CustomEntry idn={idn} d={d} set={set} setId={setId} />
      <label className="q" htmlFor="refl">One line on today</label>
      <input id="refl" className="tin" value={refl} onChange={(e) => setRefl(e.target.value)} onBlur={() => set({ reflection: refl.trim() })} placeholder="Today I am…" />
      <Hint text={refl} />
      <button className="btn gold" onClick={() => { set({ evening: true, reflection: refl.trim() }); bowl(261.6, 0.1); setDone(true); }}>Done for today</button>
      {weeklyDueId(idn) && <button className="ghost light" onClick={() => go("idweek")}>Your weekly review is ready</button>}
    </div>);
}

/* Something bespoke: an unplanned action, a moment, or a new affirmation,
   optionally linked to a trait or a domain. A new affirmation joins the
   affirmation list too, so it turns up in the mornings. */
function CustomEntry({ idn, d, set, setId }) {
  const [text, setText] = useState("");
  const [kind, setKind] = useState("did");
  const [link, setLink] = useState(null); // { trait } | { domain } | null
  const list = d.custom || [];
  const add = () => {
    const t = text.trim(); if (!t) return;
    const e = { id: uid(), kind, text: t, ...(link || {}) };
    set((x) => ({ custom: [...(x.custom || []), e] }));
    if (kind === "affirm") { const dm = (link && link.domain) || (link && link.trait && (traitOf(idn, link.trait) || {}).domain) || null; setId((s) => ({ affirmations: [...(s.affirmations || []), { id: uid(), domain: dm, text: t }] })); }
    setText(""); setLink(null); bowl(440, 0.05);
  };
  return (
    <div className="panel">
      <p className="kicker">Add your own</p>
      <div className="chips">{ID_CUSTOM_KINDS.map((k) => <button key={k.id} className={"chip" + (kind === k.id ? " on" : "")} aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>{k.label}</button>)}</div>
      <textarea className="tarea" rows="2" value={text} onChange={(e) => setText(e.target.value)} aria-label="Your own entry" placeholder={kind === "affirm" ? "I am…" : kind === "moment" ? "I notice…" : "I…"} />
      <Hint text={text} />
      <p className="tnote light">Link it to a trait or an area (optional)</p>
      <div className="chips small">
        {(idn.traits || []).map((t) => { const on = link && link.trait === t.id; return <button key={t.id} className={"chip" + (on ? " on" : "")} aria-pressed={!!on} onClick={() => setLink(on ? null : { trait: t.id })}>{t.name}</button>; })}
        {shownDomains(idn).map((dm) => { const on = link && link.domain === dm.id; return <button key={dm.id} className={"chip" + (on ? " on" : "")} aria-pressed={!!on} onClick={() => setLink(on ? null : { domain: dm.id })}>{dm.name}</button>; })}
      </div>
      <button className="btn ink2 small" disabled={!text.trim()} onClick={add}>Add it</button>
      {kind === "affirm" && <p className="tnote light">It joins your affirmations, so you'll see it in the mornings.</p>}
      {list.length > 0 && <div className="evlist">{list.map((e) => (
        <div key={e.id} className="ev"><span className="evdate">{(ID_CUSTOM_KINDS.find((k) => k.id === e.kind) || {}).label}</span><span className="evtext">{e.text}{linkLabel(idn, e) && <span className="trdom"> · {linkLabel(idn, e)}</span>}</span>
          <button className="evx" onClick={() => set((x) => ({ custom: (x.custom || []).filter((y) => y.id !== e.id) }))} aria-label={`Remove: ${e.text}`}>×</button></div>))}</div>}
    </div>);
}
const linkLabel = (idn, e) => (e.trait ? (traitOf(idn, e.trait) || {}).name : e.domain ? domainName(idn, e.domain) : "");

/* ================================================================
   Weekly review: the last seven days as evidence, by domain and trait, every
   day still editable, then a nudge to sharpen anything that's ready. */
export function IdWeek({ st, update, go }) {
  const idn = st.identity || {};
  const { setId, setIdDay } = writer(update);
  const keys = lastDays(7);
  const traits = idn.traits || [];
  const [openDay, setOpenDay] = useState(null);
  const days = keys.map((k) => ({ k, d: idDay(st, k) }));
  const ticksOf = (id) => days.filter(({ d }) => (d.ticks || []).includes(id)).length;
  const customs = days.flatMap(({ k, d }) => (d.custom || []).map((e) => ({ ...e, k })));
  const domOfEntry = (e) => e.domain || (traitOf(idn, e.trait) || {}).domain || null;
  const totalTicks = days.reduce((a, { d }) => a + (d.ticks || []).length, 0);
  const practised = days.filter(({ d }) => d.morning || d.evening).length;
  const groups = [...domainsOf(idn).map((dm) => ({ id: dm.id, name: dm.name })), { id: null, name: "Not linked to an area" }]
    .map((g) => ({ ...g, traits: traits.filter((t) => (t.domain || null) === g.id), entries: customs.filter((e) => domOfEntry(e) === g.id) }))
    .filter((g) => g.traits.length || g.entries.length);
  return (
    <Shell>
      <div className="toprow"><Back onClick={() => go("identity")} label="Who I am" /></div>
      <div className="flow">
        <p className="kicker">Weekly review · {shortDate(keys[6])} to {shortDate(keys[0])}</p>
        <h1 className="display sm">This is the evidence.</h1>
        <div className="stats three">
          <div><b>{totalTicks}</b><span>proof actions</span></div><div><b>{customs.length}</b><span>of your own</span></div><div><b>{practised}</b><span>days practised</span></div>
        </div>
        {groups.map((g) => (
          <div key={g.id || "none"} className="panel">
            <p className="kicker">{g.name}</p>
            {g.traits.map((t) => { const n = ticksOf(t.id); return (
              <div key={t.id} className="wtrait">
                <p className="trname">{t.name} <span className="trdom">{n} of 7 days</span></p>
                <div className="wdots" aria-hidden="true">{[...days].reverse().map(({ k, d }) => <span key={k} className={"ed" + ((d.ticks || []).includes(t.id) ? " full" : "")} />)}</div>
                {t.action && <p className="trhow">{ifThen("", t.action)}</p>}
              </div>); })}
            {g.entries.length > 0 && <div className="evlist">{g.entries.map((e) => <div key={e.id} className="ev"><span className="evdate">{new Date(e.k + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short" })}</span><span className="evtext">{e.text}</span></div>)}</div>}
          </div>))}

        <p className="q">Day by day</p>
        <p className="lede dim">Missed a tick, or a line to change? Every day here is still yours to edit.</p>
        {days.map(({ k, d }) => (
          <div key={k} className="wday">
            <button className="wdayhead" aria-expanded={openDay === k} onClick={() => setOpenDay(openDay === k ? null : k)}>
              <span>{k === dayKey() ? "Today" : shortDate(k)}</span><span className="trdom">{(d.ticks || []).length} ticked{(d.custom || []).length ? ` · ${(d.custom || []).length} of your own` : ""}</span>
            </button>
            {openDay === k && <DayEdit idn={idn} d={d} set={(patch) => setIdDay(k, patch)} />}
          </div>))}

        <div className="panel">
          <p className="kicker">Sharpen it</p>
          <p className="lede dim">Is anything ready to be truer, smaller or more exact? A trait that doesn't fit, a proof that's too big, an affirmation that's stopped landing.</p>
          <div className="row wrap">
            <button className="btn ink2 small" onClick={() => go("idcreate", { step: 1, edit: true })}>Traits</button>
            <button className="btn ink2 small" onClick={() => go("idintegrate", { step: 0, edit: true })}>Proof actions</button>
            <button className="btn ink2 small" onClick={() => go("idintegrate", { step: 1, edit: true })}>If-then plans</button>
            <button className="btn ink2 small" onClick={() => go("idcreate", { step: 4, edit: true })}>Affirmations</button>
          </div>
        </div>
        <button className="btn gold" onClick={() => { setId({ reviewed: dayKey() }); go("identity"); }}>{weeklyDueId(idn) ? "Done with this week" : "Done"}</button>
      </div>
    </Shell>);
}

function DayEdit({ idn, d, set }) {
  const [refl, setRefl] = useState(d.reflection || "");
  const ticks = d.ticks || [];
  return (
    <div className="wdaybody">
      <div className="chips">{(idn.traits || []).filter((t) => t.action).map((t) => { const on = ticks.includes(t.id); return (
        <button key={t.id} className={"chip" + (on ? " on" : "")} aria-pressed={on} onClick={() => set((x) => ({ ticks: on ? (x.ticks || []).filter((y) => y !== t.id) : [...(x.ticks || []), t.id] }))}>{on ? "✓ " : ""}{t.name}</button>); })}</div>
      {(d.custom || []).map((e) => (
        <div key={e.id} className="askrow">
          <input className="tin" value={e.text} aria-label="Your entry" onChange={(ev) => { const v = ev.target.value; set((x) => ({ custom: (x.custom || []).map((y) => (y.id === e.id ? { ...y, text: v } : y)) })); }} />
          <button className="evx" onClick={() => set((x) => ({ custom: (x.custom || []).filter((y) => y.id !== e.id) }))} aria-label={`Remove: ${e.text}`}>×</button>
        </div>))}
      <input className="tin" value={refl} onChange={(e) => setRefl(e.target.value)} onBlur={() => set({ reflection: refl.trim() })} placeholder="One line on the day" aria-label="Your line on the day" />
      <Hint text={refl} />
    </div>);
}

/* The standalone vision, from before Identity: its words become a day in the
   life, its recording the identity recording (same storage key), and its
   reminder time the morning anchor. Runs once. */
export function migrateVision(s) {
  if (!s.vision || s.identity) return s;
  const v = s.vision, n = { ...s };
  n.identity = {
    life: { text: v.text || "" },
    // the script is left to be built from the new statement and traits, so
    // the old take shows as not matching until it's re-recorded
    ...(v.audio ? { audio: { ...v.audio } } : {}),
    anchors: { morning: v.time || ID_TIMES.morning, evening: ID_TIMES.evening },
  };
  delete n.vision;
  return n;
}
