// Quick test of the availability system
const testStockService = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing Availability System');
  console.log('=' .repeat(50));
  
  // Test 1: Products API - Check if products have colorVariants
  console.log('\n1️⃣ Testing Products API:');
  try {
    const response = await fetch(`${baseUrl}/api/products?limit=5`);
    const data = await response.json();
    
    if (data.products && data.products.length > 0) {
      const product = data.products[0];
      console.log(`   ✅ Product SKU: ${product.sku}`);
      console.log(`   ✅ Stock: ${product.stock}`);
      console.log(`   ✅ Availability: ${product.availability}`);
      console.log(`   ✅ Has images: ${product.images?.length || 0}`);
    }
  } catch (error) {
    console.log(`   ❌ Products API error: ${error.message}`);
  }
  
  // Test 2: Variants API - Check if variants are detected
  console.log('\n2️⃣ Testing Variants API:');
  try {
    const response = await fetch(`${baseUrl}/api/variants?baseSku=OM5285OM5`);
    const data = await response.json();
    
    console.log(`   ✅ Base SKU: ${data.baseSku}`);
    console.log(`   ✅ Variants found: ${data.total}`);
    
    if (data.variants && data.variants.length > 0) {
      data.variants.forEach((variant, index) => {
        console.log(`   ${index + 1}. ${variant.sku} - ${variant.colorName} (${variant.stock}ks)`);
      });
    }
  } catch (error) {
    console.log(`   ❌ Variants API error: ${error.message}`);
  }
  
  // Test 3: Stock API - Check real stock data
  console.log('\n3️⃣ Testing Stock API:');
  const testSkus = ['OM5285OM5-BLU', 'OM5285OM5-N', 'CA3444MOS-N'];
  
  for (const sku of testSkus) {
    try {
      const response = await fetch(`${baseUrl}/api/stock/${sku}`);
      const data = await response.json();
      
      console.log(`   ${data.available ? '✅' : '❌'} ${sku}: ${data.totalStock}ks ${data.available ? 'dostupné' : 'nedostupné'}`);
      if (data.locations && data.locations.length > 0) {
        data.locations.forEach(loc => {
          console.log(`      📍 ${loc.location}: ${loc.stock}ks`);
        });
      }
    } catch (error) {
      console.log(`   ❌ Stock API error for ${sku}: ${error.message}`);
    }
  }
  
  console.log('\n🏁 Availability System Test Complete');
  console.log('=' .repeat(50));
};

// Run the test
testStockService().catch(console.error);