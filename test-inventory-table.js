const { createClient } = require('@supabase/supabase-js');

// Use service role key
const supabase = createClient(
  'https://dbnfkzctensbpktgbsgn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY3OTQ0OCwiZXhwIjoyMDcxMjU1NDQ4fQ.llqxG-lE7hintpsBBC1aRncgpPZSvyREQ8sKAVA533E'
);

async function testInventoryTable() {
  console.log('🧪 Testing inventory table...');
  console.log('='.repeat(40));

  try {
    // Test 1: Simple select
    console.log('\n1️⃣ Testing SELECT...');
    const { data: selectData, error: selectError } = await supabase
      .from('inventory')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.log('❌ SELECT failed:', selectError.message);
      if (selectError.message.includes('does not exist')) {
        console.log('🚨 inventory table does NOT exist');
        return false;
      }
    } else {
      console.log('✅ SELECT successful');
    }
    
    // Test 2: Insert test record
    console.log('\n2️⃣ Testing INSERT...');
    const { data: insertData, error: insertError } = await supabase
      .from('inventory')
      .insert([{
        sku: 'TEST-INSERT-001',
        outlet_stock: 1,
        chodov_stock: 2
      }])
      .select();
    
    if (insertError) {
      console.log('❌ INSERT failed:', insertError.message);
      return false;
    } else {
      console.log('✅ INSERT successful:', insertData[0]);
      
      // Clean up
      await supabase
        .from('inventory')
        .delete()
        .eq('sku', 'TEST-INSERT-001');
      console.log('🧹 Test record cleaned up');
    }
    
    // Test 3: Upsert (for import compatibility)
    console.log('\n3️⃣ Testing UPSERT...');
    const { data: upsertData, error: upsertError } = await supabase
      .from('inventory')
      .upsert({
        sku: 'TEST-UPSERT-001',
        outlet_stock: 3
      }, {
        onConflict: 'sku'
      })
      .select();
    
    if (upsertError) {
      console.log('❌ UPSERT failed:', upsertError.message);
      return false;
    } else {
      console.log('✅ UPSERT successful:', upsertData[0]);
      
      // Test second upsert to same SKU
      const { data: upsert2Data, error: upsert2Error } = await supabase
        .from('inventory')
        .upsert({
          sku: 'TEST-UPSERT-001',
          chodov_stock: 4
        }, {
          onConflict: 'sku'
        })
        .select();
      
      if (!upsert2Error) {
        console.log('✅ Second UPSERT successful:', upsert2Data[0]);
        console.log('   📊 Total stock calculated:', upsert2Data[0].total_stock);
      }
      
      // Clean up
      await supabase
        .from('inventory')
        .delete()
        .eq('sku', 'TEST-UPSERT-001');
      console.log('🧹 Test records cleaned up');
    }
    
    console.log('\n🎉 All tests passed! inventory table is ready for import');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

testInventoryTable()
  .then(success => {
    if (success) {
      console.log('\n✅ Proceed with inventory import');
    } else {
      console.log('\n⚠️ Fix inventory table setup first');
      console.log('\n🔧 Manual setup:');
      console.log('1. https://dbnfkzctensbpktgbsgn.supabase.co → SQL Editor');
      console.log('2. Run: create-inventory-table.sql');
    }
  })
  .catch(console.error);