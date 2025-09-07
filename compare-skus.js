const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Supabase connection
const supabase = createClient(
  'https://dbnfkzctensbpktgbsgn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY3OTQ0OCwiZXhwIjoyMDcxMjU1NDQ4fQ.llqxG-lE7hintpsBBC1aRncgpPZSvyREQ8sKAVA533E'
);

async function compareSkus() {
  console.log('🔍 Comparing SKUs from database with CSV...');
  
  try {
    // Load CSV mapping
    console.log('📖 Loading CSV mapping...');
    const skuMapping = JSON.parse(fs.readFileSync('./sku-to-collection.json', 'utf8'));
    const csvSkus = new Set(Object.keys(skuMapping));
    console.log(`📊 CSV contains: ${csvSkus.size} SKUs`);
    
    // Get database SKUs
    console.log('🗄️ Fetching database SKUs...');
    const { data: products, error } = await supabase
      .from('products')
      .select('sku');
    
    if (error) {
      throw error;
    }
    
    const dbSkus = new Set(products.map(p => p.sku));
    console.log(`🗄️ Database contains: ${dbSkus.size} SKUs`);
    
    // Find matches and misses
    const matches = [];
    const dbNotInCsv = [];
    const csvNotInDb = [];
    
    // Check DB SKUs against CSV
    for (const sku of dbSkus) {
      if (csvSkus.has(sku)) {
        matches.push({
          sku,
          collection: skuMapping[sku]
        });
      } else {
        dbNotInCsv.push(sku);
      }
    }
    
    // Check CSV SKUs against DB
    for (const sku of csvSkus) {
      if (!dbSkus.has(sku)) {
        csvNotInDb.push(sku);
      }
    }
    
    console.log('\n📊 COMPARISON RESULTS:');
    console.log('=' .repeat(50));
    console.log(`✅ Matches (DB ∩ CSV): ${matches.length} SKUs`);
    console.log(`❌ In DB but not in CSV: ${dbNotInCsv.length} SKUs`);
    console.log(`ℹ️  In CSV but not in DB: ${csvNotInDb.length} SKUs`);
    
    const matchPercentage = ((matches.length / dbSkus.size) * 100).toFixed(1);
    console.log(`\n🎯 Match rate: ${matchPercentage}% of our products have collection data`);
    
    if (matches.length > 0) {
      console.log('\n🔍 Sample matches:');
      matches.slice(0, 10).forEach(match => {
        console.log(`   ${match.sku} → ${match.collection.name} (${match.collection.code})`);
      });
    }
    
    if (dbNotInCsv.length > 0) {
      console.log('\n❌ Products without collection data (sample):');
      dbNotInCsv.slice(0, 10).forEach(sku => {
        console.log(`   ${sku}`);
      });
    }
    
    // Group matches by collection
    const collectionStats = {};
    matches.forEach(match => {
      const collectionName = match.collection.name;
      if (!collectionStats[collectionName]) {
        collectionStats[collectionName] = {
          count: 0,
          code: match.collection.code
        };
      }
      collectionStats[collectionName].count++;
    });
    
    console.log('\n📈 Top collections in our database:');
    Object.entries(collectionStats)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .forEach(([name, stats]) => {
        console.log(`   ${stats.code.padEnd(8)} → ${name.padEnd(25)} (${stats.count} products)`);
      });
    
    // Save detailed results
    const results = {
      summary: {
        totalDbSkus: dbSkus.size,
        totalCsvSkus: csvSkus.size,
        matches: matches.length,
        dbNotInCsv: dbNotInCsv.length,
        csvNotInDb: csvNotInDb.length,
        matchPercentage: parseFloat(matchPercentage)
      },
      matches,
      dbNotInCsv,
      collectionStats
    };
    
    fs.writeFileSync('./sku-comparison-results.json', JSON.stringify(results, null, 2));
    console.log('\n💾 Detailed results saved to sku-comparison-results.json');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

compareSkus();