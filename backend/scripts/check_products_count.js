const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Připojení k databázi
const dbPath = path.join(__dirname, '..', 'database.sqlite');
console.log('Připojuji se k databázi:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Chyba při připojení k databázi:', err.message);
    process.exit(1);
  }
  console.log('Připojeno k SQLite databázi.');
  
  // Zjistit počet produktů
  db.get('SELECT COUNT(*) as count FROM products', [], (err, row) => {
    if (err) {
      console.error('Chyba při počítání produktů:', err.message);
      closeDb();
      return;
    }
    
    console.log(`Celkový počet produktů v databázi: ${row.count}`);
    
    // Pokud existují produkty, zobrazit prvních 10 pro kontrolu
    if (row.count > 0) {
      db.all('SELECT id, name_cz, sku FROM products LIMIT 10', [], (err, rows) => {
        if (err) {
          console.error('Chyba při načítání produktů:', err.message);
          closeDb();
          return;
        }
        
        console.log('\nPrvních 10 produktů:');
        rows.forEach(product => {
          console.log(`ID: ${product.id}, Název: ${product.name_cz}, SKU: ${product.sku}`);
        });
        
        closeDb();
      });
    } else {
      console.log('V databázi nejsou žádné produkty.');
      closeDb();
    }
  });
});

function closeDb() {
  db.close((err) => {
    if (err) {
      console.error('Chyba při zavírání databáze:', err.message);
    } else {
      console.log('Databáze uzavřena.');
    }
    process.exit(0);
  });
}