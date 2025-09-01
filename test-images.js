const { chromium } = require('playwright');

async function testImages() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🔍 Testing image loading on https://italskebrasnarstvi-eshop-nu.vercel.app');
  
  // Navigate to the page
  await page.goto('https://italskebrasnarstvi-eshop-nu.vercel.app');
  await page.waitForLoadState('networkidle');
  
  // Wait for product grid to load
  try {
    await page.waitForSelector('[data-testid="product-grid"], .grid', { timeout: 10000 });
    console.log('✅ Product grid found');
  } catch (e) {
    console.log('❌ Product grid not found, checking for products anyway');
  }
  
  // Check for product images
  const images = await page.locator('img').all();
  console.log(`📷 Found ${images.length} images on page`);
  
  let loadedImages = 0;
  let failedImages = 0;
  
  for (let i = 0; i < Math.min(images.length, 20); i++) { // Test first 20 images
    const img = images[i];
    const src = await img.getAttribute('src');
    const alt = await img.getAttribute('alt');
    
    if (src && src.includes('/images/')) {
      console.log(`\n🖼️  Testing image: ${src}`);
      console.log(`   Alt text: ${alt || 'N/A'}`);
      
      // Check if image is actually loaded
      const isVisible = await img.isVisible();
      const naturalWidth = await img.evaluate(img => img.naturalWidth);
      const naturalHeight = await img.evaluate(img => img.naturalHeight);
      
      console.log(`   Visible: ${isVisible}`);
      console.log(`   Natural dimensions: ${naturalWidth}x${naturalHeight}`);
      
      if (naturalWidth > 0 && naturalHeight > 0) {
        loadedImages++;
        console.log('   ✅ Image loaded successfully');
      } else {
        failedImages++;
        console.log('   ❌ Image failed to load');
      }
    }
  }
  
  console.log(`\n📊 SUMMARY:`);
  console.log(`   ✅ Successfully loaded: ${loadedImages}`);
  console.log(`   ❌ Failed to load: ${failedImages}`);
  
  // Take a screenshot
  await page.screenshot({ path: 'homepage-test.png', fullPage: true });
  console.log('📸 Screenshot saved as homepage-test.png');
  
  await browser.close();
}

testImages().catch(console.error);