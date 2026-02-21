import { Page, expect } from '@playwright/test';

const BaseSelectors = {
    emailInput: 'login-email-input',
    passwordInput: 'login-password-input',
    loginButton: 'login-button',
};

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

    async expectRedirectTo(path: string) {
        await expect(this.page).toHaveURL(new RegExp(path));
    }
}
