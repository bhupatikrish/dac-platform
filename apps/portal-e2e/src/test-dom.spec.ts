import { test } from '@playwright/test';
test('dump dom', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  await page.goto('/');
  await page.waitForTimeout(2000);
  
  console.log("=== BROWSER DOM ===");
  const html = await page.content();
  console.log(html);
  console.log("===================");
});
