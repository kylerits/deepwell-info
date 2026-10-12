import { expect, test, type Page } from '@playwright/test';
import { backdropRoots, baseline, open, restingDom } from './helpers';
// State-independent: pilot only. Same compositor args as glass.spec (smudge blur under SwiftShader).
test.beforeEach(({}, info) => test.skip(info.project.name !== 'pilot', 'state-independent'));
test.use({ launchOptions: { args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--disable-gpu-compositing'] } });

/** Read the page like a visitor: 60% of a screen at a time, then wait for every entrance to finish. */
async function descend(page: Page) {
  for (let atEnd = false; !atEnd;) {
    atEnd = await page.evaluate(() => { scrollBy(0, Math.round(innerHeight * 0.6)); return scrollY + innerHeight >= document.documentElement.scrollHeight - 2; });
    await page.waitForTimeout(300);
  }
  await expect(page.locator('[data-scene]:not([data-scene-done])')).toHaveCount(0, { timeout: 20_000 });
}

for (const [level, width, mode] of [['full', 1440, 'full'], ['full', 390, 'full-narrow'], ['reduced', 1440, 'calm']] as const)
  test(`${mode} @${width}: every section comes to rest as the shipped DOM`, async ({ page, browser }) => {
    test.setTimeout(240_000);
    const size = { width, height: width === 390 ? 844 : 900 };
    await page.setViewportSize(size);
    await open(page, { level, cover: 'scp-4999' });
    await expect(page.locator('html')).toHaveAttribute('data-motion', mode);
    await descend(page);
    expect(await page.locator('html').getAttribute('data-motion-arm')).toBeNull();
    expect(await page.locator('main .dw-sr').count()).toBe(0);
    expect(await restingDom(page)).toEqual(await baseline(browser, size));
  });

test('off: nothing is hidden and nothing moves', async ({ page, browser }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, { level: 'off', cover: 'scp-4999' });
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'none');
  await expect(page.locator('[data-scene]:not([data-scene-done])')).toHaveCount(0);
  expect(await restingDom(page)).toEqual(await baseline(browser, { width: 1440, height: 900 }));
});

test('a section on screen at load is left alone (deep link)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    (window as unknown as { __styled: string[] }).__styled = [];
    new MutationObserver((ms) => { for (const m of ms) if ((m.target as Element).closest?.('#pricing')) (window as unknown as { __styled: string[] }).__styled.push((m.target as Element).className); })
      .observe(document, { subtree: true, attributes: true, attributeFilter: ['style'] });
  });
  await page.goto('/#pricing');
  await expect(page.locator('#pricing')).toHaveAttribute('data-scene-done', '');
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => (window as unknown as { __styled: string[] }).__styled)).toEqual([]);
  // The Themes pin (Task 8) adds 220vh above Pricing once motion starts; keepPlace() holds the view.
  expect(Math.abs(await page.locator('#pricing').evaluate((e) => e.getBoundingClientRect().top))).toBeLessThan(4);
});

test('mid-entrance, no smudge is cut off from the glass', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  await page.evaluate(() => { const s = document.querySelector('#module-01')!; scrollTo(0, s.getBoundingClientRect().top + scrollY - innerHeight * 0.5); });
  await page.waitForTimeout(350); // inside the entrance
  expect(await page.locator('#module-01').getAttribute('data-scene-done')).toBeNull();
  expect(await backdropRoots(page)).toEqual([]);
});

test('the hero fails open when the motion script never runs', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route('**/_astro/*.js', (r) => r.abort());
  await page.goto('/');
  await page.waitForTimeout(2300);
  expect(await page.locator('html').getAttribute('data-motion-arm')).toBeNull();
  expect(await page.locator('#top .narr').evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
});

test('a fling to the bottom leaves nothing hidden (Review Focus 2)', async ({ page, browser }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, { cover: 'scp-4999' });
  await page.keyboard.press('End');
  await page.waitForTimeout(2500);
  await page.keyboard.press('Home');
  await page.waitForTimeout(1500);
  await expect(page.locator('[data-scene]:not([data-scene-done])')).toHaveCount(0, { timeout: 20_000 });
  expect(await restingDom(page)).toEqual(await baseline(browser, { width: 1440, height: 900 }));
});

test('keyboard focus never lands on hidden text (Review Focus 4)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    const hidden = await page.evaluate(() => {
      for (let e: Element | null = document.activeElement; e && e !== document.body; e = e.parentElement)
        // Shipped CSS dims some links (.foot__links a is 0.86), so "hidden" means motion's inline opacity or near-invisible.
        if (/opacity/.test(e.getAttribute('style') ?? '') || Number(getComputedStyle(e).opacity) < 0.5) return `${e.tagName}.${e.className}`;
      return null;
    });
    expect(hidden).toBeNull();
  }
});

const setHidden = (page: Page, hidden: boolean) => page.evaluate((h) => {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => h });
  document.dispatchEvent(new Event('visibilitychange'));
}, hidden);

test('a hold mid-entrance settles it at once', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  await page.evaluate(() => { const s = document.querySelector('#module-01')!; scrollTo(0, s.getBoundingClientRect().top + scrollY - innerHeight * 0.5); });
  await page.waitForTimeout(300);
  await setHidden(page, true);
  await expect(page.locator('#module-01')).toHaveAttribute('data-scene-done', '');
  expect(await page.locator('#module-01 .narr').getAttribute('style')).toBeNull();
  expect(await page.locator('#module-01 .h2 span').count()).toBe(0); // the word split reverted
  await setHidden(page, false);
});

test('a page already held at load never plays the hero', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    const seen: string[] = [];
    (window as unknown as { __opacities: string[] }).__opacities = seen;
    new MutationObserver((ms) => { for (const m of ms) { const v = (m.target as HTMLElement).style?.opacity; if (v && /^0?\.\d/.test(v) && m.target instanceof Element && m.target.closest('#top')) seen.push(v); } })
      .observe(document, { subtree: true, attributes: true, attributeFilter: ['style'] });
  });
  await page.goto('/');
  await expect(page.locator('#top')).toHaveAttribute('data-scene-done', '', { timeout: 5000 });
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => (window as unknown as { __opacities: string[] }).__opacities)).toEqual([]);
  expect(await page.locator('#top .narr').getAttribute('style')).toBeNull();
});

test('switching to Off mid-page leaves every section visible and at rest', async ({ page, browser }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, { cover: 'scp-4999' });
  await page.evaluate(() => scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * 0.3));
  await page.waitForTimeout(400);
  await page.evaluate(() => { document.documentElement.dataset.atmosphere = 'off'; dispatchEvent(new CustomEvent('dw:atmosphere', { detail: 'off' })); });
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'none');
  await expect(page.locator('[data-scene]:not([data-scene-done])')).toHaveCount(0);
  expect(await restingDom(page)).toEqual(await baseline(browser, { width: 1440, height: 900 }));
});

test('crossing 900px mid-entrance rebuilds without stuck text (Review Focus 3)', async ({ page, browser }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, { cover: 'scp-4999' });
  await page.evaluate(() => { const s = document.querySelector('#module-01')!; scrollTo(0, s.getBoundingClientRect().top + scrollY - innerHeight * 0.5); });
  await page.waitForTimeout(300);
  await page.setViewportSize({ width: 800, height: 900 });
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'full-narrow');
  await descend(page);
  expect(await restingDom(page)).toEqual(await baseline(browser, { width: 800, height: 900 }));
});
