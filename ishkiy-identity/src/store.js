// Everything stays on the phone. State in localStorage; the voice recording,
// which is too big for that, in IndexedDB.

const KEY = "ishkiy-identity-v1";
export const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
export const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} };
export const wipe = async () => { try { localStorage.removeItem(KEY); } catch {} await delVoice(); await delVoice("vision"); };

const DB = "ishkiy-identity", STORE = "voice";
const open = () => new Promise((res, rej) => {
  const r = indexedDB.open(DB, 1);
  r.onupgradeneeded = () => r.result.createObjectStore(STORE);
  r.onsuccess = () => res(r.result);
  r.onerror = () => rej(r.error);
});
const tx = async (mode, fn) => {
  const db = await open();
  return new Promise((res, rej) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => res(req && req.result);
    t.onerror = () => rej(t.error);
  });
};
/* Two recordings, each a single take that a re-record overwrites (no history):
   "induction", the daily recording, and "vision", the vision statement. */
export const putVoice = (blob, key = "induction") => tx("readwrite", (s) => s.put(blob, key));
export const getVoice = async (key = "induction") => { try { return await tx("readonly", (s) => s.get(key)); } catch { return null; } };
export const delVoice = async (key = "induction") => { try { await tx("readwrite", (s) => s.delete(key)); } catch {} };

/* Dates as local YYYY-MM-DD, so "today" means the person's today. */
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const daysBetween = (a, b) => Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000);
export const uid = () => Math.random().toString(36).slice(2, 10);

/* A calendar file with two daily reminders for the length of the era. It is
   the one reminder that fires reliably on every phone without a server. */
export function reminderICS({ start, days = 21, morning = "06:45", evening = "22:00", midday, eraName }) {
  const d = start.replace(/-/g, "");
  const ev = (time, title, body, id) => {
    const t = time.replace(":", "") + "00";
    return [
      "BEGIN:VEVENT",
      `UID:${id}-${d}@identity.ishkiy.com`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
      `DTSTART:${d}T${t}`,
      "DURATION:PT15M",
      `RRULE:FREQ=DAILY;COUNT=${days}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${body}`,
      "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${title}`, "TRIGGER:PT0M", "END:VALARM",
      "END:VEVENT",
    ].join("\r\n");
  };
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//iSHKiY//Identity//EN", "CALSCALE:GREGORIAN",
    ev(morning, "iSHKiY · Morning. Before the phone, you first", `Open iSHKiY Identity. Listen once and say your lines out loud${eraName ? " as " + eraName : ""}.`, "am"),
    ev(evening, "iSHKiY · Tonight. Calm body, calm mind", "Open iSHKiY Identity. Check in, then fall asleep to your recording.", "pm"),
    ...(midday ? [ev(midday, "iSHKiY · A two-minute top-up", "Open iSHKiY Identity. Two minutes to come back to the new you.", "md")] : []),
    "END:VCALENDAR",
  ].join("\r\n");
}

/* The vision reminder: one daily alarm with no end date, linking straight to
   the vision screen. */
export function visionICS({ time = "07:30", url }) {
  const d = dayKey().replace(/-/g, "");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//iSHKiY//Identity//EN", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:vision-${d}@identity.ishkiy.com`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART:${d}T${time.replace(":", "")}00`,
    "DURATION:PT5M",
    "RRULE:FREQ=DAILY",
    "SUMMARY:iSHKiY · Your vision",
    `DESCRIPTION:Open iSHKiY Identity and play your vision. ${url || ""}`,
    ...(url ? [`URL:${url}`] : []),
    "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:iSHKiY · Your vision", "TRIGGER:PT0M", "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export const download = (blob, name) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
};
