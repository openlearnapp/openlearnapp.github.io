import { test, expect } from '@playwright/test';

test.describe('Open Learn Guide Workshop', () => {

  test('should navigate to English guide and show 3 lessons', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Select English language from dropdown
    await page.locator('[role="combobox"]').click();
    await page.getByText('English', { exact: false }).click();
    await page.waitForTimeout(500);

    // Click on Open Learn Guide workshop tile
    await page.getByText('Open Learn Guide').click();
    await page.waitForTimeout(1000);

    // Should be on lessons overview
    await expect(page).toHaveURL(/#\/english\/open-learn-guide\/lessons/);

    // Should show 3 lesson cards
    const lessons = page.locator('[class*="cursor-pointer"]').filter({ hasText: /Welcome to Open Learn|Using the Platform|Create Your Own Workshop/ });
    await expect(lessons).toHaveCount(3);
  });

  test('should navigate to German guide and show 3 lessons', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Select Deutsch language from dropdown
    await page.locator('[role="combobox"]').click();
    await page.getByText('Deutsch', { exact: false }).click();
    await page.waitForTimeout(500);

    // Click on Open Learn Anleitung workshop tile
    await page.getByText('Open Learn Anleitung').click();
    await page.waitForTimeout(1000);

    // Should be on lessons overview
    await expect(page).toHaveURL(/#\/deutsch\/open-learn-guide\/lessons/);
  });

  test('should open lesson 1 and display markdown content', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lesson/1');
    await page.waitForTimeout(2000);

    // Should display the lesson title
    await expect(page.getByText('Welcome to Open Learn')).toBeVisible();

    // Should render markdown content (bold text)
    await expect(page.locator('strong').filter({ hasText: 'Open Learn' }).first()).toBeVisible();

    // Should show Q&A cards
    await expect(page.getByText('Where does Open Learn store my progress?')).toBeVisible();
  });

  test('should show assessments in lesson 1', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lesson/1');
    await page.waitForTimeout(2000);

    // Should show the select assessment (radio buttons)
    await expect(page.getByText('What do you need to start using Open Learn?')).toBeVisible();

    // Should show multiple-choice assessment (checkboxes)
    await expect(page.getByText('Which of these are actual Open Learn features?')).toBeVisible();
  });

  test('should show video embed in lesson 2', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lesson/2');
    await page.waitForTimeout(2000);

    // Should have a YouTube iframe embed
    const iframe = page.locator('iframe[src*="youtube"]');
    await expect(iframe).toBeVisible();
  });

  test('should show code blocks in lesson 3', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lesson/3');
    await page.waitForTimeout(2000);

    // Should render code blocks (folder structure)
    const codeBlock = page.locator('pre code').first();
    await expect(codeBlock).toBeVisible();

    // Should contain YAML-related content
    await expect(page.getByText('content.yaml')).toBeVisible();
  });
});
