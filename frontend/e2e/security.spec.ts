import { test, expect } from '@playwright/test';

test.describe('Client-Side Security & XSS Neutralization E2E', () => {
  test('Neutralizes javascript: pseudo-protocol in Markdown Viewer', async ({ page }) => {
    // Intercept user profile and documents with simulated malicious payload
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'test-sec-user',
            name: 'Security Tester',
            email: 'sec@example.com',
            createdAt: '2026-01-01T00:00:00Z',
          },
        }),
      });
    });

    await page.route('**/api/v1/content*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            items: [
              {
                id: 'sec-doc-1',
                title: 'Security XSS Test Document',
                content:
                  '# Security Test\n\nDangerous link: [Click here for prize](javascript:alert("pwned"))\n\nDangerous image: ![Bad](javascript:alert("img"))\n\nSafe link: [Official Docs](https://google.com)',
                contentType: 'blog',
                tone: 'professional',
                length: 'short',
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
                versionsCount: 1,
              },
            ],
            total: 1,
            page: 1,
            totalPages: 1,
          },
        }),
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem('token', 'valid-mock-security-token');
    });

    await page.goto('/history');

    // Open Quick Markdown Preview modal
    await page.getByRole('button', { name: 'View Markdown' }).first().click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Verify unsafe javascript: link is neutralized (not rendered as an active javascript: href)
    const dangerousLink = modal.locator('a[href*="javascript:"]');
    await expect(dangerousLink).toHaveCount(0);

    // Verify the text is still readable with neutralized indicator
    await expect(modal.getByText('Click here for prize')).toBeVisible();

    // Verify safe link is preserved
    const safeLink = modal.locator('a[href="https://google.com"]');
    await expect(safeLink).toBeVisible();
    await expect(safeLink).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(safeLink).toHaveAttribute('target', '_blank');

    // Close preview
    await modal.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(modal).not.toBeVisible();
  });

  test('Protected routes strictly block unauthenticated sessions', async ({ page }) => {
    // Clear localStorage to simulate unauthenticated visitor
    await page.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto('/generator');
    // Must redirect to /login
    await page.waitForURL('**/login');
    await expect(page.getByRole('heading', { level: 2, name: 'Welcome back' })).toBeVisible();
  });
});
