import { test, expect } from '@playwright/test';
import { BasePom } from '../pages/base.pom';
import data from '../test-data.json' assert { type: 'json' };

let app: BasePom;

test.describe('Login tests', () => {

    test.beforeEach(async ({ page }) => {
        app = new BasePom(page);
        await app.navigate('/');
    })

    test('Admin can login', async () => {
        await app.navigate('/');
        await app.login(data.admin.email, data.admin.password);
        await app.expectRedirectTo('/admin');
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

});