const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Kontrola SKU v databázi...');

// Zkontrolovat produkty bez SKU
db.all(`SELECT id, name_cz, sku FROM products WHERE sku IS NULL OR sku = '' LIMIT 10`, (err, rows) => {
  if (err) {
    console.error('❌ Chyba při čtení databáze:', err);
    return;
  }
  
  console.log('📊 Produkty bez SKU:');
  if (rows.length === 0) {
    console.log('✅ Všechny produkty mají SKU');
  } else {
    rows.forEach(row => {
      console.log(`ID: ${row.id}, Název: ${row.name_cz}, SKU: ${row.sku || 'CHYBÍ'}`);
    });
  }
  
  // Spočítat celkový počet produktů bez SKU
  db.get(`SELECT COUNT(*) as count FROM products WHERE sku IS NULL OR sku = ''`, (err, result) => {
    if (err) {
      console.error('❌ Chyba při počítání:', err);
      return;
    }
    
    console.log(`\n📈 Celkem produktů bez SKU: ${result.count}`);
    
    // Spočítat celkový počet produktů
    db.get(`SELECT COUNT(*) as total FROM products`, (err, totalResult) => {
      if (err) {
        console.error('❌ Chyba při počítání celkem:', err);
        return;
      }
      
      console.log(`📊 Celkem produktů: ${totalResult.total}`);
      console.log(`✅ Produktů s SKU: ${totalResult.total - result.count}`);
      
      db.close();
    });
  });
});