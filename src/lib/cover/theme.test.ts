// PORTED from ~/git_local/deepwell/apps/web/src/lib/reader/cover/theme.test.ts on 2026-10-08 (modified: import paths).

import { expect, test } from 'vitest';
import { coverThemeForTags, COVER_THEMES } from './theme';

test('maps a keyword tag to its silhouette theme', () => {
	expect(coverThemeForTags(['euclid', 'scp', 'humanoid'])).toBe('humanoid');
	expect(coverThemeForTags(['sculpture', 'scp'])).toBe('sculpture');
	expect(coverThemeForTags(['safe', 'scp', 'mechanical'])).toBe('mechanical');
	expect(coverThemeForTags(['keter', 'celestial'])).toBe('celestial');
});

test('falls back to the default theme when no keyword matches', () => {
	expect(coverThemeForTags(['scp'])).toBe('default');
	expect(coverThemeForTags([])).toBe('default');
});

test('resolves by fixed priority when several keywords match', () => {
	// humanoid outranks monster (a sapient hostile reads as a humanoid first)
	expect(coverThemeForTags(['hostile', 'humanoid'])).toBe('humanoid');
});

test('every resolvable theme is a known theme, case-insensitively', () => {
	expect(COVER_THEMES).toContain(coverThemeForTags(['HUMANOID']));
	for (const t of ['sculpture', 'structure', 'celestial', 'document']) {
		expect(COVER_THEMES).toContain(coverThemeForTags([t]));
	}
});
