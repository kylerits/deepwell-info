// PORTED from ~/git_local/deepwell/apps/web/src/lib/article-title.test.ts on 2026-10-08 (modified: import paths).

import { describe, it, expect } from 'vitest';
import { articleName, articleEyebrow, quotedName } from './article-title';

describe('articleName', () => {
	it('prefers the series friendly name when present', () => {
		expect(articleName({ title: 'SCP-049', alternateTitle: 'The Plague Doctor' })).toBe(
			'The Plague Doctor'
		);
	});

	it('falls back to the page title when there is no friendly name', () => {
		expect(articleName({ title: 'SCP-055', alternateTitle: null })).toBe('SCP-055');
		expect(articleName({ title: 'SCP-087' })).toBe('SCP-087');
	});

	it('ignores a blank friendly name', () => {
		expect(articleName({ title: 'SCP-096', alternateTitle: '   ' })).toBe('SCP-096');
	});
});

describe('articleEyebrow', () => {
	it('hides the designation when it only repeats the name', () => {
		expect(articleEyebrow('SCP-049', { title: 'SCP-049', alternateTitle: null })).toBeNull();
	});

	it('shows the designation beside a distinct friendly name', () => {
		expect(
			articleEyebrow('SCP-049', { title: 'SCP-049', alternateTitle: 'The Plague Doctor' })
		).toBe('SCP-049');
	});

	it('shows a type designation beside a real title (tales/hubs)', () => {
		expect(articleEyebrow('TALE', { title: 'A Fisherman’s Tale' })).toBe('TALE');
	});
});

it('quotedName nests inner quotes and never double-wraps', () => {
	expect(quotedName({ title: 'SCP-173', alternateTitle: 'The Sculpture' })).toBe('“The Sculpture”');
	expect(quotedName({ title: 'SCP-096', alternateTitle: 'The "Shy Guy"' })).toBe('“The ‘Shy Guy’”');
	expect(quotedName({ title: 'SCP-999', alternateTitle: '"The Tickle Monster"' })).toBe('“The Tickle Monster”');
});
