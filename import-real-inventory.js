const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

// Supabase client with service role key
const supabase = createClient(
  'https://dbnfkzctensbpktgbsgn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY3OTQ0OCwiZXhwIjoyMDcxMjU1NDQ4fQ.llqxG-lE7hintpsBBC1aRncgpPZSvyREQ8sKAVA533E'
);

async function importRealInventory() {
  console.log('📦 Importing real inventory data...');
  console.log('='.repeat(50));

  try {
    // Read Excel file
    const workbook = XLSX.readFile('C:\\Users\\hynex\\Downloads\\ZASOBY.xlsx');
    console.log('📋 Available sheets:', workbook.SheetNames);

    // Get CHODOV data (we know this exists)
    const chodovSheet = workbook.Sheets['CHODOV'];
    const chodovData = XLSX.utils.sheet_to_json(chodovSheet, { header: 1, defval: '' });
    
    // Get OUTET data (OUTLET with typo)
    const outletSheet = workbook.Sheets['OUTET'];
    const outletData = XLSX.utils.sheet_to_json(outletSheet, { header: 1, defval: '' });

    console.log(`\n📊 CHODOV: ${chodovData.length} rows`);
    console.log(`📊 OUTLET: ${outletData.length} rows`);

    // Import CHODOV data
    if (chodovData.length > 1) {
      console.log('\n📦 Importing CHODOV inventory...');
      let importedChodov = 0;
      
      for (let i = 1; i < chodovData.length; i++) { // Skip header row (row 1)
        const row = chodovData[i];
        const sku = row[0]; // Column A
        const stock = parseInt(row[4]) || 0; // Column E
        
        if (sku && typeof sku === 'string' && sku.trim() !== '' && sku.trim() !== 'PIQUADRO') {
          try {
            const { error } = await supabase
              .from('inventory')
              .upsert({
                sku: sku.trim(),
                chodov_stock: stock
              }, {
                onConflict: 'sku'
              });
            
            if (!error) {
              importedChodov++;
              if (importedChodov % 100 === 0) {
                console.log(`   📊 CHODOV: ${importedChodov} records imported...`);
              }
            } else {
              console.log(`   ⚠️ CHODOV ${sku}: ${error.message}`);
            }
          } catch (error) {
            console.log(`   ❌ CHODOV ${sku}: ${error.message}`);
          }
        }
      }
      
      console.log(`✅ CHODOV import complete: ${importedChodov} records`);
    }
    
    // Import OUTLET data
    if (outletData.length > 1) {
      console.log('\n🏪 Importing OUTLET inventory...');
      let importedOutlet = 0;
      
      for (let i = 1; i < outletData.length; i++) { // Skip header row 
        const row = outletData[i];
        const sku = row[0]; // Column A
        const stock = parseInt(row[5]) || 0; // Column F (index 5)
        
        if (sku && typeof sku === 'string' && sku.trim() !== '' && sku.trim() !== 'PIQUADRO') {
          try {
            const { error } = await supabase
              .from('inventory')
              .upsert({
                sku: sku.trim(),
                outlet_stock: stock
              }, {
                onConflict: 'sku'
              });
            
            if (!error) {
              importedOutlet++;
              if (importedOutlet % 100 === 0) {
                console.log(`   📊 OUTLET: ${importedOutlet} records imported...`);
              }
            } else {
              console.log(`   ⚠️ OUTLET ${sku}: ${error.message}`);
            }
          } catch (error) {
            console.log(`   ❌ OUTLET ${sku}: ${error.message}`);
          }
        }
      }
      
      console.log(`✅ OUTLET import complete: ${importedOutlet} records`);
    }
    
    // Summary
    console.log('\n📊 Final Summary:');
    const { data: summary } = await supabase
      .from('inventory')
      .select('*')
      .limit(10);
    
    if (summary && summary.length > 0) {
      console.log('✅ Sample imported records:');
      summary.forEach(record => {
        console.log(`   ${record.sku}: OUTLET=${record.outlet_stock || 0}, CHODOV=${record.chodov_stock || 0}, TOTAL=${record.total_stock || 0}`);
      });
    }
    
    const { count } = await supabase
      .from('inventory')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n🎉 Total inventory records: ${count}`);
    console.log('✅ Inventory import completed successfully!');
    
  } catch (error) {
    console.error('❌ Import error:', error.message);
  }
}

importRealInventory();