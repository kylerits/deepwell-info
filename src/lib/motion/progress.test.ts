import { expect, test } from 'vitest';
import { approachRange, pinRange, rangeProgress } from './progress';

test('rangeProgress clamps to 0..1 and is linear inside', () => {
  const r = { start: 100, end: 300 };
  expect(rangeProgress(0, r)).toBe(0);
  expect(rangeProgress(200, r)).toBe(0.5);
  expect(rangeProgress(999, r)).toBe(1);
});
test('rangeProgress treats the last pixel as the end (a fractional max scroll still resolves)', () => {
  const r = { start: 100, end: 300 };
  expect(rangeProgress(299.4, r)).toBe(1);
  expect(rangeProgress(298.5, r)).toBeLessThan(1);
});
test('a zero-length range is a step at start', () => {
  expect(rangeProgress(99, { start: 100, end: 100 })).toBe(0);
  expect(rangeProgress(100, { start: 100, end: 100 })).toBe(1);
});
test('approachRange: from section top at the bottom of the screen to top at 40%', () => {
  expect(approachRange({ top: 5000, vh: 1000, maxScroll: 9000, from: 1, to: 0.4 })).toEqual({ start: 4000, end: 4600 });
});
test('approachRange ends at max scroll when the page runs out first (Final CTA always resolves)', () => {
  expect(approachRange({ top: 5000, vh: 1000, maxScroll: 4300, from: 1, to: 0.4 })).toEqual({ start: 4000, end: 4300 });
});
test('pinRange runs from the section top to its bottom leaving the screen', () => {
  expect(pinRange({ top: 3000, height: 3200, vh: 1000 })).toEqual({ start: 3000, end: 5200 });
});
