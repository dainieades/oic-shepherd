/**
 * Journey 2 — Unapproved email → blocked
 *
 * An email that is not in the approved_emails table must be rejected at the
 * sign-in step and the user must never reach the dashboard.
 */
import { test, expect } from './fixtures';

test.describe('Unapproved email → blocked', () => {
  test.beforeEach(async ({ page }) => {
    // Stub /api/check-email to return not-invited for any email
    await page.route('/api/check-email', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'not-invited' }),
      });
    });
  });

  test('shows the invitation-required error when the email is not approved', async ({ page }) => {
    await page.goto('/signin');

    await page.getByLabel('Email address').fill('stranger@example.com');
    await page.getByRole('button', { name: /^continue$/i }).click();

    await expect(
      page.getByText(/access is by invitation only/i),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('does not navigate away from the sign-in page', async ({ page }) => {
    await page.goto('/signin');

    await page.getByLabel('Email address').fill('notinvited@example.com');
    await page.getByRole('button', { name: /^continue$/i }).click();

    await page.waitForTimeout(500);
    expect(page.url()).toContain('/signin');
  });

  test('email field can be corrected after the error', async ({ page }) => {
    await page.goto('/signin');

    await page.getByLabel('Email address').fill('wrong@example.com');
    await page.getByRole('button', { name: /^continue$/i }).click();
    await expect(page.getByText(/access is by invitation only/i)).toBeVisible();

    // Clear the field and try a different email
    await page.getByLabel('Email address').fill('other@example.com');
    await page.getByRole('button', { name: /^continue$/i }).click();

    // Error should show again (both emails are mocked as not-invited)
    await expect(page.getByText(/access is by invitation only/i)).toBeVisible();
  });
});
