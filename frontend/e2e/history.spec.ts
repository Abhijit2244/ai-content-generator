import { test, expect } from '@playwright/test';

test.describe('Content Library / History Management E2E', () => {
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

    // Mock Content List
    await page.route('**/api/v1/content?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            items: [
              {
                id: 'doc-101',
                userId: 'mock-user-1',
                title: 'The AI Revolution in 2026',
                content: 'Full article body discussing generative AI paradigms.',
                contentType: 'blog',
                tone: 'informative',
                length: 'medium',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              {
                id: 'doc-102',
                userId: 'mock-user-1',
                title: 'LinkedIn Thought Leadership Post',
                content: '3 principles for modern engineering managers.',
                contentType: 'social_linkedin',
                tone: 'professional',
                length: 'short',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
            pagination: { total: 2, page: 1, limit: 10, totalPages: 1 },
          },
        }),
      });
    });
  });

  test('Displays saved document library and permits search and filtering', async ({ page }) => {
    await page.goto('/history');

    await expect(page.locator('h1')).toContainText('Content Library');
    await expect(page.getByText('The AI Revolution in 2026')).toBeVisible();
    await expect(page.getByText('LinkedIn Thought Leadership Post')).toBeVisible();

    // Verify search input is interactable
    const searchInput = page.getByPlaceholder(/Search documents by title/i);
    await searchInput.fill('AI Revolution');
    await expect(searchInput).toHaveValue('AI Revolution');

    // Verify open in editor link
    const openLink = page.getByRole('link', { name: 'Open Editor' }).first();
    await expect(openLink).toHaveAttribute('href', '/generator?id=doc-101');
  });

  test('Can open rename modal and trigger update', async ({ page }) => {
    await page.route('**/api/v1/content/doc-101', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { id: 'doc-101', title: 'Renamed Title' },
          }),
        });
      }
    });

    await page.goto('/history');

    // Click rename button (pencil icon)
    await page.locator('button[title="Rename"]').first().click();
    await expect(page.getByRole('heading', { name: 'Rename Document' })).toBeVisible();

    const titleInput = page.getByPlaceholder('New title...');
    await titleInput.fill('Renamed Title');
    await page.getByRole('button', { name: 'Save Title' }).click();

    // Modal closes
    await expect(page.getByRole('heading', { name: 'Rename Document' })).not.toBeVisible();
  });

  test('Displays delete confirmation dialog and allows cancelling safely', async ({ page }) => {
    await page.goto('/history');

    // Click Delete button on first document
    await page.locator('button[title="Delete"]').first().click();

    // Verify modal text
    await expect(
      page.getByText('Are you sure you want to delete this document and all its historical versions?')
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete Permanently' })).toBeVisible();

    // Click Cancel
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Modal disappears and document remains visible
    await expect(
      page.getByText('Are you sure you want to delete this document and all its historical versions?')
    ).not.toBeVisible();
    await expect(page.getByText('The AI Revolution in 2026')).toBeVisible();
  });

  test('Displays helpful empty state message when collection has zero documents', async ({ page }) => {
    // Override route to return empty list
    await page.route('**/api/v1/content?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 1 } },
        }),
      });
    });

    await page.goto('/history');
    await expect(page.getByText('No documents found')).toBeVisible();
    await expect(page.getByText('You have not saved any content yet.')).toBeVisible();
  });

  test('Can open Quick Markdown Preview modal from history library', async ({ page }) => {
    await page.goto('/history');

    // Click View Markdown button on first document card
    await page.getByRole('button', { name: 'View Markdown' }).first().click();

    // Verify modal appears with header and content
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('heading', { level: 2, name: 'The AI Revolution in 2026' })).toBeVisible();
    await expect(modal.getByText('Full article body discussing generative AI paradigms.')).toBeVisible();

    // Click Close
    await modal.getByRole('button', { name: 'Close', exact: true }).click();

    // Modal disappears
    await expect(modal).not.toBeVisible();
  });
});
