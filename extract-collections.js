const fs = require('fs');
const path = require('path');

// Path to the CSV file
const csvPath = 'C:\\Users\\hynex\\Downloads\\all_products_www.piquadro.com (2).csv';

function parseCSV(csvContent) {
  const lines = csvContent.split('\n');
  const header = lines[0].split(',');
  
  // Find column indices
  const variantSkuIndex = header.indexOf('Variant SKU');
  const tagsIndex = header.indexOf('Tags');
  
  const collections = new Map();
  const skuToCollection = new Map();
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV line (handling quoted fields)
    const fields = parseCSVLine(line);
    if (fields.length < Math.max(variantSkuIndex, tagsIndex)) continue;
    
    const sku = fields[variantSkuIndex]?.trim();
    const tags = fields[tagsIndex]?.trim();
    
    if (!sku || !tags) continue;
    
    // Extract collection info
    const collectionMatch = tags.match(/PfsCollection:([A-Z0-9]+)/);
    const collectionDescMatch = tags.match(/a_pfscollection_description:([^,]+)/);
    
    if (collectionMatch) {
      const collectionCode = collectionMatch[1];
      let collectionName = collectionCode;
      
      // Extract full collection name from description
      // Format: "a_pfscollection_description:COLLECTION NAME, CODE, COLLECTION NAME, ..."
      if (collectionDescMatch) {
        const desc = collectionDescMatch[1].trim();
        const parts = desc.split(',').map(p => p.trim());
        
        // The first part is usually the collection name
        const firstPart = parts[0];
        
        // Skip if it's just the collection code or empty
        if (firstPart && 
            firstPart !== collectionCode && 
            firstPart.length > 2 &&
            !firstPart.match(/^[A-Z0-9]{1,4}$/)) {
          collectionName = firstPart;
        }
      }
      
      // Store collection mapping
      collections.set(collectionCode, collectionName);
      skuToCollection.set(sku, {
        code: collectionCode,
        name: collectionName
      });
    }
  }
  
  return { collections, skuToCollection };
}

function parseCSVLine(line) {
  const fields = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"' && (i === 0 || line[i-1] === ',')) {
      inQuotes = true;
    } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
      inQuotes = false;
    } else if (char === ',' && !inQuotes) {
      fields.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }
  
  // Add the last field
  fields.push(currentField);
  
  return fields;
}

// Main execution
try {
  console.log('📖 Reading CSV file...');
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  
  console.log('🔍 Parsing collections...');
  const { collections, skuToCollection } = parseCSV(csvContent);
  
  console.log(`\n📊 Found ${collections.size} unique collections:`);
  
  // Sort collections by name for better readability
  const sortedCollections = Array.from(collections.entries())
    .sort((a, b) => a[1].localeCompare(b[1]))
    .slice(0, 20); // Show top 20
  
  sortedCollections.forEach(([code, name]) => {
    const count = Array.from(skuToCollection.values())
      .filter(item => item.code === code).length;
    console.log(`   ${code.padEnd(8)} → ${name.padEnd(25)} (${count} products)`);
  });
  
  // Create collection mapping for the database
  const collectionMapping = {};
  collections.forEach((name, code) => {
    collectionMapping[code] = name;
  });
  
  // Save collection mapping to JSON
  fs.writeFileSync(
    path.join(__dirname, 'collection-mapping.json'), 
    JSON.stringify(collectionMapping, null, 2)
  );
  
  // Create SKU to collection mapping
  const skuMapping = {};
  skuToCollection.forEach((collection, sku) => {
    skuMapping[sku] = collection;
  });
  
  fs.writeFileSync(
    path.join(__dirname, 'sku-to-collection.json'),
    JSON.stringify(skuMapping, null, 2)
  );
  
  console.log(`\n✅ Created mapping files:`);
  console.log(`   📄 collection-mapping.json (${Object.keys(collectionMapping).length} collections)`);
  console.log(`   📄 sku-to-collection.json (${Object.keys(skuMapping).length} SKUs)`);
  
  // Show some examples
  console.log(`\n🔍 Examples:`);
  let count = 0;
  for (const [sku, collection] of skuToCollection) {
    if (count >= 5) break;
    console.log(`   ${sku} → ${collection.name} (${collection.code})`);
    count++;
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
}