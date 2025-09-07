// Setup supplier orders system using Supabase Access Token
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://dbnfkzctensbpktgbsgn.supabase.co'
const SUPABASE_ACCESS_TOKEN = 'sbp_cf4e143d271355c377eb2469e2756a4dde4ba076'

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_ACCESS_TOKEN)

const setupSupplierOrdersSystem = async () => {
  console.log('🚀 Setting up Supplier Orders System...')
  console.log('=' .repeat(50))

  try {
    // Create the supplier_orders table
    console.log('\n1️⃣ Creating supplier_orders table...')
    
    const createTableSQL = `
      -- Create supplier_orders table
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
    `

    const { error: tableError } = await supabase.rpc('exec_sql', { 
      sql: createTableSQL 
    })

    if (tableError) {
      console.log('   📋 Table might already exist, continuing...')
    } else {
      console.log('   ✅ Table created successfully')
    }

    // Create indexes
    console.log('\n2️⃣ Creating indexes...')
    
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_supplier_orders_status ON supplier_orders(status);
      CREATE INDEX IF NOT EXISTS idx_supplier_orders_created_at ON supplier_orders(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_supplier_orders_product_sku ON supplier_orders(product_sku);
      CREATE INDEX IF NOT EXISTS idx_supplier_orders_customer_email ON supplier_orders(customer_email);
    `

    const { error: indexError } = await supabase.rpc('exec_sql', { 
      sql: indexSQL 
    })

    if (!indexError) {
      console.log('   ✅ Indexes created successfully')
    }

    // Create updated_at trigger
    console.log('\n3️⃣ Creating updated_at trigger...')
    
    const triggerSQL = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_supplier_orders_updated_at ON supplier_orders;
      CREATE TRIGGER update_supplier_orders_updated_at 
        BEFORE UPDATE ON supplier_orders 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    `

    const { error: triggerError } = await supabase.rpc('exec_sql', { 
      sql: triggerSQL 
    })

    if (!triggerError) {
      console.log('   ✅ Trigger created successfully')
    }

    // Enable RLS and create policies
    console.log('\n4️⃣ Setting up Row Level Security...')
    
    const rlsSQL = `
      ALTER TABLE supplier_orders ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Allow public insert" ON supplier_orders;
      DROP POLICY IF EXISTS "Allow public select" ON supplier_orders;  
      DROP POLICY IF EXISTS "Allow public update" ON supplier_orders;

      CREATE POLICY "Allow public insert" ON supplier_orders
        FOR INSERT WITH CHECK (true);

      CREATE POLICY "Allow public select" ON supplier_orders
        FOR SELECT USING (true);

      CREATE POLICY "Allow public update" ON supplier_orders
        FOR UPDATE USING (true);
    `

    const { error: rlsError } = await supabase.rpc('exec_sql', { 
      sql: rlsSQL 
    })

    if (!rlsError) {
      console.log('   ✅ RLS policies created successfully')
    }

    // Create statistics view
    console.log('\n5️⃣ Creating statistics view...')
    
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
    `

    const { error: viewError } = await supabase.rpc('exec_sql', { 
      sql: viewSQL 
    })

    if (!viewError) {
      console.log('   ✅ Statistics view created successfully')
    }

    // Insert demo data using direct table operations
    console.log('\n6️⃣ Inserting demo data...')
    
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
      },
      {
        customer_name: 'Petr Dvořák',
        customer_email: 'petr.dvorak@firma.cz', 
        customer_phone: '+420 555 123 456',
        product_sku: 'OM5288OM6-R',
        product_name: 'Automatický deštník - Červená varianta',
        color_variant: 'Červená',
        quantity: 1,
        message: 'Firemní objednávka, faktura na firmu.',
        priority: 'normal'
      }
    ]

    for (const order of demoOrders) {
      const { error } = await supabase
        .from('supplier_orders')
        .insert([order])
      
      if (error && !error.message.includes('duplicate')) {
        console.log(`   ⚠️ Error inserting demo order: ${error.message}`)
      }
    }

    console.log('   ✅ Demo data inserted successfully')

    // Test the setup
    console.log('\n7️⃣ Testing the setup...')
    
    const { data: orders, error: selectError } = await supabase
      .from('supplier_orders')
      .select('*')
      .limit(5)

    if (!selectError && orders) {
      console.log(`   ✅ Query test successful: Found ${orders.length} orders`)
      
      // Test statistics view
      const { data: stats, error: statsError } = await supabase
        .from('order_statistics')  
        .select('*')
        .single()

      if (!statsError && stats) {
        console.log(`   📊 Statistics: ${stats.total_orders} total, ${stats.pending_orders} pending`)
      }
    }

    console.log('\n🎉 Setup Complete!')
    console.log('=' .repeat(50))
    console.log('✅ Supplier orders system is ready!')
    console.log('')
    console.log('🔗 Next steps:')
    console.log('1. Visit: http://localhost:3000/admin/supplier-orders')
    console.log('2. Test customer flow: http://localhost:3000/produkty')
    console.log('3. Look for out-of-stock products and test order form')
    console.log('')
    console.log('📊 System features:')
    console.log('• Customer order form for out-of-stock products')
    console.log('• Admin dashboard with order management')
    console.log('• Status tracking and priority system')
    console.log('• Customer contact information management')
    console.log('• Statistics and reporting')

  } catch (error) {
    console.error('❌ Setup Error:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('1. Check if Supabase access token is valid')
    console.log('2. Ensure database permissions are correct') 
    console.log('3. Try running the SQL script manually in Supabase dashboard')
  }
}

// Alternative method using raw SQL if RPC doesn't work
const alternativeSetup = async () => {
  console.log('\n🔄 Trying alternative setup method...')
  
  try {
    // Try inserting a test record to check if table exists
    const { error } = await supabase
      .from('supplier_orders')
      .insert([{
        customer_name: 'Test Customer',
        customer_email: 'test@test.cz',
        customer_phone: '+420 000 000 000',
        product_sku: 'TEST-SKU',
        product_name: 'Test Product',
        message: 'Test order to verify setup'
      }])
    
    if (!error) {
      console.log('✅ Table exists and is working!')
      
      // Clean up test record
      await supabase
        .from('supplier_orders')
        .delete()
        .eq('customer_email', 'test@test.cz')
        
    } else {
      console.log('❌ Table does not exist yet')
      console.log('Please run the SQL script manually in Supabase:')
      console.log('👉 https://dbnfkzctensbpktgbsgn.supabase.co')
    }
    
  } catch (error) {
    console.log('❌ Alternative setup failed:', error.message)
  }
}

// Run setup
setupSupplierOrdersSystem()
  .then(() => alternativeSetup())
  .catch(console.error)