import { test, expect } from '@playwright/test';

test.describe('Authentication & Navigation E2E (Isolated Mock - No DB Alteration)', () => {
  test('Landing page loads brand, headline, and call to action', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/AI Content Generator/i);
    await expect(page.locator('h1')).toContainText('Generate, refine, and master written content');
    await expect(page.getByRole('link', { name: 'Start Writing Free' })).toBeVisible();
    await expect(page.getByRole('banner').getByRole('link', { name: 'Sign in' })).toBeVisible();
  });

  test('Shows form validation error when submitting empty login credentials', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('h2')).toContainText('Welcome back');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('User successfully logs in and navigates to Dashboard', async ({ page }) => {
    // Intercept auth API call to keep actual DB 100% unaltered
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: 'mock-user-1',
              name: 'Alex Mercer',
              email: 'demo@example.com',
              createdAt: new Date().toISOString(),
            },
            token: 'mock-jwt-token-12345',
          },
        }),
      });
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

    await page.route('**/api/v1/content?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            items: [
              {
                id: 'doc-1',
                userId: 'mock-user-1',
                title: 'The Future of AI in Education',
                content: 'Full article text...',
                contentType: 'blog',
                tone: 'informative',
                length: 'medium',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
            pagination: { total: 1, page: 1, limit: 5, totalPages: 1 },
          },
        }),
      });
    });

    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill('demo@example.com');
    await page.getByPlaceholder('••••••••').fill('Password123!');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Verify redirection to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1')).toContainText('Welcome back, Alex');
    await expect(page.getByText('The Future of AI in Education')).toBeVisible();
  });

  test('User can register a new account and is redirected to Dashboard', async ({ page }) => {
    await page.route('**/api/v1/auth/register', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: 'mock-new-user',
              name: 'Taylor Swift',
              email: 'taylor@example.com',
              createdAt: new Date().toISOString(),
            },
            token: 'mock-new-token-555',
          },
        }),
      });
    });

    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'mock-new-user',
            name: 'Taylor Swift',
            email: 'taylor@example.com',
            createdAt: new Date().toISOString(),
          },
        }),
      });
    });

    await page.route('**/api/v1/content?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { items: [], pagination: { total: 0, page: 1, limit: 5, totalPages: 1 } },
        }),
      });
    });

    await page.goto('/register');
    await expect(page.locator('h2')).toContainText('Create your account');

    await page.getByPlaceholder('Alex Mercer').fill('Taylor Swift');
    await page.getByPlaceholder('you@example.com').fill('taylor@example.com');
    await page.getByPlaceholder(/Min. 8 chars/i).fill('Password123!');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1')).toContainText('Welcome back, Taylor');
  });

  test('Unauthenticated user accessing protected /dashboard is redirected to /login', async ({ page }) => {
    // Clear any token in storage
    await page.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('h2')).toContainText('Welcome back');
  });

  test('Navigation links toggle smoothly between Login and Register views', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h2')).toContainText('Welcome back');

    await page.getByRole('link', { name: 'Create one now' }).click();
    await expect(page).toHaveURL(/.*register/);
    await expect(page.locator('h2')).toContainText('Create your account');

    await page.getByRole('main').getByRole('link', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('h2')).toContainText('Welcome back');
  });
});
