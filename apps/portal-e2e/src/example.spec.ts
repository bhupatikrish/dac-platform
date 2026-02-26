import { test, expect } from '@playwright/test';

test('Loads the Global Discovery Portal Header', async ({ page }) => {
  // Navigate to root (Landing Page)
  await page.goto('/');

  // Expect the header logo text to be present
  await expect(page.locator('.header-logo')).toContainText('Enterprise Documentation');

  // Expect the theme toggle button to be present
  await expect(page.locator('.theme-toggle')).toContainText('Theme');
});

test('Successfully loads embedded markdown static images from Backend', async ({ page }) => {
  // Navigate directly to the newly authored EKS Architecture page
  await page.goto('/docs/infrastructure/compute/eks/architecture');
  await page.waitForTimeout(2000); // Give Angular time to fetch and paint the markdown JSON

  // Wait for the specific EKS markdown image to be physically injected into the DOM
  const imageElement = page.locator('img[src="http://localhost:3000/api/assets/infrastructure/compute/eks/architecture.png"]');
  await expect(imageElement).toBeVisible();

  // Evaluate the raw image binary loaded successfully (not a broken 404 silhouette)
  const isImageLoaded = await imageElement.evaluate((img: HTMLImageElement) => {
    return img.complete && img.naturalWidth > 0;
  });

  expect(isImageLoaded).toBeTruthy();
});
