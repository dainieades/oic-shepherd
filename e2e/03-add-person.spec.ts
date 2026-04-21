/**
 * Journey 3 — Add person → appears in list
 *
 * The shepherd opens the add-person form, fills in a name, saves, and the new
 * person is immediately visible in the directory list. Supabase REST calls are
 * intercepted so the app runs on seed data and inserts do not hit the real DB.
 */
import { test, expect } from './fixtures';

test.describe('Add person → appears in list', () => {
  test.beforeEach(async ({ page }) => {
    // Seed-data mode: empty GET responses trigger the seed-data fallback;
    // mutations return success so optimistic state is not rolled back.
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

  test('newly added person appears in the people list', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Bob You')).toBeVisible({ timeout: 10_000 });

    // Open the add-choice sheet via the floating "+" button
    await page.getByRole('button', { name: /add/i }).last().click();
    await expect(page.getByText('Individual')).toBeVisible();
    await page.getByText('Individual').click();

    // Fill in the preferred name (the only required field)
    await page.getByPlaceholder('Preferred name').fill('Grace Testfield');
    await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled();
    await page.getByRole('button', { name: 'Save' }).click();

    // The modal closes after save; the new person should be in the list
    await expect(page.getByText('Grace Testfield')).toBeVisible({ timeout: 5_000 });
  });

  test('save button is disabled until a name is entered', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Bob You')).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /add/i }).last().click();
    await page.getByText('Individual').click();

    await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
    await page.getByPlaceholder('Preferred name').fill('A');
    await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled();
  });
});
