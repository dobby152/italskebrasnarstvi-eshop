import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test('should load admin dashboard without errors', async ({ page }) => {
    await page.goto('/admin');
    
    // Check if page loads without errors
    await expect(page).toHaveTitle(/Admin Dashboard/i);
    
    // Check if main sections are visible
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should display products data', async ({ page }) => {
    await page.goto('/admin/products');
    
    // Wait for products to load
    await page.waitForSelector('[data-testid="products-table"]', { timeout: 10000 });
    
    // Check if products are displayed
    const productRows = await page.locator('tr').count();
    expect(productRows).toBeGreaterThan(1); // Header + at least one product
  });

  test('should display dashboard stats', async ({ page }) => {
    await page.goto('/admin');
    
    // Wait for stats to load
    await page.waitForSelector('[data-testid="dashboard-stats"]', { timeout: 10000 });
    
    // Check if stats cards are visible
    await expect(page.locator('text=Produkty')).toBeVisible();
    await expect(page.locator('text=Objednávky')).toBeVisible();
    await expect(page.locator('text=Zákazníci')).toBeVisible();
  });

  test('should load warehouse data', async ({ page }) => {
    await page.goto('/admin/warehouse');
    
    // Wait for warehouse data to load
    await page.waitForSelector('[data-testid="warehouse-stats"]', { timeout: 10000 });
    
    // Check if warehouse stats are visible
    await expect(page.locator('text=Skladové zásoby')).toBeVisible();
  });
});