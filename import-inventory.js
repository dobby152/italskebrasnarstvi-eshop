const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

// Supabase client with service role key
const supabase = createClient(
  'https://dbnfkzctensbpktgbsgn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY3OTQ0OCwiZXhwIjoyMDcxMjU1NDQ4fQ.llqxG-lE7hintpsBBC1aRncgpPZSvyREQ8sKAVA533E'
);

async function importInventory() {
  console.log('📦 Importing inventory from ZASOBY.xlsx...');
  console.log('='.repeat(50));

  try {
    // Read Excel file
    const workbook = XLSX.readFile('C:\\Users\\hynex\\Downloads\\ZASOBY.xlsx');
    console.log('📋 Available worksheets:', workbook.SheetNames);

    // Check if we have the right sheets
    const outletSheet = workbook.Sheets['OUTLET'] || workbook.Sheets['Outlet'] || workbook.Sheets['outlet'];
    const chodovSheet = workbook.Sheets['Chodov'] || workbook.Sheets['CHODOV'] || workbook.Sheets['chodov'];

    if (!outletSheet && !chodovSheet) {
      console.log('❌ Could not find OUTLET or Chodov sheets');
      console.log('Available sheets:', workbook.SheetNames);
      return;
    }

    // Process OUTLET sheet
    if (outletSheet) {
      console.log('\\n🏪 Processing OUTLET sheet...');
      const outletData = XLSX.utils.sheet_to_json(outletSheet, { 
        header: 1, // Get raw array data
        defval: '' // Default value for empty cells
      });
      
      console.log(`📊 OUTLET rows: ${outletData.length}`);
      if (outletData.length > 0) {
        console.log('📋 First few rows:');
        outletData.slice(0, 10).forEach((row, index) => {
          console.log(`${index + 1}: [${row.slice(0, 6).join(' | ')}]`);
        });
        
        // Look for inventory data starting from row 5 (index 4)
        console.log('\\n🔍 Row 5 data (where inventory should be):');
        if (outletData[4]) {
          console.log('Row 5:', outletData[4].slice(0, 10));
        }
      }
    }

    // Process Chodov sheet
    if (chodovSheet) {
      console.log('\\n🏪 Processing Chodov sheet...');
      const chodovData = XLSX.utils.sheet_to_json(chodovSheet, { 
        header: 1,
        defval: ''
      });
      
      console.log(`📊 Chodov rows: ${chodovData.length}`);
      if (chodovData.length > 0) {
        console.log('📋 First few rows:');
        chodovData.slice(0, 10).forEach((row, index) => {
          console.log(`${index + 1}: [${row.slice(0, 6).join(' | ')}]`);
        });
        
        // Look for inventory data starting from row 5 (index 4)
        console.log('\\n🔍 Row 5 data (where inventory should be):');
        if (chodovData[4]) {
          console.log('Row 5:', chodovData[4].slice(0, 10));
        }
      }
    }

    // Now let's import the actual inventory data
    console.log('\\n📝 Importing inventory to database...');
    
    // First check if inventory table exists and its structure
    const { data: existingInventory, error: inventoryError } = await supabase
      .from('inventory')
      .select('*')
      .limit(1);
    
    if (inventoryError) {
      console.log('❌ Inventory table check:', inventoryError.message);
      console.log('🔧 Creating inventory table...');
      
      // We need to create inventory table structure
      const inventorySQL = `
        CREATE TABLE IF NOT EXISTS inventory (
          id SERIAL PRIMARY KEY,
          sku VARCHAR(100) NOT NULL UNIQUE,
          outlet_stock INTEGER DEFAULT 0,
          chodov_stock INTEGER DEFAULT 0,
          total_stock INTEGER GENERATED ALWAYS AS (outlet_stock + chodov_stock) STORED,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku);
        CREATE INDEX IF NOT EXISTS idx_inventory_total_stock ON inventory(total_stock);
      `;
      
      // Note: We can't execute DDL through API, need manual creation
      console.log('⚠️  Manual table creation needed - will proceed assuming table exists');
    }
    
    // Import Chodov data
    if (chodovData && chodovData.length > 1) {
      console.log('\\n📦 Importing Chodov inventory...');
      let importedChodov = 0;
      
      for (let i = 1; i < chodovData.length; i++) { // Skip header row
        const row = chodovData[i];
        const sku = row[0];
        const stock = parseInt(row[4]) || 0; // Column E (index 4) has stock
        
        if (sku && typeof sku === 'string') {
          try {
            // Upsert inventory record
            const { error: upsertError } = await supabase
              .from('inventory')
              .upsert({
                sku: sku.trim(),
                chodov_stock: stock
              }, {
                onConflict: 'sku'
              });
            
            if (!upsertError) {
              importedChodov++;
              if (importedChodov % 100 === 0) {
                console.log(`   📊 Chodov: ${importedChodov} records imported...`);
              }
            } else if (!upsertError.message.includes('does not exist')) {
              console.log(`   ⚠️  ${sku}: ${upsertError.message}`);
            }
          } catch (error) {
            // Skip individual errors
          }
        }
      }
      
      console.log(`✅ Chodov import complete: ${importedChodov} records`);
    }
    
    // Import OUTLET data (from OUTET sheet)
    const outletSheetData = workbook.Sheets['OUTET'];
    if (outletSheetData) {
      console.log('\\n🏪 Processing OUTLET (OUTET) sheet...');
      const outletData = XLSX.utils.sheet_to_json(outletSheetData, { 
        header: 1,
        defval: ''
      });
      
      console.log(`📊 OUTLET rows: ${outletData.length}`);
      
      if (outletData.length > 1) {
        console.log('\\n📦 Importing OUTLET inventory...');
        let importedOutlet = 0;
        
        for (let i = 1; i < outletData.length; i++) {
          const row = outletData[i];
          const sku = row[0];
          const stock = parseInt(row[4]) || 0; // Column E (index 4) has stock
          
          if (sku && typeof sku === 'string') {
            try {
              // Upsert inventory record  
              const { error: upsertError } = await supabase
                .from('inventory')
                .upsert({
                  sku: sku.trim(),
                  outlet_stock: stock
                }, {
                  onConflict: 'sku'
                });
              
              if (!upsertError) {
                importedOutlet++;
                if (importedOutlet % 100 === 0) {
                  console.log(`   📊 OUTLET: ${importedOutlet} records imported...`);
                }
              } else if (!upsertError.message.includes('does not exist')) {
                console.log(`   ⚠️  ${sku}: ${upsertError.message}`);
              }
            } catch (error) {
              // Skip individual errors
            }
          }
        }
        
        console.log(`✅ OUTLET import complete: ${importedOutlet} records`);
      }
    }
    
    // Final summary
    console.log('\\n📊 Import Summary:');
    try {
      const { data: totalInventory, error } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        console.log(`✅ Total inventory records: ${totalInventory.length || 'unknown'}`);
      }
      
      // Sample of imported data
      const { data: sampleData } = await supabase
        .from('inventory')
        .select('*')
        .limit(5);
      
      if (sampleData && sampleData.length > 0) {
        console.log('\\n📋 Sample imported records:');
        sampleData.forEach(record => {
          console.log(`   ${record.sku}: OUTLET=${record.outlet_stock}, CHODOV=${record.chodov_stock}, TOTAL=${record.total_stock}`);
        });
      }
      
    } catch (summaryError) {
      console.log('⚠️  Could not fetch summary - table may need manual creation');
      console.log('\\n🔧 Manual SQL needed:');
      console.log(`
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(100) NOT NULL UNIQUE,
  outlet_stock INTEGER DEFAULT 0,
  chodov_stock INTEGER DEFAULT 0,
  total_stock INTEGER GENERATED ALWAYS AS (outlet_stock + chodov_stock) STORED,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_total_stock ON inventory(total_stock);
      `);
    }

  } catch (error) {
    console.error('❌ Error reading Excel file:', error.message);
    
    if (error.message.includes('XLSX')) {
      console.log('\\n💡 Installing xlsx package...');
      console.log('Run: npm install xlsx');
    }
  }
}

importInventory();