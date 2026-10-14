import { expect, test } from 'vitest';
import { baseColorAt, bloomAt, createMoteSet, moteCount, shaftsAt, timecodeAt, volumesAt } from './field-params';

test('five shafts at the hero, at full length and alpha', () => {
  const s = shaftsAt(0);
  expect(s.map((x) => x.index)).toEqual([0, 1, 2, 3, 4]);
  expect(s.map((x) => x.len)).toEqual([1250, 1150, 1500, 1050, 1350]);
  expect(s[0]!.alpha).toBeCloseTo(0.17);
  expect(s[3]!.thin).toBe(true);
  expect([s[0]!.coreHalfDeg, s[0]!.softHalfDeg, s[4]!.coreHalfDeg, s[4]!.softHalfDeg]).toEqual([7, 15, 2, 6.5]);
});
test('each shaft drops out at its own depth', () => {
  expect(shaftsAt(0.34).map((x) => x.index)).toEqual([1, 2, 3, 4]);
  expect(shaftsAt(0.6).map((x) => x.index)).toEqual([2, 3, 4]);
});
test('one thin shaft at about 3% by the final CTA', () => {
  const s = shaftsAt(0.96);
  expect(s.map((x) => x.index)).toEqual([4]);
  expect(s[0]!.alpha).toBeCloseTo(0.0315, 3);
  expect(s[0]!.len).toBeCloseTo(1350 * (0.42 + 0.58 * 0.36));
});
test('a shaft fainter than 0.012 is dropped', () => {
  for (let d = 0; d <= 1; d += 0.01) for (const s of shaftsAt(d)) expect(s.alpha).toBeGreaterThanOrEqual(0.012);
});
test('motes: 34 at the hero, none from d = 0.62', () => {
  expect(moteCount(0)).toBe(34);
  expect(moteCount(0.31)).toBe(Math.round(34 * 0.5 ** 1.4));
  expect(moteCount(0.62)).toBe(0);
});
test('the mote set is stable, deterministic and inside the handoff ranges', () => {
  const a = createMoteSet(); const b = createMoteSet();
  expect(a).toEqual(b);
  expect(a).toHaveLength(34);
  for (const m of a) {
    expect(m.size).toBeGreaterThanOrEqual(1.1); expect(m.size).toBeLessThanOrEqual(2.6);
    expect(m.baseAlpha).toBeGreaterThanOrEqual(0.22); expect(m.baseAlpha).toBeLessThanOrEqual(0.64);
    expect(m.durS).toBeGreaterThanOrEqual(9); expect(m.durS).toBeLessThanOrEqual(18);
    expect(Math.abs(m.across)).toBeLessThanOrEqual(1);
  }
});
test('bloom, base colour, timecode', () => {
  expect(bloomAt(0)).toBe(1); expect(bloomAt(0.625)).toBe(0); expect(bloomAt(0.9)).toBe(0);
  expect(baseColorAt(0)).toEqual([19, 16, 25]); expect(baseColorAt(1)).toEqual([11, 10, 15]);
  expect(timecodeAt(0)).toBe('00:14:07'); expect(timecodeAt(0.5)).toBe('00:23:07'); expect(timecodeAt(1)).toBe('00:32:07');
});
test('volumes grow with depth (the dark gets bigger)', () => {
  const [a0, b0, c0] = volumesAt(0, 1440, 900);
  const [a1, b1, c1] = volumesAt(1, 1440, 900);
  expect([a0!.rx, b0!.rx, c0!.rx]).toEqual([1000, 1200, 800]);
  expect([a1!.rx, b1!.rx, c1!.rx]).toEqual([3600, 4400, 3000]);
  expect(a0!.ry).toBeCloseTo(680); expect(b1!.rgba[3]).toBeCloseTo(0.75);
  expect(a0!.cx).toBeCloseTo(1440 * 0.82); expect(a1!.cy).toBeCloseTo(900 * 0.32);
});
