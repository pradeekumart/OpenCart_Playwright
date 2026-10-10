import { Locator, Page } from '@playwright/test';

export class ProductPage {
  private readonly page: Page;

  // Locators
  private readonly productHeading: (productName: string) => Locator;
  private readonly quantityInput: Locator;
  private readonly addToCartButton: Locator;
  private readonly addToCartSuccessMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators with CSS selectors
    this.productHeading = (productName) =>
      page.getByRole('heading', { name: productName, exact: true, level: 1 });
    this.quantityInput = page.locator('#input-quantity');
    this.addToCartButton = page.getByRole('button', { name: 'Add to Cart', exact: true });
    this.addToCartSuccessMessage = page.getByText('Success: You have added', { exact: false });
  }

  /**
   * Opens the product from search results.
   * @param productName - Exact name of the product
   */
  async openFromSearchResults(productName: string): Promise<void> {
    const productLink = this.page.getByRole('link', { name: productName, exact: true }).last();
    await productLink.click();
  }

  /**
   * Checks whether the product appears in search results.
   * @param productName - Exact name of the product
   * @returns Whether the product result is visible
   */
  async isProductInSearchResults(productName: string): Promise<boolean> {
    return this.page.getByRole('link', { name: productName, exact: true }).first().isVisible();
  }

  /**
   * Checks whether the product detail page is displayed.
   * @param productName - Exact name of the product
   * @returns Whether the product heading is visible
   */
  async isProductDetailsVisible(productName: string): Promise<boolean> {
    return this.productHeading(productName).isVisible();
  }

  /**
   * Sets the requested product quantity.
   * @param quantity - Quantity to add
   */
  async setQuantity(quantity: string): Promise<void> {
    await this.quantityInput.fill(quantity);
  }

  /**
   * Adds the product to the cart.
   */
  async addToCart(): Promise<void> {
    try {
      await this.addToCartButton.click();
      await this.addToCartSuccessMessage.waitFor({ state: 'visible' });
    } catch (error) {
      console.log(`Adding the product to the cart failed: ${error}`);
      throw error;
    }
  }

  /**
   * Reads the displayed product price.
   * @returns Product price text
   */
  async getProductPrice(): Promise<string> {
    return (await this.page.getByRole('heading', { level: 2 }).first().innerText()).trim();
  }
}
