export interface Anchor { y: number; d: number }

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function normalizeAnchors(raw: Anchor[], maxScroll: number): Anchor[] {
  const max = Math.max(0, maxScroll);
  if (max === 0) return [{ y: 0, d: 0 }];
  const pts = raw
    .filter((a) => Number.isFinite(a.y) && Number.isFinite(a.d))
    .map((a) => ({ y: clamp(a.y, 0, max), d: clamp(a.d, 0, 1) }))
    .sort((a, b) => a.y - b.y || a.d - b.d);
  const out: Anchor[] = [{ y: 0, d: 0 }];
  for (const p of [...pts, { y: max, d: 1 }]) {
    const last = out[out.length - 1]!;
    const d = Math.max(last.d, p.d);
    if (p.y === last.y) last.d = d; else out.push({ y: p.y, d });
  }
  return out;
}

export function depthAt(scrollY: number, anchors: Anchor[]): number {
  if (anchors.length < 2) return 0;
  const first = anchors[0]!, last = anchors[anchors.length - 1]!;
  if (scrollY <= first.y) return first.d;
  if (scrollY >= last.y) return last.d;
  for (let i = 1; i < anchors.length; i++) {
    const a = anchors[i - 1]!, b = anchors[i]!;
    if (scrollY <= b.y) return a.d + ((b.d - a.d) * (scrollY - a.y)) / (b.y - a.y);
  }
  return last.d;
}

export function approach(current: number, target: number, dtMs: number, tauMs = 160): number {
  const next = current + (target - current) * (1 - Math.exp(-Math.max(0, dtMs) / tauMs));
  return Math.abs(target - next) < 1e-4 ? target : next;
}
