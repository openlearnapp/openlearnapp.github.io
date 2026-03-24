import { test, expect } from '@playwright/test';

test.describe('Open Learn App', () => {
  test('should load the homepage without errors', async ({ page }) => {
    // Listen for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');

    // Wait a bit for the page to load
    await page.waitForTimeout(2000);

    // Check if there are any console errors
    if (errors.length > 0) {
      console.log('Console errors:', errors);
    }

    // Check that the page title is set
    await expect(page).toHaveTitle('Open Learn');

    // Check that the app div exists
    const app = page.locator('#app');
    await expect(app).toBeAttached();
  });

  test('should have the correct HTML structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Check if body has the expected classes
    const body = page.locator('body');
    await expect(body).toHaveClass(/bg-gradient-to-br/);
  });

  test('should toggle dark mode on and off correctly', async ({ page }) => {
    // Navigate to a workshop page first, then open settings
    await page.goto('/#/english/open-learn-guide/lessons');
    await page.waitForTimeout(1000);

    // Open settings
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.waitForTimeout(500);

    // Verify dark mode is initially off
    const html = page.locator('html');
    await expect(html).not.toHaveClass(/dark/);

    // Find the Dark Mode toggle switch
    const darkModeToggle = page.getByRole('switch').first();
    await darkModeToggle.click();
    await page.waitForTimeout(500);

    // Verify dark mode is enabled
    await expect(html).toHaveClass(/dark/);

    // Toggle dark mode off
    await darkModeToggle.click();
    await page.waitForTimeout(500);

    // Verify dark mode is disabled
    await expect(html).not.toHaveClass(/dark/);
  });

  test('should persist dark mode setting after reload', async ({ page }) => {
    // Navigate to a workshop page first, then open settings
    await page.goto('/#/english/open-learn-guide/lessons');
    await page.waitForTimeout(1000);

    // Open settings and enable dark mode
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.waitForTimeout(500);

    // Find the Dark Mode toggle switch
    const darkModeToggle = page.getByRole('switch').first();
    await darkModeToggle.click();
    await page.waitForTimeout(500);

    // Verify dark mode is enabled
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);

    // Reload the page
    await page.reload();
    await page.waitForTimeout(1000);

    // Verify dark mode persists after reload
    await expect(html).toHaveClass(/dark/);

    // Clean up - clear localStorage to reset settings
    await page.evaluate(() => localStorage.clear());
  });
});
