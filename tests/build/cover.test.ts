import { readFileSync } from 'node:fs';
import { Window } from 'happy-dom';
import { describe, expect, test } from 'vitest';
import { COVER_POOL } from '../../src/lib/cover/pool';

const parse = (f: string) => { const w = new Window(); w.document.write(readFileSync(f, 'utf8')); return w.document; };

for (const out of ['dist-pilot', 'dist-public']) describe(`${out}: hero cover`, () => {
  const doc = parse(`${out}/index.html`);
  const slots = [...doc.querySelectorAll('.cover-slot')];
  test('one slot per pool entry, exactly one default (the JS-off pick)', () => {
    expect(slots.map((s) => s.getAttribute('data-slug'))).toEqual(COVER_POOL.map((e) => e.slug));
    expect(doc.querySelectorAll('.cover-slot[data-default]')).toHaveLength(1);
    expect(doc.querySelector('.cover-slot[data-default]')!.getAttribute('data-slug')).toBe('scp-173');
  });
  test('every slot: the way in and the attribution live on the cover, never gated', () => {
    for (const e of COVER_POOL) {
      const s = doc.querySelector(`.cover-slot[data-slug="${e.slug}"]`)!;
      const read = s.querySelector('.cover__foot a.cover__read')!;
      expect(read.getAttribute('href')).toBe(`https://app.readdeepwell.com/read/${e.slug}`);
      expect(read.getAttribute('aria-label')).toBe(`Read ${e.title} in Deepwell`);
      const lic = s.querySelector('.cover__credits a.cover__license')!;
      expect(lic.getAttribute('href')).toBe(e.url);
      expect(lic.textContent!.trim()).toBe('CC BY-SA 3.0 · SCP Wiki');
      expect(lic.getAttribute('title')).toMatch(/^“.+” by .+ · SCP Wiki · CC BY-SA 3\.0$/);
      expect(s.querySelector('.cover__byline')!.textContent).toContain(e.authors.join(', '));
      expect(s.querySelector('.cover__after, .cover__attr')).toBeNull();
    }
  });
  test('no ids inside slots (ten copies must not collide)', () => {
    for (const s of slots) expect(s.querySelectorAll('[id]')).toHaveLength(0);
  });
  test('the selection stylesheet covers every slug', () => {
    const html = readFileSync(`${out}/index.html`, 'utf8');
    for (const e of COVER_POOL) expect(html).toContain(`html[data-cover="${e.slug}"] .cover-slot[data-slug="${e.slug}"]`);
  });
});
