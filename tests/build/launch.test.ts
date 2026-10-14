import { readFileSync } from 'node:fs';
import { Window } from 'happy-dom';
type Doc = Window['document'];
import { expect, test } from 'vitest';

const doc = (out: string) => { const w = new Window(); w.document.write(readFileSync(`${out}/index.html`, 'utf8')); return w.document; };
const pilot = doc('dist-pilot'), pub = doc('dist-public');
const slot = (d: Doc, k: string) => d.querySelector(`[data-launch-slot="${k}"]`)!;

test('public: both CTAs are plain "Start reading — free" links to the app; no form', () => {
  for (const k of ['hero', 'final']) {
    const a = slot(pub, k).querySelector('a.btn')!;
    expect(a.textContent!.trim()).toBe('Start reading — free');
    expect(a.getAttribute('href')).toBe('https://app.readdeepwell.com');
  }
  expect(pub.querySelector('form')).toBeNull();
});
test('only the two launch slots differ between the builds (the one-switch flip)', () => {
  const strip = (d: Doc) => { d.querySelectorAll('[data-launch-slot]').forEach((n) => n.remove()); d.querySelectorAll('script').forEach((n) => n.remove()); return d.body.innerHTML.replace(/astro-[a-z0-9]+/g, ''); };
  expect(strip(pilot)).toBe(strip(pub));
});
test('labels are plain, never in-fiction', () => {
  for (const d of [pilot, pub]) for (const b of d.querySelectorAll('a.btn, button.btn'))
    expect(['Start reading — free', 'Get early access', 'Join the waitlist']).toContain(b.textContent!.trim());
});
