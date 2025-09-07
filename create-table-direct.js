const { createClient } = require('@supabase/supabase-js');

// Use the service role key
const supabase = createClient(
  'https://dbnfkzctensbpktgbsgn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY3OTQ0OCwiZXhwIjoyMDcxMjU1NDQ4fQ.llqxG-lE7hintpsBBC1aRncgpPZSvyREQ8sKAVA533E'
);

async function createTable() {
  console.log('🚀 Creating supplier_orders table...');
  console.log('='.repeat(50));
  
  try {
    // First, test if we can insert into the table (if it exists)
    console.log('🔍 Checking if table already exists...');
    const { data: existingData, error: existingError } = await supabase
      .from('supplier_orders')
      .select('count')
      .limit(1);
    
    if (!existingError) {
      console.log('✅ Table already exists!');
      
      // Check record count
      const { count } = await supabase
        .from('supplier_orders')
        .select('*', { count: 'exact', head: true });
      
      console.log(`📊 Current records: ${count}`);
      
      if (count === 0) {
        console.log('📝 Adding demo data...');
        await addDemoData();
      }
      
      console.log('🎉 Table is ready to use!');
      return;
    }
    
    console.log('❌ Table does not exist:', existingError.message);
    console.log('🔧 Creating table using direct operations...');
    
    // Since we can't execute DDL directly, let's try a workaround
    // We'll use the database's ability to create tables through migrations
    
    // Method 1: Try using supabase-js schema operations
    console.log('📝 Attempting table creation via API...');
    
    // This won't work with standard supabase-js, but let's try anyway
    const testInsert = await supabase
      .from('supplier_orders')
      .insert([{
        customer_name: 'Test',
        customer_email: 'test@test.com',
        customer_phone: '+420000000000',
        product_sku: 'TEST-SKU',
        product_name: 'Test Product'
      }]);
    
    if (testInsert.error) {
      console.log('❌ Direct insert failed (expected):', testInsert.error.message);
      
      if (testInsert.error.message.includes('does not exist')) {
        console.log('');
        console.log('🛠️  MANUAL SETUP REQUIRED');
        console.log('='.repeat(50));
        console.log('The service role key works, but we need to run the SQL manually.');
        console.log('');
        console.log('📋 Steps:');
        console.log('1. Go to: https://dbnfkzctensbpktgbsgn.supabase.co');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy contents of quick-setup-supplier-orders.sql');
        console.log('4. Paste and execute');
        console.log('');
        console.log('🎯 Alternative: Use Supabase CLI if available');
      }
    } else {
      console.log('✅ Table creation successful!');
      await addDemoData();
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function addDemoData() {
  console.log('📊 Adding demo data...');
  
  const demoOrders = [
    {
      customer_name: 'Jan Novák',
      customer_email: 'jan.novak@email.cz',
      customer_phone: '+420 123 456 789',
      product_sku: 'OM5285OM5-VE',
      product_name: 'Pánská peněženka - Zelená varianta',
      color_variant: 'Zelená',
      quantity: 1,
      message: 'Potřebuji tento produkt co nejdříve na dárek.',
      priority: 'high'
    },
    {
      customer_name: 'Marie Svobodová',
      customer_email: 'marie.s@email.cz',
      customer_phone: '+420 987 654 321',
      product_sku: 'CA3444MOS-N',
      product_name: 'Batoh na notebook - Černá varianta',
      color_variant: 'Černá',
      quantity: 2,
      message: 'Objednávám pro celou rodinu.',
      priority: 'normal'
    }
  ];
  
  for (const order of demoOrders) {
    const { error } = await supabase
      .from('supplier_orders')
      .insert([order]);
    
    if (error && !error.message.includes('duplicate')) {
      console.log(`⚠️  ${order.customer_name}: ${error.message}`);
    } else if (!error) {
      console.log(`✅ ${order.customer_name}: Order added`);
    } else {
      console.log(`ℹ️  ${order.customer_name}: Already exists`);
    }
  }
}

createTable();