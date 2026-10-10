import { Locator, Page } from '@playwright/test';

export class AccountPage {
  private readonly page: Page;

  // Locators
  private readonly accountHeading: Locator;
  private readonly myAccountButton: Locator;
  private readonly logoutLink: Locator;
  private readonly logoutHeading: Locator;
  private readonly continueLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators with CSS selectors
    this.accountHeading = page.getByRole('heading', {
      name: 'My Account',
      exact: true,
      level: 1,
    });
    this.myAccountButton = page.getByRole('button', { name: 'My Account' });
    this.logoutLink = page.locator('#top').getByRole('link', { name: 'Logout', exact: true });
    this.logoutHeading = page.getByRole('heading', { name: 'Account Logout', exact: true });
    this.continueLink = page.getByRole('link', { name: 'Continue', exact: true });
  }

  /**
   * Checks whether the authenticated My Account page is displayed.
   * @returns Whether the account dashboard is visible
   */
  async isAccountDashboardVisible(): Promise<boolean> {
    return this.accountHeading.isVisible();
  }

  /**
   * Logs out the current customer.
   */
  async logout(): Promise<void> {
    try {
      await this.myAccountButton.click();
      await Promise.all([
        this.page.waitForURL(/route=account\/logout/),
        this.logoutLink.click(),
      ]);
    } catch (error) {
      console.log(`Customer logout failed: ${error}`);
      throw error;
    }
  }

  /**
   * Checks whether the logout confirmation is displayed.
   * @returns Whether the logout confirmation is visible
   */
  async isLogoutConfirmationVisible(): Promise<boolean> {
    return this.logoutHeading.isVisible();
  }

  /**
   * Continues from the logout confirmation page.
   */
  async continueAfterLogout(): Promise<void> {
    await Promise.all([
      this.page.waitForURL(/route=common\/home/),
      this.continueLink.click(),
    ]);
  }
}
