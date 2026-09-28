// Prints every spoken line as JSON, grouped by folder, for make-voice.py:
// { "calm": { id: text }, "topup": { id: text } }
import { CALM_SCRIPT, TOPUPS } from "../src/content.js";
const out = { calm: {}, topup: {} };
CALM_SCRIPT.forEach((s) => { out.calm[s.id] = s.say; });
TOPUPS.forEach((t) => t.steps.forEach((s) => { if (s.say) out.topup[s.id] = s.say; }));
console.log(JSON.stringify(out, null, 2));
