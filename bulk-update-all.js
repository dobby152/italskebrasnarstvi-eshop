const fs = require('fs');

// Read the complete SQL file and execute it in one go
console.log('📖 Reading complete collection updates...');
const fullSql = fs.readFileSync('./update-our-products-collections.sql', 'utf8');

// Split into smaller chunks for MCP execution (due to query limits)
const updates = fullSql.split('\n').filter(line => line.trim());
console.log(`📊 Total updates: ${updates.length}`);

// Create chunks of 100 updates each
const chunkSize = 100;
const chunks = [];

for (let i = 0; i < updates.length; i += chunkSize) {
  const chunk = updates.slice(i, i + chunkSize).join('\n');
  chunks.push(chunk);
}

console.log(`📦 Created ${chunks.length} chunks of ${chunkSize} updates each`);

// Save chunks for manual execution
chunks.forEach((chunk, index) => {
  const filename = `final-update-${(index + 1).toString().padStart(2, '0')}.sql`;
  fs.writeFileSync(filename, chunk);
  console.log(`💾 Created ${filename}`);
});

// Create a single smaller test batch for immediate execution
const testBatch = updates.slice(0, 50).join('\n');
fs.writeFileSync('test-batch-collections.sql', testBatch);

console.log('\n✅ Files created:');
console.log(`   📄 final-update-01.sql to final-update-${chunks.length.toString().padStart(2, '0')}.sql`);
console.log('   📄 test-batch-collections.sql (first 50 updates for testing)');

console.log('\n📋 Next steps:');
console.log('1. Run test-batch-collections.sql first');
console.log('2. Check progress with check-progress.sql');
console.log('3. Run remaining final-update-XX.sql files');
console.log('4. Final verification with verify-our-collections.sql');