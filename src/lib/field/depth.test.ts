import { expect, test } from 'vitest';
import { approach, depthAt, normalizeAnchors } from './depth';

const A = normalizeAnchors([{ y: -300, d: 0 }, { y: 1000, d: 0.3 }, { y: 3000, d: 0.6 }, { y: 6000, d: 0.96 }], 7000);

test('anchors are framed by {0,0} and {max,1}', () => {
  expect(A[0]).toEqual({ y: 0, d: 0 });
  expect(A.at(-1)).toEqual({ y: 7000, d: 1 });
});
test('interpolates linearly between anchors and hits each keyframe exactly', () => {
  expect(depthAt(1000, A)).toBeCloseTo(0.3);
  expect(depthAt(2000, A)).toBeCloseTo(0.45);
  expect(depthAt(6000, A)).toBeCloseTo(0.96);
});
test('clamps outside the scroll range (overscroll, rubber-banding)', () => {
  expect(depthAt(-50, A)).toBe(0);
  expect(depthAt(9999, A)).toBe(1);
});
test('unsorted, duplicate and non-monotonic anchors still give a monotonic depth (Review Focus 5)', () => {
  const B = normalizeAnchors([{ y: 3000, d: 0.6 }, { y: 1000, d: 0.7 }, { y: 1000, d: 0.2 }, { y: 8000, d: 0.9 }], 5000);
  let prev = -1;
  for (let y = 0; y <= 5000; y += 50) { const d = depthAt(y, B); expect(d).toBeGreaterThanOrEqual(prev); expect(d).toBeLessThanOrEqual(1); prev = d; }
});
test('a page shorter than the viewport stays at the hero depth', () => {
  expect(depthAt(0, normalizeAnchors([{ y: 0, d: 0 }], 0))).toBe(0);
});
test('approach eases toward the target and snaps when close', () => {
  const v = approach(0, 1, 160);
  expect(v).toBeGreaterThan(0.6); expect(v).toBeLessThan(0.65);
  expect(approach(0.99995, 1, 16)).toBe(1);
  expect(approach(0.5, 0.5, 16)).toBe(0.5);
});
