// Generate founding access codes + hashes.
// Usage: node gen-codes.mjs 10
import { createHash } from "node:crypto";
const n = Number(process.argv[2] || 10);
const block = () => Math.random().toString(36).slice(2, 6).toUpperCase().replace(/[O0IL1]/g, "X");
console.log("Codes (send to customers)        SHA-256 hash (paste into CODE_HASHES in src/app.jsx)");
for (let i = 0; i < n; i++) {
  const code = `ERA-${block()}-${block()}`;
  const hash = createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
  console.log(`${code}    "${hash}",`);
}
