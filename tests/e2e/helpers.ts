import { test, type Browser, type Page } from '@playwright/test';
export async function open(page: Page, o: { level?: 'full' | 'reduced' | 'off'; cover?: string } = {}) {
  await page.addInitScript(({ level, cover, slugs }) => {
    if (level) try { localStorage.setItem('dw-atmosphere', level); } catch {}
    if (cover) { const i = slugs.indexOf(cover); Math.random = () => (i + 0.5) / slugs.length; }
  }, { level: o.level, cover: o.cover, slugs: ['scp-173', 'scp-087', 'scp-096', 'scp-055', 'scp-426', 'scp-914', 'scp-2317', 'scp-3001', 'scp-4999', 'scp-5000'] });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
}
export async function scrollToFraction(page: Page, f: number) {
  await page.evaluate((x) => scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * x), f);
  await page.waitForTimeout(500);
  await settled(page);
}

/** Every section in or above the viewport has finished its entrance (motion-scenes spec). */
export async function settled(page: Page) {
  await page.waitForFunction(() => [...document.querySelectorAll<HTMLElement>('[data-scene]')].every((s) =>
    s.hasAttribute('data-scene-done') || s.getBoundingClientRect().top > innerHeight * 0.8), undefined, { timeout: 15_000 });
}
/** Smudges whose blur is cut off by a backdrop root on themselves or an ancestor (atmosphere-layers spec). */
export async function backdropRoots(page: Page) {
  return page.evaluate(() => [...document.querySelectorAll('.smudge')].flatMap((smudge) => {
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
}
/** Each scene's markup at rest, minus what legitimately differs with JS (islands hydrate, forms enhance). */
export async function restingDom(page: Page) {
  return page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-scene]')].map((s) => {
    const c = s.cloneNode(true) as HTMLElement;
    c.removeAttribute('data-scene-done'); c.removeAttribute('data-pin');
    c.querySelectorAll('astro-island, form').forEach((n) => n.remove());
    return c.outerHTML;
  }));
}
/** The same markup with JavaScript off: the shipped DOM. */
export async function baseline(browser: Browser, size: { width: number; height: number }) {
  // A new context doesn't inherit the project's baseURL, so pass it through.
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: size, baseURL: test.info().project.use.baseURL });
  const p = await ctx.newPage(); await p.goto('/');
  const html = await p.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-scene]')].map((s) => {
    const c = s.cloneNode(true) as HTMLElement;
    c.querySelectorAll('astro-island, form').forEach((n) => n.remove());
    return c.outerHTML;
  }));
  await ctx.close();
  return html;
}
