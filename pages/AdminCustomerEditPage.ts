import { Locator, Page } from '@playwright/test';

export class AdminCustomerEditPage {
  private readonly page: Page;
  private readonly firstNameInput: Locator;
  private readonly lastNameInput: Locator;
  private readonly emailInput: Locator;
  private readonly statusSelect: Locator;

  constructor(page: Page) {
    this.page = page;
    this.firstNameInput = page.locator('#input-firstname');
    this.lastNameInput = page.locator('#input-lastname');
    this.emailInput = page.locator('#input-email');
    this.statusSelect = page.locator('#input-status');
  }

  async isEditCustomerPageExists(): Promise<boolean> {
    return this.firstNameInput.isVisible();
  }

  async getFirstNameValue(): Promise<string> {
    return this.firstNameInput.inputValue();
  }

  async getLastNameValue(): Promise<string> {
    return this.lastNameInput.inputValue();
  }

  async getEmailValue(): Promise<string> {
    return this.emailInput.inputValue();
  }

  async getStatusValue(): Promise<string> {
    return this.statusSelect.inputValue();
  }
}
