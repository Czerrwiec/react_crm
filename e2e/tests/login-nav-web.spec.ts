import { test, expect } from '@playwright/test';
import { BasePom } from '../pages/base.pom';
import data from '../test-data.json' assert { type: 'json' };

let app: BasePom;

test.describe('Login tests', () => {

    test.beforeEach(async ({ page }) => {
        app = new BasePom(page);
        await app.navigate('/');
    })

    test('Admin can login and logout', async ({ page }) => {
        await app.navigate('/');
        await app.login(data.admin.email, data.admin.password);
        await app.expectRedirectTo('/admin');

        await page.getByTestId('logout-button').click();
        await app.expectRedirectTo('/login');
    });

    test('Instructor can login', async () => {
        await app.navigate('/');
        await app.login(data.instructor.email, data.instructor.password);
        await app.expectRedirectTo('/instructor');
    });

    test('Login fails with wrong password', async ({ page }) => {
        await app.navigate('/');
        await app.login(data.admin.email, '0000!');

        await expect(page.getByTestId('login-error')).toBeVisible();
        await expect(page.getByTestId('login-button')).toBeVisible()
    });

    test('User can send recovery email', async ({ page }) => {
        await app.navigate('/');

        await page.getByTestId('password-recovery-button').click()
        await app.expectRedirectTo('/reset-password');

        await page.getByTestId('recovery-email').fill(data.recoveryEmail)
        await page.getByTestId('send-link-button').click()

        await Promise.all([
            page.waitForResponse(response =>
                response.url().includes('/update-password') &&
                response.request().method() === 'POST' &&
                response.status() === 200
            ),
        ]);
        await page.getByTestId('back-login-button').click()
        await app.expectRedirectTo('/login');
    });

    test('Admin can use navigation panel', async ({ page }) => {
        await app.navigate('/');
        await app.login(data.admin.email, data.admin.password);

        const dashboardNav = page.getByTestId('nav-dashboard');
        const studentsNav = page.getByTestId('nav-students');

        await expect(
            dashboardNav.locator('div')
        ).toHaveClass(/text-primary-foreground/);

        await expect(page.getByTestId('debt-board')).toBeVisible();

        await studentsNav.click();

        await expect(
            studentsNav.locator('div')
        ).toHaveClass(/text-primary-foreground/);
    });
});