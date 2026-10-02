// iSHKiY — motion and light. Everything here is decoration: if any of it fails,
// or the person has asked their device for less motion, the app reads the same.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";

/* One dial for the pace of everything that moves. The CSS timings in index.html
   were scaled by the same factor; change both together. */
export const TEMPO = 1.6;

export const still = () => { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } };

/* The last place a finger or pointer touched, so a theme change can open from it. */
const lastPtr = { x: typeof innerWidth === "number" ? innerWidth / 2 : 0, y: 0 };

/* Screen changes go through the browser's view transitions where they exist:
   the old screen softens away as the new one arrives. A theme change opens as a
   circle from wherever it was tapped. Anything without the API just swaps. */
export function transition(fn, kind = "screen") {
  const d = typeof document !== "undefined" ? document : null;
  if (!d || !d.startViewTransition || still() || d.hidden) { fn(); return; }
  const root = d.documentElement;
  root.dataset.vt = kind;
  root.style.setProperty("--vx", lastPtr.x + "px");
  root.style.setProperty("--vy", lastPtr.y + "px");
  try {
    const t = d.startViewTransition(() => flushSync(fn));
    t.finished.finally(() => { delete root.dataset.vt; });
  } catch { delete root.dataset.vt; fn(); }
}

/* ---------------- the night sky ----------------
   Stars at three depths, rising very slowly, each breathing at its own pace. A
   few are gold. Near a pointer, the closest stars join into a constellation. Now
   and then, one falls. Draws a single still frame under reduced motion. */
export function Sky({ density = 1 }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const cx = cv.getContext("2d"); if (!cx) return;
    const calm = still();
    let w = 0, h = 0, stars = [], raf = 0, alive = true;
    const t0 = performance.now();
    const ptr = { x: -9999, y: -9999, tx: 0, ty: 0, px: 0, py: 0, seen: 0 };
    let fall = null, nextFall = 4 + Math.random() * 6;
    const make = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = window.innerWidth; h = window.innerHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(240, Math.round((w * h) / 5600 * density));
      stars = Array.from({ length: n }, () => {
        const z = Math.random();
        return { x: Math.random() * w, y: Math.random() * h, z, r: 0.3 + z * z * 1.45, a: 0.25 + Math.random() * 0.65, s: 0.35 + Math.random() * 1.4, p: Math.random() * 6.283, gold: Math.random() < 0.13 };
      });
    };
    const draw = (now) => {
      const t = calm ? 0 : (now - t0) / 1000 / TEMPO;
      cx.clearRect(0, 0, w, h);
      ptr.px += (ptr.tx - ptr.px) * 0.05 / TEMPO; ptr.py += (ptr.ty - ptr.py) * 0.05 / TEMPO;
      const near = [];
      for (const s of stars) {
        let y = (s.y - t * (1.5 + s.z * 5)) % h; if (y < 0) y += h;
        const x = s.x - ptr.px * s.z * 18, yy = y - ptr.py * s.z * 18;
        const tw = calm ? s.a : s.a * (0.55 + 0.45 * Math.sin(t * s.s + s.p));
        if (s.r > 1.05) {
          const g = cx.createRadialGradient(x, yy, 0, x, yy, s.r * 5);
          g.addColorStop(0, s.gold ? `rgba(232,194,106,${tw * 0.5})` : `rgba(245,241,232,${tw * 0.32})`);
          g.addColorStop(1, "rgba(0,0,0,0)");
          cx.fillStyle = g; cx.beginPath(); cx.arc(x, yy, s.r * 5, 0, 6.283); cx.fill();
        }
        cx.fillStyle = s.gold ? `rgba(232,194,106,${tw})` : `rgba(245,241,232,${tw})`;
        cx.beginPath(); cx.arc(x, yy, s.r, 0, 6.283); cx.fill();
        if (ptr.seen) { const dx = x - ptr.x, dy = yy - ptr.y; if (dx * dx + dy * dy < 150 * 150 && near.length < 16) near.push([x, yy, Math.sqrt(dx * dx + dy * dy)]); }
      }
      /* The constellation: each nearby star reaches for its two closest neighbours. */
      if (near.length > 1) {
        cx.lineWidth = 0.7;
        for (let i = 0; i < near.length; i++) {
          const a = near[i];
          const ds = near.map((b, j) => [j, (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2]).filter(([j]) => j !== i).sort((p, q) => p[1] - q[1]).slice(0, 2);
          for (const [j, d2] of ds) {
            if (j < i || d2 > 110 * 110) continue;
            const fade = (1 - Math.sqrt(d2) / 110) * (1 - Math.max(a[2], near[j][2]) / 150) * ptr.seen;
            cx.strokeStyle = `rgba(212,165,71,${0.55 * fade})`;
            cx.beginPath(); cx.moveTo(a[0], a[1]); cx.lineTo(near[j][0], near[j][1]); cx.stroke();
          }
        }
      }
      if (!calm) {
        if (!fall && t > nextFall) { fall = { x: Math.random() * w * 0.8 + w * 0.1, y: Math.random() * h * 0.35, at: t, ang: 0.45 + Math.random() * 0.35 }; }
        if (fall) {
          const k = (t - fall.at) / 1.1;
          if (k >= 1) { fall = null; nextFall = t + 7 + Math.random() * 9; }
          else {
            const len = 120, travel = 260 * k, ex = fall.x + Math.cos(fall.ang) * travel, ey = fall.y + Math.sin(fall.ang) * travel;
            const g = cx.createLinearGradient(ex, ey, ex - Math.cos(fall.ang) * len, ey - Math.sin(fall.ang) * len);
            const o = Math.sin(k * Math.PI);
            g.addColorStop(0, `rgba(245,231,190,${0.9 * o})`); g.addColorStop(1, "rgba(245,231,190,0)");
            cx.strokeStyle = g; cx.lineWidth = 1.3; cx.beginPath(); cx.moveTo(ex, ey); cx.lineTo(ex - Math.cos(fall.ang) * len, ey - Math.sin(fall.ang) * len); cx.stroke();
          }
        }
        ptr.seen = Math.max(0, ptr.seen - 0.004 / TEMPO);
      }
      if (!calm && alive) raf = requestAnimationFrame(draw);
    };
    const onMove = (e) => { ptr.x = e.clientX; ptr.y = e.clientY; ptr.tx = e.clientX / w - 0.5; ptr.ty = e.clientY / h - 0.5; ptr.seen = 1; };
    const onVis = () => { cancelAnimationFrame(raf); if (!document.hidden && !calm) raf = requestAnimationFrame(draw); };
    const onResize = () => { make(); if (calm) draw(performance.now()); };
    make(); raf = requestAnimationFrame(draw);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);
    return () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerdown", onMove); window.removeEventListener("resize", onResize); document.removeEventListener("visibilitychange", onVis); };
  }, [density]);
  return <canvas ref={ref} className="sky" aria-hidden="true" />;
}

/* Text that arrives a word at a time, each one coming out of soft focus. The
   words stay real text, so it reads, copies and translates like any other. */
export function Words({ text, delay = 0, step = 55 }) {
  const parts = String(text == null ? "" : text).split(/(\s+)/);
  let k = 0;
  return <>{parts.map((p, i) => (/^\s+$/.test(p) || !p ? p : <span key={i} className="w" style={{ "--i": k++, "--wd": Math.round(delay * TEMPO) + "ms", "--ws": Math.round(step * TEMPO) + "ms" }}>{p}</span>))}</>;
}

/* A ring of gold sparks thrown once from the middle of whatever holds it. */
export function Burst({ n = 16, spread = 120 }) {
  const sparks = useMemo(() => Array.from({ length: n }, (_, i) => ({
    a: (i / n) * 360 + (i % 3) * 7, r: spread * (0.6 + ((i * 37) % 10) / 22), s: 3 + (i % 4), d: (i % 5) * 40,
  })), [n, spread]);
  return <span className="burst" aria-hidden="true">{sparks.map((p, i) => <i key={i} style={{ "--a": p.a + "deg", "--r": p.r + "px", "--s": p.s + "px", "--d": Math.round(p.d * TEMPO) + "ms" }} />)}</span>;
}

/* A small padlock. Open, its shackle lifts free. */
export function LockIcon({ open, size = 14 }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} className={"lockic" + (open ? " open" : "")} aria-hidden="true">
      <path className="shackle" d="M5 7.5 V5.2 a3 3 0 0 1 6 0 V7.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <rect x="3" y="7.2" width="10" height="7.3" rx="2.2" fill="currentColor" />
    </svg>
  );
}

/* A number that counts up to where it's going, easing out as it lands. */
export function useCountUp(target, dur = 1500, delay = 250) {
  const [v, setV] = useState(() => (still() ? target : 0));
  useEffect(() => {
    if (still()) { setV(target); return; }
    let raf = 0; const from = 0, start = performance.now() + delay * TEMPO, span = dur * TEMPO;
    const tick = (now) => {
      const k = Math.min(1, Math.max(0, (now - start) / span));
      setV(Math.round(from + (target - from) * (1 - Math.pow(1 - k, 4))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
}

/* ---------------- page-wide behaviour, installed once ---------------- */
const SPOT = ".htile,.depthcard,.vcard,.libtile,.capp,.tile,.prac,.sostile,.resumecard,.libcta,.deeperband";
/* Answers aren't here: they fill with gold instead, and a ripple on them showed
   as a square block on phones that don't clip a moving layer to round corners. */
const PRESS = ".btn,.depthcard,.htile,.vcard,.resumecard,.libcta,.deeperband,.setbtn,.rtbtn,.insbtn,.tilehead";
const REVEAL = ".rbody > *,.tile,.libtile,.subject,.sostile,.rung,.prac,.capp,.vcard,.sbrow,.nextrung,.integrity,.libcta,.deeperband,.retakes,.subjask,.libnarr,.constel,.setgroup,.pracs,.tierbox,.badgestrip,.voicehub,.hquote,.privline,.hlinks,.liblock,.libtally,.subjnav";

let installed = false;
export function installFx() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const calm = still();
  const doc = document;

  /* Pointer: remembered for the theme circle; and cards light up where it is. */
  let spotEl = null, spotRaf = 0, spotEv = null;
  const spot = () => {
    spotRaf = 0; if (!spotEv) return;
    const el = spotEv.target && spotEv.target.closest ? spotEv.target.closest(SPOT) : null;
    if (spotEl && spotEl !== el) spotEl.classList.remove("lit");
    spotEl = el;
    if (el) { const r = el.getBoundingClientRect(); el.style.setProperty("--mx", spotEv.clientX - r.left + "px"); el.style.setProperty("--my", spotEv.clientY - r.top + "px"); el.classList.add("lit"); }
  };
  window.addEventListener("pointermove", (e) => { lastPtr.x = e.clientX; lastPtr.y = e.clientY; if (e.pointerType === "mouse") { spotEv = e; if (!spotRaf) spotRaf = requestAnimationFrame(spot); } }, { passive: true });

  /* Press: a soft ripple from the exact point of contact. It runs inside its own
     clipped layer (see .ripwrap) so it can never spill past rounded corners. */
  window.addEventListener("pointerdown", (e) => {
    lastPtr.x = e.clientX; lastPtr.y = e.clientY;
    if (calm) return;
    const el = e.target && e.target.closest ? e.target.closest(PRESS) : null;
    if (!el || el.disabled || el.getAttribute("aria-disabled") === "true") return;
    const r = el.getBoundingClientRect(), size = Math.max(r.width, r.height) * 2.2;
    const wrap = doc.createElement("span");
    wrap.className = "ripwrap"; wrap.setAttribute("aria-hidden", "true");
    const s = doc.createElement("span");
    s.className = "ripple";
    s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
    wrap.appendChild(s);
    el.appendChild(wrap);
    setTimeout(() => wrap.remove(), 900 * TEMPO + 100);
  }, { passive: true });

  /* Reading line: a hairline of gold across the top of long pages. */
  const bar = doc.createElement("div");
  bar.className = "readbar"; bar.setAttribute("aria-hidden", "true");
  doc.body.appendChild(bar);
  let barRaf = 0;
  const measure = () => {
    barRaf = 0;
    const max = doc.documentElement.scrollHeight - window.innerHeight;
    const on = !!doc.querySelector(".reportpage") && max > window.innerHeight * 0.6;
    bar.classList.toggle("on", on);
    bar.style.transform = `scaleX(${on ? Math.min(1, Math.max(0, window.scrollY / max)) : 0})`;
  };
  const queue = () => { if (!barRaf) barRaf = requestAnimationFrame(measure); };
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);

  /* Reveal: things further down the page rise into place as they're reached.
     Never under reduced motion, and never in print (the CSS is screen-only). */
  if (calm || !("IntersectionObserver" in window)) { new MutationObserver(queue).observe(doc.body, { childList: true, subtree: true }); return; }
  const io = new IntersectionObserver((entries) => {
    let k = 0;
    entries.filter((en) => en.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top).forEach((en) => {
      en.target.style.setProperty("--rvd", Math.round(Math.min(k++, 6) * 70 * TEMPO) + "ms");
      en.target.classList.add("rv-in");
      io.unobserve(en.target);
    });
  }, { rootMargin: "0px 0px -6% 0px", threshold: 0.08 });
  const adopt = (root) => {
    const list = [];
    if (root.matches && root.matches(REVEAL)) list.push(root);
    if (root.querySelectorAll) root.querySelectorAll(REVEAL).forEach((n) => list.push(n));
    list.forEach((n) => { if (!n.classList.contains("rv")) { n.classList.add("rv"); io.observe(n); } });
  };
  new MutationObserver((muts) => {
    muts.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1) adopt(n); }));
    queue();
  }).observe(doc.body, { childList: true, subtree: true });
  adopt(doc.body);
}
