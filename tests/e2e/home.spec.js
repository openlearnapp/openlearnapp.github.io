import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {

  test('should show intro content and language buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Should show the tagline
    await expect(page.getByText('Learn anything')).toBeVisible();

    // Should show language buttons
    await expect(page.getByText('Deutsch', { exact: false })).toBeVisible();
    await expect(page.getByText('English', { exact: false })).toBeVisible();

    // Should NOT show navbar (hidden on home page)
    await expect(page.locator('[aria-label="Settings"]')).not.toBeVisible();
  });

  test('should navigate to workshop overview on language click', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Click English language button
    await page.getByText('English', { exact: false }).click();
    await page.waitForTimeout(1000);

    // Should navigate to workshop overview
    await expect(page).toHaveURL(/#\/english\/workshops/);

    // Should show workshop tiles
    await expect(page.getByText('Open Learn Guide')).toBeVisible();

    // Clean up
    await page.evaluate(() => localStorage.clear());
  });
});

test.describe('Workshop Overview', () => {

  test('should show workshops and language dropdown', async ({ page }) => {
    await page.goto('/#/english/workshops');
    await page.waitForTimeout(1000);

    // Should show language dropdown in navbar
    const dropdown = page.locator('[aria-label="Change language"]');
    await expect(dropdown).toBeVisible();

    // Should show workshop tiles
    await expect(page.getByText('Open Learn Guide')).toBeVisible();
    await expect(page.getByText('Open Learn Feedback')).toBeVisible();
  });

  test('should navigate to lessons on workshop click', async ({ page }) => {
    await page.goto('/#/english/workshops');
    await page.waitForTimeout(1000);

    // Click on workshop tile
    await page.getByText('Open Learn Guide').click();
    await page.waitForTimeout(1000);

    // Should navigate to lessons overview
    await expect(page).toHaveURL(/#\/english\/open-learn-guide\/lessons/);
  });

  test('should switch language via dropdown', async ({ page }) => {
    await page.goto('/#/english/workshops');
    await page.waitForTimeout(1000);

    // Switch to Deutsch using precise dropdown selector
    await page.locator('[aria-label="Change language"]').click();
    await page.waitForTimeout(300);
    const dropdown = page.locator('.absolute.top-full');
    await dropdown.getByText('Deutsch').click();
    await page.waitForTimeout(500);

    // Should navigate to deutsch workshops
    await expect(page).toHaveURL(/#\/deutsch\/workshops/);
    await expect(page.getByText('Open Learn Anleitung')).toBeVisible();

    // Clean up
    await page.evaluate(() => localStorage.clear());
  });

  test('should show info links', async ({ page }) => {
    await page.goto('/#/english/workshops');
    await page.waitForTimeout(1000);

    // Should show Guide, Feedback, and Bug Report links
    await expect(page.getByText('Guide & First Steps')).toBeVisible();
    await expect(page.getByText('Give Feedback')).toBeVisible();
    await expect(page.getByText('Report a Bug')).toBeVisible();
  });
});
