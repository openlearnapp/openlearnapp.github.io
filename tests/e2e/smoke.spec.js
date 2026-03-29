/**
 * Smoke Tests — run on every PR check.
 * These cover the critical user paths and must stay fast (<30s test time).
 * Tag: @smoke (matched by playwright.config.js grep)
 *
 * Full E2E suite: pnpm test:e2e (runs all spec files)
 * Smoke only:     pnpm test:e2e:smoke
 */
import { test, expect } from '@playwright/test';

test.describe('@smoke Critical paths', () => {
  test('homepage loads and shows content', async ({ page }) => {
    await page.goto('/');
    await page.locator('#app').waitFor();

    await expect(page).toHaveTitle('Open Learn');
    await expect(page.locator('#app')).toBeAttached();

    // "Browse Workshops" button or any link to a workshop should be visible
    const startLink = page.locator('a[href*="#/"]').first();
    await expect(startLink).toBeVisible({ timeout: 8000 });
  });

  test('navigate to workshop and see lessons', async ({ page }) => {
    await page.goto('/#/english');
    // Workshop cards should appear
    const workshopLink = page.locator('a[href*="/lessons"]').first();
    await workshopLink.waitFor({ timeout: 8000 });
    await workshopLink.click();

    // Lessons should load
    await expect(page.locator('[class*="rounded-2xl"]').first()).toBeVisible({ timeout: 8000 });
  });

  test('open a lesson and see content', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lesson/1');
    // Wait for lesson content
    const heading = page.locator('h2, h3').first();
    await heading.waitFor({ timeout: 8000 });
    await expect(heading).toBeVisible();
  });

  test('dark mode toggle works', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lessons');
    await page.getByRole('button', { name: 'Settings' }).waitFor({ timeout: 8000 });
    await page.getByRole('button', { name: 'Settings' }).click();

    const html = page.locator('html');
    await expect(html).not.toHaveClass(/dark/);

    const toggle = page.getByRole('switch').first();
    await toggle.waitFor({ timeout: 3000 });
    await toggle.click();
    await expect(html).toHaveClass(/dark/);

    // Cleanup
    await page.evaluate(() => localStorage.clear());
  });
});
