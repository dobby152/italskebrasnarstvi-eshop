const XLSX = require('xlsx');

function analyzeExcelData() {
  console.log('🔍 Analyzing Excel data structure...');
  console.log('='.repeat(50));

  try {
    const workbook = XLSX.readFile('C:\\Users\\hynex\\Downloads\\ZASOBY.xlsx');
    console.log('📋 Available sheets:', workbook.SheetNames);

    // Analyze CHODOV sheet
    const chodovSheet = workbook.Sheets['CHODOV'];
    const chodovData = XLSX.utils.sheet_to_json(chodovSheet, { header: 1, defval: '' });
    
    console.log('\n📊 CHODOV Sheet Analysis:');
    console.log(`   Total rows: ${chodovData.length}`);
    
    // Show first 10 rows with column indices
    console.log('\n📋 First 10 rows (with column indices):');
    chodovData.slice(0, 10).forEach((row, rowIndex) => {
      console.log(`Row ${rowIndex + 1}:`);
      row.slice(0, 8).forEach((cell, colIndex) => {
        console.log(`   [${String.fromCharCode(65 + colIndex)}] ${cell}`);
      });
      console.log('');
    });

    // Look for SKU patterns and stock values
    console.log('\n🔍 Looking for SKU patterns in first 20 rows:');
    for (let i = 1; i < Math.min(chodovData.length, 20); i++) {
      const row = chodovData[i];
      const potentialSKU = row[0];
      const colE = row[4];
      const colF = row[5];
      const colG = row[6];
      
      if (potentialSKU && typeof potentialSKU === 'string') {
        console.log(`Row ${i + 1}: SKU="${potentialSKU}" | E="${colE}" | F="${colF}" | G="${colG}"`);
      }
    }

    // Analyze OUTET sheet
    console.log('\n📊 OUTET (OUTLET) Sheet Analysis:');
    const outletSheet = workbook.Sheets['OUTET'];
    const outletData = XLSX.utils.sheet_to_json(outletSheet, { header: 1, defval: '' });
    
    console.log(`   Total rows: ${outletData.length}`);
    
    console.log('\n📋 First 5 OUTLET rows:');
    outletData.slice(0, 5).forEach((row, rowIndex) => {
      console.log(`Row ${rowIndex + 1}:`);
      row.slice(0, 8).forEach((cell, colIndex) => {
        console.log(`   [${String.fromCharCode(65 + colIndex)}] ${cell}`);
      });
      console.log('');
    });

    // Check for numeric values that could be stock
    console.log('\n🔍 Looking for numeric stock values:');
    for (let i = 1; i < Math.min(chodovData.length, 10); i++) {
      const row = chodovData[i];
      console.log(`Row ${i + 1} numeric values:`);
      row.forEach((cell, index) => {
        if (typeof cell === 'number' && cell >= 0 && cell < 1000) {
          console.log(`   Column ${String.fromCharCode(65 + index)} (${index}): ${cell}`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Analysis error:', error.message);
  }
}

analyzeExcelData();