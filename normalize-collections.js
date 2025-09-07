const fs = require('fs');

// Load current mapping
console.log('📖 Loading current collection mapping...');
const collectionMapping = JSON.parse(fs.readFileSync('./collection-mapping.json', 'utf8'));
const skuMapping = JSON.parse(fs.readFileSync('./sku-to-collection.json', 'utf8'));

// Normalize collection names
const normalizedMapping = {};
const collectionNormalization = {
  // Blue Square variations
  'BLUE SQUARE': 'Blue Square',
  'Blue Square': 'Blue Square',
  
  // Black Square variations  
  'BLACK SQUARE': 'Black Square',
  'Black Square': 'Black Square',
  
  // Other common variations
  'COLLEZIONE BAGMOTIC': 'BagMotic',
  'Collezione BagMotic': 'BagMotic',
  
  'COLLEZIONE MODUS RESTYLING': 'Modus Restyling',
  'Collezione MODUS Restyling': 'Modus Restyling',
  
  'URBAN': 'Urban',
  'Urban': 'Urban',
  
  'CIRCLE': 'Circle',  
  'Circle': 'Circle',
  
  'BRIEF 2': 'Brief 2',
  'Brief 2': 'Brief 2',
  
  // Keep others as is but capitalize properly
};

console.log('🔄 Normalizing collection names...');

// Create normalized mapping
Object.entries(collectionMapping).forEach(([code, name]) => {
  let normalizedName = collectionNormalization[name];
  
  if (!normalizedName) {
    // Auto-normalize: capitalize first letter of each word
    normalizedName = name.toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  normalizedMapping[code] = normalizedName;
});

// Update SKU mapping with normalized names
const normalizedSkuMapping = {};
Object.entries(skuMapping).forEach(([sku, collection]) => {
  normalizedSkuMapping[sku] = {
    code: collection.code,
    name: normalizedMapping[collection.code] || collection.name
  };
});

// Show changes
console.log('\n🔍 Collection name changes:');
Object.entries(collectionMapping).forEach(([code, oldName]) => {
  const newName = normalizedMapping[code];
  if (oldName !== newName) {
    console.log(`   ${code}: "${oldName}" → "${newName}"`);
  }
});

// Save normalized versions
fs.writeFileSync('./collection-mapping-normalized.json', JSON.stringify(normalizedMapping, null, 2));
fs.writeFileSync('./sku-to-collection-normalized.json', JSON.stringify(normalizedSkuMapping, null, 2));

console.log('\n✅ Normalized mapping files created:');
console.log('   📄 collection-mapping-normalized.json');
console.log('   📄 sku-to-collection-normalized.json');

// Show final stats
const collectionStats = {};
Object.values(normalizedSkuMapping).forEach(item => {
  if (!collectionStats[item.name]) {
    collectionStats[item.name] = { count: 0, code: item.code };
  }
  collectionStats[item.name].count++;
});

console.log('\n📊 Top collections after normalization:');
Object.entries(collectionStats)
  .sort((a, b) => b[1].count - a[1].count)
  .slice(0, 15)
  .forEach(([name, stats]) => {
    console.log(`   ${stats.code.padEnd(8)} → ${name.padEnd(30)} (${stats.count} products)`);
  });