// PORTED from ~/git_local/deepwell/apps/web/src/lib/reader/cover/theme.ts on 2026-10-08 (unchanged below this header).

// Keyword → silhouette theme, pure and deterministic. The "keywords" are the article's
// Wikidot tags (the same set the cover already reads for object class). Each theme has a
// committed silhouette whose ASCII is composed into the cover art (see cover-art.ts). Order
// is priority: the first theme whose keyword set intersects the tags wins, so a sapient
// hostile reads as a humanoid before a monster.

export const COVER_THEMES = [
	'humanoid',
	'sculpture',
	'structure',
	'celestial',
	'mechanical',
	'biological',
	'document',
	'observation',
	'doorway',
	'artifact',
	'monster',
	'default'
] as const;
export type CoverTheme = (typeof COVER_THEMES)[number];

// [theme, keywords] in priority order. `default` is the terminal fallback (no keywords).
const THEME_KEYWORDS: readonly [CoverTheme, readonly string[]][] = [
	['humanoid', ['humanoid', 'sapient', 'reanimation', 'clockwork-humanoid', 'person']],
	['sculpture', ['sculpture', 'statue', 'the-sculpture']],
	['structure', ['location', 'structure', 'building', 'extradimensional', 'spatial', 'city']],
	['celestial', ['celestial', 'extraterrestrial', 'cosmic', 'planet', 'stellar', 'meteorological']],
	['mechanical', ['mechanical', 'appliance', 'automaton', 'computer', 'electronic', 'vehicle', 'clockwork']],
	['biological', ['biological', 'organism', 'plant', 'fungus', 'insect', 'animal', 'species', 'contagion']],
	['document', ['narrative', 'document', 'metafictional', 'memetic', 'language', 'knowledge', 'text']],
	['observation', ['visual', 'observational', 'photographic', 'ocular', 'auditory']],
	['doorway', ['portal', 'doorway', 'teleportation', 'gateway']],
	['artifact', ['artifact', 'tool', 'artistic', 'jewelry', 'clothing', 'inscription']],
	['monster', ['hostile', 'predatory', 'monster', 'murder-monster', 'aggressive', 'carnivorous']]
];

export function coverThemeForTags(tags: string[]): CoverTheme {
	const set = new Set(tags.map((t) => t.trim().toLowerCase()));
	for (const [theme, keywords] of THEME_KEYWORDS) {
		if (keywords.some((k) => set.has(k))) return theme;
	}
	return 'default';
}
