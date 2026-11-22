import { test, expect } from '@playwright/test';

test.describe('Profile & Settings E2E (Isolated Mock - No DB Alteration)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-jwt-token-12345');
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 'mock-user-1',
          name: 'Alex Mercer',
          email: 'demo@example.com',
          createdAt: new Date().toISOString(),
        })
      );
    });

    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'mock-user-1',
            name: 'Alex Mercer',
            email: 'demo@example.com',
            createdAt: new Date().toISOString(),
          },
        }),
      });
    });

    await page.route('**/api/v1/auth/logout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { message: 'Logged out' } }),
      });
    });
  });

  test('Profile page displays user details and architectural verification badges', async ({ page }) => {
    await page.goto('/profile');

    await expect(page.locator('h1')).toContainText('Alex Mercer');
    await expect(page.getByText('demo@example.com')).toBeVisible();
    await expect(page.getByText('Architecture & Security Verification')).toBeVisible();
    await expect(page.getByText('FastAPI & Google Gemini')).toBeVisible();
    await expect(page.getByText('SQLite + Prisma ORM')).toBeVisible();
    await expect(page.getByText('JWT + bcrypt Hashing')).toBeVisible();
  });

  test('User can sign out from profile page and gets redirected to login', async ({ page }) => {
    await page.goto('/profile');

    await page.getByRole('main').getByRole('button', { name: 'Sign Out' }).click();
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('h2')).toContainText('Welcome back');
  });
});
