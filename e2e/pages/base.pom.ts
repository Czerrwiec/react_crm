import { Page, expect } from '@playwright/test';

const BaseSelectors = {
    emailInput: 'login-email-input',
    passwordInput: 'login-password-input',
    loginButton: 'login-button',
    recoveryButton: 'password-recovery-button',
    recoveryEmail: 'recovery-email',
    sendLinkButton: 'send-link-button',
    backToLogin: 'back-login-button-sended',
    loginError: 'login-error',
    logoutButton: 'logout-button',
    nav: {
        dashboard: 'nav-dashboard',
        students: 'nav-students',
        calendar: 'nav-calendar',
        cars: 'nav-cars',
        instructors: 'nav-instructors',
        packages: 'nav-packages',
        settings: 'nav-settings'
    }
}

type NavItem = keyof typeof BaseSelectors.nav;

export class BasePom {
    constructor(private page: Page) { }

    async navigate(path: string = '/') {
        await this.page.goto(path);
    }

    async login(email: string, password: string) {
        await this.page.getByTestId(BaseSelectors.emailInput).fill(email);
        await this.page.getByTestId(BaseSelectors.passwordInput).fill(password);
        await this.page.getByTestId(BaseSelectors.loginButton).click();
    }

    async expectLoginError() {
        await expect(
            this.page.getByTestId(BaseSelectors.loginError)
        ).toBeVisible();

        await expect(
            this.page.getByTestId(BaseSelectors.loginButton)
        ).toBeVisible();
    }

    async goAndsendRecovery(email: string) {
        await this.page.getByTestId(BaseSelectors.recoveryButton).click()
        await this.page
            .getByTestId(BaseSelectors.recoveryEmail)
            .fill(email);

        await Promise.all([
            this.page.waitForResponse(res =>
                res.url().includes('/auth/v1/recover') &&
                res.request().method() === 'POST' &&
                res.status() === 200
            ),
            this.page.getByTestId(BaseSelectors.sendLinkButton).click(),
        ]);
    }

    async backToLogin() {
        await this.page.getByTestId(BaseSelectors.backToLogin).click();
    }

    async logOut() {
        await this.page.getByTestId(BaseSelectors.logoutButton).click();
    }

    async expectRedirectTo(path: string) {
        await expect(this.page).toHaveURL(new RegExp(path));
    }

    private navLocator(item: NavItem) {
        return this.page.getByTestId(BaseSelectors.nav[item]);
    }

    async goToNavAndConfirmActiveTab(item: NavItem) {
        const nav = this.navLocator(item);

        await nav.click();
        await expect(nav.locator('div'))
            .toHaveClass(/text-primary-foreground/);
    }
}

