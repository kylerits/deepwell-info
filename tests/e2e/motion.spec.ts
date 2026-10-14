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
    // No native scroll anchoring (Safari has none): placeAnchor() alone must hold the view when the pin adds height.
    document.addEventListener('DOMContentLoaded', () => {
      const st = document.createElement('style'); st.textContent = 'html, body { overflow-anchor: none !important; }'; document.head.append(st);
    });
  });
  await page.goto('/#pricing');
  await expect(page.locator('#pricing')).toHaveAttribute('data-scene-done', '');
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => (window as unknown as { __styled: string[] }).__styled)).toEqual([]);
  // The Themes pin (Task 8) adds 220vh above Pricing once motion starts; placeAnchor() holds the view.
  expect(await page.locator('#themes').evaluate((e) => e.getBoundingClientRect().height / innerHeight)).toBeGreaterThan(3 - 0.01); // the pin really exists
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
  // restingDom strips data-pin, so assert the pin itself is gone (Review Focus 3)
  expect(await page.locator('#themes').getAttribute('data-pin')).toBeNull();
  expect(await page.locator('#themes .pin').evaluate((e) => getComputedStyle(e).position)).not.toBe('sticky');
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
test('keyboard-activated anchors move focus to the target (F3)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(1500);
  await page.locator('.foot__links a[href="#pricing"]').focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2500);
  expect(await page.evaluate(() => document.activeElement?.closest('#pricing') !== null)).toBe(true);
  expect(await page.locator('#pricing').evaluate((e) => getComputedStyle(e).outlineStyle)).toBe('none');
  await page.locator('.top__logo').focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2500);
  expect(await page.evaluate(() => document.activeElement?.closest('#top') !== null)).toBe(true);
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
/** Scroll to fraction `p` of a pinned section's pin range (its top at the screen top → its bottom at the screen bottom). */
const scrollPinTo = (page: Page, sel: string, p: number) => page.evaluate(([s, f]) => {
  const el = document.querySelector<HTMLElement>(s as string)!; const top = el.getBoundingClientRect().top + scrollY;
  scrollTo(0, top + (el.offsetHeight - innerHeight) * (f as number));
}, [sel, p] as const);
const m2 = (page: Page) => page.evaluate(() => {
  const s = document.querySelector<HTMLElement>('#module-02')!; const op = (q: string) => Number(getComputedStyle(s.querySelector(q)!).opacity);
  return { steps: [...s.querySelectorAll('.steps li')].map((l) => Number(getComputedStyle(l).opacity)), saved: op('.fieldcard__saved'), nosig: op('.fieldcard__nosig'), here: op('.reader__para--here'), pinP: s.style.getPropertyValue('--pin-p') };
});
test('module 02: pins and walks Save → Lose signal → Resume, then rests at the shipped DOM', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  const sec = page.locator('#module-02');
  expect(await sec.getAttribute('data-pin')).toBeNull();
  expect(await sec.evaluate((e) => e.getBoundingClientRect().height / innerHeight)).toBeGreaterThan(2.8 - 0.01);
  await scrollPinTo(page, '#module-02', 0.2);
  await page.waitForTimeout(1200);
  expect(Math.round(await page.locator('#module-02 .pin').evaluate((e) => e.getBoundingClientRect().top))).toBe(0);
  let st = await m2(page);
  expect(st.steps[1]).toBeLessThan(0.5); expect(st.steps[2]).toBeLessThan(0.5);
  expect(st.saved).toBeLessThan(0.5); expect(st.nosig).toBeLessThan(0.5); expect(st.here).toBeLessThan(0.5);
  await scrollPinTo(page, '#module-02', 0.55);
  await page.waitForTimeout(1200);
  st = await m2(page);
  expect(st.steps[1]).toBe(1); expect(st.steps[2]).toBeLessThan(0.5);
  expect(st.saved).toBe(1); expect(st.nosig).toBe(1); expect(st.here).toBeLessThan(0.5);
  await scrollPinTo(page, '#module-02', 1.05);
  await page.waitForTimeout(1500);
  st = await m2(page);
  expect(st.steps).toEqual([1, 1, 1]); expect(st.here).toBe(1); expect(st.pinP).toBe('');
  expect(await page.locator('#module-02 .fieldcard [style]:not(.reader__lamp, .reader__edge)').count()).toBe(0);
  expect(await page.locator('#module-02 .steps [style]').count()).toBe(0);
  expect(await backdropRoots(page)).toEqual([]);
});
test('pin progress: the right-gutter rail fills with each pin and shows only while pinned', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  for (const sel of ['#module-02', '#themes']) {
    const seen: number[] = [];
    for (const p of [0.1, 0.4, 0.7, 0.95]) {
      await scrollPinTo(page, sel, p);
      await page.waitForTimeout(900);
      seen.push(Number(await page.locator(sel).evaluate((e) => e.style.getPropertyValue('--pin-p'))));
      await expect(page.locator(`${sel} .pin-rail`)).toBeVisible();
    }
    expect(seen, sel).toEqual([...seen].sort((x, y) => x - y));
    expect(seen[0]!).toBeGreaterThan(0); expect(seen[3]!).toBeLessThan(1);
  }
  await page.setViewportSize({ width: 1440, height: 600 }); // neither pin fits: no rail
  await expect(page.locator('#themes')).toHaveAttribute('data-pin', 'off');
  await expect(page.locator('#module-02 .pin-rail')).toBeHidden();
  await expect(page.locator('#themes .pin-rail')).toBeHidden();
});
test('module 02: arriving pulses the \u00b6 14 mark in lamp amber', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  await scrollPinTo(page, '#module-02', 0.8);
  await page.waitForTimeout(1200);
  // Sample the computed color every frame across the pulse; some frame must be well toward lamp amber
  // (#C98A3B, red 201) from the resting teal (red channel far lower).
  const AMBER = [201, 138, 59];
  const dist = (c: number[]) => Math.hypot(c[0]! - AMBER[0]!, c[1]! - AMBER[1]!, c[2]! - AMBER[2]!);
  const rgb = (c: string) => { const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c); if (!m) throw new Error(`not rgb(): ${c}`); return [+m[1]!, +m[2]!, +m[3]!]; };
  const rest = dist(rgb(await page.locator('#module-02 .reader__mark').evaluate((e) => getComputedStyle(e).color)));
  const best = await page.evaluate(() => new Promise<string>((res) => {
    const mark = document.querySelector('#module-02 .reader__mark')!;
    const AMB = [201, 138, 59];
    const t0 = performance.now(); let min = Infinity; let at = '';
    const tick = () => {
      const c = getComputedStyle(mark).color; const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c);
      if (!m) { res(`not rgb(): ${c}`); return; }
      const d = Math.hypot(+m[1]! - AMB[0]!, +m[2]! - AMB[1]!, +m[3]! - AMB[2]!);
      if (d < min) { min = d; at = c; }
      if (performance.now() - t0 > 1800) res(at); else requestAnimationFrame(tick);
    };
    const s = document.querySelector<HTMLElement>('#module-02')!;
    scrollTo(0, s.getBoundingClientRect().top + scrollY + s.offsetHeight - innerHeight + 40); // past the pin's end
    tick();
  }));
  expect(best, 'computed color must be rgb()').toMatch(/^rgba?\(/);
  expect(dist(rgb(best))).toBeLessThan(rest / 2); // the peak frame is at least halfway home to lamp amber, never toward red
});

const cardLefts = (page: Page) => page.locator('#themes .tcard').evaluateAll((cs) => cs.map((c) => Math.round(c.getBoundingClientRect().left)));

test('themes: pins, changes the lighting with the cards stacked, then deals them into the row', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  const h = await page.locator('#themes').evaluate((e) => e.getBoundingClientRect().height / innerHeight);
  expect(h).toBeGreaterThan(3 - 0.01);
  await page.evaluate(() => { const s = document.querySelector('#themes')!; scrollTo(0, s.getBoundingClientRect().top + scrollY + innerHeight * 0.9); });
  await page.waitForTimeout(1500);
  expect(Math.round(await page.locator('#themes .pin').evaluate((e) => e.getBoundingClientRect().top))).toBe(0);
  const stacked = await cardLefts(page);
  expect(new Set(stacked).size).toBe(1);
  expect(await backdropRoots(page)).toEqual([]);
  await page.evaluate(() => { const s = document.querySelector('#themes')!; scrollTo(0, s.getBoundingClientRect().top + scrollY + innerHeight * 2.4); });
  await page.waitForTimeout(1500);
  expect(new Set(await cardLefts(page)).size).toBe(3);
  expect(await page.locator('#themes .tcard[style]').count()).toBe(0);
});
test('themes: a pin taller than the screen is not pinned (Review Focus 1)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await open(page);
  await expect(page.locator('#themes')).toHaveAttribute('data-pin', 'off');
  const h = await page.locator('#themes').evaluate((e) => e.getBoundingClientRect().height / innerHeight);
  expect(h).toBeLessThan(2);
  expect(new Set(await cardLefts(page)).size).toBe(3); // the row, at rest
  await scrollSectionTo(page, '#themes', 0.5); // the entrance still plays
  await expect(page.locator('#themes')).toHaveAttribute('data-scene-done', '', { timeout: 10_000 });
});
test('themes and module 02: calm and narrow never pin', async ({ page }) => {
  for (const [level, width] of [['reduced', 1440], ['full', 390]] as const) {
    await page.setViewportSize({ width, height: 900 });
    await open(page, { level });
    for (const id of ['#themes', '#module-02']) expect(await page.locator(`${id} .pin`).evaluate((e) => getComputedStyle(e).position)).toBe('static');
  }
});
test('a hold jumps every scrub to rest (final CTA, Module 02, Themes)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  try {
    await scrollSectionTo(page, '#start', 0.85);
    await page.waitForTimeout(1200);
    expect((await styleOf(page, '.h-deep')).filter).toMatch(/blur/);
    await scrollPinTo(page, '#module-02', 0.5);
    await page.waitForTimeout(1200);
    expect(await page.locator('#module-02 .reader__prog i').getAttribute('style')).not.toBeNull();
    await page.evaluate(() => { const s = document.querySelector('#themes')!; scrollTo(0, s.getBoundingClientRect().top + scrollY + innerHeight * 0.9); });
    await page.waitForTimeout(1200);
    expect(await page.locator('#themes .tcard[style]').count()).toBeGreaterThan(0);
    await setHidden(page, true);
    expect(await page.locator('#module-02 .reader__prog i').getAttribute('style')).toBeNull();
    expect(await page.locator('#module-02').getAttribute('style')).toBeNull(); // --pin-p is gone at rest
    expect(await page.locator('#themes .tcard[style], #themes .tcard__label[style]').count()).toBe(0);
    await scrollSectionTo(page, '#start', 0.85);
    await page.waitForTimeout(600);
    expect(await page.locator('.h-deep').getAttribute('style')).toBeNull();
  } finally { await setHidden(page, false); }
});

test('final CTA rests at max scroll at 2x DPR (smoke; the fractional-scroll guard is the unit test in progress.test.ts)', async ({ browser }, info) => {
  const ctx = await browser.newContext({ baseURL: info.project.use.baseURL, viewport: { width: 1440, height: 899 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  try {
    await open(page);
    await page.addStyleTag({ content: 'body { padding-bottom: 0.4px; }' }); // a fractional document height
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(2000);
    const gap = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight - scrollY);
    expect(gap).toBeGreaterThanOrEqual(0); // sanity: we are at the bottom, and may be a fraction short of the rounded max
    expect(await page.locator('.h-deep').getAttribute('style')).toBeNull();
  } finally { await ctx.close(); }
});

test('themes: a resize that keeps the mode re-decides the pin (Review Focus 1)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  const themes = page.locator('#themes');
  expect(await themes.getAttribute('data-pin')).toBeNull();
  await page.setViewportSize({ width: 1440, height: 600 });
  await expect(themes).toHaveAttribute('data-pin', 'off');
  expect(await themes.evaluate((e) => e.getBoundingClientRect().height / innerHeight)).toBeLessThan(2);
  expect(new Set(await cardLefts(page)).size).toBe(3);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(themes).not.toHaveAttribute('data-pin', /.*/);
  expect(await page.locator('#themes .pin').evaluate((e) => getComputedStyle(e).position)).toBe('sticky');
  expect(await themes.evaluate((e) => e.getBoundingClientRect().height / innerHeight)).toBeGreaterThan(3 - 0.01);
});

/** Hold every app chunk for `ms`, so the motion module arrives late (after the 2 s fail-open when ms > 2000). */
const delayChunks = (page: Page, ms: number) => page.route('**/_astro/*.js', async (r) => { await new Promise((res) => setTimeout(res, ms)); await r.continue(); });

test('a motion script that arrives after the 2 s fail-open never blinks the hero out (F1)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    const w = window as unknown as { __dips: string[] };
    w.__dips = [];
    const peak = new WeakMap<Element, number>(); // some shipped copy rests below 1 (.subtitle 0.92): a dip is a drop from what was seen
    const f = () => {
      for (const e of document.querySelectorAll<HTMLElement>('#top .col > :not(h1), #top .col > :not(h1) *, #top .hero__visual > *')) {
        const o = Number(getComputedStyle(e).opacity), p = peak.get(e) ?? 0;
        if (o >= 0.5 && o > p) peak.set(e, o);
        else if (p >= 0.5 && o < p - 0.05) w.__dips.push(`${e.tagName}.${e.className}=${o}`);
      }
      requestAnimationFrame(f);
    };
    requestAnimationFrame(f); // module scripts hold DOMContentLoaded, so start at once
  });
  await delayChunks(page, 2600);
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'full', { timeout: 20_000 });
  await page.waitForTimeout(2500);
  expect(await page.evaluate(() => (window as unknown as { __dips: string[] }).__dips)).toEqual([]);
  await expect(page.locator('#top')).toHaveAttribute('data-scene-done', '');
});

test('focus in the hero before motion starts is never faded in (F2)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await delayChunks(page, 1200); // stays inside the 2 s arm
  await page.goto('/', { waitUntil: 'commit' }); // module scripts hold DOMContentLoaded, so don't wait for it
  const target = page.locator('#top .col input, #top .col a, #top .col button').first();
  await target.waitFor({ state: 'attached' });
  await target.evaluate((el) => (el as HTMLElement).focus());
  expect(await page.locator('html').getAttribute('data-motion')).toBeNull();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'full', { timeout: 20_000 });
  const ops = await target.evaluate((el) => new Promise<number[]>((res) => {
    const out: number[] = []; let n = 0;
    const f = () => { let o = 1; for (let e: Element | null = el; e; e = e.parentElement) o *= Number(getComputedStyle(e).opacity); out.push(o); if (++n < 90) requestAnimationFrame(f); else res(out); };
    f();
  }));
  expect(Math.min(...ops)).toBe(1);
  expect(await target.evaluate((el) => el === document.activeElement)).toBe(true);
});
