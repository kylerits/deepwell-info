import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

const IDS = ['hero', 'trust', 'problem', 'module-01', 'module-02', 'module-03', 'themes', 'pricing', 'licensing', 'faq', 'final-cta', 'footer'];
for (const out of ['dist-pilot', 'dist-public']) {
  const html = readFileSync(`${out}/index.html`, 'utf8');
  test(`${out}: every landing section is a scene, in page order`, () => {
    const roots = [...html.matchAll(/<(section|footer)\b[^>]*>/g)].map((m) => m[0]);
    expect(roots.every((r) => /\bdata-scene="/.test(r)), roots.join('\n')).toBe(true);
    expect(roots.map((r) => /data-scene="([^"]+)"/.exec(r)![1])).toEqual(IDS);
  });
  test(`${out}: the landing page arms motion; utility pages do not`, () => {
    expect(html).toContain('data-motion-arm');
    expect(readFileSync(`${out}/404.html`, 'utf8')).not.toContain('data-motion-arm');
  });
}
