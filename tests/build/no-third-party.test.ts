import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
// Hosts allowed to appear as *strings* in JS (links the page renders), never as fetched resources.
// svelte.dev: the Svelte 5 runtime embeds error-documentation URLs as strings; they're never fetched.
const JS_ALLOWED = /https?:\/\/(app\.readdeepwell\.com|readdeepwell\.com|scp-wiki\.wikidot\.com|www\.w3\.org|svelte\.dev)/;
const REMOTE = /^(https?:)?\/\//i;

for (const out of ['dist-pilot', 'dist-public']) {
  describe(`${out}: zero third-party requests`, () => {
    const files = walk(out);
    test('HTML loads no remote script, stylesheet, font, image or frame', () => {
      for (const f of files.filter((x) => x.endsWith('.html'))) {
        const html = readFileSync(f, 'utf8');
        const loads = [
          ...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g),
          ...html.matchAll(/<link\b(?![^>]*rel="(?:canonical|alternate)")[^>]*\bhref="([^"]+)"/g),
          ...html.matchAll(/<(?:img|source|iframe|video|audio)\b[^>]*\bsrcs?e?t?="([^"]+)"/g),
        ].map((m) => m[1]!);
        for (const u of loads) expect(u, `${f} loads ${u}`).not.toMatch(REMOTE);
      }
    });
    test('CSS has no remote url() or @import', () => {
      const css = files.filter((x) => x.endsWith('.css')).map((f) => readFileSync(f, 'utf8')).join('\n');
      const html = files.filter((x) => x.endsWith('.html')).map((f) => readFileSync(f, 'utf8')).join('\n');
      for (const m of (css + html).matchAll(/url\(\s*['"]?([^'")]+)/g)) expect(m[1]).not.toMatch(REMOTE);
      expect(css).not.toMatch(/@import\s+(url\()?['"]?https?:/);
    });
    test('JS references no host outside the allow-list', () => {
      for (const f of files.filter((x) => x.endsWith('.js'))) {
        for (const m of readFileSync(f, 'utf8').matchAll(/https?:\/\/[^\s"'`)]+/g)) {
          expect(m[0], `${f}: ${m[0]}`).toMatch(JS_ALLOWED);
        }
      }
    });
  });
}
