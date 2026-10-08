import { readFileSync } from 'node:fs';
import { Window } from 'happy-dom';
import { expect, test } from 'vitest';
import { normalizeCopy } from './landing-copy';

const text = (f: string) => { const w = new Window(); w.document.write(readFileSync(f, 'utf8')); return { d: w.document, t: normalizeCopy(w.document.body.textContent ?? '') }; };

test('404 (landing-page.md §11)', () => {
  const { d, t } = text('dist-pilot/404.html');
  expect(t).toContain('FILE NOT FOUND.');
  expect(t).toContain('This page has been redacted, misfiled, or never existed. Personnel are reminded not to wander outside the lit area.');
  expect(d.querySelector('a.btn[href="/"]')!.textContent).toContain('Back to the archive');
});
test('waitlist confirmation', () => {
  expect(text('dist-pilot/waitlist/confirmed/index.html').t).toContain(normalizeCopy('Noted. Your name is in the personnel file. We’ll be in touch exactly once, when your access is ready.'));
});
test('offline', () => {
  expect(text('dist-pilot/offline/index.html').t).toContain(normalizeCopy('You appear to be offline. Good field practice, but you’ll need a connection for this part.'));
});
