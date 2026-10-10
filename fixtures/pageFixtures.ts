import { test as base } from '@playwright/test';
import dotenv from 'dotenv';
import { AccountPage } from '../pages/AccountPage.js';
import { AdminCustomerEditPage } from '../pages/AdminCustomerEditPage.js';
import { AdminCustomersPage } from '../pages/AdminCustomersPage.js';
import { AdminLoginPage } from '../pages/AdminLoginPage.js';
import { CartPage } from '../pages/CartPage.js';
import { HomePage } from '../pages/HomePage.js';
import { LoginPage } from '../pages/LoginPage.js';
import { ProductPage } from '../pages/ProductPage.js';
import { RegisterPage } from '../pages/RegisterPage.js';

dotenv.config();

const appUrl = process.env.WEB_APP_URL;

if (!appUrl) {
  throw new Error('WEB_APP_URL must be configured in .env');
}

type PageFixtures = {
  homePage: HomePage;
  adminLoginPage: AdminLoginPage;
  adminCustomersPage: AdminCustomersPage;
  adminCustomerEditPage: AdminCustomerEditPage;
  registerPage: RegisterPage;
  loginPage: LoginPage;
  accountPage: AccountPage;
  productPage: ProductPage;
  cartPage: CartPage;
};

export const test = base.extend<PageFixtures>({
  homePage: async ({ page }, use) => {
    await page.goto(appUrl);
    await use(new HomePage(page));
  },
  adminLoginPage: async ({ page }, use) => {
    await use(new AdminLoginPage(page));
  },
  adminCustomersPage: async ({ page }, use) => {
    await use(new AdminCustomersPage(page));
  },
  adminCustomerEditPage: async ({ page }, use) => {
    await use(new AdminCustomerEditPage(page));
  },
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  accountPage: async ({ page }, use) => {
    await use(new AccountPage(page));
  },
  productPage: async ({ page }, use) => {
    await use(new ProductPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
});

test.afterEach(async ({ page, context }) => {
  if (!page.isClosed()) {
    await page.close();
  }

  await context.close();
});

export { expect } from '@playwright/test';
