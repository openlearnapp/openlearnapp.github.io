import { test, expect } from '@playwright/test';

test.describe('Home Page — Redesigned', () => {

  test('should show language dropdown instead of buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Should have a select/combobox for language selection
    const dropdown = page.locator('[role="combobox"]');
    await expect(dropdown).toBeVisible();

    // Should NOT have a "Load Lessons" button
    await expect(page.getByText('Load Lessons')).not.toBeVisible();
    await expect(page.getByText('Lektionen laden')).not.toBeVisible();
  });

  test('should show flag emoji in language dropdown', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Open the language dropdown
    await page.locator('[role="combobox"]').click();
    await page.waitForTimeout(300);

    // Should show flag emojis in dropdown items
    await expect(page.getByText('🇩🇪')).toBeVisible();
    await expect(page.getByText('🇬🇧')).toBeVisible();
  });

  test('should show workshops as clickable tiles after selecting language', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Select English
    await page.locator('[role="combobox"]').click();
    await page.getByText('English', { exact: false }).click();
    await page.waitForTimeout(500);

    // Should show workshop tiles with titles
    await expect(page.getByText('Open Learn Guide')).toBeVisible();
    await expect(page.getByText('Open Learn Feedback')).toBeVisible();
  });

  test('should navigate directly to workshop on tile click (no Load button)', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Select English
    await page.locator('[role="combobox"]').click();
    await page.getByText('English', { exact: false }).click();
    await page.waitForTimeout(500);

    // Click on workshop tile directly
    await page.getByText('Open Learn Guide').click();
    await page.waitForTimeout(1000);

    // Should navigate to lessons overview
    await expect(page).toHaveURL(/#\/english\/open-learn-guide\/lessons/);
  });

  test('should remember language selection on reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Select Deutsch
    await page.locator('[role="combobox"]').click();
    await page.getByText('Deutsch', { exact: false }).click();
    await page.waitForTimeout(500);

    // Reload page
    await page.reload();
    await page.waitForTimeout(1000);

    // Should still show Deutsch workshops
    await expect(page.getByText('Open Learn Anleitung')).toBeVisible();

    // Clean up
    await page.evaluate(() => localStorage.clear());
  });

  test('should show info links after language selection', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Select English
    await page.locator('[role="combobox"]').click();
    await page.getByText('English', { exact: false }).click();
    await page.waitForTimeout(500);

    // Should show Guide, Feedback, and Bug Report links
    await expect(page.getByText('Guide & First Steps')).toBeVisible();
    await expect(page.getByText('Give Feedback')).toBeVisible();
    await expect(page.getByText('Report a Bug')).toBeVisible();
  });
});
