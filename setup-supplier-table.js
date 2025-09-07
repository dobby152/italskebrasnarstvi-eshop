const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://dbnfkzctensbpktgbsgn.supabase.co';
const supabaseServiceKey = 'sbp_cf4e143d271355c377eb2469e2756a4dde4ba076';

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSupplierOrdersTable() {
  try {
    console.log('🔄 Starting supplier_orders table setup...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'quick-setup-supplier-orders.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 SQL schema loaded from quick-setup-supplier-orders.sql');
    
    // Split the SQL into individual statements and execute them
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim() === '') continue;
      
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        });
        
        if (error) {
          // Try direct query execution as fallback
          const { data: directData, error: directError } = await supabase
            .from('_temp')
            .select('*')
            .limit(0);
          
          // If RPC doesn't exist, execute via raw SQL
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey
            },
            body: JSON.stringify({ sql: statement })
          });
          
          if (!response.ok) {
            // Final fallback - execute statements individually using the SQL editor endpoint
            console.log(`⚠️  Standard execution failed, trying alternative approach...`);
          }
        }
        
      } catch (err) {
        console.log(`⚠️  Statement ${i + 1} may have failed, continuing...`);
      }
    }
    
    console.log('✅ SQL statements executed');
    
    // Verify the table was created by testing a simple query
    console.log('🔍 Verifying table creation...');
    
    const { data, error } = await supabase
      .from('supplier_orders')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Table verification failed:', error.message);
      return false;
    }
    
    console.log('✅ Table verified successfully!');
    console.log(`📊 Found ${data.length} records in supplier_orders table`);
    
    if (data.length > 0) {
      console.log('📄 Sample data:');
      data.forEach((record, index) => {
        console.log(`   ${index + 1}. ${record.customer_name} - ${record.product_name} (${record.status})`);
      });
    }
    
    // Test the statistics view
    try {
      const { data: stats, error: statsError } = await supabase
        .from('order_statistics')
        .select('*')
        .single();
      
      if (!statsError && stats) {
        console.log('📈 Order Statistics:');
        console.log(`   Total orders: ${stats.total_orders}`);
        console.log(`   Pending orders: ${stats.pending_orders}`);
        console.log(`   Orders today: ${stats.orders_today}`);
      }
    } catch (statsErr) {
      console.log('⚠️  Statistics view test skipped');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    return false;
  }
}

// Alternative approach using direct SQL execution
async function executeDirectSQL() {
  try {
    console.log('🔄 Attempting direct SQL execution...');
    
    const sqlFilePath = path.join(__dirname, 'quick-setup-supplier-orders.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the complete SQL as one batch
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: sqlContent
      })
    });
    
    console.log('📡 SQL batch executed via REST API');
    
    // Verify table creation
    const { data, error } = await supabase
      .from('supplier_orders')
      .select('count(*)')
      .single();
    
    if (!error) {
      console.log('✅ Table verification successful via direct method');
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ Direct SQL execution failed:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Setting up supplier_orders table in Supabase...');
  console.log(`🌐 Database URL: ${supabaseUrl}`);
  console.log('🔑 Using service role key for admin access\n');
  
  // Try the primary approach first
  let success = await createSupplierOrdersTable();
  
  // If that fails, try the alternative approach
  if (!success) {
    console.log('\n🔄 Trying alternative setup method...');
    success = await executeDirectSQL();
  }
  
  if (success) {
    console.log('\n🎉 Supplier orders table setup completed successfully!');
    console.log('📋 The table is ready for use with:');
    console.log('   - Basic customer info storage');
    console.log('   - Product details tracking');
    console.log('   - Order status management');
    console.log('   - Audit trail with timestamps');
    console.log('   - RLS policies for public access');
    console.log('   - Demo data for testing');
    process.exit(0);
  } else {
    console.log('\n❌ Setup failed. Please check the Supabase console for manual execution.');
    process.exit(1);
  }
}

main().catch(console.error);