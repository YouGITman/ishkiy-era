// iSHKiY Identity — the visuals. All drawn here, in SVG and canvas, in the
// ERA palette: ink, bone and gold. Nothing flashes; everything moves at the
// pace of a slow breath, and stops moving when the phone asks for less motion.
import React, { useEffect, useRef } from "react";

const GOLD = "#D4A547", BONE = "#F5F1E8";
export const calmMotion = () => { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } };

/* A slow field of gold dust behind the dark screens. */
export function Field({ density = 0.00009 }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const c = cv.getContext("2d");
    let w, h, dots = [], raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = () => {
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [...Array(Math.max(24, Math.floor(w * h * density)))].map(() => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.4 + 0.3, v: Math.random() * 0.12 + 0.03, p: Math.random() * 6.28 }));
    };
    size();
    const draw = (t) => {
      c.clearRect(0, 0, w, h);
      dots.forEach((d) => {
        if (!calmMotion()) { d.y -= d.v; if (d.y < -4) { d.y = h + 4; d.x = Math.random() * w; } }
        const a = 0.18 + 0.22 * Math.sin(t / 2600 + d.p);
        c.fillStyle = `rgba(212,165,71,${a})`;
        c.beginPath(); c.arc(d.x, d.y, d.r, 0, 6.283); c.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", size);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", size); };
  }, [density]);
  return <canvas ref={ref} className="field" aria-hidden="true" />;
}

/* The orb breathes: in for five seconds, out for five. Calm breathing
   hovers around six breaths a minute, so that is the pace. */
export function Orb({ size = 200, level = 0, still = false, label }) {
  const glow = Math.min(1, level * 9);
  return (
    <div className={"orb" + (still || calmMotion() ? " still" : "")} style={{ width: size, height: size }} aria-hidden={!label} aria-label={label}>
      <svg viewBox="0 0 200 200" width={size} height={size}>
        <defs>
          <radialGradient id="og" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#F3D58B" />
            <stop offset="55%" stopColor={GOLD} />
            <stop offset="100%" stopColor="#8E6A22" />
          </radialGradient>
          <radialGradient id="oh" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(212,165,71,0.35)" />
            <stop offset="100%" stopColor="rgba(212,165,71,0)" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="98" fill="url(#oh)" className="orb-halo" style={{ opacity: 0.6 + glow * 0.4 }} />
        <circle cx="100" cy="100" r="74" fill="none" stroke="rgba(212,165,71,0.22)" strokeWidth="1" className="orb-ring r1" />
        <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(212,165,71,0.3)" strokeWidth="1" className="orb-ring r2" />
        <circle cx="100" cy="100" r={34 + glow * 10} fill="url(#og)" className="orb-core" />
      </svg>
    </div>
  );
}

/* Letting go. The words are drawn, sampled into grains, and the grains rise
   and thin out like smoke. */
export function Dissolve({ text, go, onDone }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const c = cv.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = cv.clientWidth, h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const font = (px) => `600 ${px}px Lora, Georgia, serif`;
    // wrap the line to fit
    let px = 30; const lines = [];
    const wrap = () => {
      lines.length = 0; c.font = font(px);
      let cur = "";
      text.split(" ").forEach((word) => { const t = cur ? cur + " " + word : word; if (c.measureText(t).width > w - 40 && cur) { lines.push(cur); cur = word; } else cur = t; });
      if (cur) lines.push(cur);
    };
    wrap(); while (lines.length > 4 && px > 18) { px -= 2; wrap(); }
    const drawText = (alpha = 1) => {
      c.clearRect(0, 0, w, h);
      c.font = font(px); c.textAlign = "center"; c.textBaseline = "middle";
      c.fillStyle = `rgba(245,241,232,${alpha})`;
      const lh = px * 1.3, top = h / 2 - ((lines.length - 1) * lh) / 2;
      lines.forEach((l, i) => c.fillText(l, w / 2, top + i * lh));
    };
    if (!go) { drawText(); const t = setTimeout(drawText, 400); return () => clearTimeout(t); } // redraw once the font lands
    drawText();
    if (calmMotion()) {
      let a = 1; const fade = setInterval(() => { a -= 0.05; drawText(Math.max(0, a)); if (a <= 0) { clearInterval(fade); onDone && onDone(); } }, 60);
      return () => clearInterval(fade);
    }
    const img = c.getImageData(0, 0, cv.width, cv.height).data;
    const grains = [];
    const step = Math.max(2, Math.round(2 * dpr));
    for (let y = 0; y < cv.height; y += step) for (let x = 0; x < cv.width; x += step) {
      if (img[(y * cv.width + x) * 4 + 3] > 120) grains.push({ x: x / dpr, y: y / dpr, vx: (Math.random() - 0.5) * 0.6, vy: -Math.random() * 1.2 - 0.3, d: Math.random() * 40 + ((x / cv.width) * 50), life: 1, gold: Math.random() < 0.35 });
    }
    let f = 0, raf = 0;
    const tick = () => {
      f++;
      c.clearRect(0, 0, w, h);
      let alive = 0;
      grains.forEach((g) => {
        if (f > g.d) { g.x += g.vx + Math.sin((f + g.d) / 18) * 0.35; g.y += g.vy; g.vy -= 0.012; g.life -= 0.009; }
        if (g.life > 0) {
          alive++;
          c.fillStyle = g.gold ? `rgba(212,165,71,${g.life})` : `rgba(245,241,232,${g.life})`;
          c.fillRect(g.x, g.y, 1.6, 1.6);
        }
      });
      if (alive && f < 420) raf = requestAnimationFrame(tick); else { c.clearRect(0, 0, w, h); onDone && onDone(); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, go]);
  return <canvas ref={ref} className="dissolve" aria-label={text} role="img" />;
}

/* One drawing per explainer card. Line work in gold, on ink. */
export function ExplainArt({ kind }) {
  const s = { fill: "none", stroke: GOLD, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  const dim = { ...s, stroke: "rgba(245,241,232,0.35)", strokeWidth: 1.5 };
  if (kind === "frog") return (
    <svg viewBox="0 0 220 140" className="eart" aria-hidden="true">
      <path {...s} d="M40 110 Q40 70 80 66 Q120 62 124 100 Q126 116 106 118 L56 118 Q40 118 40 110 Z" />
      <circle {...s} cx="66" cy="62" r="11" /><circle {...s} cx="98" cy="60" r="11" />
      <circle cx="68" cy="61" r="3.5" fill={GOLD} /><circle cx="100" cy="59" r="3.5" fill={GOLD} />
      <path {...s} d="M64 96 Q82 104 100 94" />
      <path {...dim} d="M112 60 L200 30 M112 60 L200 100" strokeDasharray="3 5" />
      {[[168, 118], [180, 124], [192, 116], [174, 128], [186, 130]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.6" fill="rgba(245,241,232,0.45)" />)}
      <path {...s} d="M150 42 q6 -6 12 0 q6 -6 12 0" className="fly" />
    </svg>);
  if (kind === "firewall") return (
    <svg viewBox="0 0 220 140" className="eart" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((r) => [0, 1].map((c) => <rect key={r + "-" + c} {...s} x={98 + c * 14 - (r % 2 ? 7 : 0)} y={18 + r * 22} width="14" height="20" rx="2" strokeWidth="1.6" />))}
      <circle {...s} cx="176" cy="70" r="26" /><path {...s} d="M164 70 Q170 60 176 70 T188 70" />
      {[[24, 34], [18, 70], [30, 106]].map(([x, y], i) => <g key={i} className={"app a" + i}><rect {...dim} x={x} y={y - 9} width="20" height="18" rx="4" /><path {...dim} d={`M${x + 24} ${y} L86 ${y}`} strokeDasharray="2 4" /></g>)}
      <path {...s} d="M60 70 L150 70" strokeDasharray="0" opacity=".9" />
    </svg>);
  if (kind === "band") return (
    <svg viewBox="0 0 220 140" className="eart" aria-hidden="true">
      <circle cx="40" cy="70" r="7" fill={GOLD} />
      <path {...s} d="M40 70 Q120 40 186 70" className="band" />
      <path {...s} d="M40 70 Q120 100 186 70" className="band" />
      <circle cx="186" cy="70" r="9" fill="none" stroke={BONE} strokeOpacity=".6" strokeWidth="1.6" />
      <path {...dim} d="M150 116 L70 116 M78 110 L70 116 L78 122" />
    </svg>);
  if (kind === "who") return (
    <svg viewBox="0 0 220 140" className="eart" aria-hidden="true">
      <g opacity=".45"><circle {...dim} cx="60" cy="42" r="14" /><path {...dim} d="M36 118 Q36 70 60 70 Q84 70 84 118" /></g>
      <circle {...s} cx="160" cy="42" r="14" /><path {...s} d="M136 118 Q136 70 160 70 Q184 70 184 118" />
      <circle cx="160" cy="26" r="3" fill={GOLD} />
      <path {...dim} d="M96 78 L124 78 M117 72 L124 78 L117 84" />
    </svg>);
  if (kind === "path") return (
    <svg viewBox="0 0 220 140" className="eart" aria-hidden="true">
      <path {...dim} d="M20 110 C60 110 60 40 110 40 S160 110 200 70" strokeDasharray="3 6" />
      {[[20, 110], [58, 86], [90, 48], [130, 44], [160, 84], [200, 70]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i === 5 ? 8 : 4.5} fill={i === 5 ? GOLD : "none"} stroke={GOLD} strokeWidth="1.8" />)}
    </svg>);
  return (
    <svg viewBox="0 0 220 140" className="eart" aria-hidden="true">
      <circle {...s} cx="110" cy="70" r="30" /><path {...s} d="M110 82 L110 96" /><circle cx="110" cy="66" r="7" fill={GOLD} />
      <path {...dim} d="M150 60 L196 60 L196 80 L150 80" /><path {...dim} d="M178 80 L178 90 M188 80 L188 94" />
    </svg>);
}

/* A small trend line for the check-ins. */
export function Spark({ values, max = 10, w = 260, h = 56 }) {
  const pts = values.filter((v) => v != null);
  if (pts.length < 2) return null;
  const xs = (i) => 6 + (i * (w - 12)) / (values.length - 1);
  const ys = (v) => h - 6 - (v / max) * (h - 12);
  const d = values.map((v, i) => (v == null ? null : [xs(i), ys(v)])).filter(Boolean).map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const last = values.map((v, i) => [v, i]).filter(([v]) => v != null).pop();
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="spark" role="img" aria-label={`Trend over ${values.length} days, latest ${last[0]} out of ${max}`}>
      <line x1="6" x2={w - 6} y1={ys(max / 2)} y2={ys(max / 2)} stroke="currentColor" strokeOpacity=".12" strokeDasharray="2 4" />
      <path d={d} fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={xs(last[1])} cy={ys(last[0])} r="3.5" fill={GOLD} />
    </svg>
  );
}
