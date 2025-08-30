const fs = require('fs');
const csv = require('csv-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Cesta k CSV souboru
const csvFilePath = path.join(__dirname, '../../../unified_catalog_translated.csv');
const dbPath = path.join(__dirname, '../database.sqlite');

// Připojení k databázi
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Chyba při připojení k databázi:', err.message);
    process.exit(1);
  } else {
    console.log('Připojeno k SQLite databázi pro import.');
  }
});

// Funkce pro vytvoření tabulek
function createTables() {
  return new Promise((resolve, reject) => {
    const createProductsTable = `
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name_cz TEXT NOT NULL,
        collection_cz TEXT,
        description_cz TEXT,
        sku TEXT UNIQUE NOT NULL,
        price REAL NOT NULL,
        local_images TEXT,
        online_images TEXT,
        original_name TEXT,
        original_collection TEXT,
        original_description TEXT,
        brand TEXT,
        availability TEXT,
        product_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    db.run(createProductsTable, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Tabulka products vytvořena nebo již existuje.');
        resolve();
      }
    });
  });
}

// Funkce pro vymazání existujících dat
function clearExistingData() {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM products', (err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Existující data vymazána.');
        resolve();
      }
    });
  });
}

// Funkce pro import CSV dat
function importCsvData() {
  return new Promise((resolve, reject) => {
    const products = [];
    let rowCount = 0;
    
    console.log('Začínám čtení CSV souboru...');
    
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        rowCount++;
        
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
        
        // Validace povinných polí
        if (product.sku && product.name_cz && product.price > 0) {
          products.push(product);
        } else {
          console.warn(`Řádek ${rowCount}: Neplatná data - SKU: ${product.sku}, Název: ${product.name_cz}, Cena: ${product.price}`);
        }
      })
      .on('end', () => {
        console.log(`CSV soubor načten. Celkem řádků: ${rowCount}, Validních produktů: ${products.length}`);
        
        if (products.length === 0) {
          reject(new Error('Žádné validní produkty k importu'));
          return;
        }
        
        // Příprava SQL dotazu pro vložení
        const insertQuery = `
          INSERT INTO products (
            name_cz, collection_cz, description_cz, sku, price,
            local_images, online_images, original_name, original_collection,
            original_description, brand, availability, product_url
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        // Příprava transakce pro rychlejší vkládání
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');
          
          const stmt = db.prepare(insertQuery);
          let insertedCount = 0;
          let errorCount = 0;
          
          products.forEach((product, index) => {
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
                errorCount++;
              } else {
                insertedCount++;
              }
              
              // Kontrola, zda jsou všechny produkty zpracovány
              if (insertedCount + errorCount === products.length) {
                stmt.finalize();
                
                db.run('COMMIT', (err) => {
                  if (err) {
                    console.error('Chyba při potvrzení transakce:', err.message);
                    reject(err);
                  } else {
                    console.log(`Import dokončen. Vloženo: ${insertedCount}, Chyby: ${errorCount}`);
                    resolve({ inserted: insertedCount, errors: errorCount });
                  }
                });
              }
            });
          });
        });
      })
      .on('error', (err) => {
        console.error('Chyba při čtení CSV souboru:', err.message);
        reject(err);
      });
  });
}

// Hlavní funkce pro spuštění importu
async function runImport() {
  try {
    console.log('=== IMPORT CSV DAT DO DATABÁZE ===');
    console.log(`CSV soubor: ${csvFilePath}`);
    console.log(`Databáze: ${dbPath}`);
    
    // Kontrola existence CSV souboru
    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`CSV soubor nenalezen: ${csvFilePath}`);
    }
    
    // Vytvoření tabulek
    await createTables();
    
    // Vymazání existujících dat
    console.log('Mažu existující data...');
    await clearExistingData();
    
    // Import nových dat
    console.log('Importuji nová data...');
    const result = await importCsvData();
    
    console.log('=== IMPORT DOKONČEN ===');
    console.log(`Úspěšně importováno: ${result.inserted} produktů`);
    if (result.errors > 0) {
      console.log(`Chyby při importu: ${result.errors}`);
    }
    
  } catch (error) {
    console.error('Chyba při importu:', error.message);
    process.exit(1);
  } finally {
    // Uzavření databáze
    db.close((err) => {
      if (err) {
        console.error('Chyba při uzavírání databáze:', err.message);
      } else {
        console.log('Databáze uzavřena.');
      }
      process.exit(0);
    });
  }
}

// Spuštění importu
if (require.main === module) {
  runImport();
}

module.exports = { runImport };