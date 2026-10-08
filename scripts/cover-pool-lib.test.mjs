import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { EXCLUDED, POOL_SLUGS, buildPool, coverHeaderOf, loadSeed } from './cover-pool-lib.mjs';

test('the ten pool slugs, none excluded', () => {
  expect(POOL_SLUGS).toEqual(['scp-173', 'scp-087', 'scp-096', 'scp-055', 'scp-426', 'scp-914', 'scp-2317', 'scp-3001', 'scp-4999', 'scp-5000']);
  for (const s of Object.keys(EXCLUDED)) expect(POOL_SLUGS).not.toContain(s);
});
test('coverHeaderOf: first ACS bar wins; a leading gate supplies clearance only', () => {
  const acs = { type: 'acs', itemNumber: '1', clearance: 'Level3', containmentClass: 'keter', secondaryClass: 'none', disruptionClass: 'ekhi', riskClass: 'notice' };
  expect(coverHeaderOf({ blocks: [{ type: 'paragraph' }, acs] })).toEqual({
    acs: { clearance: 'Level3', containmentClass: 'keter', secondaryClass: 'none', disruptionClass: 'ekhi', riskClass: 'notice' }, clearance: 'Level3' });
  expect(coverHeaderOf({ blocks: [{ type: 'gate', notice: { clearance: '4' } }] })).toEqual({ acs: null, clearance: '4' });
  expect(coverHeaderOf({ blocks: [{ type: 'paragraph' }] })).toBeNull();
});

const SEED = process.env.DEEPWELL_SEED ?? join(homedir(), 'git_local/deepwell/apps/api/seed.sql');
describe.skipIf(!existsSync(SEED))('against the real seed', () => {
  const pool = buildPool(loadSeed(readFileSync(SEED, 'utf8')));
  test('names, authors and classes match the handoff table', () => {
    const t = Object.fromEntries(pool.map((e) => [e.slug, [e.alternateTitle, e.authors.join(', ')]]));
    expect(t['scp-173']).toEqual(['The Sculpture - The Original', 'Moto42']);
    expect(t['scp-055']).toEqual(['[unknown]', 'CptBellman, qntm']);
    expect(t['scp-096']).toEqual(['The "Shy Guy"', 'Dr Dan']);
    expect(t['scp-4999']).toEqual(['Someone to Watch Over Us', 'CadaverCommander']);
  });
  test('only SCP-4999 carries an ACS panel', () => {
    expect(pool.filter((e) => e.header?.acs).map((e) => e.slug)).toEqual(['scp-4999']);
  });
  test('metadata only: no article text leaks into the pool', () => {
    expect(JSON.stringify(pool)).not.toMatch(/"(doc|blocks|inlines|text)"/);
  });
});
