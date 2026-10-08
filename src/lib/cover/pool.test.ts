import { expect, test } from 'vitest';
import { COVER_POOL, COVER_SLUGS } from './pool';

test('the committed pool has the ten vetted slugs and wiki URLs', () => {
  expect(COVER_SLUGS).toHaveLength(10);
  for (const e of COVER_POOL) expect(e.url).toBe(`https://scp-wiki.wikidot.com/${e.slug}`);
});
test('no teal-toned class reaches the hero (thaumiel)', () => {
  for (const e of COVER_POOL) expect(e.tags).not.toContain('thaumiel');
});
