// PORTED from ~/git_local/deepwell/apps/web/src/lib/article-title.ts on 2026-10-08 (unchanged below this header).

// Display naming for an article. The stored `title` is the exact Wikidot page title
// (e.g. "SCP-049"); `alternateTitle` is the series friendly name (e.g. "The Plague Doctor").
// Readers want the friendly name as the prominent line, with the designation as a small
// eyebrow — but only when the two actually differ, so a page with no friendly name doesn't
// show "SCP-049" twice.

export interface NamedArticle {
	title: string;
	alternateTitle?: string | null;
}

/** The prominent display name: the friendly name when present, else the page title. */
export function articleName(item: NamedArticle): string {
	const alt = item.alternateTitle?.trim();
	return alt ? alt : item.title;
}

/**
 * The designation eyebrow to show above the name, or `null` when it would merely repeat the
 * name (case-insensitive) — e.g. a file whose only title is its own "SCP-049" designation.
 */
export function articleEyebrow(designation: string, item: NamedArticle): string | null {
	return designation.toUpperCase() === articleName(item).toUpperCase() ? null : designation;
}

/**
 * The name set in running quotation marks (“…”), for attribution lines. A name that already
 * carries straight quotes — The "Shy Guy" — nests them as single quotes (“The ‘Shy Guy’”),
 * and a name wholly wrapped in quotes isn't double-wrapped.
 */
export function quotedName(item: NamedArticle): string {
	let name = articleName(item).trim();
	const wrapped = /^["“](.*)["”]$/.exec(name);
	if (wrapped && !/["“”]/.test(wrapped[1]!)) name = wrapped[1]!;
	name = name.replace(/["“]([^"“”]*)["”]/g, '‘$1’');
	return `“${name}”`;
}
