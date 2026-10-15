// Renders the share card (public/og/deepwell-card.jpg) from src/pages/og/[slug].astro, plus the
// PNG icons share previews and JSON-LD use (rasterised from public/favicon.svg, the vendored app icon).
// Usage: pnpm og   (the cover is OG_SLUG in src/lib/seo/index.ts; env OG_SLUG overrides for a trial). Commit the outputs.
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { chromium } from '@playwright/test';

const SLUG = process.env.OG_SLUG ?? readFileSync('src/lib/seo/index.ts', 'utf8').match(/OG_SLUG = '([^']+)'/)[1];
const OUT_DIR = 'dist-og';
const PORT = 4329;
const MAX_BYTES = 300 * 1024; // WhatsApp drops preview images above ~300 KB.

const build = spawnSync('pnpm', ['exec', 'astro', 'build'], { stdio: 'inherit', env: { ...process.env, OG_RENDER: '1', ASTRO_OUT_DIR: OUT_DIR } });
if (build.status !== 0) process.exit(build.status ?? 1);

const server = spawn('node', ['scripts/serve-static.mjs', OUT_DIR, String(PORT)], { stdio: 'inherit' });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  for (let i = 0; ; i++) {
    try { await page.goto(`http://127.0.0.1:${PORT}/og/${SLUG}/`, { waitUntil: 'networkidle' }); break; }
    catch (err) { if (i > 20) throw err; await new Promise((r) => setTimeout(r, 150)); }
  }
  if (!(await page.locator('.og').count())) throw new Error(`no share card for "${SLUG}" — is it in src/data/cover-pool.json?`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'public/og/deepwell-card.jpg', type: 'jpeg', quality: 82 });
  const bytes = statSync('public/og/deepwell-card.jpg').size;
  console.log(`og: public/og/deepwell-card.jpg ${(bytes / 1024).toFixed(0)} KB (${SLUG})`);
  if (bytes > MAX_BYTES) throw new Error(`share card is ${bytes} bytes; keep it under ${MAX_BYTES} for WhatsApp`);

  const svg = readFileSync('public/favicon.svg', 'utf8');
  for (const [file, size] of [['public/apple-touch-icon.png', 180], ['public/icon-512.png', 512]]) {
    const icon = await browser.newPage({ viewport: { width: size, height: size } });
    await icon.setContent(`<style>html,body{margin:0;background:#131019}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
    await icon.screenshot({ path: file, type: 'png' });
    console.log(`og: ${file}`);
  }
} finally {
  await browser.close();
  server.kill();
}
