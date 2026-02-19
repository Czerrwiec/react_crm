import { test, expect } from '@playwright/test';

/**
 * Smoke Test - Basic connectivity/app load
 */

test.describe('Smoke Test', () => {
  test('App loads and redirects to login', async ({ page }) => {

    const response = await page.goto('/');

    // Check Vercel protection
    if (response?.status() === 401 || response?.status() === 403) {
      throw new Error(
        'Access Denied.'
      );
    }

    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    await expect(page.locator('[data-testid="login-email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-recovery-button"]')).toBeVisible();
  
    console.log('Smoke test passed!');
  });
});