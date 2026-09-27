// Prints the unique spoken lines of the calm script as JSON, for make-voice.py.
import { CALM_SCRIPT } from "../src/content.js";
const out = {};
CALM_SCRIPT.forEach((s) => { out[s.id] = s.say; });
console.log(JSON.stringify(out, null, 2));
