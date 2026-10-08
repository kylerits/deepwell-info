import { expect, test } from 'vitest';
import { breathAt, buildFrame } from './frame';
import { moteCount } from './field-params';

const at = (o: Partial<Parameters<typeof buildFrame>[0]> = {}) => buildFrame({ d: 0, width: 1440, height: 900, timeMs: 0, motion: 'full', presence: 0, ...o });

test('shaft 1 apex sits above-left, outside the frame, at the handoff geometry', () => {
  const f = at();
  expect(f.shaftCount).toBe(5);
  const a = (-27 * Math.PI) / 180;
  expect(f.shaftA[0]).toBeCloseTo(-43.2 + Math.sin(a) * 0.09 * 1250, 3);
  expect(f.shaftA[1]).toBeCloseTo(-240 - Math.cos(a) * 0.09 * 1250, 3);
  expect(f.shaftA[2]).toBeCloseTo(a, 6); expect(f.shaftA[3]).toBe(1250);
  expect(f.shaftB[0]).toBeCloseTo(0.17); expect(f.shaftB[3]).toBeCloseTo(112.5);
  for (let i = 0; i < f.shaftCount; i++) expect(f.shaftA[i * 4 + 1]!).toBeLessThan(0); // origin never in frame
});
test('breathing: 0.82..1 over 13 s at full; still 1 at reduced', () => {
  expect(breathAt(0)).toBeCloseTo(0.82); expect(breathAt(13000)).toBeCloseTo(1);
  for (let t = 0; t < 30000; t += 700) { const b = breathAt(t); expect(b).toBeGreaterThanOrEqual(0.82 - 1e-9); expect(b).toBeLessThanOrEqual(1 + 1e-9); }
  expect(at({ motion: 'reduced', timeMs: 5000 }).breath).toBe(1);
});
test('motes: full count at the hero, half at reduced, none deep; positions static at reduced', () => {
  expect(at().moteCount).toBe(moteCount(0));
  expect(at({ motion: 'reduced' }).moteCount).toBe(Math.ceil(moteCount(0) / 2));
  expect(at({ d: 0.7 }).moteCount).toBe(0);
  expect(Array.from(at({ motion: 'reduced', timeMs: 0 }).motes)).toEqual(Array.from(at({ motion: 'reduced', timeMs: 9999 }).motes));
});
test('motes never rise above (or left of) their rest position: drift is down/right then back', () => {
  // Reduced draws the even-indexed motes undrifted, so reduced mote k is full mote 2k at rest.
  const rest = at({ motion: 'reduced' });
  let moved = false;
  for (let t = 0; t < 30000; t += 1234) {
    const full = at({ timeMs: t });
    for (let k = 0; k < rest.moteCount; k++) {
      const j = 2 * k;
      expect(full.motes[j * 4 + 1]!).toBeGreaterThanOrEqual(rest.motes[k * 4 + 1]! - 1e-6);
      expect(full.motes[j * 4]!).toBeGreaterThanOrEqual(rest.motes[k * 4]! - 1e-6);
      if (full.motes[j * 4 + 1]! > rest.motes[k * 4 + 1]! + 0.5) moved = true;
    }
  }
  expect(moved).toBe(true); // the drift is real, so the bound is not vacuous
});
test('one shaft and no bloom by the final CTA; presence packs its envelope', () => {
  const f = at({ d: 0.96, presence: 0.5 });
  expect(f.shaftCount).toBe(1); expect(f.bloom).toBe(0);
  expect(f.presence[0]).toBeCloseTo(1440 * (1.35 - 0.95)); expect(f.presence[1]).toBeCloseTo(1.4 * 1440); expect(f.presence[2]).toBeCloseTo(0.12);
});
test('base colour and volumes are packed for the shader', () => {
  const f = at({ d: 1 });
  expect(Array.from(f.base).map((v) => Math.round(v * 255))).toEqual([11, 10, 15]);
  expect(f.volA[2]).toBe(3600); expect(f.volC[7]).toBeCloseTo(0.75); expect(Array.from(f.volStop).map((v) => +v.toFixed(2))).toEqual([0.7, 0.72, 0.7]);
});
