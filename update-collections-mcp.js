const fs = require('fs');

// Load normalized mapping
console.log('📖 Loading normalized collection mapping...');
const skuMapping = JSON.parse(fs.readFileSync('./sku-to-collection-normalized.json', 'utf8'));

console.log(`📊 Loaded mapping for ${Object.keys(skuMapping).length} SKUs`);

// Generate SQL for updating products
console.log('🔄 Generating update SQL...');

const updates = [];
Object.entries(skuMapping).forEach(([sku, collection]) => {
  updates.push(`
    UPDATE products 
    SET collection_name = '${collection.name.replace(/'/g, "''")}',
        collection_code = '${collection.code}'
    WHERE sku = '${sku}';`);
});

// Group into batches
const batchSize = 50;
const batches = [];
for (let i = 0; i < updates.length; i += batchSize) {
  batches.push(updates.slice(i, i + batchSize));
}

console.log(`📦 Created ${batches.length} batches of SQL updates`);

// Save batches to files
batches.forEach((batch, index) => {
  const sql = batch.join('\n');
  fs.writeFileSync(`./update-collections-batch-${index + 1}.sql`, sql);
});

console.log(`💾 Saved ${batches.length} SQL batch files`);

// Create a verification query
const verificationSQL = `
-- Verification queries
SELECT 
  collection_code,
  collection_name,
  COUNT(*) as product_count
FROM products 
WHERE collection_code IS NOT NULL
GROUP BY collection_code, collection_name
ORDER BY product_count DESC
LIMIT 20;

-- Summary stats
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN collection_code IS NOT NULL THEN 1 END) as products_with_collection,
  ROUND(
    COUNT(CASE WHEN collection_code IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 
    1
  ) as collection_coverage_percent
FROM products;
`;

fs.writeFileSync('./verify-collections.sql', verificationSQL);

console.log('✅ Files created:');
console.log(`   📄 update-collections-batch-1.sql to update-collections-batch-${batches.length}.sql`);
console.log('   📄 verify-collections.sql');
console.log('\nTo update the database:');
console.log('1. Run each batch file using Supabase MCP');
console.log('2. Run verify-collections.sql to check results');