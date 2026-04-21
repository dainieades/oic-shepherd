/**
 * Journey 5 — Persona switch → data scope changes
 *
 * The PersonaSwitcherBar is visible in development mode (next dev). Clicking a
 * different persona updates the active context so that the correct todos and
 * people are shown. Verified against the seed data in src/lib/data.ts.
 */
import { test, expect } from './fixtures';

test.describe('Persona switch → data scope changes', () => {
  test.beforeEach(async ({ page }) => {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://nqaoktivshnfdyfxzlyu.supabase.co';

    await page.route(`${supabaseUrl}/rest/v1/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: route.request().method() === 'GET' ? '[]' : '{}',
      });
    });
    await page.route(`${supabaseUrl}/auth/v1/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: null, session: null }),
      });
    });
  });

  test('PersonaSwitcherBar is visible in dev mode with all four personas', async ({ page }) => {
    await page.goto('/');
    // The dev rail renders at the top of the page
    await expect(page.getByText('Admin')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Shepherd 1')).toBeVisible();
    await expect(page.getByText('Shepherd 2')).toBeVisible();
    await expect(page.getByText('Welcome')).toBeVisible();
  });

  test('switching to Shepherd 1 changes the active persona label', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Admin')).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: 'Shepherd 1' }).click();

    // The right-hand label in the dev rail shows the active persona's full name
    await expect(page.getByText('Long Cheng')).toBeVisible({ timeout: 3_000 });
  });

  test('todos page shows shepherd-1 todos after switching to Shepherd 1', async ({ page }) => {
    await page.goto('/todos');
    await expect(page.getByText('Admin')).toBeVisible({ timeout: 10_000 });

    // Switch persona
    await page.getByRole('button', { name: 'Shepherd 1' }).click();

    // A todo that exists only in shepherd-1's seed data
    await expect(
      page.getByText("Follow up with Daini about Jacob's job situation"),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('switching back to Admin restores the original data scope', async ({ page }) => {
    await page.goto('/todos');
    await expect(page.getByText('Admin')).toBeVisible({ timeout: 10_000 });

    // Switch away and then back
    await page.getByRole('button', { name: 'Shepherd 1' }).click();
    await page.getByRole('button', { name: 'Admin' }).click();

    // Admin-specific todo should be back
    await expect(
      page.getByText('Coffee with Tyler — pastoral follow-up'),
    ).toBeVisible({ timeout: 5_000 });
  });
});
