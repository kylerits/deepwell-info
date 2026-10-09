import { expect, test } from '@playwright/test';
import { open } from './helpers';
test.beforeEach(({}, info) => test.skip(info.project.name !== 'pilot', 'pilot only'));

test('success announces the confirmation in place', async ({ page }) => {
  await page.route('**/api/waitlist', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  await open(page);
  await page.locator('#hero-email').fill('agent@example.com');
  await page.getByRole('button', { name: 'Get early access' }).click();
  await expect(page.getByRole('status').first()).toHaveText('Noted. Your name is in the personnel file. We’ll be in touch exactly once, when your access is ready.');
  await expect(page.locator('form.wait').filter({ has: page.locator('#hero-email') })).toBeHidden();
});
test('failure keeps the form and shows the plain error (Review Focus 3)', async ({ page }) => {
  await page.route('**/api/waitlist', (r) => r.fulfill({ status: 429, body: '{}' }));
  await open(page);
  await page.locator('#final-email').fill('agent@example.com');
  await page.getByRole('button', { name: 'Join the waitlist' }).click();
  await expect(page.getByText('That didn’t go through. Please try again in a moment.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Join the waitlist' })).toBeEnabled();
});
