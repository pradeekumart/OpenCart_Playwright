import { Ajv } from 'ajv';
import dotenv from 'dotenv';
import { test, expect } from '@playwright/test';
import { Routes } from '../../api/endpoints/routes.js';
import { DataProvider } from '../../utils/DataReader.js';
import { RandomDataUtil } from '../../utils/dataGenerator.js';

dotenv.config();

test.describe('FakeStore API Tests', () => {
  // ---------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------

  const BASE_URL = process.env.API_BASE_URL || Routes.BASE_URL;
  const PRODUCT_ID = Number(process.env.PRODUCT_ID ?? 1);
  const USER_ID = Number(process.env.USER_ID ?? 1);
  const CART_ID = Number(process.env.CART_ID ?? 1);
  const LIMIT = Number(process.env.LIMIT ?? 3);
  const START_DATE = process.env.START_DATE ?? '2019-12-10';
  const END_DATE = process.env.END_DATE ?? '2020-10-10';
  const API_USERNAME = process.env.FAKESTORE_USERNAME ?? '';
  const API_PASSWORD = process.env.FAKESTORE_PASSWORD ?? '';

  // ---------------------------------------------------------
  // Authentication
  // ---------------------------------------------------------

  test('POST - Successful login @master @sanity @api', async ({ request }) => {
    expect(API_USERNAME, 'FAKESTORE_USERNAME must be configured in .env').toBeTruthy();
    expect(API_PASSWORD, 'FAKESTORE_PASSWORD must be configured in .env').toBeTruthy();

    const response = await request.post(`${BASE_URL}${Routes.AUTH_LOGIN}`, {
      data: {
        username: API_USERNAME,
        password: API_PASSWORD,
      },
    });

    expect(response.status(), 'Valid credentials should return HTTP 201').toBe(201);

    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('token');
    expect(typeof responseBody.token).toBe('string');
    expect(responseBody.token.length, 'The authentication token should not be empty').toBeGreaterThan(
      0,
    );
  });

  test('POST - Invalid login @master @regression @api', async ({ request }) => {
    const credentials = RandomDataUtil.generateInvalidLoginPayload();
    const response = await request.post(`${BASE_URL}${Routes.AUTH_LOGIN}`, {
      data: credentials,
    });

    expect(response.status(), 'Invalid credentials should return HTTP 401').toBe(401);
    expect(await response.text()).toBe('username or password is incorrect');
  });

  // ---------------------------------------------------------
  // Products - GET
  // ---------------------------------------------------------

  test('GET - All products @master @sanity @api', async ({ request }) => {
    const response = await request.get(`${BASE_URL}${Routes.GET_ALL_PRODUCTS}`);
    expect(response.status(), 'Product list should return HTTP 200').toBe(200);

    const products = await response.json();
    expect(Array.isArray(products), 'Product response should be an array').toBeTruthy();
    expect(products.length, 'At least one product should be returned').toBeGreaterThan(0);

    for (const product of products) {
      expect(product).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          title: expect.any(String),
          price: expect.any(Number),
          category: expect.any(String),
          image: expect.any(String),
        }),
      );
    }
  });

  test('GET - Product by ID @master @sanity @api', async ({ request }) => {
    const response = await request.get(
      `${BASE_URL}${Routes.GET_PRODUCT_BY_ID.replace('{id}', String(PRODUCT_ID))}`,
    );
    expect(response.status(), 'Product lookup should return HTTP 200').toBe(200);

    const product = await response.json();
    expect(product.id, 'Returned product ID should match the requested ID').toBe(PRODUCT_ID);
    expect(product).toEqual(
      expect.objectContaining({
        title: expect.any(String),
        price: expect.any(Number),
        category: expect.any(String),
        image: expect.any(String),
      }),
    );
  });

  test('GET - Products with limit @master @regression @api', async ({ request }) => {
    const route = Routes.GET_PRODUCTS_WITH_LIMIT.replace('{limit}', String(LIMIT));
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status()).toBe(200);

    const products = await response.json();
    expect(Array.isArray(products)).toBeTruthy();
    expect(products.length, 'The product count should match the requested limit').toBe(LIMIT);
  });

  test('GET - Products sorted ascending @master @regression @api', async ({ request }) => {
    const route = Routes.GET_PRODUCTS_SORTED.replace('{order}', 'asc');
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status()).toBe(200);

    const products = await response.json();
    const ids = products.map((product: { id: number }) => product.id);
    expect(ids).toEqual([...ids].sort((first, second) => first - second));
  });

  test('GET - Products sorted descending @master @regression @api', async ({ request }) => {
    const route = Routes.GET_PRODUCTS_SORTED.replace('{order}', 'desc');
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status()).toBe(200);

    const products = await response.json();
    const ids = products.map((product: { id: number }) => product.id);
    expect(ids).toEqual([...ids].sort((first, second) => second - first));
  });

  test('GET - All product categories @master @sanity @api', async ({ request }) => {
    const response = await request.get(`${BASE_URL}${Routes.GET_ALL_CATEGORIES}`);
    expect(response.status()).toBe(200);

    const categories = await response.json();
    expect(Array.isArray(categories)).toBeTruthy();
    expect(categories.length, 'The category list should not be empty').toBeGreaterThan(0);
    expect(categories.every((category: unknown) => typeof category === 'string')).toBeTruthy();
  });

  test('GET - Products by category @master @regression @api', async ({ request }) => {
    const category = 'electronics';
    const route = Routes.GET_PRODUCTS_BY_CATEGORY.replace('{category}', category);
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status()).toBe(200);

    const products = await response.json();
    expect(Array.isArray(products)).toBeTruthy();
    expect(products.length, 'The category should contain products').toBeGreaterThan(0);
    expect(products.every((product: { category: string }) => product.category === category)).toBe(
      true,
    );
  });

  // ---------------------------------------------------------
  // Products - POST / PUT / DELETE
  // ---------------------------------------------------------

  test('POST - Create product @master @regression @api', async ({ request }) => {
    const payload = RandomDataUtil.generateProductPayload();
    const response = await request.post(`${BASE_URL}${Routes.CREATE_PRODUCT}`, { data: payload });
    expect(response.status(), 'Product creation should return HTTP 201').toBe(201);

    const createdProduct = await response.json();
    expect(typeof createdProduct.id, 'A generated product ID should be returned').toBe('number');
    expect(createdProduct).toEqual(expect.objectContaining(payload));
  });

  test('PUT - Update product @master @regression @api', async ({ request }) => {
    const payload = RandomDataUtil.generateUpdatedProductPayload();
    const route = Routes.UPDATE_PRODUCT.replace('{id}', String(PRODUCT_ID));
    const response = await request.put(`${BASE_URL}${route}`, { data: payload });
    expect(response.status(), 'Product update should return HTTP 200').toBe(200);

    const updatedProduct = await response.json();
    expect(updatedProduct.id).toBe(PRODUCT_ID);
    expect(updatedProduct.title).toBe(payload.title);
    expect(updatedProduct.price).toBe(payload.price);
    expect(updatedProduct.description).toBe(payload.description);
    expect(updatedProduct.image).toBe(payload.image);
    expect(updatedProduct.category).toBe(payload.category);
  });

  test('DELETE - Product @master @regression @api', async ({ request }) => {
    const route = Routes.DELETE_PRODUCT.replace('{id}', String(PRODUCT_ID));
    const response = await request.delete(`${BASE_URL}${route}`);
    expect(response.status(), 'Product deletion should return HTTP 200').toBe(200);
  });

  // ---------------------------------------------------------
  // Users - GET
  // ---------------------------------------------------------

  test('GET - All users @master @sanity @api', async ({ request }) => {
    const response = await request.get(`${BASE_URL}${Routes.GET_ALL_USERS}`);
    expect(response.status()).toBe(200);

    const users = await response.json();
    expect(Array.isArray(users)).toBeTruthy();
    expect(users.length, 'At least one user should be returned').toBeGreaterThan(0);
  });

  test('GET - User by ID @master @sanity @api', async ({ request }) => {
    const route = Routes.GET_USER_BY_ID.replace('{id}', String(USER_ID));
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status()).toBe(200);

    const user = await response.json();
    expect(user.id, 'Returned user ID should match the requested ID').toBe(USER_ID);
  });

  test('GET - Users with limit @master @regression @api', async ({ request }) => {
    const route = Routes.GET_USERS_WITH_LIMIT.replace('{limit}', String(LIMIT));
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status()).toBe(200);

    const users = await response.json();
    expect(Array.isArray(users)).toBeTruthy();
    expect(users.length, 'The user count should match the requested limit').toBe(LIMIT);
  });

  test('GET - Users sorted ascending @master @regression @api', async ({ request }) => {
    const route = Routes.GET_USERS_SORTED.replace('{order}', 'asc');
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status()).toBe(200);

    const users = await response.json();
    const ids = users.map((user: { id: number }) => user.id);
    expect(ids).toEqual([...ids].sort((first, second) => first - second));
  });

  test('GET - Users sorted descending @master @regression @api', async ({ request }) => {
    const route = Routes.GET_USERS_SORTED.replace('{order}', 'desc');
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status()).toBe(200);

    const users = await response.json();
    const ids = users.map((user: { id: number }) => user.id);
    expect(ids).toEqual([...ids].sort((first, second) => second - first));
  });

  // ---------------------------------------------------------
  // Users - POST / PUT / DELETE
  // ---------------------------------------------------------

  test('POST - Create user @master @regression @api', async ({ request }) => {
    const payload = RandomDataUtil.generateUserPayload();
    const response = await request.post(`${BASE_URL}${Routes.CREATE_USER}`, { data: payload });
    expect(response.status(), 'User creation should return HTTP 201').toBe(201);

    const createdUser = await response.json();
    expect(typeof createdUser.id, 'A generated user ID should be returned').toBe('number');
  });

  test('PUT - Update user @master @regression @api', async ({ request }) => {
    const payload = RandomDataUtil.generateUserUpdatePayload();
    const route = Routes.UPDATE_USER.replace('{id}', String(USER_ID));
    const response = await request.put(`${BASE_URL}${route}`, { data: payload });
    expect(response.status()).toBe(200);

    const updatedUser = await response.json();
    expect(updatedUser.username).toBe(payload.username);
    expect(updatedUser.email).toBe(payload.email);
    expect(updatedUser.name).toEqual(payload.name);
    expect(updatedUser.address).toEqual(payload.address);
    expect(updatedUser.phone).toBe(payload.phone);
  });

  test('DELETE - User @master @regression @api', async ({ request }) => {
    const route = Routes.DELETE_USER.replace('{id}', String(USER_ID));
    const response = await request.delete(`${BASE_URL}${route}`);
    expect(response.status(), 'User deletion should return HTTP 200').toBe(200);
  });

  // ---------------------------------------------------------
  // Carts - GET
  // ---------------------------------------------------------

  test('GET - All carts @master @sanity @api', async ({ request }) => {
    const response = await request.get(`${BASE_URL}${Routes.GET_ALL_CARTS}`);
    expect(response.status()).toBe(200);

    const carts = await response.json();
    expect(Array.isArray(carts)).toBeTruthy();
    expect(carts.length, 'At least one cart should be returned').toBeGreaterThan(0);
  });

  test('GET - Cart by ID @master @sanity @api', async ({ request }) => {
    const route = Routes.GET_CART_BY_ID.replace('{id}', String(CART_ID));
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status()).toBe(200);

    const cart = await response.json();
    expect(cart.id, 'Returned cart ID should match the requested ID').toBe(CART_ID);
  });

  test('GET - Carts by date range @master @regression @api', async ({ request }) => {
    const route = Routes.GET_CARTS_BY_DATE_RANGE
      .replace('{startdate}', START_DATE)
      .replace('{enddate}', END_DATE);
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status()).toBe(200);

    const carts = await response.json();
    expect(Array.isArray(carts)).toBeTruthy();
    for (const cart of carts) {
      const cartDate = String(cart.date).slice(0, 10);
      expect(cartDate >= START_DATE && cartDate <= END_DATE).toBe(true);
    }
  });

  test('GET - Carts by user @master @regression @api', async ({ request }) => {
    const route = Routes.GET_USER_CART.replace('{userId}', String(USER_ID));
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status()).toBe(200);

    const carts = await response.json();
    expect(Array.isArray(carts)).toBeTruthy();
    expect(carts.length, 'The configured user should have carts').toBeGreaterThan(0);
    expect(carts.every((cart: { userId: number }) => cart.userId === USER_ID)).toBe(true);
  });

  test('GET - Carts with limit @master @regression @api', async ({ request }) => {
    const route = Routes.GET_CARTS_WITH_LIMIT.replace('{limit}', String(LIMIT));
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status()).toBe(200);

    const carts = await response.json();
    expect(Array.isArray(carts)).toBeTruthy();
    expect(carts.length, 'The cart count should match the requested limit').toBe(LIMIT);
  });

  test('GET - Carts sorted ascending @master @regression @api', async ({ request }) => {
    const route = Routes.GET_CARTS_SORTED.replace('{order}', 'asc');
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status()).toBe(200);

    const carts = await response.json();
    const ids = carts.map((cart: { id: number }) => cart.id);
    expect(ids).toEqual([...ids].sort((first, second) => first - second));
  });

  test('GET - Carts sorted descending @master @regression @api', async ({ request }) => {
    const route = Routes.GET_CARTS_SORTED.replace('{order}', 'desc');
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status()).toBe(200);

    const carts = await response.json();
    const ids = carts.map((cart: { id: number }) => cart.id);
    expect(ids).toEqual([...ids].sort((first, second) => second - first));
  });

  // ---------------------------------------------------------
  // Carts - POST / PUT / DELETE
  // ---------------------------------------------------------

  test('POST - Create cart @master @regression @api', async ({ request }) => {
    const payload = RandomDataUtil.generateCartPayload(USER_ID);
    const response = await request.post(`${BASE_URL}${Routes.CREATE_CART}`, { data: payload });
    expect(response.status(), 'Cart creation should return HTTP 201').toBe(201);

    const createdCart = await response.json();
    expect(typeof createdCart.id, 'A generated cart ID should be returned').toBe('number');
    expect(createdCart.userId).toBe(payload.userId);
    expect(createdCart.products).toEqual(payload.products);
  });

  test('PUT - Update cart @master @regression @api', async ({ request }) => {
    const payload = RandomDataUtil.generateUpdatedCartPayload(USER_ID);
    const route = Routes.UPDATE_CART.replace('{id}', String(CART_ID));
    const response = await request.put(`${BASE_URL}${route}`, { data: payload });
    expect(response.status()).toBe(200);

    const updatedCart = await response.json();
    expect(updatedCart.userId).toBe(payload.userId);
    expect(updatedCart.products).toEqual(payload.products);
  });

  test('DELETE - Cart @master @regression @api', async ({ request }) => {
    const route = Routes.DELETE_CART.replace('{id}', String(CART_ID));
    const response = await request.delete(`${BASE_URL}${route}`);
    expect(response.status(), 'Cart deletion should return HTTP 200').toBe(200);
  });

  // ---------------------------------------------------------
  // JSON Schema Validation
  // ---------------------------------------------------------

  test('GET - Product response schema @master @regression @api', async ({ request }) => {
    const route = Routes.GET_PRODUCT_BY_ID.replace('{id}', String(PRODUCT_ID));
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status()).toBe(200);

    const schema = DataProvider.readJson('api/schemas/product_api_schema.json');
    const validate = new Ajv().compile(schema);
    const isValid = validate(await response.json());
    expect(isValid, `Product schema validation failed: ${JSON.stringify(validate.errors)}`).toBe(
      true,
    );
  });

  test('GET - User response schema @master @regression @api', async ({ request }) => {
    const route = Routes.GET_USER_BY_ID.replace('{id}', String(USER_ID));
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status()).toBe(200);

    const schema = DataProvider.readJson('api/schemas/user_api_schema.json');
    const validate = new Ajv().compile(schema);
    const isValid = validate(await response.json());
    expect(isValid, `User schema validation failed: ${JSON.stringify(validate.errors)}`).toBe(true);
  });

  test('GET - Cart response schema @master @regression @api', async ({ request }) => {
    const route = Routes.GET_CART_BY_ID.replace('{id}', String(CART_ID));
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status()).toBe(200);

    const schema = DataProvider.readJson('api/schemas/cart_api_schema.json');
    const validate = new Ajv().compile(schema);
    const isValid = validate(await response.json());
    expect(isValid, `Cart schema validation failed: ${JSON.stringify(validate.errors)}`).toBe(true);
  });
});

// ---------------------------------------------------------
// End-to-End CRUD Workflows
// ---------------------------------------------------------

test.describe.serial('FakeStore Product CRUD Workflow', () => {
  const BASE_URL = process.env.API_BASE_URL || Routes.BASE_URL;

  test('POST - PUT - DELETE product using the created ID @master @regression @api', async ({
    request,
  }) => {
    const productPayload = RandomDataUtil.generateProductPayload();
    const createResponse = await request.post(`${BASE_URL}${Routes.CREATE_PRODUCT}`, {
      data: productPayload,
    });
    expect(createResponse.status()).toBe(201);

    const createdProduct = await createResponse.json();
    expect(typeof createdProduct.id).toBe('number');

    const updatedProductPayload = RandomDataUtil.generateUpdatedProductPayload();
    const updateRoute = Routes.UPDATE_PRODUCT.replace('{id}', String(createdProduct.id));
    const updateResponse = await request.put(`${BASE_URL}${updateRoute}`, {
      data: updatedProductPayload,
    });
    expect(updateResponse.status()).toBe(200);

    const updatedProduct = await updateResponse.json();
    expect(updatedProduct.id).toBe(createdProduct.id);
    expect(updatedProduct.title).toBe(updatedProductPayload.title);
    expect(updatedProduct.price).toBe(updatedProductPayload.price);

    const deleteRoute = Routes.DELETE_PRODUCT.replace('{id}', String(createdProduct.id));
    const deleteResponse = await request.delete(`${BASE_URL}${deleteRoute}`);
    expect(deleteResponse.status()).toBe(200);
  });
});

test.describe.serial('FakeStore User CRUD Workflow', () => {
  const BASE_URL = process.env.API_BASE_URL || Routes.BASE_URL;

  test('POST - PUT - DELETE user using the created ID @master @regression @api', async ({
    request,
  }) => {
    const userPayload = RandomDataUtil.generateUserPayload();
    const createResponse = await request.post(`${BASE_URL}${Routes.CREATE_USER}`, {
      data: userPayload,
    });
    expect(createResponse.status()).toBe(201);

    const createdUser = await createResponse.json();
    expect(typeof createdUser.id).toBe('number');

    const updatedUserPayload = RandomDataUtil.generateUserUpdatePayload();
    const updateRoute = Routes.UPDATE_USER.replace('{id}', String(createdUser.id));
    const updateResponse = await request.put(`${BASE_URL}${updateRoute}`, {
      data: updatedUserPayload,
    });
    expect(updateResponse.status()).toBe(200);

    const updatedUser = await updateResponse.json();
    expect(updatedUser.username).toBe(updatedUserPayload.username);
    expect(updatedUser.email).toBe(updatedUserPayload.email);
    expect(updatedUser.name).toEqual(updatedUserPayload.name);

    const deleteRoute = Routes.DELETE_USER.replace('{id}', String(createdUser.id));
    const deleteResponse = await request.delete(`${BASE_URL}${deleteRoute}`);
    expect(deleteResponse.status()).toBe(200);
  });
});

test.describe.serial('FakeStore Cart CRUD Workflow', () => {
  const BASE_URL = process.env.API_BASE_URL || Routes.BASE_URL;
  const USER_ID = Number(process.env.USER_ID ?? 1);

  test('POST - PUT - DELETE cart using the created ID @master @regression @api', async ({
    request,
  }) => {
    const cartPayload = RandomDataUtil.generateCartPayload(USER_ID);
    const createResponse = await request.post(`${BASE_URL}${Routes.CREATE_CART}`, {
      data: cartPayload,
    });
    expect(createResponse.status()).toBe(201);

    const createdCart = await createResponse.json();
    expect(typeof createdCart.id).toBe('number');
    expect(createdCart.userId).toBe(cartPayload.userId);
    expect(createdCart.products).toEqual(cartPayload.products);

    const updatedCartPayload = RandomDataUtil.generateUpdatedCartPayload(createdCart.userId);
    updatedCartPayload.products[0].productId = cartPayload.products[0].productId;
    updatedCartPayload.products[0].quantity = cartPayload.products[0].quantity + 1;
    const updateRoute = Routes.UPDATE_CART.replace('{id}', String(createdCart.id));
    const updateResponse = await request.put(`${BASE_URL}${updateRoute}`, {
      data: updatedCartPayload,
    });
    expect(updateResponse.status()).toBe(200);

    const updatedCart = await updateResponse.json();
    expect(updatedCart.userId).toBe(createdCart.userId);
    expect(updatedCart.products[0].quantity).toBe(updatedCartPayload.products[0].quantity);

    const deleteRoute = Routes.DELETE_CART.replace('{id}', String(createdCart.id));
    const deleteResponse = await request.delete(`${BASE_URL}${deleteRoute}`);
    expect(deleteResponse.status()).toBe(200);
  });
});
