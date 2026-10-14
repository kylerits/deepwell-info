import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

const SRC = join(homedir(), 'projects/Deepwell/design/brand/logo/logo-dark.svg');
const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
const geometry = (svg: string) => [...svg.matchAll(/<(path|circle|text)\b([^>]*?)\/?>/g)].map((m) => norm(`${m[1]} ${m[2]}`));

describe.skipIf(!existsSync(SRC))('Logo.astro matches logo-dark.svg', () => {
  test('every path, circle and text element is byte-identical in geometry', () => {
    const ours = geometry(readFileSync('src/components/brand/Logo.astro', 'utf8'));
    const theirs = geometry(readFileSync(SRC, 'utf8'));
    expect(ours).toEqual(theirs);
  });
});
