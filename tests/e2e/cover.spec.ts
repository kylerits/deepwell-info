import { expect, test } from '@playwright/test';
import { open } from './helpers';
import pool from '../../src/data/cover-pool.json' with { type: 'json' };

for (const e of pool.entries) test(`cover ${e.slug}: links, legibility, no overflow at 320px (Review Focus 4)`, async ({ page }, info) => {
  test.skip(info.project.name !== 'pilot', 'state-independent');
  await page.setViewportSize({ width: 320, height: 760 });
  await open(page, { cover: e.slug });
  const slot = page.locator(`.cover-slot[data-slug="${e.slug}"]`);
  await expect(slot).toBeVisible();
  await expect(slot.locator('a.cover__read')).toHaveAttribute('href', `https://app.readdeepwell.com/read/${e.slug}`);
  await expect(slot.locator('.cover__attr a')).toHaveAttribute('href', e.url);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const attr = slot.locator('.cover__attr');
  await attr.scrollIntoViewIfNeeded();
  const top = await attr.evaluate((el) => { const r = el.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + 4, r.top + r.height / 2); return !!hit && el.contains(hit); });
  expect(top, 'attribution is never under the tube or another layer').toBe(true);
  const masked = await attr.evaluate((el) => { for (let n: Element | null = el; n; n = n.parentElement) { const m = getComputedStyle(n).maskImage; if (m && m !== 'none') return true; } return false; });
  expect(masked).toBe(false);
});
