import { test, expect } from '@playwright/test';

test.describe('Open Learn App', () => {
  test('should load the homepage without errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.locator('#app').waitFor({ state: 'attached' });

    await expect(page).toHaveTitle('Open Learn');
    await expect(page.locator('#app')).toBeAttached();
  });

  test('should have the correct HTML structure', async ({ page }) => {
    await page.goto('/');
    await page.locator('#app').waitFor({ state: 'attached' });

    const body = page.locator('body');
    await expect(body).toHaveClass(/bg-gradient-to-br/);
  });

  test('should toggle dark mode on and off correctly', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lessons');
    await page.getByRole('button', { name: 'Settings' }).waitFor({ timeout: 10000 });
    await page.getByRole('button', { name: 'Settings' }).click();

    const html = page.locator('html');
    await expect(html).not.toHaveClass(/dark/);

    const darkModeToggle = page.getByRole('switch').first();
    await darkModeToggle.waitFor({ timeout: 5000 });
    await darkModeToggle.click();

    await expect(html).toHaveClass(/dark/);

    await darkModeToggle.click();
    await expect(html).not.toHaveClass(/dark/);
  });

  test('should persist dark mode setting after reload', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lessons');
    await page.getByRole('button', { name: 'Settings' }).waitFor({ timeout: 10000 });
    await page.getByRole('button', { name: 'Settings' }).click();

    const darkModeToggle = page.getByRole('switch').first();
    await darkModeToggle.waitFor({ timeout: 5000 });
    await darkModeToggle.click();

    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);

    await page.reload();
    await page.locator('#app').waitFor({ state: 'attached' });
    await expect(html).toHaveClass(/dark/);

    await page.evaluate(() => localStorage.clear());
  });
});
