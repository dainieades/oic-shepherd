import { test as base, expect, type Page } from '@playwright/test';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://nqaoktivshnfdyfxzlyu.supabase.co';

/**
 * Intercepts all Supabase REST and auth calls so the app falls back to its
 * local seed data (src/lib/data.ts). Mutations return a no-op success so
 * optimistic state updates are not rolled back.
 */
export async function mockSupabase(page: Page) {
  // REST — empty GET triggers the seed-data fallback in context.tsx
  await page.route(`${SUPABASE_URL}/rest/v1/**`, async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      });
    } else {
      // INSERT / UPDATE / DELETE — succeed without returning a row so the
      // optimistic update in context.tsx is kept rather than rolled back.
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{}',
      });
    }
  });

  // Auth — return "no session" so AuthSync doesn't try to sync a user and
  // the app renders purely from seed data.
  await page.route(`${SUPABASE_URL}/auth/v1/**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: null, session: null }),
    });
  });
}

export const test = base.extend<{ mockDb: void }>({
  mockDb: [
    async ({ page }, use) => {
      await mockSupabase(page);
      await use();
    },
    { auto: false },
  ],
});

export { expect };
