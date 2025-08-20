const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'frontend', 'backend', 'database.sqlite');
console.log('Database path:', dbPath);
const db = new sqlite3.Database(dbPath);

console.log('Checking products count in database...');

db.get('SELECT COUNT(*) as total FROM products', (err, row) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('Total products in database:', row.total);
  }
  
  // Also check some sample products
  db.all('SELECT id, name_cz, sku FROM products LIMIT 10', (err, rows) => {
    if (err) {
      console.error('Error getting sample products:', err.message);
    } else {
      console.log('\nSample products:');
      rows.forEach(product => {
        console.log(`ID: ${product.id}, Name: ${product.name_cz}, SKU: ${product.sku}`);
      });
    }
    
    db.close();
  });
});