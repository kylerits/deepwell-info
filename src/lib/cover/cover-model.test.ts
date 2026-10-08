import { expect, test } from 'vitest';
import { coverModel } from './cover-model';
import { COVER_POOL, type PoolEntry } from './pool';

const entry = (o: Partial<PoolEntry>): PoolEntry => ({ slug: 'scp-173', title: 'SCP-173', alternateTitle: 'The Sculpture - The Original', authors: ['Moto42'], url: 'https://scp-wiki.wikidot.com/scp-173', tags: ['euclid', 'sculpture', 'scp'], header: null, ...o });

test('SCP-173: stamp, tone, class/series line, links, attribution (plan Decision 1)', () => {
  const m = coverModel(entry({}));
  expect(m).toMatchObject({
    name: 'The Sculpture - The Original', stamp: 'SCP-173', tone: 'euclid', classLabel: 'EUCLID', seriesLabel: 'I',
    panel: null, readLabel: 'Read SCP-173 in Deepwell', appHref: 'https://app.readdeepwell.com/read/scp-173',
    wikiHref: 'https://scp-wiki.wikidot.com/scp-173', quoted: '“The Sculpture - The Original”',
    attributionTail: ' by Moto42 · SCP Wiki · CC BY-SA 3.0', ariaLabel: 'Cover — The Sculpture - The Original',
  });
});
test('inner straight quotes nest as single quotes', () => {
  expect(coverModel(entry({ slug: 'scp-096', title: 'SCP-096', alternateTitle: 'The "Shy Guy"' })).quoted).toBe('“The ‘Shy Guy’”');
});
test('no friendly name → no stamp; co-authors joined', () => {
  const m = coverModel(entry({ slug: 'scp-055', title: 'SCP-055', alternateTitle: null, authors: ['CptBellman', 'qntm'], tags: ['keter'] }));
  expect(m.stamp).toBeNull(); expect(m.name).toBe('SCP-055'); expect(m.tone).toBe('keter'); expect(m.authors).toBe('CptBellman, qntm');
});
test('SCP-4999 class panel', () => {
  const m = coverModel(entry({ slug: 'scp-4999', title: 'SCP-4999', alternateTitle: 'Someone to Watch Over Us', tags: ['keter'],
    header: { acs: { clearance: 'Level3', containmentClass: 'keter', secondaryClass: 'none', disruptionClass: 'ekhi', riskClass: 'notice' }, clearance: 'Level3' } }));
  expect(m.seriesLabel).toBe('V');
  expect(m.panel).toEqual({ levelLabel: 'Level 3', levelName: 'Confidential', secondary: null, containTone: 'keter',
    disruption: { value: 'ekhi', level: 4, token: 'ekhi' }, risk: { value: 'notice', level: 1, token: 'notice' } });
});
test('every pool entry yields a 48×22 printable-ASCII plate and correct links', () => {
  for (const e of COVER_POOL) {
    const m = coverModel(e);
    const rows = m.art.split('\n');
    expect(rows).toHaveLength(22);
    for (const r of rows) { expect(r).toHaveLength(48); expect(r).toMatch(/^[\x20-\x7e]*$/); }
    expect(m.appHref).toBe(`https://app.readdeepwell.com/read/${e.slug}`);
    expect(m.wikiHref).toBe(`https://scp-wiki.wikidot.com/${e.slug}`);
  }
});
