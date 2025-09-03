const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration - using direct values
const supabaseUrl = 'https://dbnfkzctensbpktgbsgn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Nzk0NDgsImV4cCI6MjA3MTI1NTQ0OH0.vbtmSPS8ul57zeZ3W1LCZFAO0O6nyt475IY2_hGHKws';

console.log('Using Supabase URL:', supabaseUrl);
console.log('Using Anon Key (last 10 chars):', supabaseAnonKey.slice(-10));

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function syncInventoryToSupabase() {
  try {
    console.log('Loading inventory data...');
    const inventoryPath = path.join(__dirname, '..', 'inventory-parsed.json');
    const inventoryData = JSON.parse(fs.readFileSync(inventoryPath, 'utf-8'));
    
    console.log(`Found inventory data with ${inventoryData.totalItems} items across ${inventoryData.locations} locations`);
    
    // Create a map of SKU -> total stock
    const stockMap = new Map();
    
    // Process all locations (CHODOV, OUTLET)
    Object.keys(inventoryData.inventory).forEach(location => {
      console.log(`Processing ${location}...`);
      const items = inventoryData.inventory[location];
      
      items.forEach(item => {
        const sku = item.productId;
        const stock = item.stock;
        
        if (stockMap.has(sku)) {
          stockMap.set(sku, stockMap.get(sku) + stock);
        } else {
          stockMap.set(sku, stock);
        }
      });
    });
    
    console.log(`Calculated stock for ${stockMap.size} unique SKUs`);
    
    // Update products in Supabase
    let updatedCount = 0;
    let notFoundCount = 0;
    
    for (const [sku, totalStock] of stockMap.entries()) {
      try {
        // Find product by SKU
        const { data: products, error: findError } = await supabase
          .from('products')
          .select('id, sku, stock')
          .eq('sku', sku);
        
        if (findError) {
          console.error(`Error finding product ${sku}:`, findError);
          continue;
        }
        
        if (products && products.length > 0) {
          const product = products[0];
          
          // Update stock if different
          if (product.stock !== totalStock) {
            const { error: updateError } = await supabase
              .from('products')
              .update({ stock: totalStock })
              .eq('id', product.id);
            
            if (updateError) {
              console.error(`Error updating product ${sku}:`, updateError);
            } else {
              console.log(`Updated ${sku}: ${product.stock} -> ${totalStock}`);
              updatedCount++;
            }
          }
        } else {
          notFoundCount++;
          if (totalStock > 0) {
            console.warn(`Product not found in database: ${sku} (stock: ${totalStock})`);
          }
        }
      } catch (error) {
        console.error(`Error processing SKU ${sku}:`, error);
      }
    }
    
    console.log('\\n=== SYNC SUMMARY ===');
    console.log(`Total SKUs in inventory: ${stockMap.size}`);
    console.log(`Products updated: ${updatedCount}`);
    console.log(`Products not found: ${notFoundCount}`);
    console.log('Inventory sync completed!');
    
  } catch (error) {
    console.error('Error syncing inventory:', error);
    
    if (error.message.includes('Cannot resolve module')) {
      console.log('\\nTo install required dependencies:');
      console.log('npm install @supabase/supabase-js');
    }
  }
}

// Run the sync
syncInventoryToSupabase();