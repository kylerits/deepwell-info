import { expect, test } from '@playwright/test';

test.beforeEach(({}, info) => test.skip(info.project.name !== 'pilot', 'state-independent; run once'));

test('WebGL field mounts at full, with no console errors', async ({ page }) => {
  const errors: string[] = []; page.on('console', (m) => m.type() === 'error' && errors.push(m.text())); page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-field', 'webgl');
  expect(errors).toEqual([]);
});
test('no WebGL2 → static field, page intact, no errors (Review Focus 2)', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, t: string, ...a: unknown[]) { return t === 'webgl2' ? null : (g as any).call(this, t, ...a); } as any; });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-field', 'static');
  await expect(page.locator('.field-static')).toBeVisible();
  await expect(page.locator('#hero-h1')).toBeVisible();
  expect(errors).toEqual([]);
});
test('OSD timecode advances with scroll and stays valid after a resize (Review Focus 5)', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-osd-time]')).toHaveText('00:14:07');
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await expect(page.locator('[data-osd-time]')).toHaveText('00:32:07');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await expect(page.locator('[data-osd-time]')).toHaveText('00:32:07');
  await page.evaluate(() => scrollTo(0, 0));
  await expect(page.locator('[data-osd-time]')).toHaveText('00:14:07');
});
test('presence: once, only deep, only when idle; marked for the session', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight * 0.85));
  await page.clock.runFor(8500);
  await expect(page.locator('html')).toHaveAttribute('data-presence', 'running');
  expect(await page.evaluate(() => sessionStorage.getItem('dw-presence-seen'))).toBe('1');
  await page.clock.runFor(21000);
  await expect(page.locator('html')).toHaveAttribute('data-presence', 'done');
});
