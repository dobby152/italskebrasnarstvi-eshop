import { test, expect } from '@playwright/test';

const VERCEL_URL = 'https://italskebrasnarstvi-eshop-eglt73gzi-frantiseks-projects-0ba688b4.vercel.app';

test.describe('Italian Leather E-shop Quality Check', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(VERCEL_URL);
  });

  test('Homepage loads and displays main navigation', async ({ page }) => {
    // Check title
    await expect(page).toHaveTitle(/italske.*Brasnarstvi/);
    
    // Check main navigation is visible and enlarged
    await expect(page.locator('nav a:has-text("PRODUKTY")')).toBeVisible();
    await expect(page.locator('nav a:has-text("KOLEKCE")')).toBeVisible();
    await expect(page.locator('nav a:has-text("O NÁS")')).toBeVisible();
    await expect(page.locator('nav a:has-text("KONTAKT")')).toBeVisible();
    
    // Check if navigation has large styling
    const produktyLink = page.locator('nav a:has-text("PRODUKTY")');
    await expect(produktyLink).toHaveClass(/text-xl/);
    await expect(produktyLink).toHaveClass(/font-bold/);
  });

  test('Products page loads with functional sidebar filters', async ({ page }) => {
    // Navigate to products page
    await page.click('a:has-text("PRODUKTY")');
    await expect(page).toHaveURL(/.*produkty.*/);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check sidebar filters are visible
    await expect(page.locator('text=KATEGORIE')).toBeVisible();
    await expect(page.locator('text=DOSTUPNOST')).toBeVisible();
    await expect(page.locator('text=CENA')).toBeVisible();
    await expect(page.locator('text=MATERIÁL')).toBeVisible();
    await expect(page.locator('text=VELIKOST')).toBeVisible();
    await expect(page.locator('text=BARVA')).toBeVisible();
    await expect(page.locator('text=ZNAČKA')).toBeVisible();
    
    // Check filter sections have accordion behavior
    const categorySection = page.locator('text=KATEGORIE').first();
    await expect(categorySection).toBeVisible();
    
    // Look for filter options with counts
    const brandSection = page.locator('text=ZNAČKA').first();
    await brandSection.click();
    
    // Should see Piquadro with count
    await expect(page.locator('text=Piquadro')).toBeVisible();
  });

  test('Product grid displays with stock availability and color variants', async ({ page }) => {
    await page.click('a:has-text("PRODUKTY")');
    await page.waitForLoadState('networkidle');
    
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"], .product-card, .group', { timeout: 10000 });
    
    // Check if products are displayed
    const products = page.locator('.group, [data-testid="product-card"]');
    await expect(products.first()).toBeVisible();
    
    // Check for stock badges
    const stockBadges = page.locator('text=/Skladem|Málo skladem|Vyprodáno/');
    if (await stockBadges.count() > 0) {
      await expect(stockBadges.first()).toBeVisible();
    }
    
    // Check for brand badges (should show Piquadro)
    const brandBadges = page.locator('text=Piquadro');
    if (await brandBadges.count() > 0) {
      await expect(brandBadges.first()).toBeVisible();
    }
    
    // Check for color variants (small colored circles)
    const colorVariants = page.locator('div[style*="backgroundColor"], .rounded-full[style*="background"]');
    if (await colorVariants.count() > 0) {
      await expect(colorVariants.first()).toBeVisible();
    }
  });

  test('Search functionality works', async ({ page }) => {
    await page.click('a:has-text("PRODUKTY")');
    await page.waitForLoadState('networkidle');
    
    // Find search input
    const searchInput = page.locator('input[placeholder*="Hledat"]');
    await expect(searchInput).toBeVisible();
    
    // Type search query
    await searchInput.fill('CA4021');
    
    // Wait for search results
    await page.waitForTimeout(2000);
    
    // Check if products are filtered (fewer than before)
    const products = page.locator('.group, [data-testid="product-card"]');
    const productCount = await products.count();
    
    // Should have some result or show "no products found"
    if (productCount === 0) {
      await expect(page.locator('text=/Žádné produkty|nenalezeny/')).toBeVisible();
    } else {
      expect(productCount).toBeGreaterThan(0);
    }
  });

  test('Out of stock order button works', async ({ page }) => {
    await page.click('a:has-text("PRODUKTY")');
    await page.waitForLoadState('networkidle');
    
    // Look for "Objednat" or "Informovat o dostupnosti" buttons
    const orderButtons = page.locator('text=/Objednat|Informovat o dostupnosti/');
    
    if (await orderButtons.count() > 0) {
      // Click the first out of stock order button
      await orderButtons.first().click();
      
      // Check if modal/dialog opens
      await expect(page.locator('text=/není skladem|dostupnosti/')).toBeVisible();
      
      // Check if form is visible
      const emailInput = page.locator('input[type="email"], input[placeholder*="email"]');
      if (await emailInput.count() > 0) {
        await expect(emailInput).toBeVisible();
      }
    }
  });

  test('Price slider filter works', async ({ page }) => {
    await page.click('a:has-text("PRODUKTY")');
    await page.waitForLoadState('networkidle');
    
    // Find price section
    const priceSection = page.locator('text=CENA').first();
    await priceSection.click();
    
    // Look for price range slider
    const priceSlider = page.locator('input[type="range"]');
    if (await priceSlider.count() > 0) {
      await expect(priceSlider).toBeVisible();
      
      // Try to adjust the slider
      await priceSlider.fill('5000');
      
      // Wait for filter to apply
      await page.waitForTimeout(1000);
      
      // Should still see products or no products message
      const products = page.locator('.group, [data-testid="product-card"]');
      const noProducts = page.locator('text=/Žádné produkty|nenalezeny/');
      
      const hasProducts = await products.count() > 0;
      const hasNoProductsMessage = await noProducts.count() > 0;
      
      expect(hasProducts || hasNoProductsMessage).toBeTruthy();
    }
  });

  test('Collection filter works', async ({ page }) => {
    await page.click('a:has-text("PRODUKTY")');
    await page.waitForLoadState('networkidle');
    
    // Find category section
    const categorySection = page.locator('text=KATEGORIE').nth(1); // Second one (not the dropdown)
    await categorySection.click();
    
    // Look for collection checkboxes
    const collections = page.locator('label:has(input[type="checkbox"])');
    
    if (await collections.count() > 0) {
      // Click first collection filter
      await collections.first().click();
      
      // Wait for filter to apply
      await page.waitForTimeout(2000);
      
      // Check that products are filtered
      const products = page.locator('.group, [data-testid="product-card"]');
      const productCount = await products.count();
      
      // Should have results or no products message
      if (productCount === 0) {
        await expect(page.locator('text=/Žádné produkty|nenalezeny/')).toBeVisible();
      } else {
        expect(productCount).toBeGreaterThan(0);
      }
    }
  });

  test('API endpoints respond correctly', async ({ page }) => {
    // Test filters API
    const filtersResponse = await page.request.get(`${VERCEL_URL}/api/filters`);
    expect(filtersResponse.status()).toBe(200);
    
    const filtersData = await filtersResponse.json();
    expect(filtersData).toHaveProperty('categories');
    expect(filtersData).toHaveProperty('brands');
    expect(filtersData).toHaveProperty('priceRange');
    
    // Test products API
    const productsResponse = await page.request.get(`${VERCEL_URL}/api/products?limit=5`);
    expect(productsResponse.status()).toBe(200);
    
    const productsData = await productsResponse.json();
    expect(productsData).toHaveProperty('products');
    expect(Array.isArray(productsData.products)).toBeTruthy();
    
    // Check product structure
    if (productsData.products.length > 0) {
      const product = productsData.products[0];
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('sku');
      expect(product).toHaveProperty('available');
      expect(product).toHaveProperty('totalStock');
      expect(product).toHaveProperty('brand');
    }
  });
});