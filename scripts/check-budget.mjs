// Spec perf budget: field island ≤ 40 KB gz. Enforced conservatively on ALL shipped JS.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const dir = process.argv[2] ?? 'dist';
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const js = walk(dir).filter((f) => f.endsWith('.js'));
let total = 0;
for (const f of js) { const gz = gzipSync(readFileSync(f)).length; total += gz; console.log(`${(gz / 1024).toFixed(1).padStart(6)} KB  ${f}`); }
console.log(`${(total / 1024).toFixed(1).padStart(6)} KB  total (gz)`);
if (total > 40 * 1024) { console.error('JS budget exceeded (40 KB gz)'); process.exit(1); }
