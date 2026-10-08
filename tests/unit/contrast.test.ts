import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

type RGB = [number, number, number];
const lin = (c: number) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const L = ([r, g, b]: RGB) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const over = (fg: RGB, a: number, bg: RGB): RGB => fg.map((v, i) => bg[i]! + a * (v - bg[i]!)) as RGB;
const ratio = (a: RGB, b: RGB) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x! + 0.05) / (y! + 0.05); };

const INK: RGB = [234, 223, 198];
const DARKEST: RGB = [6, 5, 9];      // d=1 base under volume 2 at full strength
const LIT: RGB = [56, 58, 64];       // hero, under shaft 1 + bloom at full (conservative)

// Read the shipped ramps: the last opacity step of each mask-image gradient.
const css = readFileSync(new URL('../../src/styles/site.css', import.meta.url), 'utf8');
const floor = (sel: string): number => {
  const m = new RegExp(`^${sel.replace('.', '\\.')} \\{[^}]*?\\n\\s*mask-image:([^;]+);`, 'm').exec(css);
  expect(m, `${sel} mask-image`).not.toBeNull();
  const steps = [...m![1]!.matchAll(/rgba\(0,0,0,([\d.]+)\)/g)].map((x) => Number(x[1]));
  return steps[steps.length - 1]!;
};
const BODY = Math.min(floor('.recede'), floor('.recede-slow'));
const HEAD = floor('.recede-h');

test('shipped ramp floors are the pinned ones (.66 body, .54 headline)', () => {
  expect(floor('.recede')).toBe(0.66);
  expect(floor('.recede-slow')).toBe(0.66);
  expect(HEAD).toBe(0.54);
});
test('body ramp floor .66 stays ≥ 4.5:1 on the darkest and the most-lit field frame', () => {
  for (const bg of [DARKEST, LIT]) expect(ratio(over(INK, BODY, bg), bg)).toBeGreaterThanOrEqual(4.5);
});
test('headline ramp floor .54 stays ≥ 4.5:1 on the darkest frame and ≥ 3:1 (large text) when lit', () => {
  expect(ratio(over(INK, HEAD, DARKEST), DARKEST)).toBeGreaterThanOrEqual(4.5);
  expect(ratio(over(INK, HEAD, LIT), LIT)).toBeGreaterThanOrEqual(3);
});
