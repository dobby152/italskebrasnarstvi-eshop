const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const csv = require('csv-parser');

// Cesta k databázi a CSV souboru
const dbPath = path.join(__dirname, '..', 'database.sqlite');
const csvPath = path.join(__dirname, '..', '..', '..', 'unified_catalog_translated.csv');

// Připojení k databázi
const db = new sqlite3.Database(dbPath);

// Funkce pro vyčištění a import produktů
function importProducts() {
  console.log('Začínám import produktů...');
  
  // Nejdříve vyčistíme tabulku produktů
  db.run('DELETE FROM products', (err) => {
    if (err) {
      console.error('Chyba při mazání produktů:', err);
      return;
    }
    console.log('Tabulka produktů vyčištěna.');
    
    // Reset auto increment
    db.run('DELETE FROM sqlite_sequence WHERE name="products"', (err) => {
      if (err) console.log('Varování: Nepodařilo se resetovat auto increment');
      
      let count = 0;
      const products = [];
      
      // Čtení CSV souboru
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          // Mapování CSV sloupců na databázové sloupce
          const product = {
            name_cz: row['Název produktu (CZ)'] || '',
            collection_cz: row['Kolekce (CZ)'] || '',
            description_cz: row['Popis (CZ)'] || '',
            sku: row['SKU'] || '',
            price: parseFloat(row['Cena (€)']) || 0,
            local_images: row['Lokální obrázky'] || '',
            online_images: row['Online obrázky'] || '',
            original_name: row['Původní název'] || '',
            original_collection: row['Původní kolekce'] || '',
            original_description: row['Původní popis'] || '',
            brand: row['Značka'] || '',
            availability: row['Dostupnost'] || '',
            product_url: row['URL produktu'] || ''
          };
          
          products.push(product);
          count++;
        })
        .on('end', () => {
          console.log(`Načteno ${count} produktů z CSV.`);
          
          // Bulk insert produktů
          const stmt = db.prepare(`
            INSERT INTO products (
              name_cz, collection_cz, description_cz, sku, price,
              local_images, online_images, original_name, original_collection,
              original_description, brand, availability, product_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          
          let inserted = 0;
          let errors = 0;
          
          products.forEach((product) => {
            stmt.run([
              product.name_cz,
              product.collection_cz,
              product.description_cz,
              product.sku,
              product.price,
              product.local_images,
              product.online_images,
              product.original_name,
              product.original_collection,
              product.original_description,
              product.brand,
              product.availability,
              product.product_url
            ], function(err) {
              if (err) {
                console.error(`Chyba při vkládání produktu ${product.sku}:`, err.message);
                errors++;
              } else {
                inserted++;
              }
              
              // Kontrola, zda jsou všechny produkty zpracovány
              if (inserted + errors === products.length) {
                stmt.finalize();
                console.log(`Import dokončen: ${inserted} produktů úspěšně vloženo, ${errors} chyb.`);
                
                // Ověření počtu produktů v databázi
                db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
                  if (err) {
                    console.error('Chyba při počítání produktů:', err);
                  } else {
                    console.log(`Celkový počet produktů v databázi: ${row.count}`);
                  }
                  db.close();
                });
              }
            });
          });
        })
        .on('error', (err) => {
          console.error('Chyba při čtení CSV:', err);
          db.close();
        });
    });
  });
}

// Spuštění importu
importProducts();