import { expect, test } from '@playwright/test';
test.use({ javaScriptEnabled: false });

test('JS off: copy, the CTA and exactly one cover still render', async ({ page }, info) => {
  await page.goto('/');
  await expect(page.locator('#hero-h1')).toBeVisible();
  if (info.project.name === 'pilot') await expect(page.getByRole('button', { name: 'Get early access' })).toBeVisible();
  else await expect(page.getByRole('link', { name: 'Start reading — free' }).first()).toBeVisible();
  const visible = await page.locator('.cover-slot').evaluateAll((els) => els.filter((e) => getComputedStyle(e).display !== 'none').length);
  expect(visible).toBe(1);
  await expect(page.locator('.atmo')).toBeHidden();
  await expect(page.locator('[data-osd-time]')).toHaveText('00:14:07');
});
test('JS off: a failed waitlist post lands on the plain error page with a retry form', async ({ page }, info) => {
  test.skip(info.project.name !== 'pilot', 'pilot only');
  await page.route('**/api/waitlist', (r) => r.fulfill({ status: 303, headers: { Location: '/waitlist/error/' } }));
  await page.goto('/');
  await page.locator('#final-email').fill('agent@example.com');
  await page.getByRole('button', { name: 'Join the waitlist' }).click();
  await expect(page).toHaveURL(/\/waitlist\/error\/$/);
  await expect(page.getByRole('alert')).toHaveText('Your sign-up didn’t go through. Check that your email address is complete and try again below. If it still fails, wait a minute and retry.');
  await expect(page.locator('#retry-email')).toBeVisible();
});
