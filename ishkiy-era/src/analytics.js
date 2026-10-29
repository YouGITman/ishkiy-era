/* ---------------- behavioural analytics (PostHog) ----------------
   How people move through the app: which screen, how long they stayed, where
   they left, what they hovered over before tapping. Sent to PostHog so the
   funnels, paths and drop-off charts come ready-made.

   Deliberately NOT the posthog-js library. That library's autocapture and
   session replay record the text on what people tap, and here that would be
   their answers. Every event below is built by hand from screen names, part
   ids, item numbers and timings, so nothing a person writes or chooses can
   leave the device through this file.

   Off until the person says yes (the consent card on Home, or Settings).
   Off entirely while POSTHOG_KEY is empty.

   Setup: PostHog -> new project (EU cloud) -> Project settings -> copy the
   Project API key (phc_..., public by design) into POSTHOG_KEY below. */
const POSTHOG_KEY = "";
const POSTHOG_HOST = "https://eu.i.posthog.com";
const VERSION = "1.20";

let on = false;
let id = "anon";
let base = {};
let queue = [];
let timer = null;

const send = (beacon) => {
  if (!queue.length) return;
  const body = JSON.stringify({ api_key: POSTHOG_KEY, batch: queue });
  queue = [];
  // text/plain keeps it a simple request: no CORS preflight, and sendBeacon accepts it.
  const blob = new Blob([body], { type: "text/plain" });
  try {
    if (beacon && navigator.sendBeacon && navigator.sendBeacon(`${POSTHOG_HOST}/batch/`, blob)) return;
    fetch(`${POSTHOG_HOST}/batch/`, { method: "POST", body: blob, keepalive: true }).catch(() => {});
  } catch {}
};

export const capture = (event, props) => {
  if (!on) return;
  queue.push({
    event,
    timestamp: new Date().toISOString(),
    properties: { distinct_id: id, $process_person_profile: false, $lib: "ishkiy-era", app_version: VERSION, ...base, ...props },
  });
  if (queue.length >= 20) send(false);
  else if (!timer) timer = setTimeout(() => { timer = null; send(false); }, 5000);
};

/* ---- screens: time on each, and the last one before someone leaves ---- */
let screen = null;     // { name, props, since, shown }
const visible = () => typeof document === "undefined" || document.visibilityState !== "hidden";

const leave = (why) => {
  if (!screen) return;
  const ms = screen.shown + (screen.since ? Date.now() - screen.since : 0);
  capture("screen_time", { ...screen.props, $screen_name: screen.name, seconds: Math.round(ms / 100) / 10, left_by: why });
};

export const setScreen = (name, props = {}) => {
  const key = name + JSON.stringify(props);
  if (screen && screen.key === key) return;
  leave("navigate");
  screen = { key, name, props, since: visible() ? Date.now() : 0, shown: 0 };
  capture("$screen", { ...props, $screen_name: name });
};

/* ---- hover: dwell on anything marked data-hover="name", 300ms or more ---- */
const hovering = new Map();
const onOver = (e) => {
  const el = e.target.closest && e.target.closest("[data-hover]");
  if (el && !hovering.has(el)) hovering.set(el, Date.now());
};
const onOut = (e) => {
  for (const [el, t] of hovering) {
    if (e.relatedTarget && el.contains(e.relatedTarget)) continue;
    if (!el.contains(e.target)) continue;
    hovering.delete(el);
    const ms = Date.now() - t;
    if (ms >= 300) capture("hover", { target: el.dataset.hover, ms, $screen_name: screen && screen.name });
  }
};

/* ---- app hidden / closed: the exit point is whatever screen was up ---- */
const onVis = () => {
  if (!screen) return;
  if (!visible()) {
    screen.shown += screen.since ? Date.now() - screen.since : 0;
    screen.since = 0;
    capture("app_hidden", { ...screen.props, $screen_name: screen.name });
    send(true);
  } else {
    screen.since = Date.now();
    capture("app_visible", { ...screen.props, $screen_name: screen.name });
  }
};
const onHide = () => { leave("closed"); send(true); };

let wired = false;
export const configure = ({ consent, distinctId, props }) => {
  id = distinctId || id;
  base = { ...base, ...props };
  const want = !!POSTHOG_KEY && consent === "yes";
  if (want === on) return;
  on = want;
  if (on && !wired && typeof document !== "undefined") {
    wired = true;
    document.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseout", onOut, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onHide);
  }
  if (!on) { queue = []; hovering.clear(); }
  else if (screen) capture("$screen", { ...screen.props, $screen_name: screen.name });
};

export const analyticsReady = () => !!POSTHOG_KEY;
