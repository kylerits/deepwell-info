import { expect, test } from '@playwright/test';

test.beforeEach(({}, info) => test.skip(info.project.name !== 'pilot', 'state-independent; run once'));

test('WebGL field mounts at full, with no console errors', async ({ page }) => {
  const errors: string[] = []; page.on('console', (m) => m.type() === 'error' && errors.push(m.text())); page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-field', 'webgl');
  expect(errors).toEqual([]);
});
test('no WebGL2 → static field, page intact, no errors (Review Focus 2)', async ({ page }) => {
  const errors: string[] = []; page.on('console', (m) => m.type() === 'error' && errors.push(m.text())); page.on('pageerror', (e) => errors.push(e.message));
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

const noWebGL2 = () => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, t: string, ...a: unknown[]) { return t === 'webgl2' ? null : (g as any).call(this, t, ...a); } as any; };
const at = async (page: import('@playwright/test').Page, f: number) => {
  await page.evaluate((x) => scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * x), f);
  await page.waitForTimeout(300);
  // Headless Chromium can report a stale computed transform for a scroll-driven animation until a
  // frame is produced; wait two frames so the sample reflects the scroll position.
  return page.evaluate(async () => { await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); return {
    pos: getComputedStyle(document.querySelector('.field-static')!).position,
    ty: new DOMMatrix(getComputedStyle(document.querySelector('.volumes--page')!).transform).m42,
    shaft: Number(getComputedStyle(document.querySelector('.field-static .shaft')!).opacity),
  }; });
};

test('static field: fixed; volumes drift up 800px over the page; shafts fade out by 15%', async ({ page }) => {
  await page.addInitScript(noWebGL2);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-field', 'static');
  const top = await at(page, 0);
  expect(top).toEqual({ pos: 'fixed', ty: 0, shaft: expect.closeTo(0.14, 2) });
  const mid = await at(page, 0.5);
  expect(mid.ty).toBeCloseTo(-400, -1); // within ±5px
  expect(mid.shaft).toBe(0);
  expect((await at(page, 1)).ty).toBeCloseTo(-800, -1);
});
test('static field holds still when reduced, off or held (Review Focus 5)', async ({ page }) => {
  await page.addInitScript(noWebGL2);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect((await at(page, 0.5)).ty).toBe(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: 'Reduced' }).click();
  expect((await at(page, 0.5)).ty).toBe(0);
  await page.getByRole('button', { name: 'Full' }).click();
  await page.evaluate(() => document.documentElement.setAttribute('data-atmosphere-held', ''));
  expect((await at(page, 0.5)).ty).toBe(0);
});
