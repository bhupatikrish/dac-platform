import { test, expect } from '@playwright/test';
test('debug network', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  page.on('response', resp => console.log('NETWORK:', resp.status(), resp.url()));
  await page.goto('/');
  await page.waitForTimeout(2000);
});
