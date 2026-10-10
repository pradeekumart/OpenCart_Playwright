import { Locator, Page } from '@playwright/test';

export class AdminLoginPage {
  private readonly page: Page;
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator('#input-username');
    this.passwordInput = page.locator('#input-password');
    this.loginButton = page.locator('#button-login');
  }

  async isAdminLoginPageExists(): Promise<boolean> {
    return this.usernameInput.isVisible();
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
