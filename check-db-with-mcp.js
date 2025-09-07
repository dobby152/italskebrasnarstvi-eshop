const { createClient } = require('@supabase/supabase-js');

// Use service role key for database operations
const supabase = createClient(
  'https://dbnfkzctensbpktgbsgn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY3OTQ0OCwiZXhwIjoyMDcxMjU1NDQ4fQ.llqxG-lE7hintpsBBC1aRncgpPZSvyREQ8sKAVA533E'
);

async function checkDatabaseStructure() {
  console.log('🔍 Checking current database structure...');
  console.log('='.repeat(50));
  
  const tables = [
    'products',
    'variants', 
    'categories',
    'subcategories',
    'inventory',
    'supplier_orders'
  ];
  
  for (const table of tables) {
    try {
      console.log(`\\n📋 Checking table: ${table}`);
      
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        
        if (table === 'inventory' && error.message.includes('does not exist')) {
          console.log('   🔧 inventory table needs to be created');
        }
      } else {
        console.log(`✅ ${table}: exists, ${count || 0} records`);
        
        // For inventory table, show sample structure
        if (table === 'inventory' && count > 0) {
          const { data: sampleData } = await supabase
            .from('inventory')
            .select('*')
            .limit(3);
            
          if (sampleData && sampleData.length > 0) {
            console.log('   📊 Sample inventory records:');
            sampleData.forEach(record => {
              console.log(`      ${record.sku}: OUTLET=${record.outlet_stock || 0}, CHODOV=${record.chodov_stock || 0}, TOTAL=${record.total_stock || 0}`);
            });
          }
        }
        
        // For supplier_orders, show sample
        if (table === 'supplier_orders' && count > 0) {
          const { data: sampleOrders } = await supabase
            .from('supplier_orders')
            .select('customer_name, product_sku, status')
            .limit(2);
            
          if (sampleOrders && sampleOrders.length > 0) {
            console.log('   📊 Sample orders:');
            sampleOrders.forEach(order => {
              console.log(`      ${order.customer_name}: ${order.product_sku} (${order.status})`);
            });
          }
        }
      }
      
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
  
  console.log('\\n🎯 Database Status Summary:');
  console.log('='.repeat(50));
  
  // Check if we need to create inventory table
  const { error: inventoryError } = await supabase
    .from('inventory')
    .select('count', { count: 'exact', head: true });
    
  if (inventoryError) {
    console.log('🚨 REQUIRED: Create inventory table');
    console.log('   👉 Run: create-inventory-table.sql in Supabase SQL Editor');
    console.log('');
    return false;
  } else {
    console.log('✅ inventory table: Ready for import');
    console.log('');
    return true;
  }
}

checkDatabaseStructure()
  .then(ready => {
    if (ready) {
      console.log('🎉 Database structure is ready for inventory import!');
      console.log('\\nNext steps:');
      console.log('1. Run inventory import: node import-inventory.js');
      console.log('2. Update stock service for multi-branch support');
      console.log('3. Update frontend messages');
    } else {
      console.log('⚠️  Database setup needed before proceeding');
    }
  })
  .catch(console.error);