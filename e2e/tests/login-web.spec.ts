import { test, expect } from '@playwright/test';
import DATA from '../test-data.json' assert { type: 'json' };



test.describe('Login tests', () => {
    test('Admin can login', async ({ page }) => {
        await page.goto('/');

        await page.fill('[data-testid="login-email-input"]', DATA.admin.email);
        await page.fill('[data-testid="login-password-input"]', DATA.admin.password);
        await page.locator('[data-testid="login-button"]').click();

        await expect(page).toHaveURL(/\/admin/);
    });
});