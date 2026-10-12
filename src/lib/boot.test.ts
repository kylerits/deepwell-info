// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { bootScript } from './boot';
import { resolveAtmosphere, type AtmosphereLevel } from './atmosphere/level';

const run = (src: string) => new Function(src)();
const html = () => document.documentElement;
const setRM = (on: boolean) => { window.matchMedia = ((q: string) => ({ matches: on && q.includes('reduce') })) as unknown as typeof window.matchMedia; };

beforeEach(() => { localStorage.clear(); for (const a of ['data-js', 'data-atmosphere', 'data-cover', 'data-motion-arm', 'data-motion']) html().removeAttribute(a); setRM(false); });
afterEach(() => vi.restoreAllMocks());

test('agrees with resolveAtmosphere for every input combination', () => {
  for (const stored of [null, 'full', 'reduced', 'off', 'bogus'])
    for (const rm of [false, true])
      for (const def of ['full', 'reduced', 'off'] as AtmosphereLevel[]) {
        localStorage.clear(); if (stored) localStorage.setItem('dw-atmosphere', stored); setRM(rm);
        run(bootScript({ storageKey: 'dw-atmosphere', buildDefault: def, slugs: [] }));
        expect(html().getAttribute('data-atmosphere')).toBe(resolveAtmosphere({ stored, prefersReducedMotion: rm, buildDefault: def }));
      }
});
test('marks JS available and picks one cover slug at random', () => {
  vi.spyOn(Math, 'random').mockReturnValue(0.55);
  run(bootScript({ storageKey: 'dw-atmosphere', buildDefault: 'full', slugs: ['a', 'b', 'c', 'd'] }));
  expect(html().hasAttribute('data-js')).toBe(true);
  expect(html().getAttribute('data-cover')).toBe('c');
});
test('throwing storage falls back to the reduced-motion/default path (Review Focus 1)', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
  setRM(true);
  expect(() => run(bootScript({ storageKey: 'dw-atmosphere', buildDefault: 'full', slugs: ['a'] }))).not.toThrow();
  expect(html().getAttribute('data-atmosphere')).toBe('reduced');
  expect(html().getAttribute('data-cover')).toBe('a');
});
test('values are escaped so a hostile slug cannot break out of the inline script', () => {
  vi.spyOn(Math, 'random').mockReturnValue(0);
  const src = bootScript({ storageKey: 'dw-atmosphere', buildDefault: 'full', slugs: ['</script><b>'] });
  expect(src).not.toContain('</');
  run(src);
  expect(html().getAttribute('data-cover')).toBe('</script><b>');
});

test('motion pages arm the hero pre-hide unless the level is off', () => {
  for (const [stored, armed] of [['full', true], ['reduced', true], ['off', false]] as const) {
    html().removeAttribute('data-motion-arm'); localStorage.setItem('dw-atmosphere', stored);
    run(bootScript({ storageKey: 'dw-atmosphere', buildDefault: 'full', slugs: [], motion: true }));
    expect(html().hasAttribute('data-motion-arm')).toBe(armed);
  }
});
test('pages without motion never arm', () => {
  run(bootScript({ storageKey: 'dw-atmosphere', buildDefault: 'full', slugs: [] }));
  expect(html().hasAttribute('data-motion-arm')).toBe(false);
});
test('the arm fails open after 2 s unless the motion module has started', () => {
  vi.useFakeTimers();
  run(bootScript({ storageKey: 'dw-atmosphere', buildDefault: 'full', slugs: [], motion: true }));
  vi.advanceTimersByTime(1999); expect(html().hasAttribute('data-motion-arm')).toBe(true);
  vi.advanceTimersByTime(1); expect(html().hasAttribute('data-motion-arm')).toBe(false);
  html().setAttribute('data-motion', 'full');
  run(bootScript({ storageKey: 'dw-atmosphere', buildDefault: 'full', slugs: [], motion: true }));
  vi.advanceTimersByTime(2000); expect(html().hasAttribute('data-motion-arm')).toBe(true);
  vi.useRealTimers();
});
