import { Locator, Page } from '@playwright/test';

export class AdminCustomersPage {
  private readonly page: Page;
  private readonly securityModal: Locator;
  private readonly securityModalCloseButton: Locator;
  private readonly customersMenu: Locator;
  private readonly customersSubmenu: Locator;
  private readonly emailFilter: Locator;
  private readonly filterButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.securityModal = page.locator('.modal-dialog');
    this.securityModalCloseButton = this.securityModal.locator(
      'button.close, button[aria-label="Close"], [data-dismiss="modal"]',
    );
    this.customersMenu = page.locator('#menu-customer > a');
    this.customersSubmenu = page.locator(
      '#menu-customer a[href*="route=customer/customer"]',
    );
    this.emailFilter = page.locator('#input-email');
    this.filterButton = page.locator('#button-filter');
  }

  async dismissSecurityModal(): Promise<void> {
    if (await this.securityModal.isVisible()) {
      await this.securityModalCloseButton.click();
    }
  }

  async clickCustomersMenu(): Promise<void> {
    await this.customersMenu.click();
  }

  async clickCustomersSubmenu(): Promise<void> {
    await this.customersSubmenu.click();
  }

  async isCustomersPageExists(): Promise<boolean> {
    return this.emailFilter.isVisible();
  }

  async searchCustomerByEmail(email: string): Promise<void> {
    await this.emailFilter.fill(email);
    await this.filterButton.click();
  }

  async isCustomerRowExists(email: string): Promise<boolean> {
    const row = this.page.locator('#content table tbody tr').filter({ hasText: email });
    await row.waitFor({ state: 'visible' });
    return row.isVisible();
  }

  async clickEditCustomer(email: string): Promise<void> {
    const row = this.page.locator('#content table tbody tr').filter({ hasText: email });
    await row.locator('a[href*="route=customer/customer.edit"]').click();
  }
}
