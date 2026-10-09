import type { Page } from '@playwright/test';
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
}
