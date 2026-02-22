import { test } from '@playwright/test';
import { BasePom } from '../pages/base.pom';
import data from '../test-data.json' assert { type: 'json' };

let base: BasePom;

test.describe('Login tests', () => {

    test.beforeEach(async ({ page }) => {
        base = new BasePom(page);
        await base.navigate('/');
    })

    test('Admin can login and logout', async () => {
        await base.navigate('/');
        await base.login(data.admin.email, data.admin.password);
        await base.expectRedirectTo('/admin');

        await base.logOut()
        await base.expectRedirectTo('/login');
    });

    test('Instructor can login', async () => {
        await base.navigate('/');
        await base.login(data.instructor.email, data.instructor.password);
        await base.expectRedirectTo('/instructor');
    });

    test('Login fails with wrong password', async () => {
        await base.navigate('/');
        await base.login(data.admin.email, '0000!');

        await base.expectLoginError()
    });

    test('User can send recovery email', async () => {
        await base.navigate('/');

        console.log('Full data object:', data);
        console.log('Recovery email:', data.recoveryEmail);


        await base.goAndsendRecovery(data.recoveryEmail)
        await base.backToLogin()
        await base.expectRedirectTo('/login');
    });

    test('Admin can use navigation panel', async () => {
        await base.navigate('/');
        await base.login(data.admin.email, data.admin.password);

        await base.goToNavAndConfirmActiveTab('dashboard')
        await base.goToNavAndConfirmActiveTab('students');
        await base.goToNavAndConfirmActiveTab('calendar')
        await base.goToNavAndConfirmActiveTab('cars')
        await base.goToNavAndConfirmActiveTab('instructors')
        await base.goToNavAndConfirmActiveTab('packages')
        await base.goToNavAndConfirmActiveTab('settings')
    });

    test('Instructor can use navigation panel', async () => {
        await base.navigate('/');
        await base.login(data.instructor.email, data.instructor.password);

        await base.goToNavAndConfirmActiveTab('dashboard')
        await base.goToNavAndConfirmActiveTab('students');
        await base.goToNavAndConfirmActiveTab('calendar')
        await base.goToNavAndConfirmActiveTab('cars')
    });
});