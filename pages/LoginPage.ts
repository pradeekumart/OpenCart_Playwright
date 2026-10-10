import { Locator, Page } from '@playwright/test';

export class LoginPage {
  private readonly page: Page;

  // Locators
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators with CSS selectors
    this.emailInput = page.getByRole('textbox', { name: 'E-Mail Address' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password' });
    this.loginButton = page.getByRole('button', { name: 'Login', exact: true });
  }

  /**
   * Logs in with the supplied customer credentials.
   * @param email - Registered customer email
   * @param password - Registered customer password
   */
  async login(email: string, password: string): Promise<void> {
    try {
      await this.emailInput.fill(email);
      await this.passwordInput.fill(password);
      await Promise.all([
        this.page.waitForURL(/route=account\/account/),
        this.loginButton.click(),
      ]);
    } catch (error) {
      console.log(`Customer login failed: ${error}`);
      throw error;
    }
  }
}
