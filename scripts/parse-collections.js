const fs = require('fs');

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function extractCollections(tags) {
  if (!tags) return [];
  
  const collections = new Set();
  
  // Look for PfsCollection tag
  const collectionMatch = tags.match(/PfsCollection:([^,]+)/);
  if (collectionMatch) {
    collections.add(collectionMatch[1].trim());
  }
  
  // Look for collection descriptions
  const descMatch = tags.match(/a_pfscollection_description:([^,]+)/);
  if (descMatch) {
    const desc = descMatch[1].trim();
    // Split by comma and extract collection names
    const collectionNames = desc.split(',').map(c => c.trim());
    collectionNames.forEach(name => {
      if (name && name !== 'gender:' && name !== 'model_group:' && !name.includes(':')) {
        collections.add(name);
      }
    });
  }
  
  return Array.from(collections);
}

function parseCollections() {
  try {
    const csvPath = 'C:\\Users\\hynex\\Downloads\\all_products_www.piquadro.com (2).csv';
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    
    if (lines.length <= 1) {
      console.log('No data to parse');
      return;
    }
    
    // Parse header
    const header = parseCSVLine(lines[0]);
    console.log('Parsing collections from CSV...\n');
    
    const allCollections = new Set();
    let processedLines = 0;
    
    // Process each line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const data = parseCSVLine(line);
      if (data.length < header.length) continue;
      
      const row = {};
      header.forEach((col, index) => {
        row[col] = data[index] || '';
      });
      
      const tags = row['Tags'];
      const title = row['Title'];
      
      // Only process rows with title (main product rows)
      if (title && tags) {
        const collections = extractCollections(tags);
        collections.forEach(collection => allCollections.add(collection));
      }
      
      processedLines++;
      if (processedLines % 100 === 0) {
        console.log(`Processed ${processedLines} lines...`);
      }
    }
    
    console.log(`\n=== FOUND COLLECTIONS ===`);
    console.log(`Total unique collections: ${allCollections.size}\n`);
    
    // Sort and display collections
    const sortedCollections = Array.from(allCollections).sort();
    sortedCollections.forEach((collection, index) => {
      console.log(`${index + 1}. ${collection}`);
    });
    
    // Save to file for reference
    const collectionsData = {
      total: allCollections.size,
      collections: sortedCollections,
      extractedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(
      'C:\\Users\\hynex\\Desktop\\italskebrasnarstvi eshop\\collections-extracted.json', 
      JSON.stringify(collectionsData, null, 2)
    );
    
    console.log('\nCollections saved to collections-extracted.json');
    
  } catch (error) {
    console.error('Error parsing collections:', error.message);
  }
}

// Run the parser
parseCollections();