import { expect, test } from '@playwright/test';
import { open, scrollToFraction } from './helpers';

// Reading text never sits under an overlay (Task 20 review). Runs in both launch states.

test('phone width: the OSD is hidden', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, { level: 'full' });
  await expect(page.locator('.osd')).toBeHidden();
});

for (const [width, height] of [[1440, 900], [1024, 768]] as const)
  test(`@${width}×${height}: the fixed OSD is shown and never sits over any text, at rest or mid-descent`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await open(page, { level: 'full' });
    const osd = page.locator('.osd');
    await expect(osd).toBeVisible();
    for (const f of [0, 0.25, 0.5, 0.75, 1]) {
      await scrollToFraction(page, f);
      const over = await osd.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const hits: string[] = [];
        const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let n = walk.nextNode(); n; n = walk.nextNode()) {
          if (!n.textContent!.trim() || el.contains(n)) continue;
          const range = document.createRange(); range.selectNodeContents(n);
          for (const q of range.getClientRects())
            if (q.width > 0 && q.right > r.left && q.left < r.right && q.bottom > r.top && q.top < r.bottom) { hits.push(n.textContent!.trim().slice(0, 40)); break; }
        }
        return hits;
      });
      expect(over, `d=${f}`).toEqual([]);
    }
  });
