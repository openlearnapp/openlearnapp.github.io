import { test, expect } from '@playwright/test';

test.describe('Lesson Overview — Learning Path', () => {

  test('should show progress bar with 0 completed', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lessons');
    await page.waitForTimeout(2000);

    // Progress bar should show 0/3 completed
    await expect(page.getByText('0/3')).toBeVisible();
    await expect(page.getByText('0%')).toBeVisible();
  });

  test('should show lessons as learning path nodes', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lessons');
    await page.waitForTimeout(2000);

    // Should show lesson titles
    await expect(page.getByText('Welcome to Open Learn')).toBeVisible();

    // Should show section counts
    await expect(page.getByText(/sections/).first()).toBeVisible();
  });

  test('should highlight first lesson as next', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lessons');
    await page.waitForTimeout(2000);

    // First lesson should have the "Continue" badge
    await expect(page.getByText('Continue')).toBeVisible();
  });

  test('should mark lesson as completed and update progress', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lessons');
    await page.waitForTimeout(2000);

    // Click the completed toggle on the first lesson
    const completeButton = page.getByTitle('Mark as completed').first();
    await completeButton.click();
    await page.waitForTimeout(500);

    // Progress should update to 1/3
    await expect(page.getByText('1/3')).toBeVisible();
    await expect(page.getByText('33%')).toBeVisible();
  });

  test('should toggle favorite on a lesson', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lessons');
    await page.waitForTimeout(2000);

    // Click favorite on a lesson
    const favoriteButton = page.getByTitle('Add to favorites').first();
    await favoriteButton.click();
    await page.waitForTimeout(500);

    // Should now show "Remove from favorites"
    await expect(page.getByTitle('Remove from favorites').first()).toBeVisible();
  });

  test('should persist completed status after reload', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lessons');
    await page.waitForTimeout(2000);

    // Mark first lesson as completed
    const completeButton = page.getByTitle('Mark as completed').first();
    await completeButton.click();
    await page.waitForTimeout(500);

    // Reload
    await page.reload();
    await page.waitForTimeout(2000);

    // Progress should still show 1/3
    await expect(page.getByText('1/3')).toBeVisible();

    // Clean up
    await page.evaluate(() => localStorage.clear());
  });

  test('should navigate to lesson on card click', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lessons');
    await page.waitForTimeout(2000);

    // Click the first lesson card
    await page.getByText('Welcome to Open Learn').click();
    await page.waitForTimeout(1000);

    // Should navigate to lesson detail
    await expect(page).toHaveURL(/#\/english\/open-learn-guide\/lesson\/1/);
  });
});
