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
  await page.waitForTimeout(1500); // Module 02's arrival pulse restores its mark after data-scene-done is set
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
  // Scenes scrub with scroll: at the top the far ones sit at their start frame, so compare back at the bottom.
  await page.keyboard.press('End');
  await page.waitForTimeout(3000);
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

test('smooth scroll runs at full on desktop only', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  await expect(page.locator('html')).toHaveClass(/\blenis\b/);
  for (const [level, width] of [['reduced', 1440], ['off', 1440], ['full', 390]] as const) {
    await page.setViewportSize({ width, height: 900 });
    await open(page, { level });
    await page.waitForTimeout(500);
    await expect(page.locator('html')).not.toHaveClass(/\blenis\b/);
  }
});
test('the wheel glides: Lenis takes the wheel from the browser, then scroll arrives', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  // Structural, not wall-clock (headless here renders a few frames a second): Lenis listens on window from startup,
  // so by the time this later window listener runs it has already cancelled the native wheel scroll. A native
  // wheel is not cancelled, and the browser would scroll itself.
  await page.evaluate(() => {
    const w = window as unknown as { __wheelTaken: boolean[] };
    w.__wheelTaken = [];
    addEventListener('wheel', (e) => { w.__wheelTaken.push(e.defaultPrevented); }, { passive: true });
  });
  await page.mouse.move(700, 450);
  await page.mouse.wheel(0, 600);
  await expect.poll(() => page.evaluate(() => scrollY), { timeout: 20000 }).toBeGreaterThan(550);
  expect(await page.evaluate(() => (window as unknown as { __wheelTaken: boolean[] }).__wheelTaken)).toEqual([true]);
});
test('a hold hands scroll back to the browser, and release restores smoothing', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  await setHidden(page, true);
  await expect(page.locator('html')).not.toHaveClass(/\blenis\b/);
  await setHidden(page, false);
  await expect(page.locator('html')).toHaveClass(/\blenis\b/);
});
/** Click a link in the page and sample scrollY every frame until it has stopped moving for ~0.8 s. */
const glideFrom = (page: Page, link: string) => page.locator(link).evaluate((el) => new Promise<number[]>((res) => {
  const out: number[] = []; let still = 0; const t0 = performance.now();
  (el as HTMLElement).click();
  const f = () => {
    const y = Math.round(scrollY), prev = out.at(-1);
    out.push(y); still = prev === y ? still + 1 : 0;
    if (performance.now() - t0 > 15000 || (still >= 3 && performance.now() - t0 > 800)) res(out); else requestAnimationFrame(f);
  };
  f();
}));
/** The glide is one steady approach: it never jumps to the target and gets pulled back (a native fragment jump). */
const expectGlide = (ys: number[], from: number, to: number) => {
  const dir = Math.sign(to - from), jitter = 2;
  expect(Math.abs(ys[0]! - to)).toBeGreaterThan(Math.abs(from - to) * 0.3);        // not already at the target
  for (let i = 1; i < ys.length; i++) expect((ys[i]! - ys[i - 1]!) * dir).toBeGreaterThanOrEqual(-jitter); // monotone
  expect(ys.some((y) => Math.abs(y - from) > 20 && Math.abs(y - to) > 20)).toBe(true);                   // intermediates
  expect(Math.abs(ys.at(-1)! - to)).toBeLessThan(4);
};
test('anchor links glide to their target (Review Focus 5)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(1500);
  const from = await page.evaluate(() => scrollY);
  const to = await page.locator('#pricing').evaluate((e) => Math.round(e.getBoundingClientRect().top + scrollY));
  expectGlide(await glideFrom(page, '.foot__links a[href="#pricing"]'), from, to);
  expect(Math.abs(await page.locator('#pricing').evaluate((e) => e.getBoundingClientRect().top))).toBeLessThan(4);
  await expect(page.locator('#pricing')).toHaveAttribute('data-scene-done', '');
  expect(new URL(page.url()).hash).toBe('#pricing'); // Back and deep links keep working
});
test('the logo glides back to the top (Review Focus 5)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  await page.evaluate(() => scrollTo(0, 4000));
  await page.waitForTimeout(1500);
  const from = await page.evaluate(() => scrollY);
  expectGlide(await glideFrom(page, '.top__logo'), from, 0);
});

const scrollSectionTo = (page: Page, sel: string, frac: number) => page.evaluate(([s, f]) => {
  const el = document.querySelector(s as string)!; scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * (f as number));
}, [sel, frac] as const);
const styleOf = (page: Page, sel: string) => page.locator(sel).evaluate((e) => { const s = getComputedStyle(e); return { attr: e.getAttribute('style'), filter: s.filter, transform: s.transform, color: s.color }; });

for (const size of [{ width: 1280, height: 720 }, { width: 1440, height: 900 }])
  test(`final CTA: "Go deeper." is in focus at max scroll @${size.width}x${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await open(page);
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(2000);
    const s = await styleOf(page, '.h-deep');
    expect(s).toMatchObject({ attr: null, filter: 'none', transform: 'none' });
  });
test('final CTA: on approach it is far off and out of focus; calm never blurs it', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  await scrollSectionTo(page, '#start', 0.85);
  await page.waitForTimeout(1200);
  const far = await styleOf(page, '.h-deep');
  expect(far.filter).toMatch(/blur/);
  expect(far.transform).not.toBe('none');
  await open(page, { level: 'reduced' });
  await scrollSectionTo(page, '#start', 0.6);
  await page.waitForTimeout(1500);
  expect((await styleOf(page, '.h-deep')).filter).toBe('none');
});
test('module 02: the bar fills with scroll, rests at its shipped width, and runs back', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  const scaleX = () => page.locator('#module-02 .reader__prog i').evaluate((e) => { const m = getComputedStyle(e).transform; return m === 'none' ? 1 : Number(m.slice(7).split(',')[0]); });
  await scrollSectionTo(page, '#module-02', 0.75);
  await page.waitForTimeout(1200);
  const mid = await scaleX();
  expect(mid).toBeGreaterThan(0); expect(mid).toBeLessThan(1);
  await scrollSectionTo(page, '#module-02', 0.1);
  await page.waitForTimeout(2500);
  expect(await page.locator('#module-02 .reader__prog i').getAttribute('style')).toBeNull();
  expect(await page.locator('#module-02 .reader__mark').getAttribute('style')).toBeNull();
  await scrollSectionTo(page, '#module-02', 0.75);
  await page.waitForTimeout(1200);
  expect(await scaleX()).toBeLessThan(1);
});
test('module 02: arriving pulses the \u00b6 14 mark in lamp amber', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  await scrollSectionTo(page, '#module-02', 0.75);
  await page.waitForTimeout(1200);
  await scrollSectionTo(page, '#module-02', 0.2);
  await page.waitForTimeout(450);
  expect((await styleOf(page, '#module-02 .reader__mark')).attr).toMatch(/color/);
});
