import { expect, test } from '@playwright/test';
import { open } from './helpers';
test.beforeEach(({}, info) => test.skip(info.project.name !== 'pilot', 'state-independent'));

test('the switch sets, persists and mirrors aria-pressed; Off hides canvas, tube and OSD', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Off' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-atmosphere', 'off');
  await expect(page.getByRole('button', { name: 'Off' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('canvas.field')).toBeHidden();
  await expect(page.locator('.osd')).toBeHidden();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-atmosphere', 'off');
});
test('prefers-reduced-motion forces reduced when nothing is stored', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-atmosphere', 'reduced');
});
test('throwing storage: the page and the switch still work (Review Focus 1)', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    const deny = () => { throw new DOMException('denied', 'SecurityError'); };
    Object.defineProperty(window, 'localStorage', { get: deny }); Object.defineProperty(window, 'sessionStorage', { get: deny });
  });
  await page.goto('/');
  await expect(page.locator('#hero-h1')).toBeVisible();
  await page.getByRole('button', { name: 'Reduced' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-atmosphere', 'reduced');
  expect(errors).toEqual([]);
});
test('plain sections carry no mask anywhere up their ancestry', async ({ page }) => {
  await open(page);
  for (const sel of ['#pricing', '#licensing', '.faq__a', '.summary', '.foot__disc', '.foot__attr']) {
    const masked = await page.locator(sel).first().evaluate((el) => { for (let n: Element | null = el; n; n = n.parentElement) { const m = getComputedStyle(n).maskImage; if (m && m !== 'none') return true; } return false; });
    expect(masked, sel).toBe(false);
  }
});
test('phone width: the fixed OSD never sits over copy, at rest or mid-descent (Task 20 review)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, { level: 'full' });
  for (const f of [0, 0.25, 0.5, 0.75, 1]) {
    await page.evaluate((x) => scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * x), f);
    const over = await page.locator('.osd').evaluate((osd) => {
      const r = osd.getBoundingClientRect();
      if (getComputedStyle(osd).display === 'none' || r.width === 0) return [];
      const hits: string[] = [];
      for (const el of document.querySelectorAll('main p, main h1, main h2, main h3, main li, main label, main a, main button, footer p, footer a')) {
        for (const q of el.getClientRects()) if (q.right > r.left && q.left < r.right && q.bottom > r.top && q.top < r.bottom) hits.push(el.textContent!.trim().slice(0, 40));
      }
      return hits;
    });
    expect(over, `d=${f}`).toEqual([]);
  }
});
