const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Supabase connection
const supabase = createClient(
  'https://dbnfkzctensbpktgbsgn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY3OTQ0OCwiZXhwIjoyMDcxMjU1NDQ4fQ.llqxG-lE7hintpsBBC1aRncgpPZSvyREQ8sKAVA533E'
);

async function updateExistingProducts() {
  console.log('🔄 Creating SQL for existing products only...');
  
  try {
    // Load normalized mapping
    const skuMapping = JSON.parse(fs.readFileSync('./sku-to-collection-normalized.json', 'utf8'));
    
    // Get all SKUs from database
    const { data: products, error } = await supabase
      .from('products')
      .select('sku');
    
    if (error) {
      throw error;
    }
    
    console.log(`📊 Found ${products.length} products in database`);
    
    // Filter mapping to only include existing products
    const existingUpdates = [];
    let matchCount = 0;
    
    products.forEach(product => {
      const collectionData = skuMapping[product.sku];
      if (collectionData) {
        existingUpdates.push({
          sku: product.sku,
          name: collectionData.name.replace(/'/g, "''"), // Escape quotes
          code: collectionData.code
        });
        matchCount++;
      }
    });
    
    console.log(`✅ ${matchCount} products have collection mapping`);
    console.log(`❌ ${products.length - matchCount} products have no mapping`);
    
    // Generate SQL for our existing products
    const sqlUpdates = existingUpdates.map(update => 
      `UPDATE products SET collection_name = '${update.name}', collection_code = '${update.code}' WHERE sku = '${update.sku}';`
    );
    
    // Create single SQL file for our products
    const sql = sqlUpdates.join('\n');
    fs.writeFileSync('./update-our-products-collections.sql', sql);
    
    console.log('📄 Created update-our-products-collections.sql');
    
    // Also create verification SQL
    const verifySQL = `
-- Check how many products now have collections
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN collection_code IS NOT NULL THEN 1 END) as products_with_collection,
  ROUND(
    COUNT(CASE WHEN collection_code IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 
    1
  ) as collection_coverage_percent
FROM products;

-- Show top collections
SELECT 
  collection_code,
  collection_name,
  COUNT(*) as product_count
FROM products 
WHERE collection_code IS NOT NULL
GROUP BY collection_code, collection_name
ORDER BY product_count DESC;

-- Show some examples
SELECT sku, collection_name, collection_code
FROM products 
WHERE collection_code IS NOT NULL
LIMIT 10;
`;
    
    fs.writeFileSync('./verify-our-collections.sql', verifySQL);
    
    console.log('📄 Created verify-our-collections.sql');
    console.log(`\n📊 Summary: ${matchCount} products will get collection data`);
    
    // Show some examples
    console.log('\n🔍 Examples of updates:');
    existingUpdates.slice(0, 10).forEach(update => {
      console.log(`   ${update.sku} → ${update.name} (${update.code})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

updateExistingProducts();