// Everything stays on the phone. State in localStorage; the voice recording,
// which is too big for that, in IndexedDB.

const KEY = "ishkiy-identity-v1";
export const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
export const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} };
export const wipe = async () => { try { localStorage.removeItem(KEY); } catch {} await delVoice(); await delVoice("vision"); await delVoice("gratitude"); };

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
/* Three recordings, each a single take that a re-record overwrites (no
   history): "induction", the daily recording, "vision", the identity
   recording (it kept the key from the vision it replaced, so takes made
   before carry straight over), and "gratitude", the thank-you script. */
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
    // no morning when Identity is set up: its own reminder is the morning
    ...(morning ? [ev(morning, "iSHKiY · Morning. Before the phone, you first", `Open iSHKiY Identity. Listen once and say your lines out loud${eraName ? " as " + eraName : ""}.`, "am")] : []),
    ev(evening, "iSHKiY · Tonight. Calm body, calm mind", "Open iSHKiY Identity. Check in, then fall asleep to your recording.", "pm"),
    ...(midday ? [ev(midday, "iSHKiY · A two-minute top-up", "Open iSHKiY Identity. Two minutes to come back to the new you.", "md")] : []),
    "END:VCALENDAR",
  ].join("\r\n");
}

/* The identity anchor times: a morning and an evening alarm, daily with no
   end date, each linking straight to the daily practice. */
export function identityICS({ morning = "07:00", evening = "21:00", url }) {
  const d = dayKey().replace(/-/g, "");
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const ev = (time, id, title, body) => [
    "BEGIN:VEVENT",
    `UID:identity-${id}-${d}@identity.ishkiy.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${d}T${time.replace(":", "")}00`,
    "DURATION:PT5M",
    "RRULE:FREQ=DAILY",
    `SUMMARY:${title}`,
    `DESCRIPTION:${body} ${url || ""}`,
    ...(url ? [`URL:${url}`] : []),
    "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${title}`, "TRIGGER:PT0M", "END:VALARM",
    "END:VEVENT",
  ].join("\r\n");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//iSHKiY//Identity//EN", "CALSCALE:GREGORIAN",
    ev(morning, "am", "iSHKiY · Who I am", "Open iSHKiY Identity. Hear it, read it, choose today's proof."),
    ev(evening, "pm", "iSHKiY · This is what I do", "Open iSHKiY Identity. Tick today's proof."),
    "END:VCALENDAR",
  ].join("\r\n");
}

/* Gratitude reminders that circle round. Each daily time gets its own run
   of prompts: one calendar event per prompt, repeating every N days and
   starting a day apart, so each day's reminder asks something different and
   the whole cycle comes back round with no end date. The times are offset
   from each other, so morning and evening never ask the same thing. */
export function gratitudeICS({ times = [], prompts = [], url }) {
  const P = prompts.length;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const events = [];
  times.forEach((time, j) => {
    for (let k = 0; k < P; k++) {
      const d = new Date(); d.setDate(d.getDate() + k);
      const day = dayKey(d).replace(/-/g, "");
      const prompt = prompts[(k + j * 3) % P].replace(/([,;\\])/g, "\\$1"); // calendar text escapes commas
      events.push([
        "BEGIN:VEVENT",
        `UID:thanks-${time.replace(":", "")}-${k}-${dayKey().replace(/-/g, "")}@identity.ishkiy.com`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${day}T${time.replace(":", "")}00`,
        "DURATION:PT5M",
        `RRULE:FREQ=DAILY;INTERVAL=${P}`,
        `SUMMARY:iSHKiY · Thank you: ${prompt}`,
        `DESCRIPTION:${prompt} Open iSHKiY Identity and write it down. ${url || ""}`,
        ...(url ? [`URL:${url}`] : []),
        "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${prompt}`, "TRIGGER:PT0M", "END:VALARM",
        "END:VEVENT",
      ].join("\r\n"));
    }
  });
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//iSHKiY//Identity//EN", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR"].join("\r\n");
}

export const download = (blob, name) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
};
