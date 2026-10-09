import { readFileSync } from 'node:fs';
import { Window } from 'happy-dom';
import { expect, test } from 'vitest';

const w = new Window(); w.document.write(readFileSync('dist-pilot/index.html', 'utf8')); const d = w.document;
const PLAIN = ['#pricing', '#licensing', '.faq__a', '.summary', '.foot__disc', '.foot__attr', '.cover__attr', '.cover__after', '.cta-row', 'form[data-waitlist]'];

test('plain sections, summaries, CTAs and attribution never carry a recede ramp', () => {
  for (const sel of PLAIN) for (const el of d.querySelectorAll(sel)) {
    expect(el.closest('.recede, .recede-h, .recede-slow'), sel).toBeNull();
    expect(el.querySelector('.recede, .recede-h, .recede-slow'), sel).toBeNull();
  }
});
test('one glass layer: a single .tube, a direct child of main.dw, none inside sections', () => {
  const tubes = [...d.querySelectorAll('.tube')];
  expect(tubes).toHaveLength(1);
  expect(tubes[0]!.parentElement!.matches('main.dw')).toBe(true);
  expect(tubes[0]!.getAttribute('aria-hidden')).toBe('true');
  expect(d.querySelector('section .tube, footer .tube')).toBeNull();
  expect(d.querySelector('.tube--side, .tube--edge')).toBeNull();
});
test('OSD is decorative, starts at the top timecode', () => {
  const osd = d.querySelector('.osd')!;
  expect(osd.getAttribute('aria-hidden')).toBe('true');
  expect(osd.querySelector('[data-osd-time]')!.textContent).toBe('00:14:07');
});
test('the atmosphere switch is a labelled group of three pressed-state buttons', () => {
  const g = d.querySelector('[role="group"][aria-label="Atmosphere"]')!;
  expect([...g.querySelectorAll('button')].map((b) => b.textContent!.trim())).toEqual(['Full', 'Reduced', 'Off']);
  for (const b of g.querySelectorAll('button')) expect(b.hasAttribute('aria-pressed')).toBe(true);
});
