// PORTED from ~/git_local/deepwell/apps/web/src/lib/reader/cover/cover-art.test.ts on 2026-10-08 (modified: import paths).

import { expect, test } from 'vitest';
import { coverArt, composeSilhouette, silhouetteForTags } from './cover-art';
import silhouettes from './silhouette-ascii.json';
import { COVER_THEMES } from './theme';

test('is deterministic: identical options produce identical art', () => {
	const a = coverArt({ seed: 'scp-049', objectClass: 'euclid', series: 1, cols: 40, rows: 20 });
	const b = coverArt({ seed: 'scp-049', objectClass: 'euclid', series: 1, cols: 40, rows: 20 });
	expect(a).toEqual(b);
});

test('returns exactly `rows` lines of `cols` characters', () => {
	const g = coverArt({ seed: 'scp-173', cols: 32, rows: 18 });
	expect(g.length).toBe(18);
	for (const line of g) expect(line.length).toBe(32);
});

test('different seeds (slugs) produce different art', () => {
	const a = coverArt({ seed: 'scp-049', objectClass: 'euclid', cols: 40, rows: 20 });
	const b = coverArt({ seed: 'scp-1730', objectClass: 'euclid', cols: 40, rows: 20 });
	expect(a).not.toEqual(b);
});

test('object class selects a distinct pattern family', () => {
	const keter = coverArt({ seed: 'same-seed', objectClass: 'keter', cols: 40, rows: 20 });
	const safe = coverArt({ seed: 'same-seed', objectClass: 'safe', cols: 40, rows: 20 });
	expect(keter).not.toEqual(safe);
});

test('series varies the art for the same article slug and class', () => {
	const s1 = coverArt({ seed: 'scp-049', objectClass: 'euclid', series: 1, cols: 40, rows: 20 });
	const s3 = coverArt({ seed: 'scp-049', objectClass: 'euclid', series: 3, cols: 40, rows: 20 });
	expect(s1).not.toEqual(s3);
});

test('renders only printable ASCII (legible in a monospace grid)', () => {
	const g = coverArt({ seed: 'scp-096', objectClass: 'euclid', series: 1, cols: 40, rows: 20 });
	expect(g.join('')).toMatch(/^[\x20-\x7e]*$/);
});

test('a classless article (tale) still renders a non-empty pattern', () => {
	const g = coverArt({ seed: 'the-hanged-kings-tragedy', cols: 40, rows: 20 });
	expect(g.join('').trim().length).toBeGreaterThan(0);
});

test('a numeric seed is accepted', () => {
	const g = coverArt({ seed: 42, objectClass: 'keter', cols: 24, rows: 12 });
	expect(g.length).toBe(12);
});

test('composeSilhouette overlays the shape over a faint procedural field, keeping dimensions', () => {
	const base = ['          ', '   ####   ', '   ####   ', '   ####   ', '          ', '          '];
	const out = composeSilhouette(base, { seed: 'scp-x', objectClass: 'euclid', series: 1, cols: 10, rows: 6 });
	expect(out.length).toBe(6);
	for (const r of out) expect(r.length).toBe(10);
	expect(out[1]![3]).toBe('#'); // shape foreground preserved
	expect(out[2]![4]).toBe('#');
});

test('composeSilhouette is deterministic per seed', () => {
	const base = ['##', '  '];
	const opts = { objectClass: null, series: null, cols: 2, rows: 2 } as const;
	expect(composeSilhouette(base, { seed: 's', ...opts })).toEqual(
		composeSilhouette(base, { seed: 's', ...opts })
	);
});

test('composeSilhouette pads or crops a mismatched base and stays printable ASCII', () => {
	const out = composeSilhouette(['   ###'], { seed: 'z', objectClass: 'keter', series: 2, cols: 9, rows: 3 });
	expect(out.length).toBe(3);
	for (const r of out) expect(r.length).toBe(9);
	expect(out.join('')).toMatch(/^[\x20-\x7e]*$/);
});

test('the generated silhouette map has a well-formed 48×22 plate for every non-default theme', () => {
	for (const theme of COVER_THEMES) {
		if (theme === 'default') continue;
		const rows = (silhouettes as Record<string, string[] | undefined>)[theme];
		expect(rows, `missing silhouette: ${theme}`).toBeDefined();
		if (!rows) continue;
		expect(rows.length).toBe(22);
		for (const r of rows) expect(r.length).toBe(48);
		expect(rows.join('')).toMatch(/^[\x20-\x7e]*$/);
		expect(rows.join('').trim().length).toBeGreaterThan(0); // not blank
	}
});

test('silhouetteForTags returns a plate for a keyworded article and null for a generic one', () => {
	expect(silhouetteForTags(['euclid', 'humanoid'])).not.toBeNull();
	expect(silhouetteForTags(['scp'])).toBeNull(); // default theme → varied procedural
});

test('coverArt uses the silhouette composite when a base is supplied', () => {
	const base = Array.from({ length: 22 }, () => '#'.repeat(48));
	const withSil = coverArt({ seed: 'scp-049', objectClass: 'euclid', series: 1, cols: 48, rows: 22, silhouette: base });
	const procedural = coverArt({ seed: 'scp-049', objectClass: 'euclid', series: 1, cols: 48, rows: 22 });
	expect(withSil).not.toEqual(procedural);
	expect(withSil.every((r) => r === '#'.repeat(48))).toBe(true); // full-shape base → all foreground
});
