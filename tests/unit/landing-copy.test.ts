import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { extractLandingCopy, normalizeCopy } from '../build/landing-copy';

const SAMPLE = `## 2. Trust strip (just under the hero)

Three quiet proof points, evenly spaced. Plain.

- **Always free to read** — every article, no paywall, ever.

## 8. FAQ

**Eyebrow:** STANDARD QUESTIONS FROM NEW PERSONNEL

Answers are plain.

**Is this official?**
No. Deepwell is an unofficial, fan-made reader for the SCP Wiki. It isn't affiliated with
or endorsed by the wiki or its staff.

## 9. Final CTA

**Sub (narrator):** Orientation is complete. The archive is not.
Do sleep afterward.

**Primary CTA**
- *Public:* **Start reading — free** → \`[APP_URL]\`
`;

test('fields, bullets, FAQ pairs and continuation lines; directions and CTA bullets skipped', () => {
  const c = extractLandingCopy(SAMPLE);
  expect(c[2]).toEqual(['Always free to read — every article, no paywall, ever.']);
  expect(c[8]).toEqual(['STANDARD QUESTIONS FROM NEW PERSONNEL', 'Is this official?',
    "No. Deepwell is an unofficial, fan-made reader for the SCP Wiki. It isn't affiliated with or endorsed by the wiki or its staff."]);
  expect(c[9]).toEqual(['Orientation is complete. The archive is not. Do sleep afterward.']);
});
test('normalizeCopy folds typographic quotes and whitespace', () => {
  expect(normalizeCopy('  It isn’t “here”\n now ')).toBe('It isn\'t "here" now');
});

const MD = join(homedir(), 'projects/Deepwell/marketing/copy/landing-page.md');
describe.skipIf(!existsSync(MD))('the real landing-page.md', () => {
  const c = extractLandingCopy(readFileSync(MD, 'utf8'));
  test('every page section yields copy', () => { for (let s = 1; s <= 10; s++) expect(c[s]!.length, `section ${s}`).toBeGreaterThan(0); });
  test('hero H1 and the pricing column names are captured', () => {
    expect(c[1]).toContain('Welcome to orientation.');
    expect(c[6]).toContain('Deepwell Pro — one-time $2.99');
    expect(c[6]).toContain('(every future Pro feature included)');
  });
});
