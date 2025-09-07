const { createClient } = require('@supabase/supabase-js');

// Use service role key
const supabase = createClient(
  'https://dbnfkzctensbpktgbsgn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY3OTQ0OCwiZXhwIjoyMDcxMjU1NDQ4fQ.llqxG-lE7hintpsBBC1aRncgpPZSvyREQ8sKAVA533E'
);

async function verifyImport() {
  console.log('🔍 Verifying inventory import...');
  console.log('='.repeat(40));

  try {
    // Get total count
    const { count } = await supabase
      .from('inventory')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Total inventory records: ${count}`);

    // Get sample records
    const { data: sample } = await supabase
      .from('inventory')
      .select('*')
      .order('total_stock', { ascending: false })
      .limit(10);

    if (sample && sample.length > 0) {
      console.log('\n📋 Top 10 records by total stock:');
      sample.forEach(record => {
        console.log(`   ${record.sku.padEnd(20)} | OUTLET: ${record.outlet_stock.toString().padStart(2)}  CHODOV: ${record.chodov_stock.toString().padStart(2)}  TOTAL: ${record.total_stock.toString().padStart(2)}`);
      });
    }

    // Test specific product that should exist
    const { data: testProduct } = await supabase
      .from('inventory')
      .select('*')
      .eq('sku', 'AC2141B2/MO')
      .single();

    if (testProduct) {
      console.log('\n🧪 Test product AC2141B2/MO:');
      console.log(`   OUTLET: ${testProduct.outlet_stock}, CHODOV: ${testProduct.chodov_stock}, TOTAL: ${testProduct.total_stock}`);
    } else {
      console.log('\n❌ Test product AC2141B2/MO not found');
    }

    // Get distribution stats
    const { data: stats } = await supabase
      .from('inventory')
      .select('outlet_stock, chodov_stock, total_stock');

    if (stats) {
      const outletOnly = stats.filter(s => s.outlet_stock > 0 && s.chodov_stock === 0).length;
      const chodovOnly = stats.filter(s => s.chodov_stock > 0 && s.outlet_stock === 0).length;
      const both = stats.filter(s => s.outlet_stock > 0 && s.chodov_stock > 0).length;
      const neither = stats.filter(s => s.outlet_stock === 0 && s.chodov_stock === 0).length;

      console.log('\n📈 Distribution stats:');
      console.log(`   Only OUTLET: ${outletOnly} products`);
      console.log(`   Only CHODOV: ${chodovOnly} products`);
      console.log(`   Both stores: ${both} products`);
      console.log(`   No stock: ${neither} products`);
    }

    console.log('\n✅ Import verification complete!');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifyImport();