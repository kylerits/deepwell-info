import { expect, test } from '@playwright/test';
import { open } from './helpers';
test.beforeEach(({}, info) => test.skip(info.project.name !== 'pilot', 'state-independent'));

// Module 01's chips are the app's typeface setting in miniature: a pick re-sets that card's passage only.
for (const [label, family] of [['Atkinson Hyperlegible', 'Atkinson Hyperlegible'], ['OpenDyslexic', 'OpenDyslexic']] as const)
  test(`picking ${label} re-sets the card's passage, and nothing else`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const fonts: string[] = [];
    page.on('request', (r) => { if (r.resourceType() === 'font') fonts.push(new URL(r.url()).pathname); });
    await open(page);
    const card = page.locator('#module-01 .reader');
    const family0 = (sel: string) => page.locator(sel).evaluate((e) => getComputedStyle(e).fontFamily);
    const h2 = await family0('#module-01 h2');
    const chips = card.getByRole('group', { name: 'Reading typeface' });
    await expect(chips.getByRole('button', { name: 'Literata' })).toHaveAttribute('aria-pressed', 'true');
    await chips.getByRole('button', { name: label }).click();
    await expect(chips.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'true');
    await expect(chips.getByRole('button', { name: 'Literata' })).toHaveAttribute('aria-pressed', 'false');
    expect(await family0('#module-01 .reader__body p')).toMatch(new RegExp(`^"?${family}`));
    expect(await family0('#module-01 .reader__fn')).toMatch(new RegExp(`^"?${family}`));
    await expect(card.locator('[data-font-name]')).toHaveText(label);
    expect(await family0('#module-01 h2')).toBe(h2);
    expect(await family0('#module-02 .reader__para--here p')).not.toMatch(new RegExp(family));
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate((f) => document.fonts.check(`400 16px "${f}"`), family)).toBe(true);
    expect(fonts.some((p) => p.startsWith('/fonts/') && /atkinson|OpenDyslexic/.test(p))).toBe(true);
  });
test('the reading faces are not fetched until a chip asks for them', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const fonts: string[] = [];
  page.on('request', (r) => { if (r.resourceType() === 'font') fonts.push(r.url()); });
  await open(page);
  await page.waitForTimeout(500);
  expect(fonts.filter((u) => /atkinson|OpenDyslexic/.test(u))).toEqual([]);
});
