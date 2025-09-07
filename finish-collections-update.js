const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dbnfkzctensbpktgbsgn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY3OTQ0OCwiZXhwIjoyMDcxMjU1NDQ4fQ.llqxG-lE7hintpsBBC1aRncgpPZSvyREQ8sKAVA533E'
);

async function finishCollectionsUpdate() {
  console.log('🚀 Finishing collections update...');
  
  try {
    // Load collection mapping
    const skuMapping = JSON.parse(fs.readFileSync('./sku-to-collection-normalized.json', 'utf8'));
    
    // Get products that don't have collections yet
    const { data: productsWithoutCollections, error } = await supabase
      .from('products')
      .select('id, sku')
      .is('collection_code', null);
    
    if (error) {
      throw error;
    }
    
    console.log(`📊 Found ${productsWithoutCollections.length} products without collections`);
    
    // Update products one by one (more reliable than batch)
    let successCount = 0;
    let errorCount = 0;
    
    for (const product of productsWithoutCollections) {
      const collectionData = skuMapping[product.sku];
      
      if (collectionData) {
        const { error: updateError } = await supabase
          .from('products')
          .update({
            collection_name: collectionData.name,
            collection_code: collectionData.code
          })
          .eq('id', product.id);
        
        if (updateError) {
          console.error(`❌ Failed to update ${product.sku}:`, updateError.message);
          errorCount++;
        } else {
          successCount++;
          if (successCount % 50 === 0) {
            console.log(`✅ Updated ${successCount} products so far...`);
          }
        }
      }
      
      // Small delay to avoid rate limiting
      if (successCount % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`\n✅ Update completed!`);
    console.log(`   Successful updates: ${successCount}`);
    console.log(`   Failed updates: ${errorCount}`);
    
    // Final verification
    const { data: finalCheck } = await supabase
      .from('products')
      .select('collection_code')
      .not('collection_code', 'is', null);
    
    console.log(`\n📊 Final count: ${finalCheck?.length || 0} products now have collections`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

finishCollectionsUpdate();