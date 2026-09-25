// iSHKiY Identity. Let the old you go; become the new one. Single-page React,
// the ERA pattern: everything on the phone, one optional AI proxy.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { EXPLAIN, PATH, AREAS, areaOf, ORIGIN_AGES, REWRITES, tenseCheck, SENSES, POWER_QUESTIONS, INPUT_CHOICES, QUOTES, SAFETY, SOS_LINES, MORNING_LINES, EVENING_LINES, buildScript } from "./content.js";
import { load, save, wipe, putVoice, getVoice, delVoice, dayKey, daysBetween, uid, reminderICS, download } from "./store.js";
import { BEDS, startBed, stopBed, liveBed, releaseSound, bowl, renderMix, getCtx } from "./audio.js";
import { Field, Orb, Dissolve, ExplainArt, Spark } from "./visuals.jsx";
import { CalmSession, ListenSession, SayAloud, Mirror, Recorder } from "./sessions.jsx";

const ERA_DAYS = 21;

/* ---------------- the optional AI ----------------
   Same proxy as ERA (/api/claude on Netlify). Everything that uses it has a
   written fallback, so the app works the same without it. */
const VOICE = `You write for iSHKiY, in the voice of a kind, unhurried friend who tells the truth gently. UK English. Short sentences, most under fifteen words. Plain words. BANNED: journey, unlock, empower, transform, leverage, optimise, navigate, delve, resonate, embrace, manifest your dreams, "it's worth noting", "not just X but Y", rhetorical questions, bullet lists, exclamation marks. Never diagnose; this is self-development, not therapy.`;
async function askAI(system, prompt, max_tokens = 700) {
  const res = await fetch("/api/claude", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ system, messages: [{ role: "user", content: prompt }], max_tokens }) });
  if (!res.ok) throw new Error("ai " + res.status);
  const j = await res.json();
  const t = (j.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
  if (!t) throw new Error("empty");
  return t;
}

/* ---------------- small pieces ---------------- */
function Wordmark({ light = true, sub }) {
  return (<div className="wmrow"><div className={"wordmark" + (light ? " light" : "")} aria-label="iSHKiY">
    <span className="wm-i">{"ı"}<span className="tittle" /></span>SHK<span className="wm-i">{"ı"}<span className="tittle" /></span>Y
  </div>{sub && <span className="wmsub">{sub}</span>}</div>);
}
function Shell({ children, light, field = !light, className = "" }) {
  return (<div className={"shell " + (light ? "light " : "dark ") + className}>{field && <Field />}<div className="col">{children}</div></div>);
}
function Back({ onClick, label = "Back" }) { return <button className="back" onClick={onClick}>← {label}</button>; }
function Steps({ n, of }) { return <div className="dots" aria-label={`Step ${n + 1} of ${of}`}>{[...Array(of)].map((_, i) => <span key={i} className={"dot" + (i < n ? " done" : i === n ? " now" : "")} />)}</div>; }

const quoteFor = (d = new Date()) => QUOTES[(d.getDate() + d.getMonth()) % QUOTES.length];
const questionFor = (qs, d = new Date()) => { const list = qs && qs.length ? qs : POWER_QUESTIONS.slice(0, 4); return list[(d.getHours() + d.getDate()) % list.length]; };

/* ================================================================ */
function App() {
  const [st, setSt] = useState(load);
  const [view, setView] = useState("enter");
  const [arg, setArg] = useState(null);
  const update = (patch) => setSt((s) => { const n = { ...s, ...(typeof patch === "function" ? patch(s) : patch) }; save(n); return n; });
  const go = (v, a = null) => { setArg(a); setView(v); window.scrollTo(0, 0); };
  const markDone = (id) => update((s) => ({ done: { ...(s.done || {}), [id]: dayKey() } }));
  const today = dayKey();
  const day = (st.days || {})[today] || {};
  const setDay = (patch) => update((s) => ({ days: { ...(s.days || {}), [today]: { ...((s.days || {})[today] || {}), ...patch } } }));
  const inEra = !!(st.era && st.era.start);
  const home = () => go(inEra ? "today" : "path");

  if (view === "enter") return <Enter first={!st.started} onEnter={() => { if (!st.started) { update({ started: today }); go("welcome"); } else home(); }} />;
  if (view === "welcome") return <Welcome onGo={() => go("explain")} />;
  if (view === "explain") return <Explain onDone={() => { markDone("explain"); go("path"); }} onBack={() => go(st.done && st.done.explain ? "path" : "welcome")} />;
  if (view === "path") return <PathView st={st} go={go} />;
  if (view === "calm") return <Shell className="practice"><CalmSession short={arg === "short"} onExit={home} onDone={(secs) => { if (arg !== "short") markDone("calm"); update((s) => ({ calmCount: (s.calmCount || 0) + 1 })); arg === "evening" ? go("evening") : home(); }} /></Shell>;
  if (view === "audit") return <Audit st={st} update={update} onDone={() => { markDone("audit"); go("release"); }} onBack={() => go("path")} />;
  if (view === "release") return <Release st={st} update={update} onDone={() => { markDone("release"); go("become"); }} onBack={() => go("path")} />;
  if (view === "become") return <Become st={st} update={update} onDone={() => { markDone("become"); go("script"); }} onBack={() => go(inEra ? "you" : "path")} />;
  if (view === "script") return <ScriptView st={st} update={update} onDone={() => { markDone("script"); go(inEra ? "you" : "begin"); }} onBack={() => go(inEra ? "you" : "path")} />;
  if (view === "begin") return <Begin st={st} update={update} onBegin={() => { update({ era: { start: today, n: ((st.era && st.era.n) || 0) + 1 } }); markDone("begin"); go("today"); }} onBack={() => go("path")} />;
  if (view === "morning") return <Morning st={st} day={day} setDay={setDay} onDone={() => go("today")} />;
  if (view === "evening") return <Evening st={st} day={day} setDay={setDay} update={update} go={go} onDone={() => go("today")} />;
  if (view === "caught") return <Caught st={st} day={day} setDay={setDay} onDone={() => go("today")} />;
  if (view === "weekly") return <Weekly st={st} update={update} week={arg} onDone={() => go("today")} />;
  if (view === "review") return <Review st={st} update={update} go={go} />;
  if (view === "sos") return <SOS onBack={() => go(arg || (inEra ? "you" : "path"))} />;

  // the four tabs once the era has begun
  const tabs = inEra ? (
    <nav className="tabs" aria-label="Main">
      {[["today", "Today"], ["sound", "Sound"], ["evidence", "Evidence"], ["you", "You"]].map(([id, label]) => (
        <button key={id} className={"tab" + (view === id ? " on" : "")} onClick={() => go(id)} aria-current={view === id ? "page" : undefined}><TabIcon id={id} /><span>{label}</span></button>
      ))}
    </nav>) : null;
  if (view === "sound") return <><Sound st={st} update={update} go={go} back={inEra ? null : () => go("path")} />{tabs}</>;
  if (view === "evidence") return <><Evidence st={st} update={update} />{tabs}</>;
  if (view === "you") return <><You st={st} update={update} go={go} back={inEra ? null : () => go("path")} />{tabs}</>;
  return <><Today st={st} day={day} go={go} />{tabs}</>;
}

function TabIcon({ id }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  return (<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    {id === "today" && <g {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" /></g>}
    {id === "sound" && <g {...p}><path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 11v2" /></g>}
    {id === "evidence" && <g {...p}><path d="M7 4h10l2 4v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8z" /><path d="M9 12l2 2 4-4" /></g>}
    {id === "you" && <g {...p}><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-4 3.1-6.5 7-6.5s7 2.5 7 6.5" /><circle cx="12" cy="3" r=".8" fill="currentColor" /></g>}
  </svg>);
}

/* ---------------- entering ---------------- */
function Enter({ first, onEnter }) {
  const q = useMemo(() => quoteFor(), []);
  return (
    <Shell>
      <div className="center grow">
        <Orb size={150} />
        <p className="gline bquote">{first ? "Who were you before the world told you who to be?" : q}</p>
        <button className="btn gold" onClick={() => { getCtx(); bowl(261.6, 0.08); onEnter(); }}>Enter</button>
        <div className="bfoot"><Wordmark sub="Identity" /></div>
      </div>
    </Shell>
  );
}

function Welcome({ onGo }) {
  return (
    <Shell>
      <div className="welcome">
        <Wordmark sub="Identity" />
        <p className="kicker">Let the old you go</p>
        <h1 className="display">You aren't stuck. You're consistent.</h1>
        <p className="lede">You've been faithfully living out a picture of yourself someone else drew, mostly before you could read. This app helps you put that picture down and live from a new one.</p>
        <div className="steps">
          <div className="step"><span className="stepn">1</span><span>See why nothing has stuck so far, and feel safe enough to change. About fifteen minutes.</span></div>
          <div className="step"><span className="stepn">2</span><span>Name the old lines you've lived by, thank them, and let them go. Then write who you are now.</span></div>
          <div className="step"><span className="stepn">3</span><span>Record it in your own voice over a theta sound bed. Listen morning and night, say it out loud, and check in for 21 days.</span></div>
        </div>
        <p className="lede dim">Everything you write stays on this phone. {SAFETY}</p>
        <button className="btn gold" onClick={onGo}>Show me</button>
      </div>
    </Shell>
  );
}

function Explain({ onDone, onBack }) {
  const [i, setI] = useState(0);
  const c = EXPLAIN[i];
  const last = i === EXPLAIN.length - 1;
  return (
    <Shell>
      <div className="toprow"><Back onClick={() => (i ? setI(i - 1) : onBack())} /><Steps n={i} of={EXPLAIN.length} /></div>
      <div className="glimmer" key={i}>
        {c.visual ? <ExplainArt kind={c.visual} /> : <Orb size={130} />}
        <p className="kicker">{c.kicker}</p>
        <p className="gline">{c.line}</p>
        <p className="gsub left">{c.sub}</p>
        <button className="btn gold" onClick={() => (last ? onDone() : setI(i + 1))}>{last ? "Show me how" : "Go on"}</button>
      </div>
    </Shell>
  );
}

/* ---------------- the path (setup, before the era) ---------------- */
function PathView({ st, go }) {
  const done = st.done || {};
  const next = PATH.find((p) => !done[p.id]);
  return (
    <Shell>
      <div className="home">
        <Wordmark sub="Identity" />
        <p className="kicker hgreet">The path</p>
        <h1 className="display sm">{next ? (Object.keys(done).length ? "Pick up where you left off." : "Seven steps. One at a time.") : "Ready."}</h1>
        <ol className="path">
          {PATH.map((p, i) => {
            const isDone = !!done[p.id], isNext = next && next.id === p.id;
            const open = isDone || isNext;
            return (
              <li key={p.id} className={"pstep" + (isDone ? " done" : "") + (isNext ? " next" : "")}>
                <button disabled={!open} onClick={() => go(p.id)}>
                  <span className="pnum">{isDone ? "✓" : i + 1}</span>
                  <span className="ptext"><span className="pname">{p.name}</span><span className="pline">{p.line}</span></span>
                  {isNext && <span className="pgo">Begin</span>}
                </button>
              </li>
            );
          })}
        </ol>
        <div className="linkrow"><button className="ghost light" onClick={() => go("sound")}>Sound room</button><button className="ghost light" onClick={() => go("you")}>Settings</button><button className="ghost light" onClick={() => go("sos", "path")}>SOS</button></div>
      </div>
    </Shell>
  );
}

/* ---------------- name the old you ---------------- */
function Audit({ st, update, onDone, onBack }) {
  const old = st.old || [];
  const [stage, setStage] = useState(old.length ? "list" : "areas"); // areas | pick | dig | list
  const [areas, setAreas] = useState(() => [...new Set(old.map((o) => o.area))]);
  const [ai, setAi] = useState(0); // index into areas while picking
  const [digId, setDigId] = useState(null);
  const [custom, setCustom] = useState("");
  const setOld = (fn) => update((s) => ({ old: fn(s.old || []) }));

  if (stage === "areas") return (
    <Shell>
      <div className="toprow"><Back onClick={onBack} /></div>
      <div className="flow">
        <p className="kicker">Name the old you · 1 of 3</p>
        <h1 className="display sm">Where does the old story run loudest?</h1>
        <p className="lede dim">Pick one to three. You can come back for the rest in another era.</p>
        <div className="chips">
          {AREAS.map((a) => { const on = areas.includes(a.id); return <button key={a.id} className={"chip" + (on ? " on" : "")} style={{ "--acc": a.colour }} aria-pressed={on} onClick={() => setAreas(on ? areas.filter((x) => x !== a.id) : areas.length < 3 ? [...areas, a.id] : areas)}>{a.name}</button>; })}
        </div>
        <button className="btn gold" disabled={!areas.length} onClick={() => { setAi(0); setStage("pick"); }}>Next</button>
      </div>
    </Shell>
  );

  if (stage === "pick") {
    const a = areaOf(areas[ai]);
    const mine = old.filter((o) => o.area === a.id);
    const has = (t) => mine.some((o) => o.text === t);
    const toggle = (t) => has(t) ? setOld((l) => l.filter((o) => !(o.area === a.id && o.text === t))) : setOld((l) => [...l, { id: uid(), area: a.id, text: t }]);
    const add = () => { const t = custom.trim(); if (t && !has(t)) setOld((l) => [...l, { id: uid(), area: a.id, text: t }]); setCustom(""); };
    const nextArea = () => { if (ai + 1 < areas.length) setAi(ai + 1); else setStage("list"); };
    return (
      <Shell>
        <div className="toprow"><Back onClick={() => (ai ? setAi(ai - 1) : setStage("areas"))} /><Steps n={ai} of={areas.length} /></div>
        <div className="flow">
          <p className="kicker" style={{ color: a.colour }}>{a.name} · 2 of 3</p>
          <h1 className="display sm">Which of these have you said about yourself?</h1>
          <p className="lede dim">Out loud or in your head. Tap any that land, and write your own. The ones that sting are usually the ones.</p>
          <div className="optlist">
            {a.lines.map((t) => <button key={t} className={"opt" + (has(t) ? " sel" : "")} aria-pressed={has(t)} onClick={() => toggle(t)}><span className="odot" />"{t}"</button>)}
            {mine.filter((o) => !a.lines.includes(o.text)).map((o) => <button key={o.id} className="opt sel" onClick={() => toggle(o.text)}><span className="odot" />"{o.text}"</button>)}
          </div>
          <div className="askrow"><input className="tin" value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="In my own words: I'm…" /><button className="btn ink2" onClick={add} disabled={!custom.trim()}>Add</button></div>
          <button className="btn gold" disabled={!mine.length} onClick={nextArea}>Next</button>
        </div>
      </Shell>
    );
  }

  if (stage === "dig" && digId) {
    const o = old.find((x) => x.id === digId);
    const set = (k, v) => setOld((l) => l.map((x) => (x.id === digId ? { ...x, [k]: v } : x)));
    return (
      <Shell>
        <div className="toprow"><Back onClick={() => setStage("list")} /></div>
        <div className="flow">
          <p className="kicker">Where it came from</p>
          <h1 className="display sm quote">"{o.text}"</h1>
          <label className="q">When did you first start believing this?</label>
          <div className="chips">{ORIGIN_AGES.map((g) => <button key={g} className={"chip" + (o.age === g ? " on" : "")} onClick={() => set("age", g)}>{g}</button>)}</div>
          <label className="q" htmlFor="who">Whose voice is it? Who said it, or showed it to you?</label>
          <input id="who" className="tin" value={o.who || ""} onChange={(e) => set("who", e.target.value)} placeholder="A parent, a teacher, a moment…" />
          <label className="q" htmlFor="kept">What was it protecting you from?</label>
          <textarea id="kept" className="tarea" rows="2" value={o.kept || ""} onChange={(e) => set("kept", e.target.value)} placeholder="Every old belief was trying to keep you safe from something." />
          <label className="q" htmlFor="cost">What has it cost you?</label>
          <textarea id="cost" className="tarea" rows="2" value={o.cost || ""} onChange={(e) => set("cost", e.target.value)} placeholder="Chances, people, years, peace…" />
          <p className="tnote light">None of this is required. If it brings up something heavy, stop here. That's wisdom, not weakness.</p>
          <button className="btn gold" onClick={() => setStage("list")}>Done</button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="toprow"><Back onClick={() => setStage("areas")} label="Areas" /></div>
      <div className="flow">
        <p className="kicker">Name the old you · 3 of 3</p>
        <h1 className="display sm">These are the lines you've been living by.</h1>
        <p className="lede dim">Tap one to trace where it came from. You don't have to do them all. Seeing where a belief started is often enough to loosen it.</p>
        <div className="oldlist">
          {old.map((o) => (
            <button key={o.id} className="oldcard" style={{ "--acc": areaOf(o.area).colour }} onClick={() => { setDigId(o.id); setStage("dig"); }}>
              <span className="oldtext">"{o.text}"</span>
              <span className="oldmeta">{o.age || o.who || o.kept ? [o.age, o.who].filter(Boolean).join(" · ") || "Traced" : "Trace it →"}</span>
            </button>
          ))}
        </div>
        <button className="btn gold" disabled={!old.length} onClick={onDone}>I've seen them. Now let them go</button>
      </div>
    </Shell>
  );
}

/* ---------------- let it go ---------------- */
function HoldButton({ onHeld, label = "Hold to let go", ms = 2400 }) {
  const [p, setP] = useState(0);
  const raf = useRef(0), t0 = useRef(0), fired = useRef(false);
  const tick = () => {
    const k = Math.min(1, (performance.now() - t0.current) / ms);
    setP(k);
    if (k >= 1 && !fired.current) { fired.current = true; onHeld(); return; }
    raf.current = requestAnimationFrame(tick);
  };
  const down = (e) => { e.preventDefault(); fired.current = false; t0.current = performance.now(); raf.current = requestAnimationFrame(tick); };
  const up = () => { cancelAnimationFrame(raf.current); if (!fired.current) setP(0); };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  return (
    <button className="hold" style={{ "--p": p }} onPointerDown={down} onPointerUp={up} onPointerLeave={up} onPointerCancel={up} onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !e.repeat) { fired.current = true; onHeld(); } }}>
      <span className="holdfill" /><span className="holdlabel">{label}</span>
    </button>
  );
}

function Release({ st, update, onDone, onBack }) {
  const old = st.old || [];
  const left = old.filter((o) => !o.released);
  const [going, setGoing] = useState(false);
  const [said, setSaid] = useState(false);
  const cur = left[0];
  const let_go = () => { setGoing(true); releaseSound(); if (navigator.vibrate) navigator.vibrate(30); };
  const gone = () => { update((s) => ({ old: (s.old || []).map((o) => (o.id === cur.id ? { ...o, released: dayKey() } : o)) })); setGoing(false); setSaid(false); };
  if (!cur) return (
    <Shell>
      <div className="glimmer">
        <Orb size={170} />
        <p className="kicker">Let it go</p>
        <p className="gline">Lighter.</p>
        <p className="gsub">{old.length} old {old.length === 1 ? "line" : "lines"} thanked and put down. The space they took up is yours now. Let's fill it on purpose.</p>
        <button className="btn gold" onClick={onDone}>Write the new me</button>
      </div>
    </Shell>
  );
  return (
    <Shell>
      <div className="toprow"><Back onClick={onBack} /><span className="count light">{old.length - left.length + 1} of {old.length}</span></div>
      <div className="glimmer release">
        <p className="kicker">Let it go</p>
        <Dissolve text={`"${cur.text}"`} go={going} onDone={gone} />
        {!going && <>
          <p className="gsub">{cur.kept ? `You kept me safe from ${cur.kept.replace(/^from\s+/i, "").replace(/[.]$/, "")}. ` : "You were trying to keep me safe. "}Thank you. I don't need you now.</p>
          {!said ? <button className="btn ink2" onClick={() => setSaid(true)}>I've said it, out loud or inside</button> : <HoldButton onHeld={let_go} />}
        </>}
      </div>
    </Shell>
  );
}

/* ---------------- write the new you ---------------- */
const suggestEra = (areas) => {
  const m = { worth: "The Worthy Era", body: "The Strong Era", money: "The Abundant Era", love: "The Open-Hearted Era", work: "The Builder Era", habit: "The Clean Era" };
  return [...new Set(areas.map((a) => m[a]).filter(Boolean)), "The Quiet Power Era", "The First Chapter"].slice(0, 4);
};
function Become({ st, update, onDone, onBack }) {
  const old = st.old || [];
  const ns = st.newSelf || {};
  const [stage, setStage] = useState("lines"); // lines | scene | name | questions
  const [si, setSi] = useState(0);
  // seed a new line for every old one, once
  // seed a new line for each old one not seen before; lines removed on purpose stay removed
  useEffect(() => {
    const seeded = ns.seeded || [];
    const fresh = old.filter((o) => !seeded.includes(o.id));
    const have = ns.statements || [];
    if (!fresh.length && have.length) return;
    const add = fresh.map((o) => ({ id: uid(), from: o.id, area: o.area, text: REWRITES[o.text] || "" }));
    const statements = [...have, ...add];
    update({ newSelf: { ...ns, seeded: [...seeded, ...fresh.map((o) => o.id)], statements: statements.length ? statements : [{ id: uid(), area: "worth", text: "" }] } });
  }, []);
  const setNS = (patch) => update((s) => ({ newSelf: { ...(s.newSelf || {}), ...patch } }));
  const statements = ns.statements || [];
  const setLine = (id, text) => setNS({ statements: statements.map((x) => (x.id === id ? { ...x, text } : x)) });
  const fromText = (id) => { const o = old.find((x) => x.id === id); return o ? o.text : null; };

  if (stage === "lines") return (
    <Shell>
      <div className="toprow"><Back onClick={onBack} /><Steps n={0} of={4} /></div>
      <div className="flow">
        <p className="kicker">Write the new you · who</p>
        <h1 className="display sm">Who are you now?</h1>
        <p className="lede dim">Present tense. "I am", not "I will be". Say what you are rather than what you're not, with one exception: "I'm not a smoker" beats "I'm trying to quit" every time. I've drafted a line for each old one. Make each one yours.</p>
        {statements.map((s) => {
          const hint = tenseCheck(s.text);
          return (
            <div key={s.id} className="newline" style={{ "--acc": areaOf(s.area).colour }}>
              {fromText(s.from) && <p className="was">was: "{fromText(s.from)}"</p>}
              <textarea className="tarea big" rows="2" value={s.text} onChange={(e) => setLine(s.id, e.target.value)} placeholder="I am…" aria-label="New line" />
              {hint && <p className="hint">{hint}</p>}
              {statements.length > 1 && <button className="mini" onClick={() => setNS({ statements: statements.filter((x) => x.id !== s.id) })}>Remove</button>}
            </div>
          );
        })}
        <button className="ghost light" onClick={() => setNS({ statements: [...statements, { id: uid(), area: (statements[0] || {}).area || "worth", text: "" }] })}>+ Add another line</button>
        <button className="btn gold" disabled={!statements.some((s) => s.text.trim())} onClick={() => { setNS({ statements: statements.filter((s) => s.text.trim()) }); setStage("scene"); }}>Next</button>
      </div>
    </Shell>
  );

  if (stage === "scene") {
    const q = SENSES[si];
    const scene = ns.scene || {};
    return (
      <Shell>
        <div className="toprow"><Back onClick={() => (si ? setSi(si - 1) : setStage("lines"))} /><Steps n={1} of={4} /></div>
        <div className="flow">
          <p className="kicker">Write the new you · the moment it's done · {si + 1} of {SENSES.length}</p>
          <h1 className="display sm">{q.q}</h1>
          <p className="lede dim">{q.hint} Write it as if it's happening now. Feel it as you write it, not as a wish but as a memory of something that's already true.</p>
          <textarea key={q.id} className="tarea big" rows="4" value={scene[q.id] || ""} onChange={(e) => setNS({ scene: { ...scene, [q.id]: e.target.value } })} placeholder="I'm…" autoFocus />
          <button className="btn gold" onClick={() => (si + 1 < SENSES.length ? setSi(si + 1) : setStage("name"))}>{scene[q.id] ? "Next" : "Skip"}</button>
        </div>
      </Shell>
    );
  }

  if (stage === "name") return (
    <Shell>
      <div className="toprow"><Back onClick={() => { setSi(SENSES.length - 1); setStage("scene"); }} /><Steps n={2} of={4} /></div>
      <div className="flow">
        <p className="kicker">Write the new you · name it</p>
        <h1 className="display sm">Give this era a name.</h1>
        <p className="lede dim">Something you'd be proud to say. It goes on your identity card and at the end of your recording. Optional.</p>
        <input className="tin big" value={ns.eraName || ""} onChange={(e) => setNS({ eraName: e.target.value })} placeholder="The … Era" />
        <div className="chips">{suggestEra([...new Set(old.map((o) => o.area))]).map((n) => <button key={n} className={"chip" + (ns.eraName === n ? " on" : "")} onClick={() => setNS({ eraName: n })}>{n}</button>)}</div>
        <button className="btn gold" onClick={() => setStage("questions")}>Next</button>
      </div>
    </Shell>
  );

  const qs = ns.questions || POWER_QUESTIONS.slice(0, 3);
  return (
    <Shell>
      <div className="toprow"><Back onClick={() => setStage("name")} /><Steps n={3} of={4} /></div>
      <div className="flow">
        <p className="kicker">Write the new you · your questions</p>
        <h1 className="display sm">Pick the questions you'll carry.</h1>
        <p className="lede dim">Your brain can't leave a question alone. Ask "why am I such an idiot?" and it will find you evidence. Ask better ones. Choose up to four; they'll turn up through your day.</p>
        <div className="optlist">
          {POWER_QUESTIONS.map((q) => { const on = qs.includes(q); return <button key={q} className={"opt" + (on ? " sel" : "")} aria-pressed={on} onClick={() => setNS({ questions: on ? qs.filter((x) => x !== q) : qs.length < 4 ? [...qs, q] : qs })}><span className="odot" />{q}</button>; })}
        </div>
        <button className="btn gold" disabled={!qs.length} onClick={() => { setNS({ questions: qs }); onDone(); }}>Make my recording</button>
      </div>
    </Shell>
  );
}

/* ---------------- the recording ---------------- */
function ScriptView({ st, update, onDone, onBack }) {
  const ns = st.newSelf || {};
  const built = useMemo(() => buildScript({ statements: ns.statements || [], scene: ns.scene, eraName: ns.eraName }), [st.newSelf]);
  const [stage, setStage] = useState("read"); // read | record
  const [text, setText] = useState(st.script || built);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const saveText = (t) => { setText(t); update({ script: t }); };
  const shape = async () => {
    setBusy(true); setNote("");
    try {
      const t = await askAI(VOICE + `\n\nYou shape a spoken self-hypnosis recording for someone who will record it in their own voice and listen as they fall asleep and as they wake. Keep their own words and every "I am" line exactly as written. Keep the structure: relaxation, a countdown from ten to one, calm body calm mind, their lines, the moment it's already done in all five senses, their lines again, a soft close that works for night or morning. Mark every pause with " … ". 450 to 650 words. Present tense throughout. Plain text only: paragraphs separated by blank lines, no headings, no stage directions.`, `Their draft:\n\n${text}`, 1400);
      saveText(t);
    } catch { setNote("The writing help isn't reachable just now. Your own draft works perfectly well."); }
    setBusy(false);
  };
  if (stage === "record") return (
    <Shell className="practice">
      <div className="toprow"><Back onClick={() => setStage("read")} /></div>
      <div className="flow">
        <p className="kicker">Make your recording</p>
        <h1 className="display sm">Your voice is the one it trusts.</h1>
        <Recorder script={text} onSaved={async (blob) => { await putVoice(blob); update({ voice: { at: dayKey(), mime: blob.type } }); bowl(261.6, 0.1); onDone(); }} onSkip={() => { update({ voice: null }); onDone(); }} />
      </div>
    </Shell>
  );
  return (
    <Shell>
      <div className="toprow"><Back onClick={onBack} /></div>
      <div className="flow">
        <p className="kicker">Make your recording · your script</p>
        <h1 className="display sm">Here's your script, built from your words.</h1>
        <p className="lede dim">Read it through once. Change anything that doesn't sound like you. Each "…" is a breath.</p>
        <textarea className="tarea script" value={text} onChange={(e) => saveText(e.target.value)} aria-label="Your script" />
        {note && <p className="hint">{note}</p>}
        <div className="row wrap">
          <button className="btn ink2" onClick={shape} disabled={busy}>{busy ? "Shaping…" : "Help me shape it"}</button>
          <button className="ghost light" onClick={() => saveText(built)}>Start again from my lines</button>
        </div>
        <button className="btn gold" onClick={() => setStage("record")}>I'm ready to record</button>
      </div>
    </Shell>
  );
}

/* ---------------- begin the era ---------------- */
function Begin({ st, update, onBegin, onBack }) {
  const r = st.reminders || { morning: "06:45", evening: "22:00" };
  const setR = (k, v) => update({ reminders: { ...r, [k]: v } });
  const [added, setAdded] = useState(false);
  const ics = () => { download(new Blob([reminderICS({ start: dayKey(), days: ERA_DAYS, morning: r.morning, evening: r.evening, eraName: st.newSelf && st.newSelf.eraName })], { type: "text/calendar" }), "ishkiy-identity-reminders.ics"); setAdded(true); };
  return (
    <Shell>
      <div className="toprow"><Back onClick={onBack} /></div>
      <div className="flow">
        <p className="kicker">Begin your era</p>
        <h1 className="display sm">21 days. Morning and night.</h1>
        <p className="lede dim">Twenty-one days is how long Maxwell Maltz found people needed before a new self-image started to settle. Treat it as a floor, not a finish line.</p>
        <div className="plan">
          <div className="planrow"><span className="planwhen">On waking</span><span>Listen once. Say your lines out loud. Mirror, if you like. Ten minutes, before the phone.</span></div>
          <div className="planrow"><span className="planwhen">Through the day</span><span>Guard what goes in. Ask your questions. Catch the old voice and swap the line. Log the evidence.</span></div>
          <div className="planrow"><span className="planwhen">Before sleep</span><span>Check in. Calm body, calm mind. Fall asleep to your recording.</span></div>
          <div className="planrow"><span className="planwhen">Every 7 days</span><span>A longer check-in: where did the old you pull back, and what did the new you do?</span></div>
        </div>
        <div className="times">
          <label>Wake-up reminder<input type="time" className="tin" value={r.morning} onChange={(e) => setR("morning", e.target.value)} /></label>
          <label>Bedtime reminder<input type="time" className="tin" value={r.evening} onChange={(e) => setR("evening", e.target.value)} /></label>
        </div>
        <button className="btn ink2" onClick={ics}>{added ? "Added. Open the file to save it" : "Add reminders to my calendar"}</button>
        <p className="tnote light">Your calendar will remind you at those times for all 21 days, with no account and nothing sent anywhere. For the best experience, add this app to your home screen from your browser's menu.</p>
        <button className="btn gold" onClick={onBegin}>Begin day one</button>
      </div>
    </Shell>
  );
}

/* ---------------- today ---------------- */
const eraDay = (st) => (st.era ? daysBetween(st.era.start, dayKey()) + 1 : 0);
const weeklyDue = (st) => { const d = eraDay(st); const w = st.weekly || []; for (const n of [1, 2, 3]) if (d >= n * 7 && !w.some((x) => x.week === n && x.era === st.era.n)) return n; return null; };

function Today({ st, day, go }) {
  const n = eraDay(st);
  const ns = st.newSelf || {};
  const lines = (ns.statements || []).map((s) => s.text);
  const hour = new Date().getHours();
  const due = weeklyDue(st);
  const reviewReady = n >= ERA_DAYS && (st.weekly || []).some((w) => w.week === 3 && w.era === st.era.n);
  const [lineI, setLineI] = useState(0);
  useEffect(() => { if (lines.length < 2) return; const t = setInterval(() => setLineI((i) => (i + 1) % lines.length), 6000); return () => clearInterval(t); }, [lines.length]);
  const days = st.days || {};
  const dots = [...Array(ERA_DAYS)].map((_, i) => { const d = new Date(st.era.start + "T12:00:00"); d.setDate(d.getDate() + i); const k = dayKey(d); const x = days[k] || {}; return { k, v: (x.morning ? 1 : 0) + (x.evening ? 1 : 0), today: i === n - 1, future: i >= n }; });
  const practised = dots.filter((d) => d.v > 0).length;
  const missedYesterday = n > 1 && !(dots[n - 2] && dots[n - 2].v);
  return (
    <Shell className="withtabs">
      <div className="today">
        <div className="todayhead"><Wordmark sub="Identity" /><span className="count light">{n <= ERA_DAYS ? `Day ${n} of ${ERA_DAYS}` : `${ERA_DAYS} days done`}</span></div>
        <div className="idcard">
          <p className="kicker">{ns.eraName || "The new you"}</p>
          <p className="idline" key={lineI}>{lines[lineI % Math.max(1, lines.length)] || "I am…"}</p>
          <div className="eradots" aria-label={`${practised} of ${Math.min(n, ERA_DAYS)} days practised`}>{dots.map((d) => <span key={d.k} className={"ed" + (d.v === 2 ? " full" : d.v === 1 ? " half" : "") + (d.today ? " now" : "") + (d.future ? " future" : "")} />)}</div>
        </div>
        {missedYesterday && !day.morning && <p className="gentle">You missed yesterday. Nothing resets. The era carries on from right here.</p>}
        {reviewReady && <Card kicker="Day 21" title="Your era review" line="Look at who you were and who you've become. Then choose what's next." cta="Open it" onClick={() => go("review")} accent />}
        {due && <Card kicker={`Week ${due}`} title="Your weekly check-in" line="Five minutes. Where did the old you pull back, and what did the new you do?" cta="Check in" onClick={() => go("weekly", due)} accent />}
        <Card kicker="On waking" title={day.morning ? "Morning done" : "Morning practice"} line={day.morning ? (day.spoken ? `Said out loud ${day.spoken} ${day.spoken === 1 ? "time" : "times"}. Every one is a vote for the new you.` : "Done. Tomorrow, say your lines out loud too. Spoken lands deeper than thought.") : "Listen once, say your lines out loud, look yourself in the eye."} cta={day.morning ? "Again" : "Start"} done={day.morning} onClick={() => go("morning")} soft={hour >= 12 && !day.morning} />
        <div className="daycard">
          <p className="kicker">Through the day</p>
          <p className="pq">{questionFor(ns.questions)}</p>
          <div className="row wrap">
            <button className="btn ink2 small" onClick={() => go("caught")}>I caught the old voice</button>
            <button className="btn ink2 small" onClick={() => go("evidence")}>Log evidence</button>
          </div>
          {(day.caught || 0) > 0 && <p className="tnote light">Caught and swapped {day.caught} {day.caught === 1 ? "time" : "times"} today.</p>}
          <p className="tnote light">Guard your input. Every podcast, feed and conversation either feeds the old you or the new one.</p>
        </div>
        <Card kicker="Before sleep" title={day.evening ? "Night done" : "Tonight"} line={day.evening ? "Checked in and listened. Sleep well." : "Check in, calm body calm mind, then your recording."} cta={day.evening ? "Listen again" : "Start"} done={day.evening} onClick={() => go("evening")} />
        <p className="hquote">{quoteFor()}</p>
      </div>
    </Shell>
  );
}
function Card({ kicker, title, line, cta, onClick, done, accent, soft }) {
  return (
    <button className={"tcard" + (done ? " done" : "") + (accent ? " accent" : "") + (soft ? " soft" : "")} onClick={onClick}>
      <span className="tck">{done && <span className="tick">✓</span>}{kicker}</span>
      <span className="tct">{title}</span>
      <span className="tcl">{line}</span>
      <span className="tcgo">{cta} →</span>
    </button>
  );
}

/* ---------------- morning ---------------- */
function Morning({ st, day, setDay, onDone }) {
  const [stage, setStage] = useState("intro"); // intro | listen | say | mirror | done
  const ns = st.newSelf || {};
  const lines = (ns.statements || []).map((s) => s.text).filter(Boolean);
  const [spoken, setSpoken] = useState(0);
  const finish = (extra = {}) => { setDay({ morning: true, spoken: (day.spoken || 0) + spoken, ...extra }); setStage("done"); bowl(329.6, 0.1); };
  return (
    <Shell className="practice">
      <div className="toprow"><Back onClick={onDone} label="Today" /></div>
      {stage === "intro" && <div className="glimmer">
        <Orb size={150} />
        <p className="kicker">On waking</p>
        <p className="gline">{MORNING_LINES[new Date().getDate() % MORNING_LINES.length]}</p>
        <p className="gsub">Three parts. Listen, say it, see it. About ten minutes.</p>
        <button className="btn gold" onClick={() => setStage("listen")}>Begin</button>
      </div>}
      {stage === "listen" && <ListenSession script={st.script || ""} onDone={() => setStage("say")} onExit={() => setStage("say")} />}
      {stage === "say" && <SayAloud lines={lines} sub="Say it like it's already true." onDone={(n) => { setSpoken(n); setStage("mirror"); }} onExit={(n) => { setSpoken(n); setStage("mirror"); }} />}
      {stage === "mirror" && <div className="glimmer">
        <p className="kicker">Mirror work</p>
        <p className="gline">One more, looking yourself in the eye.</p>
        <button className="btn gold" onClick={() => setStage("mirrorOn")}>Open the mirror</button>
        <button className="ghost light" onClick={() => finish()}>Not today</button>
      </div>}
      {stage === "mirrorOn" && <Mirror line={lines[new Date().getDate() % Math.max(1, lines.length)] || "I am enough"} onDone={() => finish({ mirror: true })} />}
      {stage === "done" && <div className="glimmer">
        <Orb size={150} />
        <p className="kicker">Morning done</p>
        <p className="gline">Go and be them today.</p>
        <p className="gsub">Your question for the morning: {questionFor(ns.questions)}</p>
        <button className="btn gold" onClick={onDone}>Into the day</button>
      </div>}
    </Shell>
  );
}

/* ---------------- evening ---------------- */
function Evening({ st, day, setDay, update, go, onDone }) {
  const [stage, setStage] = useState(day.evening ? "listen" : "check"); // check | calm | listen | done
  const [feel, setFeel] = useState(day.feel != null ? day.feel : 5);
  const [input, setInput] = useState(day.input || null);
  const [vote, setVote] = useState("");
  const saveCheck = () => {
    setDay({ feel, input, checked: true });
    if (vote.trim()) update((s) => ({ evidence: [{ id: uid(), at: dayKey(), text: vote.trim() }, ...(s.evidence || [])] }));
    setStage("calm");
  };
  const done = () => { setDay({ evening: true }); setStage("done"); };
  return (
    <Shell className="practice">
      <div className="toprow"><Back onClick={onDone} label="Today" /></div>
      {stage === "check" && <div className="flow">
        <p className="kicker">Before sleep · check in</p>
        <h1 className="display sm">How much did you feel like the new you today?</h1>
        <div className="slider"><input type="range" min="0" max="10" value={feel} onChange={(e) => setFeel(+e.target.value)} aria-label="How much you felt like the new you, 0 to 10" /><div className="sliderlabels"><span>The old me</span><b>{feel}</b><span>Fully the new me</span></div></div>
        <label className="q">What went in today?</label>
        <div className="chips">{INPUT_CHOICES.map((c) => <button key={c.id} className={"chip" + (input === c.id ? " on" : "")} onClick={() => setInput(c.id)} title={c.sub}>{c.label}</button>)}</div>
        <label className="q" htmlFor="vote">One vote for the new you. Today I acted as the new me when…</label>
        <textarea id="vote" className="tarea" rows="2" value={vote} onChange={(e) => setVote(e.target.value)} placeholder="Even something small counts." />
        <button className="btn gold" onClick={saveCheck}>Next</button>
      </div>}
      {stage === "calm" && <div className="glimmer">
        <p className="kicker">Calm body, calm mind</p>
        <p className="gline">{EVENING_LINES[new Date().getDate() % EVENING_LINES.length]}</p>
        <p className="gsub">Soften first, then listen. The harder you try, the further it gets. Let go.</p>
        <button className="btn gold" onClick={() => setStage("calmOn")}>Soften (three minutes)</button>
        <button className="ghost light" onClick={() => setStage("listen")}>Straight to my recording</button>
      </div>}
      {stage === "calmOn" && <CalmSession short onDone={() => { update((s) => ({ calmCount: (s.calmCount || 0) + 1 })); setStage("listen"); }} />}
      {stage === "listen" && <ListenSession night script={st.script || ""} onDone={done} onExit={done} />}
      {stage === "done" && <div className="glimmer">
        <Orb size={120} />
        <p className="gline">Sleep as the new you.</p>
        <p className="gsub">Assume the feeling of it done, and rest there.</p>
        <button className="btn gold" onClick={onDone}>Goodnight</button>
      </div>}
    </Shell>
  );
}

/* ---------------- caught the old voice ---------------- */
function Caught({ st, day, setDay, onDone }) {
  const old = st.old || [];
  const statements = (st.newSelf || {}).statements || [];
  const [pick, setPick] = useState(null);
  const swap = pick && (statements.find((s) => s.from === pick.id) || statements[0]);
  if (pick && swap) return (
    <Shell className="practice">
      <div className="toprow"><Back onClick={() => setPick(null)} /></div>
      <p className="was center-text">You caught: "{pick.text}"</p>
      <SayAloud lines={[swap.text]} title="Swap it" sub="Say the new line out loud, three times if you can." onDone={() => { setDay({ caught: (day.caught || 0) + 1, spoken: (day.spoken || 0) + 1 }); onDone(); }} onExit={onDone} />
    </Shell>
  );
  return (
    <Shell>
      <div className="toprow"><Back onClick={onDone} label="Today" /></div>
      <div className="flow">
        <p className="kicker">Caught the old voice</p>
        <h1 className="display sm">Good. Catching it is the work.</h1>
        <p className="lede dim">Which old line was it? No judgement. Every catch is a rep.</p>
        <div className="optlist">{old.map((o) => <button key={o.id} className="opt" onClick={() => setPick(o)}><span className="odot" />"{o.text}"</button>)}</div>
        {!old.length && <p className="lede dim">You haven't named any old lines yet.</p>}
      </div>
    </Shell>
  );
}

/* ---------------- evidence ---------------- */
function Evidence({ st, update }) {
  const [t, setT] = useState("");
  const ev = st.evidence || [];
  const add = () => { if (!t.trim()) return; update((s) => ({ evidence: [{ id: uid(), at: dayKey(), text: t.trim() }, ...(s.evidence || [])] })); setT(""); bowl(392, 0.07); };
  return (
    <Shell className="withtabs">
      <div className="flow">
        <p className="kicker">Evidence</p>
        <h1 className="display sm">Proof the new you is real.</h1>
        <p className="lede dim">Every time you act as the new you, it's a vote. Write the small ones down. On a bad day, read them back.</p>
        <div className="askrow"><textarea className="tarea" rows="2" value={t} onChange={(e) => setT(e.target.value)} placeholder="Today I…" aria-label="New evidence" /><button className="btn gold" onClick={add} disabled={!t.trim()}>Add</button></div>
        <div className="evlist">
          {ev.map((e) => <div key={e.id} className="ev"><span className="evdate">{new Date(e.at + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span><span>{e.text}</span></div>)}
          {!ev.length && <p className="tnote light">Nothing yet. The first one is the hardest to notice.</p>}
        </div>
      </div>
    </Shell>
  );
}

/* ---------------- weekly check-in ---------------- */
function Weekly({ st, update, week, onDone }) {
  const days = st.days || {};
  const feels = Object.keys(days).sort().slice(-7).map((k) => days[k].feel).filter((v) => v != null);
  const [self, setSelf] = useState(5);
  const [pull, setPull] = useState("");
  const [did, setDid] = useState("");
  const [need, setNeed] = useState("");
  const [stage, setStage] = useState("ask");
  const [reflection, setReflection] = useState("");
  const submit = async () => {
    setStage("thinking");
    const ns = st.newSelf || {};
    const fallback = `Week ${week}. You put yourself at ${self} out of 10. ${pull ? "The old you pulled back around this: " + pull.trim().replace(/[.]$/, "") + ". That's the rubber band, and noticing it is how it loosens." : ""} ${did ? "And the new you did this: " + did.trim().replace(/[.]$/, "") + ". That wasn't luck. That was you, voting." : ""}`.replace(/\s+/g, " ").trim() + "\n" + (need.trim() || "Morning and night. Keep going.");
    let text = fallback;
    try {
      text = await askAI(VOICE + "\n\nYou write a short weekly reflection for someone on a 21-day identity practice. 90 to 130 words. Speak to them as \"you\". Reflect their own words back in cleaner language. Name one pattern you can see, kindly. If the old self pulled them back, frame it as the rubber band snapping, which is normal and loosens with repetition, never as failure. End with one present-tense line for them to carry this week, on its own line.", JSON.stringify({ week, selfImageOutOf10: self, dailyFeelings: feels, newLines: (ns.statements || []).map((s) => s.text), eraName: ns.eraName, oldSelfPulledBack: pull, newSelfDid: did, lineTheyNeed: need }), 450);
    } catch {}
    setReflection(text);
    update((s) => ({ weekly: [...(s.weekly || []), { week, era: s.era.n, at: dayKey(), self, pull, did, need, reflection: text }] }));
    setStage("done");
  };
  if (stage === "done" || stage === "thinking") return (
    <Shell>
      <div className="glimmer">
        <Orb size={130} />
        <p className="kicker">Week {week}</p>
        {stage === "thinking" ? <p className="gsub">Reading it back…</p> : <div className="reflection">{reflection.split("\n").filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}</div>}
        {stage === "done" && <button className="btn gold" onClick={onDone}>Back to today</button>}
      </div>
    </Shell>
  );
  return (
    <Shell>
      <div className="toprow"><Back onClick={onDone} label="Today" /></div>
      <div className="flow">
        <p className="kicker">Week {week} check-in</p>
        <h1 className="display sm">How does the new you fit now?</h1>
        {feels.length > 1 && <><p className="tnote light">Your nightly check-ins this week</p><Spark values={feels} /></>}
        <label className="q">When you picture yourself, how much do you see the new you?</label>
        <div className="slider"><input type="range" min="0" max="10" value={self} onChange={(e) => setSelf(+e.target.value)} aria-label="Self-image, 0 to 10" /><div className="sliderlabels"><span>Old picture</span><b>{self}</b><span>New picture</span></div></div>
        <label className="q" htmlFor="pull">Where did the old you pull you back this week?</label>
        <textarea id="pull" className="tarea" rows="2" value={pull} onChange={(e) => setPull(e.target.value)} placeholder="The rubber band. Where did it snap?" />
        <label className="q" htmlFor="did">What did the new you do that the old you wouldn't have?</label>
        <textarea id="did" className="tarea" rows="2" value={did} onChange={(e) => setDid(e.target.value)} />
        <label className="q" htmlFor="need">What's the one line you most need to hear next week?</label>
        <input id="need" className="tin" value={need} onChange={(e) => setNeed(e.target.value)} placeholder="I am…" />
        <button className="btn gold" onClick={submit}>Finish check-in</button>
      </div>
    </Shell>
  );
}

/* ---------------- era review ---------------- */
function Review({ st, update, go }) {
  const old = st.old || [];
  const ns = st.newSelf || {};
  const days = st.days || {};
  const inEra = Object.keys(days).filter((k) => k >= st.era.start);
  const mornings = inEra.filter((k) => days[k].morning).length, nights = inEra.filter((k) => days[k].evening).length;
  const spoken = inEra.reduce((a, k) => a + (days[k].spoken || 0), 0);
  const feels = inEra.sort().map((k) => days[k].feel);
  const weekly = (st.weekly || []).filter((w) => w.era === st.era.n);
  const again = () => { update({ era: { start: dayKey(), n: st.era.n + 1 } }); go("today"); };
  return (
    <Shell>
      <div className="toprow"><Back onClick={() => go("today")} label="Today" /></div>
      <div className="flow">
        <p className="kicker">Era review · {ns.eraName || "Era " + st.era.n}</p>
        <h1 className="display sm">Twenty-one days ago, you said this about yourself.</h1>
        <div className="versus">
          {old.map((o) => { const s = (ns.statements || []).find((x) => x.from === o.id); return (
            <div key={o.id} className="vs"><p className="was">"{o.text}"</p>{s && <p className="now">{s.text}</p>}</div>); })}
        </div>
        <div className="stats">
          <div><b>{mornings}</b><span>mornings</span></div><div><b>{nights}</b><span>nights</span></div><div><b>{spoken}</b><span>lines said aloud</span></div><div><b>{(st.evidence || []).length}</b><span>pieces of evidence</span></div>
        </div>
        {feels.filter((v) => v != null).length > 1 && <><p className="tnote light">How much you felt like the new you, night by night</p><Spark values={feels} /></>}
        {weekly.length > 0 && <p className="lede dim">Week one you put yourself at {weekly[0].self} out of 10. {weekly.length > 1 ? `Now: ${weekly[weekly.length - 1].self}.` : ""}</p>}
        <p className="lede">Maltz called 21 days the minimum. The picture is still setting. Most people run a second era with the same lines to lock it in, or rewrite the lines that have already come true.</p>
        <button className="btn gold" onClick={again}>Begin another 21 days</button>
        <button className="btn ink2" onClick={() => go("become")}>Rewrite my lines first</button>
        <button className="ghost light" onClick={() => { update({ done: { explain: dayKey(), calm: dayKey() }, old: [], newSelf: null, script: null, era: { ...st.era, start: null } }); go("audit"); }}>Let go of something new</button>
      </div>
    </Shell>
  );
}

/* ---------------- sound room ---------------- */
function Sound({ st, update, go, back }) {
  const [playing, setPlaying] = useState(() => (liveBed() ? liveBed().key : null));
  const [vol, setVol] = useState(0.7);
  const [sleepMin, setSleepMin] = useState(0);
  const [hasVoice, setHasVoice] = useState(false);
  const [mixing, setMixing] = useState(false);
  const [tail, setTail] = useState(180);
  const timer = useRef(null);
  useEffect(() => { getVoice().then((b) => setHasVoice(!!b)); return () => clearTimeout(timer.current); }, []);
  const play = (k) => {
    clearTimeout(timer.current);
    if (playing === k) { stopBed(2); setPlaying(null); return; }
    startBed(k, { volume: vol }); setPlaying(k);
    if (sleepMin) timer.current = setTimeout(() => { stopBed(30); setPlaying(null); }, sleepMin * 60000);
  };
  const setV = (v) => { setVol(v); liveBed() && liveBed().setVolume(v); };
  const mix = async () => {
    setMixing(true);
    try { const blob = await getVoice(); const wav = await renderMix({ bedKey: "theta", voiceBlob: blob, tailSec: tail }); download(wav, `ishkiy-identity-${(st.newSelf && st.newSelf.eraName || "recording").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.wav`); }
    catch { alert("That mix couldn't be made on this phone. Try again in Chrome or Safari."); }
    setMixing(false);
  };
  return (
    <Shell className="withtabs">
      {back && <div className="toprow"><Back onClick={back} /></div>}
      <div className="flow">
        <p className="kicker">Sound room</p>
        <h1 className="display sm">Beds to soften into.</h1>
        <p className="lede dim">Every sound here is made live on your phone. The beats need headphones: a slightly different tone in each ear that your brain hears as a slow pulse. Never while driving.</p>
        <div className="beds">
          {Object.entries(BEDS).map(([k, b]) => (
            <button key={k} className={"bed" + (playing === k ? " on" : "")} onClick={() => play(k)} aria-pressed={playing === k}>
              <span className="bedplay" aria-hidden="true">{playing === k ? "❚❚" : "▶"}</span>
              <span className="bedtext"><span className="bedname">{b.name}{b.hz ? ` · ${b.hz} Hz` : ""}</span><span className="bedline">{b.line}</span></span>
            </button>
          ))}
        </div>
        <label className="q">Volume</label>
        <input type="range" min="0" max="1" step="0.05" value={vol} onChange={(e) => setV(+e.target.value)} aria-label="Volume" />
        <label className="q">Sleep timer</label>
        <div className="chips">{[0, 15, 30, 60].map((m) => <button key={m} className={"chip" + (sleepMin === m ? " on" : "")} onClick={() => setSleepMin(m)}>{m ? m + " min" : "Off"}</button>)}</div>
        <div className="panel">
          <p className="kicker">Your recording</p>
          {hasVoice ? <>
            <p className="lede dim">Download your voice mixed over the theta bed as one audio file. Play it from any music app with the screen off, all night if you like.</p>
            <label className="q">Bed after your voice ends</label>
            <div className="chips">{[[60, "1 min"], [180, "3 min"], [600, "10 min"]].map(([s, l]) => <button key={s} className={"chip" + (tail === s ? " on" : "")} onClick={() => setTail(s)}>{l}</button>)}</div>
            <button className="btn gold" onClick={mix} disabled={mixing}>{mixing ? "Mixing… this takes a moment" : "Download my mix"}</button>
          </> : <p className="lede dim">You haven't recorded yet. Your own voice is the one your nervous system trusts most.</p>}
          {st.script && <button className="ghost light" onClick={() => go("script")}>{hasVoice ? "Record it again" : "Record it now"}</button>}
        </div>
      </div>
    </Shell>
  );
}

/* ---------------- you ---------------- */
function You({ st, update, go, back }) {
  const ns = st.newSelf || {};
  const old = st.old || [];
  const r = st.reminders || { morning: "06:45", evening: "22:00" };
  const [sure, setSure] = useState(false);
  const exportData = () => download(new Blob([JSON.stringify(st, null, 2)], { type: "application/json" }), "ishkiy-identity-backup.json");
  const ics = () => download(new Blob([reminderICS({ start: dayKey(), days: Math.max(1, ERA_DAYS - eraDay(st) + 1), morning: r.morning, evening: r.evening, eraName: ns.eraName })], { type: "text/calendar" }), "ishkiy-identity-reminders.ics");
  return (
    <Shell className="withtabs">
      {back && <div className="toprow"><Back onClick={back} /></div>}
      <div className="flow">
        <p className="kicker">You</p>
        <h1 className="display sm">{ns.eraName || "Who you are now"}</h1>
        {(ns.statements || []).length > 0 ? <div className="idlist">{ns.statements.map((s) => <p key={s.id} style={{ "--acc": areaOf(s.area).colour }}>{s.text}</p>)}</div> : <p className="lede dim">You haven't written your new lines yet.</p>}
        {old.some((o) => o.released) && <p className="tnote light">Let go: {old.filter((o) => o.released).map((o) => `"${o.text}"`).join(", ")}</p>}
        <div className="row wrap">
          {st.done && st.done.become && <button className="btn ink2 small" onClick={() => go("become")}>Edit my lines</button>}
          {st.script && <button className="btn ink2 small" onClick={() => go("script")}>Script and recording</button>}
          <button className="btn ink2 small" onClick={() => go("calm")}>Calm body, calm mind</button>
        </div>
        <div className="panel">
          <p className="kicker">Reminders</p>
          <div className="times">
            <label>On waking<input type="time" className="tin" value={r.morning} onChange={(e) => update({ reminders: { ...r, morning: e.target.value } })} /></label>
            <label>Before sleep<input type="time" className="tin" value={r.evening} onChange={(e) => update({ reminders: { ...r, evening: e.target.value } })} /></label>
          </div>
          <button className="btn ink2 small" onClick={ics}>Add to my calendar</button>
        </div>
        <div className="panel">
          <p className="kicker">Your data</p>
          <p className="lede dim">Everything lives on this phone, and nothing is sent anywhere unless you ask for writing help, which sends only the words involved.</p>
          <div className="row wrap"><button className="btn ink2 small" onClick={exportData}>Download a backup</button>{!sure ? <button className="ghost light" onClick={() => setSure(true)}>Delete everything</button> : <button className="btn danger small" onClick={async () => { await wipe(); location.reload(); }}>Yes, delete it all</button>}</div>
        </div>
        <p className="tnote light">{SAFETY}</p>
        <button className="ghost light" onClick={() => go("sos", "you")}>SOS: if things feel like too much</button>
      </div>
    </Shell>
  );
}

function SOS({ onBack }) {
  return (
    <Shell>
      <div className="toprow"><Back onClick={onBack} /></div>
      <div className="flow">
        <p className="kicker">SOS</p>
        <h1 className="display sm">You don't have to hold this on your own.</h1>
        <p className="lede dim">If going back over old beliefs has stirred up more than you expected, stop the practice for now and reach out. UK services:</p>
        {SOS_LINES.map((l) => (
          <div key={l.name} className="sos">
            <p className="sosname">{l.name}</p><p className="tnote light">{l.what}</p>
            {l.call && <a className="btn gold small" href={"tel:" + l.call.replace(/\s/g, "")}>Call {l.call}</a>}
            {l.text && <a className="btn gold small" href={`sms:${l.text}?&body=${l.body}`}>Text {l.body} to {l.text}</a>}
          </div>
        ))}
      </div>
    </Shell>
  );
}

createRoot(document.getElementById("root")).render(<App />);
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("/sw.js").catch(() => {});
