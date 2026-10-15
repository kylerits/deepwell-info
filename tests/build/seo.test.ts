import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { FAQ } from '../../src/data/faq';

const SITE = 'https://readdeepwell.com';
const meta = (html: string, key: string) =>
  html.match(new RegExp(`<meta\\s+(?:property|name)="${key.replace(/:/g, '\\:')}"\\s+content="([^"]*)"`))?.[1];
const UTILITY = ['404.html', 'offline/index.html', 'waitlist/confirmed/index.html', 'waitlist/error/index.html'];

for (const out of ['dist-pilot', 'dist-public']) {
  describe(`${out}: search and share previews`, () => {
    const index = readFileSync(join(out, 'index.html'), 'utf8');

    test('share image is an absolute, existing JPEG small enough for WhatsApp', () => {
      const img = meta(index, 'og:image')!;
      expect(img).toMatch(new RegExp(`^${SITE}/og/[\\w-]+\\.jpg(\\?v=\\d+)?$`));
      expect(meta(index, 'twitter:image')).toBe(img);
      const file = join(out, new URL(img).pathname);
      expect(existsSync(file), file).toBe(true);
      expect(statSync(file).size).toBeLessThan(300 * 1024);
      expect(meta(index, 'og:image:width')).toBe('1200');
      expect(meta(index, 'og:image:height')).toBe('630');
      expect(meta(index, 'og:image:alt')).toMatch(/ · SCP Wiki · CC BY-SA 3\.0$/);
    });

    test('large card, site name, and icons', () => {
      expect(meta(index, 'twitter:card')).toBe('summary_large_image');
      expect(meta(index, 'og:site_name')).toBe('Deepwell');
      expect(meta(index, 'og:url')).toBe(`${SITE}/`);
      expect(index).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon.png">');
      expect(existsSync(join(out, 'apple-touch-icon.png'))).toBe(true);
      expect(existsSync(join(out, 'icon-512.png'))).toBe(true);
    });

    test('JSON-LD parses and its FAQ matches the rendered FAQ', () => {
      const raw = index.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
      expect(raw).toBeTruthy();
      const graph = JSON.parse(raw!)['@graph'] as { '@type': string; mainEntity?: { name: string }[] }[];
      expect(graph.map((n) => n['@type'])).toEqual(['WebSite', 'Organization', 'WebApplication', 'FAQPage']);
      const faq = graph.find((n) => n['@type'] === 'FAQPage')!;
      expect(faq.mainEntity!.map((q) => q.name)).toEqual(FAQ.map((f) => f.q));
      const rendered = [...index.matchAll(/<h3 class="faq__q"[^>]*>([^<]+)<\/h3>/g)].map((m) => m[1]);
      expect(rendered).toEqual(FAQ.map((f) => f.q));
    });

    test('utility pages are noindex; the landing page is not', () => {
      expect(index).not.toContain('name="robots"');
      for (const p of UTILITY) expect(readFileSync(join(out, p), 'utf8'), p).toContain('<meta name="robots" content="noindex">');
    });

    test('robots.txt points at a sitemap of indexable pages only', () => {
      expect(readFileSync(join(out, 'robots.txt'), 'utf8')).toContain(`Sitemap: ${SITE}/sitemap.xml`);
      const locs = [...readFileSync(join(out, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
      expect(locs).toEqual([`${SITE}/`]);
    });

    test('the share-card render route never ships', () => {
      expect(existsSync(join(out, 'og'))).toBe(true); // the image folder
      expect(existsSync(join(out, 'og', 'scp-173'))).toBe(false);
    });
  });
}
