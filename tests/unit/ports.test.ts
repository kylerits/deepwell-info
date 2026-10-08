import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

const APP = process.env.DEEPWELL_APP ?? join(homedir(), 'git_local/deepwell');
const W = 'apps/web/src/lib';
const UNCHANGED: [string, string][] = [
  ['src/lib/cover/cover-art.ts', `${W}/reader/cover/cover-art.ts`],
  ['src/lib/cover/theme.ts', `${W}/reader/cover/theme.ts`],
  ['src/lib/cover/article-title.ts', `${W}/article-title.ts`],
];
const body = (s: string) => s.replace(/^\/\/ PORTED from [^\n]*\n\n/, '');

describe.skipIf(!existsSync(APP))('unchanged ports have not drifted from the app', () => {
  for (const [ours, theirs] of UNCHANGED)
    test(ours, () => {
      const local = readFileSync(ours, 'utf8');
      expect(local.startsWith('// PORTED from ')).toBe(true);
      expect(body(local)).toBe(readFileSync(join(APP, theirs), 'utf8'));
    });
  test('silhouette-ascii.json is byte-identical', () => {
    expect(readFileSync('src/lib/cover/silhouette-ascii.json', 'utf8')).toBe(readFileSync(join(APP, W, 'reader/cover/silhouette-ascii.json'), 'utf8'));
  });
});
