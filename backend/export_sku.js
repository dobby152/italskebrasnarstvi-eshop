const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Připojení k SQLite databázi
const db = new sqlite3.Database('./database.sqlite');

console.log('Exportuji SKU hodnoty z SQLite databáze...');

// Dotaz na všechny produkty s jejich SKU
db.all(`
  SELECT id, name_cz, sku 
  FROM products 
  WHERE sku IS NOT NULL AND sku != ''
  ORDER BY id
`, [], (err, rows) => {
  if (err) {
    console.error('Chyba při čtení z databáze:', err.message);
    return;
  }

  console.log(`Nalezeno ${rows.length} produktů s SKU`);
  
  // Uložení do JSON souboru pro další zpracování
  const skuData = rows.map(row => ({
    id: row.id,
    name: row.name_cz,
    sku: row.sku
  }));
  
  fs.writeFileSync('./sku_export.json', JSON.stringify(skuData, null, 2));
  console.log('SKU data exportována do sku_export.json');
  
  // Zobrazení prvních 10 záznamů
  console.log('\nPrvních 10 SKU záznamů:');
  rows.slice(0, 10).forEach(row => {
    console.log(`ID: ${row.id}, SKU: ${row.sku}, Název: ${row.name_cz}`);
  });
  
  db.close();
});