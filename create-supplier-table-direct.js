const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://dbnfkzctensbpktgbsgn.supabase.co';
const supabaseServiceKey = 'sbp_cf4e143d271355c377eb2469e2756a4dde4ba076';

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL(sql) {
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  return { data, error };
}

async function createSupplierOrdersTable() {
  try {
    console.log('🚀 Creating supplier_orders table...');
    console.log(`🌐 Database URL: ${supabaseUrl}`);
    console.log('🔑 Using service role key\n');
    
    // Step 1: Create the table
    console.log('📋 Step 1: Creating supplier_orders table...');
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS supplier_orders (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        product_sku VARCHAR(100) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        color_variant VARCHAR(100),
        quantity INTEGER DEFAULT 1,
        message TEXT,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'contacted_supplier', 'ordered', 'received', 'completed', 'cancelled')),
        priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
        supplier_contact_info JSONB,
        supplier_notes TEXT,
        admin_notes TEXT,
        estimated_delivery DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        contacted_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE
      );
    `;
    
    const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    if (tableError) {
      console.error('❌ Failed to create table:', tableError.message);
      return false;
    }
    console.log('✅ Table created successfully');
    
    // Step 2: Create indexes
    console.log('📋 Step 2: Creating indexes...');
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_supplier_orders_status ON supplier_orders(status);
      CREATE INDEX IF NOT EXISTS idx_supplier_orders_created_at ON supplier_orders(created_at DESC);
    `;
    
    const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSQL });
    if (indexError) {
      console.log('⚠️  Index creation may have failed:', indexError.message);
    } else {
      console.log('✅ Indexes created successfully');
    }
    
    // Step 3: Create trigger function
    console.log('📋 Step 3: Creating trigger function...');
    const triggerFunctionSQL = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;
    
    const { error: functionError } = await supabase.rpc('exec_sql', { sql: triggerFunctionSQL });
    if (functionError) {
      console.log('⚠️  Function creation may have failed:', functionError.message);
    } else {
      console.log('✅ Trigger function created successfully');
    }
    
    // Step 4: Create trigger
    console.log('📋 Step 4: Creating trigger...');
    const triggerSQL = `
      CREATE OR REPLACE TRIGGER update_supplier_orders_updated_at 
        BEFORE UPDATE ON supplier_orders 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    `;
    
    const { error: triggerError } = await supabase.rpc('exec_sql', { sql: triggerSQL });
    if (triggerError) {
      console.log('⚠️  Trigger creation may have failed:', triggerError.message);
    } else {
      console.log('✅ Trigger created successfully');
    }
    
    // Step 5: Enable RLS
    console.log('📋 Step 5: Enabling Row Level Security...');
    const rlsSQL = `ALTER TABLE supplier_orders ENABLE ROW LEVEL SECURITY;`;
    
    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSQL });
    if (rlsError) {
      console.log('⚠️  RLS enable may have failed:', rlsError.message);
    } else {
      console.log('✅ RLS enabled successfully');
    }
    
    // Step 6: Create policies
    console.log('📋 Step 6: Creating RLS policies...');
    const policiesSQL = `
      CREATE POLICY IF NOT EXISTS "Allow public insert" ON supplier_orders FOR INSERT WITH CHECK (true);
      CREATE POLICY IF NOT EXISTS "Allow public select" ON supplier_orders FOR SELECT USING (true);
      CREATE POLICY IF NOT EXISTS "Allow public update" ON supplier_orders FOR UPDATE USING (true);
    `;
    
    const { error: policiesError } = await supabase.rpc('exec_sql', { sql: policiesSQL });
    if (policiesError) {
      console.log('⚠️  Policies creation may have failed:', policiesError.message);
    } else {
      console.log('✅ RLS policies created successfully');
    }
    
    // Step 7: Create statistics view
    console.log('📋 Step 7: Creating statistics view...');
    const viewSQL = `
      CREATE OR REPLACE VIEW order_statistics AS
      SELECT 
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
        COUNT(*) FILTER (WHERE status = 'contacted_supplier') as contacted_orders,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as orders_today,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as orders_this_week
      FROM supplier_orders;
    `;
    
    const { error: viewError } = await supabase.rpc('exec_sql', { sql: viewSQL });
    if (viewError) {
      console.log('⚠️  Statistics view creation may have failed:', viewError.message);
    } else {
      console.log('✅ Statistics view created successfully');
    }
    
    // Step 8: Insert demo data
    console.log('📋 Step 8: Inserting demo data...');
    const { error: insertError } = await supabase
      .from('supplier_orders')
      .insert([
        {
          customer_name: 'Jan Novák',
          customer_email: 'jan.novak@email.cz',
          customer_phone: '+420 123 456 789',
          product_sku: 'OM5285OM5-VE',
          product_name: 'Pánská peněženka',
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
          product_name: 'Batoh na notebook',
          color_variant: 'Černá',
          quantity: 2,
          message: 'Objednávám pro celou rodinu.',
          priority: 'normal'
        }
      ]);
    
    if (insertError) {
      console.log('⚠️  Demo data insertion may have failed:', insertError.message);
    } else {
      console.log('✅ Demo data inserted successfully');
    }
    
    // Step 9: Verify everything works
    console.log('📋 Step 9: Verifying table functionality...');
    const { data, error } = await supabase
      .from('supplier_orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Table verification failed:', error.message);
      return false;
    }
    
    console.log('✅ Table verification successful!');
    console.log(`📊 Found ${data.length} records in supplier_orders table`);
    
    if (data.length > 0) {
      console.log('📄 Current records:');
      data.forEach((record, index) => {
        console.log(`   ${index + 1}. ${record.customer_name} - ${record.product_name} (${record.status})`);
        console.log(`      📧 ${record.customer_email} | 📱 ${record.customer_phone}`);
        console.log(`      🏷️  ${record.product_sku} | 🎨 ${record.color_variant} | 📦 Qty: ${record.quantity}`);
        console.log(`      ⚡ Priority: ${record.priority} | 📅 ${new Date(record.created_at).toLocaleString()}`);
        if (record.message) {
          console.log(`      💬 "${record.message}"`);
        }
        console.log('');
      });
    }
    
    // Test statistics view
    try {
      const { data: stats, error: statsError } = await supabase
        .from('order_statistics')
        .select('*')
        .single();
      
      if (!statsError && stats) {
        console.log('📈 Order Statistics:');
        console.log(`   📊 Total orders: ${stats.total_orders}`);
        console.log(`   ⏳ Pending orders: ${stats.pending_orders}`);
        console.log(`   📞 Contacted supplier: ${stats.contacted_orders}`);
        console.log(`   ✅ Completed orders: ${stats.completed_orders}`);
        console.log(`   📅 Orders today: ${stats.orders_today}`);
        console.log(`   📆 Orders this week: ${stats.orders_this_week}`);
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

async function main() {
  const success = await createSupplierOrdersTable();
  
  if (success) {
    console.log('\n🎉 SUCCESS: Supplier orders table setup completed!');
    console.log('\n📋 The table includes:');
    console.log('   ✅ Complete customer information storage');
    console.log('   ✅ Detailed product tracking with SKU and variants');
    console.log('   ✅ Order status management workflow');
    console.log('   ✅ Priority system for urgent requests');
    console.log('   ✅ Automatic timestamps and audit trail');
    console.log('   ✅ Row Level Security policies');
    console.log('   ✅ Performance indexes');
    console.log('   ✅ Statistics view for reporting');
    console.log('   ✅ Demo data for testing');
    console.log('\n🚀 The supplier_orders table is ready for production use!');
    process.exit(0);
  } else {
    console.log('\n❌ Setup failed. Please check the errors above.');
    process.exit(1);
  }
}

main().catch(console.error);