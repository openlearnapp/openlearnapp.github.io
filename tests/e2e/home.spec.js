import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {

  test('should show intro content and language buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Should show the tagline
    await expect(page.getByText('Learn anything')).toBeVisible();

    // Should show Deutsch language button and Browse workshops link
    await expect(page.getByText('Deutsch', { exact: false })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse workshops' })).toBeVisible();
  });

  test('should navigate to workshop overview on language click', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Click Browse workshops link
    await page.getByRole('link', { name: 'Browse workshops' }).click();
    await page.waitForTimeout(1000);

    // Should navigate to workshop overview
    await expect(page).toHaveURL(/#\/deutsch/);

    // Should show workshop tiles
    await expect(page.getByText('Open Learn Anleitung')).toBeVisible();

    // Clean up
    await page.evaluate(() => localStorage.clear());
  });
});

test.describe('Workshop Overview', () => {

  test('should show workshops and language dropdown', async ({ page }) => {
    await page.goto('/#/english');
    await page.waitForTimeout(2000);

    // Should show language dropdown in navbar
    const dropdown = page.getByRole('button', { name: 'Change language' });
    await expect(dropdown).toBeVisible();

    // Should show workshop tiles
    await expect(page.getByText('Open Learn Guide')).toBeVisible();
    await expect(page.getByText('Open Learn Feedback')).toBeVisible();
  });

  test('should navigate to lessons on workshop click', async ({ page }) => {
    await page.goto('/#/english');
    await page.waitForTimeout(2000);

    // Click on workshop tile
    await page.getByText('Open Learn Guide').click();
    await page.waitForTimeout(1000);

    // Should navigate to lessons overview
    await expect(page).toHaveURL(/#\/english\/open-learn-guide\/lessons/);
  });

  test('should switch language via dropdown', async ({ page }) => {
    await page.goto('/#/english');
    await page.waitForTimeout(2000);

    // Switch to Deutsch using dropdown
    await page.getByRole('button', { name: 'Change language' }).click();
    await page.waitForTimeout(300);
    const dropdown = page.locator('.absolute.top-full');
    await dropdown.getByText('Deutsch').click();
    await page.waitForTimeout(500);

    // Should navigate to deutsch workshops
    await expect(page).toHaveURL(/#\/deutsch/);
    await expect(page.getByText('Open Learn Anleitung')).toBeVisible();

    // Clean up
    await page.evaluate(() => localStorage.clear());
  });

  test('should show info links', async ({ page }) => {
    await page.goto('/#/english');
    await page.waitForTimeout(2000);

    // Should show footer links
    await expect(page.getByRole('link', { name: 'Guide' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Feedback' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Bug Report' })).toBeVisible();
  });
});
