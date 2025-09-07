const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Supabase connection
const supabase = createClient(
  'https://dbnfkzctensbpktgbsgn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY3OTQ0OCwiZXhwIjoyMDcxMjU1NDQ4fQ.llqxG-lE7hintpsBBC1aRncgpPZSvyREQ8sKAVA533E'
);

async function updateDatabaseCollections() {
  console.log('🚀 Starting database collections update...');
  
  try {
    // Load normalized mapping
    console.log('📖 Loading normalized collection mapping...');
    const skuMapping = JSON.parse(fs.readFileSync('./sku-to-collection-normalized.json', 'utf8'));
    
    // Step 1: Add collection columns to products table
    console.log('🏗️ Adding collection columns to products table...');
    
    // Check if columns exist
    const { data: columns } = await supabase.rpc('get_table_columns', { table_name: 'products' });
    const hasCollectionName = columns?.some(col => col.column_name === 'collection_name');
    const hasCollectionCode = columns?.some(col => col.column_name === 'collection_code');
    
    if (!hasCollectionName) {
      console.log('   Adding collection_name column...');
      const { error: nameError } = await supabase.rpc('exec_sql', { 
        sql: 'ALTER TABLE products ADD COLUMN collection_name TEXT;' 
      });
      if (nameError) console.log('   ⚠️ collection_name column may already exist');
    }
    
    if (!hasCollectionCode) {
      console.log('   Adding collection_code column...');  
      const { error: codeError } = await supabase.rpc('exec_sql', { 
        sql: 'ALTER TABLE products ADD COLUMN collection_code TEXT;' 
      });
      if (codeError) console.log('   ⚠️ collection_code column may already exist');
    }
    
    // Step 2: Get all products from database
    console.log('📊 Fetching all products from database...');
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, sku, collection_name, collection_code');
    
    if (fetchError) {
      throw fetchError;
    }
    
    console.log(`📊 Found ${products.length} products in database`);
    
    // Step 3: Prepare updates
    console.log('🔄 Preparing collection updates...');
    const updates = [];
    let matchCount = 0;
    let noMatchCount = 0;
    
    products.forEach(product => {
      const collectionData = skuMapping[product.sku];
      
      if (collectionData) {
        updates.push({
          id: product.id,
          sku: product.sku,
          collection_name: collectionData.name,
          collection_code: collectionData.code
        });
        matchCount++;
      } else {
        noMatchCount++;
      }
    });
    
    console.log(`✅ ${matchCount} products will be updated with collection data`);
    console.log(`❌ ${noMatchCount} products have no collection mapping`);
    
    // Step 4: Update products in batches
    if (updates.length > 0) {
      console.log('💾 Updating products with collection data...');
      
      const batchSize = 50;
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        
        console.log(`   Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(updates.length/batchSize)} (${batch.length} products)...`);
        
        for (const update of batch) {
          const { error } = await supabase
            .from('products')
            .update({
              collection_name: update.collection_name,
              collection_code: update.collection_code
            })
            .eq('id', update.id);
          
          if (error) {
            console.error(`   ❌ Failed to update ${update.sku}:`, error.message);
            errorCount++;
          } else {
            successCount++;
          }
        }
        
        // Brief pause between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`✅ Successfully updated ${successCount} products`);
      if (errorCount > 0) {
        console.log(`❌ Failed to update ${errorCount} products`);
      }
    }
    
    // Step 5: Verify results
    console.log('🔍 Verifying update results...');
    const { data: verifyData } = await supabase
      .from('products')
      .select('collection_name, collection_code')
      .not('collection_name', 'is', null);
    
    if (verifyData) {
      console.log(`📊 Verification: ${verifyData.length} products now have collection data`);
      
      // Show top collections
      const collectionCounts = {};
      verifyData.forEach(product => {
        if (!collectionCounts[product.collection_name]) {
          collectionCounts[product.collection_name] = 0;
        }
        collectionCounts[product.collection_name]++;
      });
      
      console.log('\n📈 Top collections in database:');
      Object.entries(collectionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([name, count]) => {
          console.log(`   ${name.padEnd(30)} (${count} products)`);
        });
    }
    
    console.log('\n✅ Database collections update completed!');
    
  } catch (error) {
    console.error('❌ Error updating database:', error.message);
  }
}

updateDatabaseCollections();