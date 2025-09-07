const { createClient } = require('@supabase/supabase-js');

// Use the service role access token you provided
const supabase = createClient(
  'https://dbnfkzctensbpktgbsgn.supabase.co',
  'sbp_cf4e143d271355c377eb2469e2756a4dde4ba076'
);

async function createSupplierOrdersTable() {
  console.log('🚀 Creating supplier_orders table using access token...');
  console.log('='.repeat(60));
  
  const tableSQL = `
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

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_supplier_orders_status ON supplier_orders(status);
    CREATE INDEX IF NOT EXISTS idx_supplier_orders_created_at ON supplier_orders(created_at DESC);

    -- Create updated_at trigger
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    CREATE OR REPLACE TRIGGER update_supplier_orders_updated_at 
      BEFORE UPDATE ON supplier_orders 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();

    -- Enable RLS
    ALTER TABLE supplier_orders ENABLE ROW LEVEL SECURITY;

    -- Public policies for demo (adjust for production)
    CREATE OR REPLACE POLICY "Allow public insert" ON supplier_orders FOR INSERT WITH CHECK (true);
    CREATE OR REPLACE POLICY "Allow public select" ON supplier_orders FOR SELECT USING (true);
    CREATE OR REPLACE POLICY "Allow public update" ON supplier_orders FOR UPDATE USING (true);

    -- Create statistics view
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

  try {
    // Try using rpc to execute SQL directly
    console.log('📝 Executing SQL...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: tableSQL });
    
    if (error) {
      console.log('❌ SQL execution failed:', error.message);
      
      // Try alternative approach - direct table operations
      console.log('🔄 Trying alternative approach...');
      const { error: insertError } = await supabase
        .from('supplier_orders')
        .insert([{
          customer_name: 'Test Customer',
          customer_email: 'test@example.com',
          customer_phone: '+420000000000',
          product_sku: 'TEST-SKU',
          product_name: 'Test Product'
        }]);
        
      if (insertError) {
        console.log('❌ Insert test failed:', insertError.message);
        
        if (insertError.code === 'PGRST106') {
          console.log('⚠️  Table does not exist. Manual creation required.');
          console.log('👉 Go to: https://dbnfkzctensbpktgbsgn.supabase.co');
          console.log('👉 SQL Editor → paste contents of quick-setup-supplier-orders.sql');
        }
      } else {
        console.log('✅ Table exists! Cleaning up test record...');
        await supabase.from('supplier_orders').delete().eq('customer_email', 'test@example.com');
      }
      
    } else {
      console.log('✅ SQL executed successfully!');
      
      // Test the table
      const { data: testData, error: testError } = await supabase
        .from('supplier_orders')
        .select('*')
        .limit(1);
        
      if (!testError) {
        console.log('✅ Table verification successful!');
        
        // Insert demo data
        console.log('📊 Inserting demo data...');
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
          const { error: demoError } = await supabase
            .from('supplier_orders')
            .insert([order]);
            
          if (demoError && !demoError.message.includes('duplicate')) {
            console.log('⚠️  Demo data insert warning:', demoError.message);
          }
        }
        
        console.log('✅ Demo data inserted!');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\\n🎉 Setup process completed!');
  console.log('Next: Test at http://localhost:3000/admin/supplier-orders');
}

createSupplierOrdersTable();