import { expect, test } from 'vitest';
import { motionMode } from './mode';

test('level off is none, whatever else', () => {
  for (const rm of [false, true]) for (const width of [390, 1440])
    expect(motionMode({ level: 'off', prefersReducedMotion: rm, width })).toBe('none');
});
test('reduced level or OS reduced-motion is calm', () => {
  expect(motionMode({ level: 'reduced', prefersReducedMotion: false, width: 1440 })).toBe('calm');
  expect(motionMode({ level: 'full', prefersReducedMotion: true, width: 1440 })).toBe('calm');
  expect(motionMode({ level: 'full', prefersReducedMotion: true, width: 390 })).toBe('calm');
});
test('full splits at 900px: 900 is narrow, 901 is full', () => {
  expect(motionMode({ level: 'full', prefersReducedMotion: false, width: 900 })).toBe('full-narrow');
  expect(motionMode({ level: 'full', prefersReducedMotion: false, width: 901 })).toBe('full');
});
