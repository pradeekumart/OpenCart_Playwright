import { Locator, Page } from '@playwright/test';

export class CartPage {
  private readonly page: Page;

  // Locators
  private readonly cartHeading: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators with CSS selectors
    this.cartHeading = page.getByRole('heading', { name: /Shopping Cart/ });
  }

  /**
   * Checks whether the shopping cart page is displayed.
   * @returns Whether the cart heading is visible
   */
  async isCartPageVisible(): Promise<boolean> {
    return this.cartHeading.isVisible();
  }

  /**
   * Gets the shopping-cart row for a product.
   * @param productName - Exact product name
   * @returns Matching product row
   */
  getProductRow(productName: string): Locator {
    return this.page.getByRole('row').filter({
      has: this.page.getByRole('link', { name: productName, exact: true }),
    });
  }

  /**
   * Gets the cart total row.
   * @returns Total row locator
   */
  getTotalRow(): Locator {
    return this.page.getByRole('row').filter({
      has: this.page.getByText('Total', { exact: true }),
    });
  }
}
