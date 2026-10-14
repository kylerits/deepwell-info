import { expect, test, type Page } from '@playwright/test';
import { open, scrollToFraction } from './helpers';
test.beforeEach(({}, info) => test.skip(info.project.name !== 'pilot', 'state-independent'));
/** The switch is server-rendered; it works once its island has hydrated (Astro drops `ssr` then). */
const hydrated = (page: Page, variant: string) => expect(page.locator(`astro-island:has(.atmo--${variant})`)).not.toHaveAttribute('ssr', /.*/);

test('the switch sets, persists and mirrors aria-pressed; Off hides canvas, tube and OSD', async ({ page }) => {
  await open(page);
  await hydrated(page, 'rail');
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
  await hydrated(page, 'rail');
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
test('desktop: the switch rides the left-gutter rail, in reach mid-page, and survives Off', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, { level: 'full' });
  await expect(page.locator('.atmo--top')).toBeHidden();
  await expect(page.locator('.atmo--foot')).toBeHidden();
  await scrollToFraction(page, 0.5);
  const rail = page.locator('.atmo--rail');
  await expect(rail).toBeVisible();
  await hydrated(page, 'rail');
  await rail.getByRole('button', { name: 'Off' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-atmosphere', 'off');
  await expect(page.locator('.osd')).toBeHidden();
  await expect(rail).toBeVisible(); // the way back
  await rail.getByRole('button', { name: 'Full' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-atmosphere', 'full');
  await expect(page.locator('.osd')).toBeVisible();
});
test('phone: the switch sits in the hero top row and the footer, and the two stay in step', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, { level: 'full' });
  await expect(page.locator('.rail')).toBeHidden();
  const top = page.locator('.atmo--top'), foot = page.locator('.atmo--foot');
  await expect(top).toBeVisible();
  await hydrated(page, 'top'); await hydrated(page, 'foot');
  await top.getByRole('button', { name: 'Reduced' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-atmosphere', 'reduced');
  await expect(foot.getByRole('button', { name: 'Reduced' })).toHaveAttribute('aria-pressed', 'true');
  await expect(foot.getByRole('button', { name: 'Full' })).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
