/**
 * Test Case: OpenCart UI + Admin + MySQL End-to-End Customer Registration Validation
 *
 * Tags: @master @end-to-end @db @regression
 *
 * Steps:
 * 1) Register a unique customer through the frontend
 * 2) Verify the customer in the OpenCart Admin Portal
 * 3) Verify the customer record in the MySQL oc_customer table
 */

import { test, expect } from '../../fixtures/pageFixtures.js';
import { RandomDataUtil } from '../../utils/dataGenerator.js';
import { executeQuery } from '../../utils/dbClient.js';
import dotenv from 'dotenv';

dotenv.config();

const ADMIN_URL = (process.env.ADMIN_URL || 'http://localhost/opencart/admin/').replace(/\/+$/, '') + '/';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

test.describe('OpenCart Customer Registration - UI + Admin + DB Validation @master @end-to-end @db', () => {

    test('Register customer, verify in admin portal and MySQL @db', async ({
        page, homePage, registerPage, adminLoginPage, adminCustomersPage, adminCustomerEditPage
    }) => {
        // Generate unique customer data once, reused across all three layers
        const firstName = RandomDataUtil.getFirstName();
        const lastName = RandomDataUtil.getLastName();
        const [emailName, emailDomain] = RandomDataUtil.getEmail().split('@');
        const email = `${emailName}+${Date.now()}@${emailDomain}`;
        const password = RandomDataUtil.getPassword();
        let registered = false;
        let testError: unknown;

        try {
            await test.step('1) Register a new customer through the frontend', async () => {
                await homePage.openRegistrationPage();

                await expect(page.getByRole('heading', { name: 'Register Account' }))
                    .toBeVisible();

                await registerPage.register({ firstName, lastName, email, password });
                registered = true;

                await expect(
                    page.getByRole('heading', {
                        name: 'Your Account Has Been Created!',
                        exact: true,
                    }),
                ).toBeVisible();
                expect(await registerPage.isRegistrationSuccessful()).toBeTruthy();
            });

            await test.step('2) Verify the customer in the Admin Portal', async () => {
                await page.goto(ADMIN_URL);

                const isLoginPage = await adminLoginPage.isAdminLoginPageExists();
                expect(isLoginPage, 'Admin login page should be displayed').toBeTruthy();

                await adminLoginPage.login(ADMIN_USERNAME, ADMIN_PASSWORD);
                await page.waitForURL(/route=common\/dashboard/);

                await adminCustomersPage.dismissSecurityModal();

                await adminCustomersPage.clickCustomersMenu();
                await adminCustomersPage.clickCustomersSubmenu();
                await page.waitForURL(/route=customer\/customer/);

                const isCustomersPage = await adminCustomersPage.isCustomersPageExists();
                expect(isCustomersPage, 'Admin Customers list page should be displayed').toBeTruthy();

                await adminCustomersPage.searchCustomerByEmail(email);

                const isRowVisible = await adminCustomersPage.isCustomerRowExists(email);
                expect(isRowVisible, `Customer with email ${email} should appear in the admin customer list`).toBeTruthy();

                await adminCustomersPage.clickEditCustomer(email);

                const isEditPage = await adminCustomerEditPage.isEditCustomerPageExists();
                expect(isEditPage, 'Edit Customer page should be displayed').toBeTruthy();

                expect(await adminCustomerEditPage.getFirstNameValue(), 'First name should match').toBe(firstName);
                expect(await adminCustomerEditPage.getLastNameValue(), 'Last name should match').toBe(lastName);
                expect(await adminCustomerEditPage.getEmailValue(), 'Email should match').toBe(email);
                expect(await adminCustomerEditPage.getStatusValue(), 'Customer status should be enabled (1)').toBe('1');
            });

            await test.step('3) Verify the customer in the MySQL oc_customer table', async () => {
                const [rows] = await executeQuery(
                    'SELECT customer_id, firstname, lastname, email, status, date_added FROM oc_customer WHERE email = ?',
                    [email]
                );

                expect(Array.isArray(rows), 'Customer query should return rows').toBeTruthy();
                const customerRows = rows as Array<{
                    firstname: string;
                    lastname: string;
                    email: string;
                    status: number;
                    date_added: string | Date;
                }>;
                expect(customerRows.length, `Exactly one customer record should exist for email ${email}`).toBe(1);

                const customer = customerRows[0];
                expect(customer.firstname, 'DB firstname should match generated first name').toBe(firstName);
                expect(customer.lastname, 'DB lastname should match generated last name').toBe(lastName);
                expect(customer.email, 'DB email should match generated email').toBe(email);
                expect(customer.status, 'DB status should be 1 (enabled)').toBe(1);
                expect(customer.date_added, 'DB date_added should exist').toBeTruthy();
            });

            console.log('✅ Customer registration validated across UI, Admin and MySQL successfully!');
        } catch (error) {
            testError = error;
        }

        if (registered) {
            try {
                await executeQuery('DELETE FROM oc_customer WHERE email = ?', [email]);
            } catch (cleanupError) {
                if (testError !== undefined) {
                    throw new AggregateError(
                        [testError, cleanupError],
                        'Customer registration test failed and cleanup could not complete',
                    );
                }
                throw cleanupError;
            }
        }

        if (testError !== undefined) {
            throw testError;
        }
    });
});
