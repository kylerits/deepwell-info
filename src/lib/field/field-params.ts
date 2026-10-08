// Every number here is from design/marketing_site/handoff/README.md §4 (approved by eye on the
// round-1 canvas; prototype source: reference/Main.dc.html shafts/motes/band/vol/base/tcode).
export interface ShaftDef { xPct: number; len: number; angleDeg: number; alpha: number; goneAt: number; thin: boolean }
export const SHAFT_DEFS: readonly ShaftDef[] = [
  { xPct: -3, len: 1250, angleDeg: -27, alpha: 0.17, goneAt: 0.34, thin: false },
  { xPct: 6, len: 1150, angleDeg: -21, alpha: 0.14, goneAt: 0.48, thin: false },
  { xPct: 13, len: 1500, angleDeg: -16.5, alpha: 0.11, goneAt: 0.66, thin: false },
  { xPct: 22, len: 1050, angleDeg: -11.5, alpha: 0.09, goneAt: 0.86, thin: true },
  { xPct: 30, len: 1350, angleDeg: -7, alpha: 0.075, goneAt: 1.5, thin: true },
];
/** Shafts start this far above the viewport top, so their origin is never in frame. */
export const SHAFT_TOP_PX = -240;

export interface Shaft { index: number; xPct: number; len: number; angleDeg: number; alpha: number; thin: boolean; coreHalfDeg: number; softHalfDeg: number }

export function shaftsAt(d: number): Shaft[] {
  const out: Shaft[] = [];
  SHAFT_DEFS.forEach((s, index) => {
    const f = 1 - d / s.goneAt;
    if (f <= 0) return;
    const alpha = s.alpha * f ** 0.85;
    if (alpha < 0.012) return;
    out.push({
      index, xPct: s.xPct, len: s.len * (0.42 + 0.58 * f), angleDeg: s.angleDeg, alpha, thin: s.thin,
      coreHalfDeg: s.thin ? 2 : 7, softHalfDeg: s.thin ? 6.5 : 15,
    });
  });
  return out;
}

export const moteFalloff = (d: number): number => Math.max(0, 1 - d / 0.62);
export const moteCount = (d: number): number => Math.round(34 * moteFalloff(d) ** 1.4);

export interface MoteSeed { shaftIndex: number; t: number; across: number; size: number; baseAlpha: number; durS: number; delayS: number }

/** Stable mote set (plan Decision 7): Park–Miller RNG as the prototype, one per shaft round-robin. */
export function createMoteSet(seed = 11, count = 34): MoteSeed[] {
  let x = seed;
  const rnd = (): number => { x = (x * 16807) % 2147483647; return x / 2147483647; };
  return Array.from({ length: count }, (_, j) => ({
    shaftIndex: j % SHAFT_DEFS.length,
    t: 0.2 + rnd() * 0.5,
    across: rnd() * 2 - 1,
    size: 1.1 + rnd() * 1.5,
    baseAlpha: 0.22 + rnd() * 0.42,
    durS: 9 + rnd() * 9,
    delayS: rnd() * 14,
  }));
}

export const bloomAt = (d: number): number => Math.max(0, 1 - 1.6 * d);

export function baseColorAt(d: number): [number, number, number] {
  const a = [19, 16, 25], b = [11, 10, 15];
  return a.map((v, i) => Math.round(v + (b[i]! - v) * d)) as [number, number, number];
}

export interface Volume { cx: number; cy: number; rx: number; ry: number; rgba: [number, number, number, number]; stop: number }

export function volumesAt(d: number, w: number, h: number): Volume[] {
  const A = 1000 + 2600 * d, B = 1200 + 3200 * d, C = 800 + 2200 * d;
  return [
    { cx: 0.82 * w, cy: (0.18 + 0.14 * d) * h, rx: A, ry: 0.68 * A, rgba: [30, 25, 40, 0.55 - 0.15 * d], stop: 0.7 },
    { cx: 0.22 * w, cy: (0.96 + 0.2 * d) * h, rx: B, ry: 0.62 * B, rgba: [6, 5, 9, 0.45 + 0.3 * d], stop: 0.72 },
    { cx: 1.08 * w, cy: 1.04 * h, rx: C, ry: C, rgba: [26, 22, 34, 0.4], stop: 0.7 },
  ];
}

/** Tape timecode: time, never a depth gauge. 00:14:07 at the top → 00:32:07 at the bottom. */
export function timecodeAt(d: number): string {
  const s = 847 + Math.round(Math.min(1, Math.max(0, d)) * 1080);
  const m = Math.floor(s / 60), ss = s % 60;
  return `00:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}
