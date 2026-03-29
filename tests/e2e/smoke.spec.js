/**
 * Smoke Tests — run on every PR check.
 *
 * Split into two groups:
 * - @ci-safe: No workshop data needed, always pass in CI
 * - @workshop: Need loaded workshops, may timeout in CI — tagged .skip in CI
 */
import { test, expect } from '@playwright/test';

const isCI = !!process.env.CI;

// ---------------------------------------------------------------------------
// 1. App & Homepage (ci-safe)
// ---------------------------------------------------------------------------
test.describe('@smoke App basics', () => {
  test('homepage loads, shows title', async ({ page }) => {
    await page.goto('/');
    await page.locator('#app').waitFor();
    await expect(page).toHaveTitle('Open Learn');
    await expect(page.locator('body')).toHaveClass(/bg-gradient-to-br/);
  });
});

// ---------------------------------------------------------------------------
// 2. Settings (ci-safe — goes directly to /#/settings, no workshop needed)
// ---------------------------------------------------------------------------
test.describe('@smoke Settings', () => {
  test('settings page shows all core toggles', async ({ page }) => {
    await page.goto('/#/settings');
    await page.getByText('Dark Mode').waitFor({ timeout: 15000 });
    await expect(page.getByText('Dark Mode')).toBeVisible();
    await expect(page.getByText('Show Answers')).toBeVisible();
  });

  test('dark mode toggle and persist after reload', async ({ page }) => {
    await page.goto('/#/settings');
    await page.getByText('Dark Mode').waitFor({ timeout: 15000 });

    const html = page.locator('html');
    await expect(html).not.toHaveClass(/dark/);

    const toggle = page.getByRole('switch').first();
    await toggle.click();
    await expect(html).toHaveClass(/dark/);

    await page.reload();
    await page.locator('#app').waitFor();
    await expect(html).toHaveClass(/dark/);

    await page.evaluate(() => localStorage.clear());
  });
});

// ---------------------------------------------------------------------------
// 3. Workshop-dependent tests — skipped in CI (need loaded workshop data)
// ---------------------------------------------------------------------------
const workshopTest = isCI ? test.skip : test;

test.describe('@smoke Navigation flow', () => {
  workshopTest('workshop overview loads with workshop tiles', async ({ page }) => {
    await page.goto('/#/english');
    await expect(page.getByText('Open Learn Guide')).toBeVisible({ timeout: 30000 });
    await expect(page.getByTitle('Change language')).toBeVisible();
  });

  workshopTest('click workshop → lessons overview', async ({ page }) => {
    await page.goto('/#/english');
    await page.getByText('Open Learn Guide').waitFor({ timeout: 30000 });
    await page.getByText('Open Learn Guide').click();

    await expect(page).toHaveURL(/#\/english\/open-learn-guide\/lessons/);
    await expect(page.getByText('Welcome to Open Learn')).toBeVisible({ timeout: 30000 });
  });

  workshopTest('click lesson card → lesson detail with content', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lessons');
    await page.getByText('Welcome to Open Learn').waitFor({ timeout: 30000 });
    await page.getByText('Welcome to Open Learn').click();

    await expect(page).toHaveURL(/#\/english\/open-learn-guide\/lesson\/1/);
    await expect(page.getByText('Where does Open Learn store my progress?')).toBeVisible({ timeout: 15000 });
  });

  workshopTest('navigate back from lesson to overview', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lesson/1');
    await page.locator('header button').first().waitFor({ timeout: 15000 });
    await page.locator('header button').first().click();
    await expect(page).toHaveURL(/#\/english\/open-learn-guide\/lessons/);
  });

  workshopTest('switch language via dropdown', async ({ page }) => {
    await page.goto('/#/english');
    await page.getByText('Open Learn Guide').waitFor({ timeout: 30000 });
    await page.getByTitle('Change language').click();

    await page.locator('.absolute.top-full').getByText('Deutsch').click();
    await expect(page).toHaveURL(/#\/deutsch/);
    await expect(page.getByText('Open Learn Anleitung')).toBeVisible({ timeout: 30000 });

    await page.evaluate(() => localStorage.clear());
  });
});

test.describe('@smoke Learning path', () => {
  workshopTest('mark lesson complete → progress updates', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lessons');
    await page.getByTitle('Mark as completed').first().waitFor({ timeout: 30000 });
    await page.getByTitle('Mark as completed').first().click();
    await expect(page.getByText('1/3')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('33%')).toBeVisible();
    await page.evaluate(() => localStorage.clear());
  });

  workshopTest('toggle favorite → star fills', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lessons');
    await page.getByTitle('Add to favorites').first().waitFor({ timeout: 30000 });
    await page.getByTitle('Add to favorites').first().click();
    await expect(page.getByTitle('Remove from favorites').first()).toBeVisible({ timeout: 5000 });
    await page.evaluate(() => localStorage.clear());
  });

  workshopTest('completed status persists after reload', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lessons');
    await page.getByTitle('Mark as completed').first().waitFor({ timeout: 30000 });
    await page.getByTitle('Mark as completed').first().click();
    await expect(page.getByText('1/3')).toBeVisible({ timeout: 5000 });

    await page.reload();
    await page.getByText('1/3').waitFor({ timeout: 30000 });
    await expect(page.getByText('1/3')).toBeVisible();
    await page.evaluate(() => localStorage.clear());
  });
});

test.describe('@smoke Assessments', () => {
  workshopTest('select assessment validates on click', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lesson/1');
    const radio = page.locator('[role="radio"]').first();
    await radio.waitFor({ timeout: 30000 });
    await radio.click();
    await expect(radio).toHaveAttribute('aria-checked', 'true');
  });

  workshopTest('multiple-choice checkboxes toggle', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lesson/1');
    const checkbox = page.locator('button[role="checkbox"]').first();
    await checkbox.waitFor({ timeout: 30000 });
    await checkbox.click();
    await expect(checkbox).toHaveAttribute('data-state', 'checked');
    await checkbox.click();
    await expect(checkbox).toHaveAttribute('data-state', 'unchecked');
  });
});

test.describe('@smoke Content rendering', () => {
  workshopTest('lesson images load without broken paths', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lesson/1');
    await page.locator('strong').first().waitFor({ timeout: 30000 });
    const images = page.locator('img[src]');
    const count = await images.count();
    if (count > 0) {
      const broken = await images.evaluateAll(imgs =>
        imgs.filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src)
      );
      expect(broken).toEqual([]);
    }
  });

  workshopTest('lesson 2 has video embed', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lesson/2');
    await expect(page.locator('iframe[src*="youtube"]')).toBeVisible({ timeout: 30000 });
  });

  workshopTest('lesson 3 has code blocks', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lesson/3');
    await expect(page.locator('pre code').first()).toBeVisible({ timeout: 30000 });
  });
});
