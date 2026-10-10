import { Locator, Page } from '@playwright/test';

export class RegisterPage {
  private readonly page: Page;

  // Locators
  private readonly firstNameInput: Locator;
  private readonly lastNameInput: Locator;
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly privacyPolicyCheckbox: Locator;
  private readonly continueButton: Locator;
  private readonly registrationSuccessHeading: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators with CSS selectors
    this.firstNameInput = page.getByPlaceholder('First Name');
    this.lastNameInput = page.getByPlaceholder('Last Name');
    this.emailInput = page.getByPlaceholder('E-Mail');
    this.passwordInput = page.getByPlaceholder('Password');
    this.privacyPolicyCheckbox = page.locator('input[name="agree"]');
    this.continueButton = page.getByRole('button', { name: 'Continue', exact: true });
    this.registrationSuccessHeading = page.getByRole('heading', {
      name: 'Your Account Has Been Created!',
      exact: true,
    });
  }

  /**
   * Completes and submits the registration form fields supported by this store.
   * @param customer - Dynamically generated customer registration data
   */
  async register(customer: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Promise<void> {
    try {
      await this.firstNameInput.fill(customer.firstName);
      await this.lastNameInput.fill(customer.lastName);
      await this.emailInput.fill(customer.email);
      await this.passwordInput.fill(customer.password);
      await this.privacyPolicyCheckbox.check();
      await this.continueButton.click();
    } catch (error) {
      console.log(`Registration failed: ${error}`);
      throw error;
    }
  }

  /**
   * Checks whether the account-created confirmation is displayed.
   * @returns Whether registration succeeded
   */
  async isRegistrationSuccessful(): Promise<boolean> {
    return this.registrationSuccessHeading.isVisible();
  }
}
