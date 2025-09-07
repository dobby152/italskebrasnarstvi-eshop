const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dbnfkzctensbpktgbsgn.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Nzk0NDgsImV4cCI6MjA3MTI1NTQ0NH0.vbtmSPS8ul57zeZ3W1LCZFAO0O6nyt475IY2_hGHKws'
);

async function checkStructure() {
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
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
        
      if (error) {
        console.log(`❌ Table '${table}': ${error.message}`);
      } else {
        console.log(`✅ Table '${table}': exists and accessible`);
        
        // Get row count for important tables
        if (['products', 'variants', 'inventory'].includes(table)) {
          const { count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          console.log(`   📊 Records: ${count || 0}`);
        }
      }
    } catch (e) {
      console.log(`❌ Table '${table}': ${e.message}`);
    }
  }
  
  console.log('\\n🎯 Summary:');
  console.log('- System is using anon key (read/insert permissions)');
  console.log('- Service role key needed for table creation');
  console.log('- supplier_orders table needs to be created manually in Supabase dashboard');
  
  console.log('\\n📝 Next steps:');
  console.log('1. Go to: https://dbnfkzctensbpktgbsgn.supabase.co');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Run the SQL from quick-setup-supplier-orders.sql');
}

checkStructure().catch(console.error);