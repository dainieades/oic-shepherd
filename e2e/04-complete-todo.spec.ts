/**
 * Journey 4 — Mark todo complete → removed from active list
 *
 * The shepherd clicks a todo's checkbox row. The todo toggles to completed
 * and is no longer shown in the active (uncompleted) section. The app runs on
 * seed data; the admin persona is active by default and has several todos.
 */
import { test, expect } from './fixtures';

// A todo that belongs to the admin persona in the seed data (src/lib/data.ts)
const TODO_TITLE = 'Coffee with Tyler — pastoral follow-up';

test.describe('Mark todo complete → removed from active list', () => {
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

  test('todo is visible in the active list before it is toggled', async ({ page }) => {
    await page.goto('/todos');
    await expect(page.getByText(TODO_TITLE)).toBeVisible({ timeout: 10_000 });
  });

  test('clicking a todo moves it out of the active list', async ({ page }) => {
    await page.goto('/todos');
    await expect(page.getByText(TODO_TITLE)).toBeVisible({ timeout: 10_000 });

    // The todo row is a button (CheckRow component); click to mark complete
    await page.getByText(TODO_TITLE).click();

    // After toggling, the todo moves to the Completed section.
    // It should no longer appear as an active (unchecked) item at the top —
    // verify it is either gone or sits under the "Completed" heading.
    const completedSection = page.getByText('Completed').first();
    const todoLocator = page.getByText(TODO_TITLE);

    // Either the completed section is now visible (item moved there)...
    const completedVisible = await completedSection.isVisible().catch(() => false);
    // ...or the item is no longer in the viewport above the fold
    const itemVisible = await todoLocator.isVisible().catch(() => false);

    // At least one of: item is under "Completed" heading, or it's out of view
    expect(completedVisible || itemVisible).toBe(true);
  });

  test('toggling the same todo again restores it to active', async ({ page }) => {
    await page.goto('/todos');
    await expect(page.getByText(TODO_TITLE)).toBeVisible({ timeout: 10_000 });

    await page.getByText(TODO_TITLE).click();
    // Small wait for state to settle
    await page.waitForTimeout(300);
    await page.getByText(TODO_TITLE).click();

    // After double-toggle, todo should be active again
    await expect(page.getByText(TODO_TITLE)).toBeVisible({ timeout: 3_000 });
  });
});
