import { SHAFT_TOP_PX, baseColorAt, bloomAt, createMoteSet, moteCount, moteFalloff, shaftsAt, volumesAt } from './field-params';
import { presenceDim } from './presence';

export type Motion = 'full' | 'reduced';
export interface FrameInput { d: number; width: number; height: number; timeMs: number; motion: Motion; presence: number }
export interface FrameData {
  base: Float32Array; bloom: number; volA: Float32Array; volC: Float32Array; volStop: Float32Array;
  shaftCount: number; shaftA: Float32Array; shaftB: Float32Array; breath: number; presence: Float32Array;
  motes: Float32Array; moteCount: number;
}

const DEG = Math.PI / 180;
const MOTES = createMoteSet();

/** Shafts breathe 0.82 ↔ 1 over 13 s, alternating, eased (app keyframe dw-breathe timing). */
export const breathAt = (timeMs: number): number => 0.91 - 0.09 * Math.cos((Math.PI * timeMs) / 13000);

const easeAlt = (tS: number, durS: number, delayS: number): number => {
  const ph = ((tS + delayS) / durS) % 2;
  const u = ph < 1 ? ph : 2 - ph;
  return 0.5 - 0.5 * Math.cos(Math.PI * u);
};

export function buildFrame(i: FrameInput): FrameData {
  const { d, width: W, height: H, motion } = i;
  const shafts = shaftsAt(d);
  const shaftA = new Float32Array(20), shaftB = new Float32Array(20);
  const geom = new Map<number, { tx: number; ty: number; dx: number; dy: number; len: number; thin: boolean }>();
  shafts.forEach((s, k) => {
    const a = s.angleDeg * DEG, dx = -Math.sin(a), dy = Math.cos(a);
    const tx = (s.xPct / 100) * W, ty = SHAFT_TOP_PX;
    shaftA.set([tx - dx * 0.09 * s.len, ty - dy * 0.09 * s.len, a, s.len], k * 4);
    shaftB.set([s.alpha, s.coreHalfDeg * DEG, s.softHalfDeg * DEG, 0.09 * s.len], k * 4);
    geom.set(s.index, { tx, ty, dx, dy, len: s.len, thin: s.thin });
  });

  const vols = volumesAt(d, W, H);
  const volA = new Float32Array(12), volC = new Float32Array(12), volStop = new Float32Array(3);
  vols.forEach((v, k) => {
    volA.set([v.cx, v.cy, v.rx, v.ry], k * 4);
    volC.set([v.rgba[0] / 255, v.rgba[1] / 255, v.rgba[2] / 255, v.rgba[3]], k * 4);
    volStop[k] = v.stop;
  });

  const n = moteCount(d);
  const f = moteFalloff(d);
  const tS = motion === 'full' ? i.timeMs / 1000 : 0;
  const out: number[] = [];
  MOTES.slice(0, n).forEach((m, j) => {
    if (motion === 'reduced' && j % 2 === 1) return; // half the motes, as the prototype's :nth-child(2n)
    const g = geom.get(m.shaftIndex);
    if (!g) return;
    const along = m.t * g.len;
    const across = m.across * (m.t + 0.09) * g.len * (g.thin ? 0.07 : 0.15);
    let x = g.tx + g.dx * along + g.dy * across;
    let y = g.ty + g.dy * along - g.dx * across;
    if (motion === 'full') { const e = easeAlt(tS, m.durS, m.delayS); x += 6 * e; y += 9 * e; }
    out.push(x, y, m.size, m.baseAlpha * (0.35 + 0.65 * f));
  });

  const p = i.presence;
  const [r, g2, b] = baseColorAt(d);
  return {
    base: new Float32Array([r / 255, g2 / 255, b / 255]), bloom: bloomAt(d), volA, volC, volStop,
    shaftCount: shafts.length, shaftA, shaftB, breath: motion === 'full' ? breathAt(i.timeMs) : 1,
    presence: new Float32Array([W * (1.35 - 1.9 * p), 1.4 * Math.max(W, H), 0.12 * presenceDim(p)]),
    motes: new Float32Array(out), moteCount: out.length / 4,
  };
}
