// Perf budget: all shipped JS ≤ 64 KB gz. Raised from 40 KB for the motion scenes (anime.js + Lenis);
// Kyle, 2026-10-12: the experience takes priority. Spec: 2026-10-12-marketing-site-motion-scenes-design.md.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const dir = process.argv[2] ?? 'dist';
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const js = walk(dir).filter((f) => f.endsWith('.js'));
let total = 0;
for (const f of js) { const gz = gzipSync(readFileSync(f)).length; total += gz; console.log(`${(gz / 1024).toFixed(1).padStart(6)} KB  ${f}`); }
console.log(`${(total / 1024).toFixed(1).padStart(6)} KB  total (gz)`);
const CAP_KB = 64;
if (total > CAP_KB * 1024) { console.error(`JS budget exceeded (${CAP_KB} KB gz)`); process.exit(1); }
