const XLSX = require('xlsx');
const fs = require('fs');

function parseInventory() {
  try {
    console.log('Reading ZASOBY.xlsx...\n');
    
    const workbook = XLSX.readFile('C:\\Users\\hynex\\Downloads\\ZASOBY.xlsx');
    const sheetNames = workbook.SheetNames;
    
    console.log(`Found ${sheetNames.length} sheets:`);
    sheetNames.forEach((name, index) => {
      console.log(`${index + 1}. ${name}`);
    });
    
    const inventory = {};
    
    sheetNames.forEach(sheetName => {
      console.log(`\nProcessing sheet: ${sheetName}`);
      
      const worksheet = workbook.Sheets[sheetName];
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
      
      // Look for data in column F (column index 5)
      for (let row = range.s.r; row <= range.e.r; row++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: 5 }); // Column F
        const cell = worksheet[cellRef];
        
        if (cell && cell.v !== undefined && cell.v !== null) {
          const stockValue = cell.v;
          
          // Try to find product identifier in columns A, B, C, D, E
          let productId = null;
          for (let col = 0; col < 5; col++) {
            const idCellRef = XLSX.utils.encode_cell({ r: row, c: col });
            const idCell = worksheet[idCellRef];
            if (idCell && idCell.v && typeof idCell.v === 'string' && idCell.v.trim()) {
              // Look for SKU-like pattern or product name
              const value = idCell.v.trim();
              if (value.length > 2 && !value.includes('Skladová') && !value.includes('zásoba')) {
                productId = value;
                break;
              }
            }
          }
          
          if (productId && typeof stockValue === 'number' && stockValue >= 0) {
            // Map OUTET to OUTLET for correct display
            const locationName = sheetName === 'OUTET' ? 'OUTLET' : sheetName;
            
            if (!inventory[locationName]) {
              inventory[locationName] = [];
            }
            
            inventory[locationName].push({
              productId: productId,
              stock: stockValue,
              row: row + 1,
              location: locationName
            });
          }
        }
      }
      
      const locationName = sheetName === 'OUTET' ? 'OUTLET' : sheetName;
      console.log(`Found ${inventory[locationName] ? inventory[locationName].length : 0} inventory items in ${sheetName} (mapped to ${locationName})`);
    });
    
    // Summary
    console.log('\n=== INVENTORY SUMMARY ===');
    let totalItems = 0;
    
    Object.keys(inventory).forEach(location => {
      const items = inventory[location];
      console.log(`${location}: ${items.length} items`);
      totalItems += items.length;
      
      // Show first few items as examples
      if (items.length > 0) {
        console.log(`  Examples:`);
        items.slice(0, 3).forEach(item => {
          console.log(`    ${item.productId}: ${item.stock} ks (row ${item.row})`);
        });
        if (items.length > 3) {
          console.log(`    ... and ${items.length - 3} more`);
        }
      }
      console.log('');
    });
    
    console.log(`Total inventory items: ${totalItems}`);
    
    // Save parsed inventory
    const inventoryData = {
      totalItems,
      locations: Object.keys(inventory).length,
      inventory,
      parsedAt: new Date().toISOString(),
      sheets: sheetNames
    };
    
    fs.writeFileSync(
      'C:\\Users\\hynex\\Desktop\\italskebrasnarstvi eshop\\inventory-parsed.json', 
      JSON.stringify(inventoryData, null, 2)
    );
    
    console.log('Inventory data saved to inventory-parsed.json');
    
    return inventoryData;
    
  } catch (error) {
    console.error('Error parsing inventory:', error.message);
    
    if (error.message.includes('Cannot resolve module')) {
      console.log('\nTo install required dependencies:');
      console.log('npm install xlsx');
    }
  }
}

// Run the parser
parseInventory();