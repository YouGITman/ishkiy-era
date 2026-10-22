// The small pieces every screen shares, in their own file so app.jsx and
// identity.jsx can both use them.
import React from "react";
import { Field } from "./visuals.jsx";

export function Wordmark({ light = true, sub }) {
  return (<div className="wmrow"><div className={"wordmark" + (light ? " light" : "")} aria-label="iSHKiY">
    <span className="wm-i">{"ı"}<span className="tittle" /></span>SHK<span className="wm-i">{"ı"}<span className="tittle" /></span>Y
  </div>{sub && <span className="wmsub">{sub}</span>}</div>);
}
export function Shell({ children, light, field = !light, className = "" }) {
  return (<div className={"shell " + (light ? "light " : "dark ") + className}>{field && <Field />}<div className="col">{children}</div></div>);
}
export function Back({ onClick, label = "Back" }) { return <button className="back" onClick={onClick}>← {label}</button>; }
export function Steps({ n, of }) { return <div className="dots" aria-label={`Step ${n + 1} of ${of}`}>{[...Array(of)].map((_, i) => <span key={i} className={"dot" + (i < n ? " done" : i === n ? " now" : "")} />)}</div>; }
export function Card({ kicker, title, line, cta, onClick, done, accent, soft }) {
  return (
    <button className={"tcard" + (done ? " done" : "") + (accent ? " accent" : "") + (soft ? " soft" : "")} onClick={onClick}>
      <span className="tck">{done && <span className="tick">✓</span>}{kicker}</span>
      <span className="tct">{title}</span>
      <span className="tcl">{line}</span>
      <span className="tcgo">{cta} →</span>
    </button>
  );
}
export const nowHM = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
