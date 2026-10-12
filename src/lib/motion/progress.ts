// Scroll ranges for the scrubbed scenes (motion-scenes spec, Part 2). Document-space px.
export type Range = { start: number; end: number };

export function rangeProgress(scrollY: number, r: Range): number {
  if (r.end <= r.start) return scrollY >= r.start ? 1 : 0;
  const p = (scrollY - r.start) / (r.end - r.start);
  return p < 0 ? 0 : p > 1 ? 1 : p;
}

/** From the section's top at `from`×vh down to its top at `to`×vh, ending early at max scroll. */
export function approachRange(o: { top: number; vh: number; maxScroll: number; from: number; to: number }): Range {
  return { start: o.top - o.from * o.vh, end: Math.min(o.top - o.to * o.vh, o.maxScroll) };
}

/** A sticky pin: from the section's top reaching the screen top until its bottom reaches the screen bottom. */
export function pinRange(o: { top: number; height: number; vh: number }): Range {
  return { start: o.top, end: o.top + o.height - o.vh };
}
