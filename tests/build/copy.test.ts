import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { Window } from 'happy-dom';
import { describe, expect, test } from 'vitest';
import { extractLandingCopy, normalizeCopy } from './landing-copy';

const MD = join(homedir(), 'projects/Deepwell/marketing/copy/landing-page.md');
const text = (f: string) => { const w = new Window(); w.document.write(readFileSync(f, 'utf8')); return normalizeCopy(w.document.body.textContent ?? ''); };
const SECTIONS: Record<number, string> = { 1: 'hero', 2: 'trust strip', 3: 'problem', 4: 'modules', 5: 'themes', 6: 'pricing', 7: 'licensing', 8: 'faq', 9: 'final cta', 10: 'footer' };
const BUILT = (process.env.COPY_SECTIONS ?? '1,2,3,4,5,6,7,8,9,10').split(',').map(Number);

describe.skipIf(!existsSync(MD))('page copy matches landing-page.md exactly', () => {
  const copy = extractLandingCopy(readFileSync(MD, 'utf8'));
  for (const out of ['dist-pilot', 'dist-public']) {
    const page = text(`${out}/index.html`);
    for (const s of BUILT) test(`${out} §${s} ${SECTIONS[s]}`, () => {
      for (const line of copy[s]!) expect(page, `missing: ${line}`).toContain(line);
    });
  }
});
