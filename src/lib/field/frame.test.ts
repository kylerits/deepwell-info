import { expect, test } from 'vitest';
import { PARALLAX, breathAt, buildFrame, riseAlong } from './frame';
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
test('an absent scrollY is the same as 0, at full and at reduced', () => {
  for (const motion of ['full', 'reduced'] as const) {
    const a = at({ motion, timeMs: 4321 }), b = at({ motion, timeMs: 4321, scrollY: 0 });
    expect(Array.from(b.motes)).toEqual(Array.from(a.motes));
    expect(Array.from(b.volA)).toEqual(Array.from(a.volA));
  }
});
test('volumes drift up at 0.08× scroll at full; no offset at reduced', () => {
  const rest = at(), moved = at({ scrollY: 1000 });
  for (let k = 0; k < 3; k++) {
    expect(moved.volA[k * 4 + 1]).toBeCloseTo(rest.volA[k * 4 + 1]! - PARALLAX.volumes * 1000, 3);
    expect(moved.volA[k * 4]).toBe(rest.volA[k * 4]); // x, rx, ry untouched
  }
  expect(Array.from(at({ motion: 'reduced', scrollY: 1000 }).volA)).toEqual(Array.from(at({ motion: 'reduced' }).volA));
});
test('shafts never move with scroll', () => {
  expect(Array.from(at({ scrollY: 2500 }).shaftA)).toEqual(Array.from(at().shaftA));
});
test('riseAlong wraps into [0.1, 0.8), fades to 0 at the seam, and is identity-with-fade-1 for today’s seeds', () => {
  for (let t = 0.2; t < 0.7; t += 0.01) expect(riseAlong(t, 0)).toEqual({ t: expect.closeTo(t, 9), fade: 1 });
  for (const shift of [-3.7, -0.4, 0, 0.05, 0.35, 1, 12.6, 1e5]) {
    const r = riseAlong(0.45, shift);
    expect(r.t).toBeGreaterThanOrEqual(0.1); expect(r.t).toBeLessThan(0.8);
    expect(r.fade).toBeGreaterThanOrEqual(0); expect(r.fade).toBeLessThanOrEqual(1);
  }
  expect(riseAlong(0.1, 0).fade).toBe(0);
  expect(riseAlong(0.1 + 1e-9, 0).fade).toBeLessThan(1e-6);
});
test('motes rise as you descend: mean y falls with scroll at full', () => {
  const meanY = (f: ReturnType<typeof at>) => { let s = 0; for (let j = 0; j < f.moteCount; j++) s += f.motes[j * 4 + 1]!; return s / f.moteCount; };
  expect(meanY(at({ scrollY: 60 }))).toBeLessThan(meanY(at()));
  expect(Array.from(at({ motion: 'reduced', scrollY: 600 }).motes)).toEqual(Array.from(at({ motion: 'reduced' }).motes));
});
test('no mote pops: a jump between adjacent scroll positions happens only while it is invisible (Review Focus 3)', () => {
  let prev = at({ scrollY: 0 });
  for (let s = 8; s <= 6000; s += 8) {
    const cur = at({ scrollY: s });
    expect(cur.moteCount).toBe(prev.moteCount);
    for (let j = 0; j < cur.moteCount; j++) {
      const dx = cur.motes[j * 4]! - prev.motes[j * 4]!, dy = cur.motes[j * 4 + 1]! - prev.motes[j * 4 + 1]!;
      if (Math.hypot(dx, dy) > 12) expect(Math.min(cur.motes[j * 4 + 3]!, prev.motes[j * 4 + 3]!)).toBeLessThan(0.02);
    }
    prev = cur;
  }
});
test('huge scroll positions stay finite and in range (Review Focus 4)', () => {
  for (const s of [1e5, 3.3e6]) {
    const f = at({ scrollY: s });
    for (const v of f.motes) expect(Number.isFinite(v)).toBe(true);
    for (const v of f.volA) expect(Number.isFinite(v)).toBe(true);
    for (let j = 0; j < f.moteCount; j++) expect(f.motes[j * 4 + 3]!).toBeGreaterThanOrEqual(0);
  }
});
