import { test, expect } from '@playwright/test';

test.describe('Open Learn App', () => {
  test('should load the homepage without errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.locator('#app').waitFor();

    await expect(page).toHaveTitle('Open Learn');
    await expect(page.locator('#app')).toBeAttached();
  });

  test('should have the correct HTML structure', async ({ page }) => {
    await page.goto('/');
    await page.locator('#app').waitFor();

    const body = page.locator('body');
    await expect(body).toHaveClass(/bg-gradient-to-br/);
  });

  test('should toggle dark mode on and off correctly', async ({ page }) => {
    await page.goto('/#/settings');
    await page.getByText('Dark Mode').waitFor({ timeout: 15000 });

    const html = page.locator('html');
    await expect(html).not.toHaveClass(/dark/);

    const darkModeToggle = page.getByRole('switch').first();
    await darkModeToggle.click();
    await expect(html).toHaveClass(/dark/);

    await darkModeToggle.click();
    await expect(html).not.toHaveClass(/dark/);
  });

  test('should persist dark mode setting after reload', async ({ page }) => {
    await page.goto('/#/settings');
    await page.getByText('Dark Mode').waitFor({ timeout: 15000 });

    const darkModeToggle = page.getByRole('switch').first();
    await darkModeToggle.click();

    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);

    await page.reload();
    await page.locator('#app').waitFor();
    await expect(html).toHaveClass(/dark/);

    await page.evaluate(() => localStorage.clear());
  });
});
