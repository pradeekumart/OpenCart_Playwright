/**
 * Test Case: End-to-End OpenCart Shopping Flow
 *
 * Tags: @master @sanity @web @end-to-end
 *
 * Steps:
 * 1) Register a new customer
 * 2) Log out and log back in
 * 3) Search for MacBook and open its product page
 * 4) Add the product to the cart and verify its price and total
 */

import { test, expect } from '../../fixtures/pageFixtures.js';
import { RandomDataUtil } from '../../utils/dataGenerator.js';
import { Helper } from '../../utils/helper.js';

test('Complete customer shopping journey @master @sanity @web @end-to-end', async ({
  page,
  homePage,
  registerPage,
  loginPage,
  accountPage,
  productPage,
  cartPage,
}) => {
  const product = Helper.getProductDetails();
  const generatedEmail = RandomDataUtil.getEmail();
  const [emailName, emailDomain] = generatedEmail.split('@');
  const customer = {
    firstName: RandomDataUtil.getFirstName(),
    lastName: RandomDataUtil.getLastName(),
    email: `${emailName}+${Date.now()}@${emailDomain}`,
    password: RandomDataUtil.getPassword(12),
  };
  const pageErrors: string[] = [];

  page.on('pageerror', (error) => pageErrors.push(error.message));

  await test.step('1) Register a new customer', async () => {
    await homePage.openRegistrationPage();
    await expect(page.getByRole('heading', { name: 'Register Account' })).toBeVisible();

    await registerPage.register(customer);

    await expect(
      page.getByRole('heading', { name: 'Your Account Has Been Created!', exact: true }),
    ).toBeVisible();
    expect(await registerPage.isRegistrationSuccessful()).toBeTruthy();
  });

  await test.step('2) Log out of the new customer account', async () => {
    await accountPage.logout();
    expect(await accountPage.isLogoutConfirmationVisible()).toBeTruthy();
    await accountPage.continueAfterLogout();
  });

  await test.step('3) Log in with the newly registered credentials', async () => {
    await homePage.openLoginPage();
    await expect(page.getByRole('heading', { name: 'Returning Customer' })).toBeVisible();

    await loginPage.login(customer.email, customer.password);

    expect(await accountPage.isAccountDashboardVisible()).toBeTruthy();
  });

  await test.step('4) Search for MacBook and open its product page', async () => {
    await homePage.searchForProduct(product.productName);

    expect(await productPage.isProductInSearchResults(product.productName)).toBeTruthy();
    await productPage.openFromSearchResults(product.productName);

    expect(await productPage.isProductDetailsVisible(product.productName)).toBeTruthy();
    await expect(page.getByRole('heading', { name: product.totalPrice, exact: true })).toBeVisible();
  });

  await test.step('5) Add MacBook to the cart', async () => {
    await productPage.setQuantity(product.productQuantity);
    await productPage.addToCart();
    await expect(page.getByText('Success: You have added', { exact: false })).toBeVisible();
  });

  await test.step('6) Verify the product, quantity, price, and cart total', async () => {
    await homePage.openShoppingCart();

    expect(await cartPage.isCartPageVisible()).toBeTruthy();
    const productRow = cartPage.getProductRow(product.productName);
    await expect(productRow).toHaveCount(1);
    await expect(
      productRow.getByRole('cell').nth(1).getByRole('link', {
        name: product.productName,
        exact: true,
      }),
    ).toBeVisible();
    await expect(productRow.getByRole('textbox')).toHaveValue(product.productQuantity);
    await expect(productRow.getByRole('cell').nth(3)).toHaveText(product.totalPrice);
    await expect(cartPage.getTotalRow().getByRole('cell').last()).toHaveText(product.totalPrice);
  });

  await test.step('7) Confirm the journey completed without page errors', async () => {
    expect(pageErrors).toEqual([]);
  });

  console.log('✅ Completed the end-to-end OpenCart shopping journey.');
});
