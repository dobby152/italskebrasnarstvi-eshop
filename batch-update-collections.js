const fs = require('fs');

// Read the full SQL file
console.log('📖 Reading update SQL file...');
const fullSql = fs.readFileSync('./update-our-products-collections.sql', 'utf8');
const allUpdates = fullSql.trim().split('\n').filter(line => line.trim());

console.log(`📊 Found ${allUpdates.length} update statements`);

// Create batches of 50 updates each
const batchSize = 50;
const batches = [];

for (let i = 0; i < allUpdates.length; i += batchSize) {
  const batch = allUpdates.slice(i, i + batchSize);
  batches.push(batch.join('\n'));
}

console.log(`📦 Created ${batches.length} batches of ${batchSize} updates each`);

// Save batches to files
batches.forEach((batch, index) => {
  const filename = `collection-update-batch-${(index + 1).toString().padStart(2, '0')}.sql`;
  fs.writeFileSync(filename, batch);
  console.log(`💾 Created ${filename}`);
});

console.log('\n✅ Batch files created!');
console.log('📝 To update all collections:');
console.log('   Run each batch file using Supabase MCP execute_sql');
console.log('   Or run the verification script first to see current status');

// Create a progress tracking script
const progressSql = `
-- Check current progress
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN collection_code IS NOT NULL THEN 1 END) as updated_products,
  COUNT(CASE WHEN collection_code IS NULL THEN 1 END) as remaining_products,
  ROUND(
    COUNT(CASE WHEN collection_code IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 
    1
  ) as completion_percent
FROM products;

-- Show collection distribution
SELECT 
  collection_name,
  collection_code,
  COUNT(*) as count
FROM products 
WHERE collection_code IS NOT NULL
GROUP BY collection_name, collection_code
ORDER BY count DESC;
`;

fs.writeFileSync('check-progress.sql', progressSql);
console.log('📄 Created check-progress.sql for monitoring progress');