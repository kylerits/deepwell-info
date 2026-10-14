import { expect, test } from '@playwright/test';
import { open, scrollToFraction } from './helpers';

test('zero third-party requests across a full descent', async ({ page, baseURL }) => {
  const foreign: string[] = [];
  page.on('request', (r) => { if (!r.url().startsWith(baseURL!) && !r.url().startsWith('data:')) foreign.push(r.url()); });
  await open(page);
  for (const f of [0.25, 0.5, 0.75, 1]) await scrollToFraction(page, f);
  expect(foreign).toEqual([]);
});
