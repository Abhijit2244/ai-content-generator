import { test, expect } from '@playwright/test';

test.describe('Generator Workspace & Refinement Lifecycle E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Inject authenticated session into localStorage
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

    // Mock auth verification
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
  });

  test('Form validation prevents generating without a topic', async ({ page }) => {
    await page.goto('/generator');
    await expect(page.getByText('Content Configuration')).toBeVisible();

    await page.getByRole('button', { name: /Generate Content/i }).click();
    await expect(page.getByText('Please enter a subject or title')).toBeVisible();
  });

  test('Full Generation, Refinement, and Variations Workflow', async ({ page }) => {
    // 1. Mock Generate Endpoint
    await page.route('**/api/v1/content/generate', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'content-uuid-1',
            title: 'Mastering Clean Architecture',
            content: '# Mastering Clean Architecture\n\nClean Architecture organizes code by responsibility.',
            contentType: 'blog',
            tone: 'informative',
            length: 'medium',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: 1,
          },
          meta: { model: 'gemini-3.5-flash', generationTimeMs: 420 },
        }),
      });
    });

    // 2. Mock Refine Endpoint (Simplify action)
    await page.route('**/api/v1/content/content-uuid-1/refine', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'content-uuid-1',
            title: 'Mastering Clean Architecture',
            content: '# Simple Guide to Clean Architecture\n\nClean code means code is easy to read and change.',
            version: 2,
            changeType: 'refined',
          },
        }),
      });
    });

    // 3. Mock Variations Endpoint
    await page.route('**/api/v1/content/content-uuid-1/variations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            variations: [
              { index: 1, content: 'Variation 1: The Blueprint for Scalable Systems.' },
              { index: 2, content: 'Variation 2: Why Every Startup Needs Clean Code.' },
              { index: 3, content: 'Variation 3: Architecture Patterns Explained Simply.' },
            ],
          },
        }),
      });
    });

    // 4. Mock Versions Endpoint
    await page.route('**/api/v1/content/content-uuid-1/versions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'ver-2',
              contentId: 'content-uuid-1',
              versionNumber: 2,
              changeType: 'refined',
              contentSnapshot: 'Clean code means code is easy to read and change.',
              createdAt: new Date().toISOString(),
            },
            {
              id: 'ver-1',
              contentId: 'content-uuid-1',
              versionNumber: 1,
              changeType: 'generated',
              contentSnapshot: 'Clean Architecture organizes code by responsibility.',
              createdAt: new Date().toISOString(),
            },
          ],
        }),
      });
    });

    await page.goto('/generator');

    // Fill form and generate
    await page.getByPlaceholder(/The Future of Remote Work/i).fill('Mastering Clean Architecture');
    await page.getByRole('button', { name: /Generate Content/i }).click();

    // Verify content rendered in editor textarea
    const textarea = page.getByPlaceholder(/Generated content will appear here/i);
    await expect(textarea).toContainText('Mastering Clean Architecture');
    await expect(page.getByText('Version 1', { exact: true })).toBeVisible();

    // Click Refine: Simplify
    await page.getByRole('button', { name: 'Simplify' }).click();

    // Verify refined text updated
    await expect(textarea).toContainText('Simple Guide to Clean Architecture');
    await expect(page.getByText('Version 2', { exact: true })).toBeVisible();

    // Click Variations
    await page.getByRole('button', { name: 'Variations' }).click();
    await expect(page.getByText('Alternative Variations')).toBeVisible();
    await expect(page.getByText('Variation 1: The Blueprint for Scalable Systems.')).toBeVisible();

    // Adopt variation 2
    await page.getByRole('button', { name: 'Adopt this option' }).nth(1).click();
    await expect(textarea).toContainText('Variation 2: Why Every Startup Needs Clean Code.');

    // Open Version History Drawer
    await page.locator('button[title="Version history"]').click();
    await expect(page.getByRole('heading', { name: 'Version History' })).toBeVisible();
    await expect(page.getByText('Version 2 (refined)')).toBeVisible();
    await expect(page.getByText('Version 1 (generated)')).toBeVisible();
  });

  test('Live word and character count updates dynamically as user edits content', async ({ page }) => {
    await page.route('**/api/v1/content/doc-existing', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'doc-existing',
            title: 'Existing Doc',
            content: 'Clean code',
            contentType: 'blog',
            tone: 'informative',
            length: 'short',
            version: 1,
          },
        }),
      });
    });

    await page.goto('/generator?id=doc-existing');
    const textarea = page.getByPlaceholder(/Generated content will appear here/i);
    await expect(textarea).toBeVisible();

    // Verify initial count (2 words, 10 characters)
    await expect(page.getByText('2 words', { exact: true })).toBeVisible();
    await expect(page.getByText('10 characters', { exact: true })).toBeVisible();

    // Type new text
    await textarea.fill('Clean resilient architecture');

    // Should update to 3 words and 28 characters
    await expect(page.getByText('3 words', { exact: true })).toBeVisible();
    await expect(page.getByText('28 characters', { exact: true })).toBeVisible();
  });

  test('Copy button is disabled when workspace is empty and shows empty workspace placeholder', async ({ page }) => {
    await page.goto('/generator');
    await expect(page.getByText('Your content workspace is empty')).toBeVisible();

    const copyButton = page.locator('button[title="Copy to clipboard"]');
    await expect(copyButton).toBeDisabled();
  });

  test('Can toggle between Editor, Markdown View, and Split View', async ({ page }) => {
    await page.route('**/api/v1/content/doc-markdown', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'doc-markdown',
            title: 'Markdown Sample',
            content: '# Main Title\n\n- Feature 1\n- Feature 2\n\n```ts\nconst x = 42;\n```',
            contentType: 'blog',
            tone: 'informative',
            length: 'short',
            version: 1,
          },
        }),
      });
    });

    await page.goto('/generator?id=doc-markdown');

    // Switch to Markdown View
    await page.getByRole('button', { name: 'Markdown View' }).click();
    await expect(page.locator('h1').getByText('Main Title')).toBeVisible();
    await expect(page.getByText('Feature 1')).toBeVisible();

    // Switch to Split View
    await page.getByRole('button', { name: 'Split View' }).click();
    await expect(page.getByText('Markdown Editor')).toBeVisible();
    await expect(page.getByText('Live Markdown Preview')).toBeVisible();

    // Switch back to Editor
    await page.getByRole('button', { name: 'Editor' }).click();
    await expect(page.getByPlaceholder(/Generated content will appear here/i)).toBeVisible();
  });
});
