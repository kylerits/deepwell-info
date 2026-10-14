// PORTED from ~/git_local/deepwell/apps/web/src/lib/render/acs.ts on 2026-10-08 (modified: import from ./classification).
import { objectClassOf } from './classification';

export type ContainmentTone =
	| 'safe'
	| 'euclid'
	| 'keter'
	| 'thaumiel'
	| 'neutralized'
	| 'apollyon'
	| 'neutral';

const TONES: Record<string, ContainmentTone> = {
	safe: 'safe',
	euclid: 'euclid',
	keter: 'keter',
	thaumiel: 'thaumiel',
	neutralized: 'neutralized',
	apollyon: 'apollyon'
};

export function containmentTone(containmentClass: string): ContainmentTone {
	return TONES[containmentClass.trim().toLowerCase()] ?? 'neutral';
}

// Class precedence lives in @deepwell/article-doc (objectClassOf) so the card chip and the
// Archive facet resolve identically. This maps the shared class token to a display label + tone.
export function objectClassLabel(tags: string[]): { label: string; tone: ContainmentTone } | null {
	const cls = objectClassOf(tags);
	return cls ? { label: cls.toUpperCase(), tone: containmentTone(cls) } : null;
}
