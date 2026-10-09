import { expect, test } from '@playwright/test';
import { open, scrollToFraction } from './helpers';
// State-independent, so pilot only, except coverage: the hero and final CTA differ between states.
test.beforeEach(({}, info) => test.skip(info.project.name !== 'pilot' && !info.title.startsWith('coverage'), 'state-independent'));
// The GPU compositor under SwiftShader re-blurs every smudge per frame, so a screenshot takes 2–30 s;
// the CPU compositor renders the same frame (WebGL and blur intact) in ~0.5 s. Same args as the
// config's chromium project, plus that one.
test.use({ launchOptions: { args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--disable-gpu-compositing'] } });

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

const SURFACES = '.cover, .reader, .tcard__page, .osd';

test('coverage: every visible text node on the glass has a .smudge ancestor (Review Focus 1)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  const bare = await page.evaluate((surfaces) => {
    const out: string[] = [];
    const walk = document.createTreeWalker(document.querySelector('main')!, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const el = n.parentElement!;
      if (!n.textContent!.trim() || el.closest(surfaces) || el.closest('.smudge')) continue;
      if (getComputedStyle(el).visibility === 'hidden') continue;
      const r = document.createRange(); r.selectNodeContents(n);
      if (![...r.getClientRects()].some((q) => q.width > 1 && q.height > 1)) continue; // hidden, or visually-hidden (1px clip)
      out.push(`${el.tagName.toLowerCase()}.${el.className} :: ${n.textContent!.trim().slice(0, 40)}`);
    }
    return out;
  }, SURFACES);
  expect(bare).toEqual([]);
});
test('mechanics: no .smudge creates a stacking context, so every blur sees the glass (Review Focus 2)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  const bad = await page.evaluate(() => [...document.querySelectorAll('.smudge')].map((el) => {
    const s = getComputedStyle(el), b = getComputedStyle(el, '::before');
    const ok = s.position === 'relative' && s.zIndex === 'auto' && s.opacity === '1' && s.filter === 'none'
      && s.isolation === 'auto' && s.transform === 'none' && s.maskImage === 'none'
      && b.zIndex === '-1' && b.backdropFilter === 'blur(10px)' && b.borderStyle === 'none' && b.borderRadius === '0px' && b.boxShadow === 'none';
    return ok ? null : el.className;
  }).filter(Boolean));
  expect(bad).toEqual([]);
  // A backdrop root anywhere from the smudge up to <html> also cuts the blur off from the glass.
  const roots = await page.evaluate(() => [...document.querySelectorAll('.smudge')].flatMap((smudge) => {
    const hits: string[] = [];
    for (let el: Element | null = smudge; el; el = el.parentElement) {
      const s = getComputedStyle(el);
      const ok = s.opacity === '1' && s.filter === 'none' && s.maskImage === 'none' && s.clipPath === 'none'
        && s.backdropFilter === 'none' && s.mixBlendMode === 'normal'
        && !/opacity|filter|mask|clip-path|mix-blend-mode/.test(s.willChange);
      if (!ok) hits.push(`${smudge.className} ← ${el.tagName.toLowerCase()}.${el.className}`);
    }
    return hits;
  }));
  expect(roots).toEqual([]);
});
test('fallbacks: forced colours hide the smudge; more contrast drops the blur and darkens the tint', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  expect(await page.locator('#problem .col').evaluate((el) => getComputedStyle(el, '::before').display)).toBe('none');
  await page.emulateMedia({ forcedColors: 'none', contrast: 'more' });
  const b = await page.locator('#problem .col').evaluate((el) => { const s = getComputedStyle(el, '::before'); return [s.backdropFilter, s.backgroundColor]; });
  expect(b).toEqual(['none', 'rgba(13, 11, 18, 0.92)']);
});
test('the smudge is hidden at level off and at 900px', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, { level: 'off' });
  expect(await page.locator('#problem .col').evaluate((el) => getComputedStyle(el, '::before').display)).toBe('none');
  await page.setViewportSize({ width: 900, height: 900 });
  await open(page);
  expect(await page.locator('#problem .col').evaluate((el) => getComputedStyle(el, '::before').display)).toBe('none');
});

// Spec Testing → Contrast. WCAG relative luminance, ink #EADFC6 composited at alpha over the backdrop.
const lum = (c: number[]) => { const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]!) + 0.7152 * f(c[1]!) + 0.0722 * f(c[2]!); };
const ratio = (bg: number[], a: number) => { const fg = [0xEA, 0xDF, 0xC6].map((c, i) => a * c + (1 - a) * bg[i]!); const [x, y] = [lum(fg), lum(bg)]; return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

test('contrast: text holds its floors over the brightest backdrop in every section', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  await expect(page.locator('html')).toHaveAttribute('data-field', 'webgl');
  await page.addStyleTag({ content: 'html.hide-text main :is(p, h1, h2, h3, li, a, span, strong, label, figcaption, em, sup) { color: transparent !important; text-decoration-color: transparent !important; }' });
  for (const sel of ['#top', '.sec--trust', '#problem', '#module-01', '#module-02', '#module-03', '#themes', '#pricing', '#licensing', '#faq', '#start', 'footer']) {
    await page.evaluate((s) => { const el = document.querySelector(s)!; scrollTo(0, el.getBoundingClientRect().top + scrollY - 120); }, sel);
    await page.waitForTimeout(900);
    const boxes = await page.evaluate(([s, surfaces]) => [...document.querySelector(s)!.querySelectorAll('p, h1, h2, h3, li')]
      .filter((e) => !e.closest(surfaces)).map((e) => e.getBoundingClientRect())
      .filter((r) => r.width > 0 && r.bottom > 0 && r.top < innerHeight)
      .map((r) => [Math.max(0, r.left), Math.max(0, r.top), Math.min(innerWidth, r.right), Math.min(innerHeight, r.bottom)]), [sel, SURFACES] as const);
    await page.evaluate(() => document.documentElement.classList.add('hide-text'));
    const png = (await page.screenshot()).toString('base64');
    await page.evaluate(() => document.documentElement.classList.remove('hide-text'));
    const bg = await page.evaluate(async ([b64, rects]) => {
      const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode();
      const c = new OffscreenCanvas(img.width, img.height); const x = c.getContext('2d')!; x.drawImage(img, 0, 0);
      const k = img.width / innerWidth; const px: [number, number[]][] = [];
      for (const [l, t, r, b] of rects) {
        const d = x.getImageData(l! * k, t! * k, Math.max(1, (r! - l!) * k), Math.max(1, (b! - t!) * k)).data;
        for (let i = 0; i < d.length; i += 4) px.push([0.2126 * d[i]! + 0.7152 * d[i + 1]! + 0.0722 * d[i + 2]!, [d[i]!, d[i + 1]!, d[i + 2]!]]);
      }
      px.sort((a, b) => b[0] - a[0]);
      return px[Math.floor(px.length * 0.005)]![1];
    }, [png, boxes] as const);
    expect(ratio(bg, 0.66), `${sel} body floor over rgb(${bg})`).toBeGreaterThanOrEqual(4.5);
    expect(ratio(bg, 0.54), `${sel} headline floor over rgb(${bg})`).toBeGreaterThanOrEqual(3);
  }
});
