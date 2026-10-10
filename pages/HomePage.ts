import { Locator, Page } from '@playwright/test';

export class HomePage {
  private readonly page: Page;

  // Locators
  private readonly myAccountButton: Locator;
  private readonly registerLink: Locator;
  private readonly loginLink: Locator;
  private readonly searchInput: Locator;
  private readonly searchButton: Locator;
  private readonly shoppingCartLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators with CSS selectors
    this.myAccountButton = page.getByRole('button', { name: 'My Account' });
    this.registerLink = page.getByRole('link', { name: 'Register', exact: true });
    this.loginLink = page.getByRole('link', { name: 'Login', exact: true });
    this.searchInput = page.getByRole('textbox', { name: 'Search' });
    this.searchButton = page
      .locator('form')
      .filter({ has: this.searchInput })
      .getByRole('button');
    this.shoppingCartLink = page.getByRole('link', { name: 'Shopping Cart', exact: true });
  }

  /**
   * Opens the My Account menu.
   */
  async openMyAccountMenu(): Promise<void> {
    await this.myAccountButton.click();
  }

  /**
   * Opens the customer registration page.
   */
  async openRegistrationPage(): Promise<void> {
    await this.openMyAccountMenu();
    await this.registerLink.click();
  }

  /**
   * Opens the customer login page.
   */
  async openLoginPage(): Promise<void> {
    await this.openMyAccountMenu();
    await this.loginLink.click();
  }

  /**
   * Searches for a product by name.
   * @param productName - Product name to search for
   */
  async searchForProduct(productName: string): Promise<void> {
    await this.searchInput.fill(productName);
    await Promise.all([
      this.page.waitForURL(/route=product\/search/),
      this.searchButton.click(),
    ]);
  }

  /**
   * Opens the shopping cart.
   */
  async openShoppingCart(): Promise<void> {
    await this.shoppingCartLink.click();
  }
}
