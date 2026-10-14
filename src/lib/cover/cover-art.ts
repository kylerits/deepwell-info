// PORTED from ~/git_local/deepwell/apps/web/src/lib/reader/cover/cover-art.ts on 2026-10-08 (unchanged below this header).

// Generative ASCII cover art — pure, seeded, deterministic, zero-dependency (mirrors the
// reader-engine ethos). A given article's slug always yields the same art, so covers are
// stable across sessions and cheap to unit-test. The object class picks a pattern family;
// the series and slug perturb it. Rendered aria-hidden as decorative monospace text.

export interface CoverArtOptions {
	/** Stable per-article seed — the slug (string) or a number. */
	seed: string | number;
	/** Object-class token (safe/euclid/keter/…) selecting the pattern family. */
	objectClass?: string | null;
	/** SCP series (1–9); perturbs the pattern. */
	series?: number | null;
	cols: number;
	rows: number;
	/**
	 * A silhouette mask (build-generated ASCII, non-space where the shape is). When present the
	 * art becomes the silhouette shape floating over a faint slug-seeded procedural field.
	 */
	silhouette?: string[] | null;
}

import silhouettes from './silhouette-ascii.json';
import { coverThemeForTags } from './theme';

/**
 * The build-generated silhouette for an article's keywords, or null when no distinctive
 * keyword matches (the `default` theme keeps the varied per-slug procedural art instead of
 * stamping every generic file with the same mark).
 */
export function silhouetteForTags(tags: string[]): string[] | null {
	const theme = coverThemeForTags(tags);
	if (theme === 'default') return null;
	return (silhouettes as Record<string, string[]>)[theme] ?? null;
}

type Rng = () => number;

// xmur3 string hash → 32-bit seed.
function hashString(str: string): number {
	let h = 1779033703 ^ str.length;
	for (let i = 0; i < str.length; i++) {
		h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
		h = (h << 13) | (h >>> 19);
	}
	h = Math.imul(h ^ (h >>> 16), 2246822507);
	h = Math.imul(h ^ (h >>> 13), 3266489909);
	return (h ^= h >>> 16) >>> 0;
}

// mulberry32 PRNG.
function mulberry32(a: number): Rng {
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const smooth = (t: number): number => t * t * (3 - 2 * t);

// Class → pattern family. Fixed so a class always reads the same way; classless articles
// fall back to a seed-chosen family.
type Family = 'corridor' | 'flow' | 'grid';
const FAMILY_BY_CLASS: Record<string, Family> = {
	keter: 'corridor',
	apollyon: 'corridor',
	euclid: 'flow',
	thaumiel: 'flow',
	safe: 'grid',
	neutralized: 'grid'
};

// One-point-perspective corridor of receding rectangles toward a central vanishing point —
// the 2001 "containment corridor" homage. Floating specks fill the negative space.
function corridor(rng: Rng, cols: number, rows: number): string[] {
	const cx = (cols - 1) / 2;
	const cy = (rows - 1) / 2;
	const grid: string[][] = Array.from({ length: rows }, () => Array<string>(cols).fill(' '));
	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < cols; x++) {
			const dx = (x - cx) / (cols / 2);
			const dy = (y - cy) / (rows / 2);
			const d = Math.max(Math.abs(dx), Math.abs(dy)); // square-ring distance 0..1
			if (d <= 0.03) {
				grid[y]![x] = '+'; // vanishing point
				continue;
			}
			const depth = Math.log2(1 / d);
			const frac = depth - Math.floor(depth);
			if (frac < 0.16) grid[y]![x] = Math.abs(dx) > Math.abs(dy) ? '|' : '-';
		}
	}
	const specks = Math.floor(cols * rows * 0.04);
	for (let i = 0; i < specks; i++) {
		const x = Math.floor(rng() * cols);
		const y = Math.floor(rng() * rows);
		if (grid[y]![x] === ' ') grid[y]![x] = rng() < 0.5 ? '.' : '+';
	}
	return grid.map((r) => r.join(''));
}

// Value-noise field mapped to a density ramp — soft, organic, "anomalous field" texture.
function flow(rng: Rng, cols: number, rows: number): string[] {
	const ramp = ' .:-=+*#%@';
	const gw = 6;
	const gh = 4;
	const angles: number[] = [];
	for (let i = 0; i < (gw + 1) * (gh + 1); i++) angles.push(rng() * Math.PI * 2);
	const at = (ix: number, iy: number): number =>
		Math.sin(angles[(iy * (gw + 1) + ix) % angles.length]!);
	const out: string[] = [];
	for (let y = 0; y < rows; y++) {
		let s = '';
		for (let x = 0; x < cols; x++) {
			const fx = (x / cols) * gw;
			const fy = (y / rows) * gh;
			const ix = Math.floor(fx);
			const iy = Math.floor(fy);
			const tx = smooth(fx - ix);
			const ty = smooth(fy - iy);
			const vx0 = at(ix, iy) + (at(ix + 1, iy) - at(ix, iy)) * tx;
			const vx1 = at(ix, iy + 1) + (at(ix + 1, iy + 1) - at(ix, iy + 1)) * tx;
			const v = vx0 + (vx1 - vx0) * ty; // -1..1
			const idx = Math.floor((v * 0.5 + 0.5) * (ramp.length - 1e-6));
			s += ramp[Math.max(0, Math.min(ramp.length - 1, idx))];
		}
		out.push(s);
	}
	return out;
}

// XOR interference lattice — crisp, geometric, "contained/ordered" texture.
function grid(rng: Rng, cols: number, rows: number): string[] {
	const ramp = ' .:-=+*#%@';
	const kx = 1 + Math.floor(rng() * 4);
	const ky = 1 + Math.floor(rng() * 4);
	const phase = Math.floor(rng() * 8);
	const out: string[] = [];
	for (let y = 0; y < rows; y++) {
		let s = '';
		for (let x = 0; x < cols; x++) {
			const v = (((x * kx) ^ (y * ky)) + phase) >>> 0;
			s += ramp[v % ramp.length];
		}
		out.push(s);
	}
	return out;
}

const FAMILIES: Record<Family, (rng: Rng, cols: number, rows: number) => string[]> = {
	corridor,
	flow,
	grid
};

// Light glyphs that are allowed to show through as the faint background field outside the
// silhouette; anything denser is dropped to a space so the shape reads clearly.
const FAINT = new Set([' ', '.', ':', "'", '`', ',', '-']);

/**
 * Compose a silhouette mask (foreground) over a slug-seeded procedural texture (faint
 * background): shape cells keep the mask glyph; outside the shape only light procedural
 * glyphs survive. Pure and deterministic; base is padded/cropped to cols×rows.
 */
export function composeSilhouette(base: string[], opts: CoverArtOptions): string[] {
	const { cols, rows } = opts;
	const bg = coverArt({ ...opts, silhouette: null });
	const out: string[] = [];
	for (let y = 0; y < rows; y++) {
		const b = base[y] ?? '';
		const g = bg[y] ?? '';
		let row = '';
		for (let x = 0; x < cols; x++) {
			const bc = b[x] ?? ' ';
			if (bc !== ' ') row += bc;
			else {
				const gc = g[x] ?? ' ';
				row += FAINT.has(gc) ? gc : ' ';
			}
		}
		out.push(row);
	}
	return out;
}

export function coverArt(opts: CoverArtOptions): string[] {
	const { seed, objectClass, series, cols, rows, silhouette } = opts;
	if (silhouette && silhouette.length) return composeSilhouette(silhouette, opts);
	const base = typeof seed === 'number' ? seed >>> 0 : hashString(seed);
	// Fold the series into the seed so different series render differently.
	const rng = mulberry32((base ^ Math.imul((series ?? 0) + 1, 0x9e3779b1)) >>> 0);

	const cls = objectClass?.toLowerCase();
	const mapped = cls ? FAMILY_BY_CLASS[cls] : undefined;
	const family: Family = mapped ?? (['corridor', 'flow', 'grid'] as const)[base % 3]!;

	return FAMILIES[family](rng, cols, rows);
}
