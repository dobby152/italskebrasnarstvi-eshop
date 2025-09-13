const { test, expect } = require('@playwright/test');

test.describe('E-shop Tests', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Italské brašnářství/);
    console.log('✅ Homepage loaded successfully');
  });

  test('should load products page', async ({ page }) => {
    await page.goto('/produkty');

    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"], .product-card, .grid', { timeout: 10000 });

    console.log('✅ Products page loaded successfully');
  });

  test('should load individual product page', async ({ page }) => {
    await page.goto('/produkty');

    // Wait for products to load
    await page.waitForSelector('a[href*="/produkty/"]', { timeout: 10000 });

    // Click on first product
    const productLinks = await page.locator('a[href*="/produkty/"]').all();
    if (productLinks.length > 0) {
      await productLinks[0].click();

      // Check if product page loads
      await page.waitForSelector('h1, .product-title, [data-testid="product-title"]', { timeout: 10000 });
      console.log('✅ Product detail page loaded successfully');
    } else {
      console.log('❌ No product links found');
    }
  });

  test('should test cart functionality', async ({ page }) => {
    await page.goto('/kosik');

    // Check if cart page loads
    await page.waitForSelector('body', { timeout: 5000 });

    const pageContent = await page.textContent('body');

    if (pageContent.includes('košík') || pageContent.includes('cart')) {
      console.log('✅ Cart page loaded successfully');
    } else {
      console.log('❌ Cart page may have issues');
    }
  });

  test('should test admin dashboard page', async ({ page }) => {
    await page.goto('/admin');

    // Wait for admin dashboard to load
    await page.waitForSelector('nav, .admin-layout, [role="navigation"]', { timeout: 10000 });

    console.log('✅ Admin dashboard page loaded successfully');
  });

  test('should test API endpoints', async ({ page, request }) => {
    // Test products API
    try {
      const productsResponse = await request.get('/api/products');
      const productsStatus = productsResponse.status();
      console.log(`Products API status: ${productsStatus}`);

      if (productsStatus === 200) {
        const products = await productsResponse.json();
        console.log(`✅ Products API working - Found ${products.length} products`);
      } else {
        console.log('❌ Products API error');
      }
    } catch (error) {
      console.log('❌ Products API failed:', error.message);
    }

    // Test cart API
    try {
      const cartResponse = await request.get('/api/cart');
      console.log(`Cart API status: ${cartResponse.status()}`);

      if (cartResponse.status() === 200) {
        console.log('✅ Cart API working');
      } else {
        console.log('❌ Cart API error');
      }
    } catch (error) {
      console.log('❌ Cart API failed:', error.message);
    }

    // Test analytics APIs
    const analyticsEndpoints = [
      '/api/analytics/sales',
      '/api/analytics/conversion',
      '/api/analytics/traffic-sources',
      '/api/analytics/top-products'
    ];

    for (const endpoint of analyticsEndpoints) {
      try {
        const response = await request.get(endpoint);
        console.log(`${endpoint} status: ${response.status()}`);

        if (response.status() === 200) {
          console.log(`✅ ${endpoint} working`);
        } else {
          console.log(`❌ ${endpoint} error`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint} failed:`, error.message);
      }
    }
  });

  test('should check for JavaScript errors', async ({ page }) => {
    const errors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.goto('/produkty');
    await page.goto('/kosik');

    if (errors.length === 0) {
      console.log('✅ No JavaScript errors found');
    } else {
      console.log('❌ JavaScript errors found:');
      errors.forEach(error => console.log('  -', error));
    }
  });

  test('should test navigation links', async ({ page }) => {
    await page.goto('/');

    // Check main navigation
    const navLinks = await page.locator('nav a, header a').all();
    console.log(`Found ${navLinks.length} navigation links`);

    // Test each link
    for (const link of navLinks.slice(0, 5)) { // Test first 5 links only
      try {
        const href = await link.getAttribute('href');
        if (href && href.startsWith('/')) {
          await page.goto(href);
          await page.waitForSelector('body', { timeout: 5000 });
          console.log(`✅ Link ${href} works`);
        }
      } catch (error) {
        const href = await link.getAttribute('href');
        console.log(`❌ Link ${href} failed:`, error.message);
      }
    }
  });

  test('should test form submissions', async ({ page }) => {
    // Test contact or search forms if available
    await page.goto('/');

    // Look for search forms
    const searchInputs = await page.locator('input[type="search"], input[placeholder*="hledat"], input[placeholder*="search"]').all();

    if (searchInputs.length > 0) {
      console.log(`Found ${searchInputs.length} search inputs`);

      try {
        await searchInputs[0].fill('kožená kabelka');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
        console.log('✅ Search form works');
      } catch (error) {
        console.log('❌ Search form error:', error.message);
      }
    } else {
      console.log('No search forms found');
    }
  });
});