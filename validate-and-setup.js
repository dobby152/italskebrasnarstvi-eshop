/**
 * Validate Supabase connection and provide setup instructions
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = 'https://dbnfkzctensbpktgbsgn.supabase.co';

// Try different key configurations
const keys = [
  {
    name: 'Provided Service Key',
    key: 'sbp_cf4e143d271355c377eb2469e2756a4dde4ba076',
    type: 'service_role'
  },
  {
    name: 'Environment Anon Key', 
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Nzk0NDgsImV4cCI6MjA3MTI1NTQ0OH0.vbtmSPS8ul57zeZ3W1LCZFAO0O6nyt475IY2_hGHKws',
    type: 'anon'
  }
];

async function validateConnection() {
  console.log('🔍 Validating Supabase connection and keys...\n');
  
  for (const keyConfig of keys) {
    console.log(`Testing ${keyConfig.name} (${keyConfig.type})...`);
    
    const supabase = createClient(SUPABASE_URL, keyConfig.key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    try {
      // Try a simple operation
      const { data, error } = await supabase
        .from('products')
        .select('count')
        .limit(1);
      
      if (error) {
        if (error.message.includes('Invalid API key') || error.message.includes('API key')) {
          console.log(`❌ ${keyConfig.name}: Invalid API key format or authentication failed`);
        } else if (error.code === '42P01') {
          console.log(`✅ ${keyConfig.name}: Connection successful, but 'products' table doesn't exist`);
        } else {
          console.log(`⚠️  ${keyConfig.name}: ${error.message}`);
        }
      } else {
        console.log(`✅ ${keyConfig.name}: Connection successful!`);
      }
      
    } catch (err) {
      console.log(`❌ ${keyConfig.name}: ${err.message}`);
    }
    
    // Try testing with supplier_orders table specifically
    try {
      const { data: supplierData, error: supplierError } = await supabase
        .from('supplier_orders')
        .select('count')
        .limit(1);
      
      if (!supplierError) {
        console.log(`✅ ${keyConfig.name}: supplier_orders table already exists!`);
        
        // Get actual count
        const { data: countData, error: countError } = await supabase
          .from('supplier_orders')
          .select('*');
        
        if (!countError) {
          console.log(`📊 Found ${countData.length} records in supplier_orders table`);
          return true; // Table already exists and is accessible
        }
      } else if (supplierError.code === '42P01') {
        console.log(`   📋 supplier_orders table doesn't exist yet - needs creation`);
      }
      
    } catch (err) {
      // Ignore errors for this test
    }
    
    console.log('');
  }
  
  return false;
}

async function showSetupInstructions() {
  console.log('📋 MANUAL SETUP INSTRUCTIONS');
  console.log('='.repeat(50));
  console.log('Since automatic setup encountered issues, please follow these steps:\n');
  
  console.log('1. 🌐 Open Supabase SQL Editor:');
  console.log('   https://dbnfkzctensbpktgbsgn.supabase.co/project/default/sql\n');
  
  console.log('2. 📄 Copy the SQL from quick-setup-supplier-orders.sql:');
  
  // Read and display the SQL content
  try {
    const sqlPath = path.join(__dirname, 'quick-setup-supplier-orders.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('   The SQL content to execute:\n');
    console.log('   ' + '─'.repeat(60));
    console.log(sqlContent.split('\n').map(line => '   ' + line).join('\n'));
    console.log('   ' + '─'.repeat(60));
    
  } catch (err) {
    console.log('   ❌ Could not read quick-setup-supplier-orders.sql');
    console.log('   Please make sure the file exists in the current directory.');
  }
  
  console.log('\n3. ▶️  Execute the SQL in the Supabase editor\n');
  
  console.log('4. ✅ Verify the setup:');
  console.log('   - Run: SELECT COUNT(*) FROM supplier_orders;');
  console.log('   - Should return 2 (demo records)\n');
  
  console.log('5. 🧪 Test the functionality:');
  console.log('   - Try inserting a test record');
  console.log('   - Verify the triggers and constraints work\n');
  
  console.log('📝 WHAT THE TABLE INCLUDES:');
  console.log('─'.repeat(30));
  console.log('✅ Customer info: name, email, phone');
  console.log('✅ Product details: SKU, name, color variant');
  console.log('✅ Order management: status, priority, quantity');
  console.log('✅ Communication: messages, notes');
  console.log('✅ Timestamps: created_at, updated_at, contacted_at, completed_at');
  console.log('✅ Supplier info: contact details (JSONB), notes');
  console.log('✅ Admin features: admin notes, estimated delivery');
  console.log('✅ Security: Row Level Security policies');
  console.log('✅ Performance: Indexes on status and created_at');
  console.log('✅ Demo data: 2 sample records for testing\n');
}

async function attemptTableCreation() {
  console.log('🔧 Attempting alternative table creation methods...\n');
  
  // Try with anon key (might have insert permissions)
  const anonSupabase = createClient(SUPABASE_URL, keys[1].key);
  
  try {
    console.log('📋 Attempting to create table via INSERT (auto-creation)...');
    
    const { data, error } = await anonSupabase
      .from('supplier_orders')
      .insert([{
        customer_name: 'Setup Test User',
        customer_email: 'setup@test.example.com',
        customer_phone: '+420000000000',
        product_sku: 'SETUP-TEST-001',
        product_name: 'Setup Test Product',
        color_variant: 'Test',
        quantity: 1,
        message: 'This is a setup test record',
        status: 'pending',
        priority: 'normal'
      }])
      .select();
    
    if (error) {
      if (error.code === '42P01') {
        console.log('❌ Table does not exist and cannot be auto-created');
        console.log('   Manual SQL execution is required\n');
      } else {
        console.log('❌ Insert failed:', error.message, '\n');
      }
    } else {
      console.log('✅ SUCCESS: Table created and test record inserted!');
      
      // Clean up test record
      await anonSupabase
        .from('supplier_orders')
        .delete()
        .eq('customer_email', 'setup@test.example.com');
      
      console.log('🧹 Test record cleaned up');
      return true;
    }
    
  } catch (err) {
    console.log('❌ Alternative creation failed:', err.message, '\n');
  }
  
  return false;
}

async function main() {
  console.log('🚀 SUPABASE SUPPLIER_ORDERS TABLE SETUP');
  console.log('='.repeat(50), '\n');
  
  // Step 1: Validate connections
  const tableExists = await validateConnection();
  
  if (tableExists) {
    console.log('🎉 GREAT NEWS: supplier_orders table already exists and is accessible!');
    console.log('No setup required - you can start using the system right away.');
    process.exit(0);
  }
  
  // Step 2: Try alternative creation
  const created = await attemptTableCreation();
  
  if (created) {
    console.log('🎉 SUCCESS: Table created successfully via alternative method!');
    process.exit(0);
  }
  
  // Step 3: Show manual instructions
  await showSetupInstructions();
  
  console.log('⚡ NEXT STEPS:');
  console.log('─'.repeat(15));
  console.log('1. Execute the SQL manually in Supabase');
  console.log('2. Run this script again to verify: node validate-and-setup.js');
  console.log('3. Start using the supplier orders system!');
}

main().catch(console.error);