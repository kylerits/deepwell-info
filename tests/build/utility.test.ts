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
test('waitlist error (no-JS failure): plain error plus a retry form that posts without JS', () => {
  const { d, t } = text('dist-pilot/waitlist/error/index.html');
  expect(t).toContain(normalizeCopy('Your sign-up didn’t go through. Check that your email address is complete and try again below. If it still fails, wait a minute and retry.'));
  expect(d.querySelector('[role="alert"]')).not.toBeNull();
  const f = d.querySelector('form[data-waitlist]')!;
  expect(f.getAttribute('method')).toBe('post'); expect(f.getAttribute('action')).toBe('/api/waitlist');
  expect(d.querySelector('label[for="retry-email"]')!.textContent).toBe('Email address');
  expect(f.querySelector('button.btn')!.classList.contains('btn--secondary')).toBe(false);
  expect(d.querySelector('a.btn.btn--secondary[href="/"]')!.textContent).toContain('Back to the archive');
});
test('offline', () => {
  expect(text('dist-pilot/offline/index.html').t).toContain(normalizeCopy('You appear to be offline. Good field practice, but you’ll need a connection for this part.'));
});
