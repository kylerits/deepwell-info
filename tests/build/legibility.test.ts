import { readdirSync, readFileSync } from 'node:fs';
import { Window } from 'happy-dom';
import { expect, test } from 'vitest';

const w = new Window(); w.document.write(readFileSync('dist-pilot/index.html', 'utf8')); const d = w.document;
const PLAIN = ['#pricing', '#licensing', '.faq__a', '.summary', '.foot__disc', '.foot__attr', '.cover__credits', '.cta-row', 'form[data-waitlist]'];

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
// Spec Part 1, Smudges table: every block of text that sits on the glass opts in.
const SMUDGED = ['.top__logo', '#top .col', '#top .hero__visual', '.sec--trust .trust', '#problem .col',
  '#module-01 .col', '#module-02 .col', '#module-03 .col', '#themes .col', '#themes .themes',
  '#pricing .col', '#pricing .price', '#pricing .fine', '#licensing .col', '#faq > .wrap', '#start .col', '.foot'];
test('every text block on the glass carries .smudge', () => {
  for (const sel of SMUDGED) {
    const els = [...d.querySelectorAll(sel)];
    expect(els.length, sel).toBeGreaterThan(0);
    for (const el of els) expect(el.classList.contains('smudge'), sel).toBe(true);
  }
});
test('the minifier never folds a scroll timeline into the animation shorthand (Chrome drops it)', () => {
  const css = readdirSync('dist-pilot/_astro').filter((n) => n.endsWith('.css')).map((n) => readFileSync(`dist-pilot/_astro/${n}`, 'utf8')).join('\n');
  expect(css).toContain('animation-timeline:scroll(root)');
  expect(css).not.toMatch(/animation:[^;}]*scroll\(/);
});
test('the build keeps -webkit-backdrop-filter and its @supports branch (Safari ≤ 17 has only the prefix)', () => {
  const css = readdirSync('dist-pilot/_astro').filter((n) => n.endsWith('.css')).map((n) => readFileSync(`dist-pilot/_astro/${n}`, 'utf8')).join('\n');
  expect(css).toMatch(/\.smudge:before\{[^}]*-webkit-backdrop-filter:blur\(10px\)/);
  expect(css).toMatch(/@supports not \(\(-webkit-backdrop-filter:blur\(1px\)\) or \(backdrop-filter:blur\(1px\)\)\)/);
});
