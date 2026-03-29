/**
 * Smoke Tests — run on every PR check (~1 min test time).
 * Covers critical user flows: navigation, content, interaction, persistence.
 * Tag: @smoke (matched by playwright.config.js grep)
 *
 * Full suite: pnpm test:e2e         (all spec files, manual)
 * Smoke only: pnpm test:e2e:smoke   (this file, CI)
 */
import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// 1. App & Homepage
// ---------------------------------------------------------------------------
test.describe('@smoke App basics', () => {
  test('homepage loads, shows title and workshop link', async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await page.goto('/');
    await page.locator('#app').waitFor();

    await expect(page).toHaveTitle('Open Learn');
    await expect(page.locator('body')).toHaveClass(/bg-gradient-to-br/);

    // "Browse workshops" link should be visible
    const link = page.locator('a[href*="#/"]').first();
    await expect(link).toBeVisible({ timeout: 8000 });
  });
});

// ---------------------------------------------------------------------------
// 2. Navigation flow: Home → Workshops → Lessons → Lesson Detail
// ---------------------------------------------------------------------------
test.describe('@smoke Navigation flow', () => {
  test('workshop overview loads with workshop tiles', async ({ page }) => {
    await page.goto('/#/english');
    // Built-in workshops need time to load in CI (fetches remote YAML)
    await expect(page.getByText('Open Learn Guide')).toBeVisible({ timeout: 15000 });

    await expect(page.getByRole('button', { name: 'Change language' })).toBeVisible();
  });

  test('click workshop → lessons overview with learning path', async ({ page }) => {
    await page.goto('/#/english');
    await page.getByText('Open Learn Guide').waitFor({ timeout: 15000 });
    await page.getByText('Open Learn Guide').click();

    await expect(page).toHaveURL(/#\/english\/open-learn-guide\/lessons/);
    await expect(page.getByText('0/3')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Welcome to Open Learn')).toBeVisible();
    await expect(page.getByText('Continue')).toBeVisible();
  });

  test('click lesson card → lesson detail with content', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lessons');
    await page.getByText('Welcome to Open Learn').waitFor({ timeout: 15000 });
    await page.getByText('Welcome to Open Learn').click();

    await expect(page).toHaveURL(/#\/english\/open-learn-guide\/lesson\/1/);
    await expect(page.locator('strong').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Where does Open Learn store my progress?')).toBeVisible();
  });

  test('navigate back from lesson to overview', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lesson/1');
    await page.locator('header button').first().waitFor({ timeout: 10000 });
    await page.locator('header button').first().click();

    await expect(page).toHaveURL(/#\/english\/open-learn-guide\/lessons/);
  });

  test('switch language via dropdown', async ({ page }) => {
    await page.goto('/#/english');
    await page.getByRole('button', { name: 'Change language' }).waitFor({ timeout: 15000 });
    await page.getByRole('button', { name: 'Change language' }).click();

    await page.locator('.absolute.top-full').getByText('Deutsch').click();
    await expect(page).toHaveURL(/#\/deutsch/);
    await expect(page.getByText('Open Learn Anleitung')).toBeVisible({ timeout: 15000 });

    await page.evaluate(() => localStorage.clear());
  });
});

// ---------------------------------------------------------------------------
// 3. Learning path interactions: mark complete, favorite, persistence
// ---------------------------------------------------------------------------
test.describe('@smoke Learning path', () => {
  test('mark lesson complete → progress updates', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lessons');
    await page.getByTitle('Mark as completed').first().waitFor({ timeout: 15000 });

    await page.getByTitle('Mark as completed').first().click();
    await expect(page.getByText('1/3')).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('33%')).toBeVisible();

    await page.evaluate(() => localStorage.clear());
  });

  test('toggle favorite → star fills', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lessons');
    await page.getByTitle('Add to favorites').first().waitFor({ timeout: 15000 });

    await page.getByTitle('Add to favorites').first().click();
    await expect(page.getByTitle('Remove from favorites').first()).toBeVisible({ timeout: 3000 });

    await page.evaluate(() => localStorage.clear());
  });

  test('completed status persists after reload', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lessons');
    await page.getByTitle('Mark as completed').first().waitFor({ timeout: 15000 });
    await page.getByTitle('Mark as completed').first().click();
    await expect(page.getByText('1/3')).toBeVisible({ timeout: 3000 });

    await page.reload();
    await page.getByText('1/3').waitFor({ timeout: 15000 });
    await expect(page.getByText('1/3')).toBeVisible();

    await page.evaluate(() => localStorage.clear());
  });
});

// ---------------------------------------------------------------------------
// 4. Assessments: select, multiple-choice
// ---------------------------------------------------------------------------
test.describe('@smoke Assessments', () => {
  test('select assessment shows radio buttons and validates on click', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lesson/1');
    const radio = page.locator('[role="radio"]').first();
    await radio.waitFor({ timeout: 15000 });
    await expect(radio).toBeVisible();

    await radio.click();
    await expect(radio).toHaveAttribute('aria-checked', 'true');
  });

  test('multiple-choice checkboxes toggle correctly', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lesson/1');
    const checkbox = page.locator('button[role="checkbox"]').first();
    await checkbox.waitFor({ timeout: 15000 });

    await checkbox.click();
    await expect(checkbox).toHaveAttribute('data-state', 'checked');

    await checkbox.click();
    await expect(checkbox).toHaveAttribute('data-state', 'unchecked');
  });
});

// ---------------------------------------------------------------------------
// 5. Settings: dark mode, persistence
// ---------------------------------------------------------------------------
test.describe('@smoke Settings', () => {
  test('dark mode toggle and persist after reload', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lessons');
    await page.getByRole('button', { name: 'Settings' }).waitFor({ timeout: 15000 });
    await page.getByRole('button', { name: 'Settings' }).click();

    const html = page.locator('html');
    await expect(html).not.toHaveClass(/dark/);

    const toggle = page.getByRole('switch').first();
    await toggle.waitFor({ timeout: 5000 });
    await toggle.click();
    await expect(html).toHaveClass(/dark/);

    // Persist after reload
    await page.reload();
    await page.locator('#app').waitFor();
    await expect(html).toHaveClass(/dark/);

    await page.evaluate(() => localStorage.clear());
  });

  test('settings page shows all core toggles', async ({ page }) => {
    await page.goto('/#/settings');
    await page.getByText('Dark Mode').waitFor({ timeout: 15000 });

    await expect(page.getByText('Dark Mode')).toBeVisible();
    await expect(page.getByText('Show Answers')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 6. Content: images load, video embeds, code blocks
// ---------------------------------------------------------------------------
test.describe('@smoke Content rendering', () => {
  test('lesson images load without broken paths', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lesson/1');
    await page.locator('strong').first().waitFor({ timeout: 15000 });

    const images = page.locator('img[src]');
    const count = await images.count();
    if (count > 0) {
      const broken = await images.evaluateAll(imgs =>
        imgs.filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src)
      );
      expect(broken).toEqual([]);
    }
  });

  test('lesson 2 has video embed', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lesson/2');
    const iframe = page.locator('iframe[src*="youtube"]');
    await expect(iframe).toBeVisible({ timeout: 15000 });
  });

  test('lesson 3 has code blocks', async ({ page }) => {
    await page.goto('/#/english/open-learn-guide/lesson/3');
    const code = page.locator('pre code').first();
    await expect(code).toBeVisible({ timeout: 15000 });
  });
});
