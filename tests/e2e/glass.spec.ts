import { expect, test } from '@playwright/test';
import { open, scrollToFraction } from './helpers';
test.beforeEach(({}, info) => test.skip(info.project.name !== 'pilot', 'state-independent'));

test('the glass is fixed, unmasked and covers the screen at every scroll position', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  for (const f of [0, 0.37, 0.71, 1]) {
    await scrollToFraction(page, f);
    const g = await page.locator('.tube').evaluate((el) => {
      const s = getComputedStyle(el); const r = el.getBoundingClientRect();
      return { position: s.position, mask: s.maskImage, l: r.left, t: r.top, w: r.width, h: r.height,
        vw: document.documentElement.clientWidth, vh: document.documentElement.clientHeight };
    });
    expect(g).toEqual({ position: 'fixed', mask: 'none', l: 0, t: 0, w: g.vw, h: g.vh, vw: g.vw, vh: g.vh });
  }
});
test('the glass is hidden at 900px and below', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await open(page);
  await expect(page.locator('.tube')).toBeHidden();
});
