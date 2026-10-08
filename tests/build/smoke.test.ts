import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

for (const out of ['dist-pilot', 'dist-public'])
  test(`${out} emits index.html with the page title`, () => {
    expect(readFileSync(`${out}/index.html`, 'utf8')).toContain('<title>Deepwell — A cozy reader for the SCP Wiki</title>');
  });
