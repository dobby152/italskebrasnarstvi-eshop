/**
 * Migrační skript pro přenos dat ze SQLite do Supabase
 */

require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { supabase } = require('../config/supabase-config');

// Cesta k SQLite databázi
const dbPath = path.join(__dirname, '..', 'database.sqlite');

// Připojení k SQLite databázi
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Chyba při připojení k SQLite databázi:', err.message);
    process.exit(1);
  }
  console.log('Připojeno k SQLite databázi.');
});

/**
 * Funkce pro získání dat z SQLite tabulky
 * @param {string} tableName - Název tabulky
 * @returns {Promise<Array>} - Pole objektů s daty
 */
function getDataFromSQLite(tableName) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

/**
 * Funkce pro vytvoření tabulek v Supabase pomocí REST API
 */
async function createTables() {
  try {
    console.log('Vytvářím tabulky v Supabase...');
    
    // Vytvoření tabulky products pomocí REST API
    try {
      console.log('Vytvářím tabulku products...');
      // Použijeme REST API pro vytvoření tabulky products
      const response = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id&limit=1`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200) {
        console.log('Tabulka products již existuje');
      } else if (response.status === 404) {
        console.log('Tabulka products neexistuje, vytvářím...');
        // Tabulka neexistuje, musíme ji vytvořit pomocí SQL v Supabase Dashboard
        console.log('Pro vytvoření tabulky products použijte SQL Editor v Supabase Dashboard:');
        console.log(`
          CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            price DECIMAL(10, 2) NOT NULL,
            image TEXT,
            category TEXT,
            stock INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `);
      } else {
        console.error('Chyba při kontrole tabulky products:', response.statusText);
      }
    } catch (error) {
      console.error('Chyba při vytváření tabulky products:', error.message);
    }
    
    // Vytvoření tabulky categories pomocí REST API
    try {
      console.log('Vytvářím tabulku categories...');
      // Použijeme REST API pro vytvoření tabulky categories
      const response = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=id&limit=1`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200) {
        console.log('Tabulka categories již existuje');
      } else if (response.status === 404) {
        console.log('Tabulka categories neexistuje, vytvářím...');
        // Tabulka neexistuje, musíme ji vytvořit pomocí SQL v Supabase Dashboard
        console.log('Pro vytvoření tabulky categories použijte SQL Editor v Supabase Dashboard:');
        console.log(`
          CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `);
      } else {
        console.error('Chyba při kontrole tabulky categories:', response.statusText);
      }
    } catch (error) {
      console.error('Chyba při vytváření tabulky categories:', error.message);
    }
    
    // Vytvoření tabulky orders pomocí REST API
    try {
      console.log('Vytvářím tabulku orders...');
      // Použijeme REST API pro vytvoření tabulky orders
      const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=id&limit=1`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200) {
        console.log('Tabulka orders již existuje');
      } else if (response.status === 404) {
        console.log('Tabulka orders neexistuje, vytvářím...');
        // Tabulka neexistuje, musíme ji vytvořit pomocí SQL v Supabase Dashboard
        console.log('Pro vytvoření tabulky orders použijte SQL Editor v Supabase Dashboard:');
        console.log(`
          CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            customer_name TEXT NOT NULL,
            customer_email TEXT,
            customer_address TEXT,
            total_amount DECIMAL(10, 2) NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `);
      } else {
        console.error('Chyba při kontrole tabulky orders:', response.statusText);
      }
    } catch (error) {
      console.error('Chyba při vytváření tabulky orders:', error.message);
    }
    
    // Vytvoření tabulky order_items pomocí REST API
    try {
      console.log('Vytvářím tabulku order_items...');
      // Použijeme REST API pro vytvoření tabulky order_items
      const response = await fetch(`${SUPABASE_URL}/rest/v1/order_items?select=id&limit=1`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200) {
        console.log('Tabulka order_items již existuje');
      } else if (response.status === 404) {
        console.log('Tabulka order_items neexistuje, vytvářím...');
        // Tabulka neexistuje, musíme ji vytvořit pomocí SQL v Supabase Dashboard
        console.log('Pro vytvoření tabulky order_items použijte SQL Editor v Supabase Dashboard:');
        console.log(`
          CREATE TABLE IF NOT EXISTS order_items (
            id SERIAL PRIMARY KEY,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES orders(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
          );
        `);
      } else {
        console.error('Chyba při kontrole tabulky order_items:', response.statusText);
      }
    } catch (error) {
      console.error('Chyba při vytváření tabulky order_items:', error.message);
    }
    
    console.log('Kontrola tabulek dokončena');
  } catch (error) {
    console.error('Chyba při vytváření tabulek:', error.message);
    // Pokračujeme i přes chybu
  }
}

/**
 * Funkce pro vytvoření tabulky products v Supabase
 */
async function createProductsTable() {
  try {
    // Nejprve zkusíme vytvořit tabulku přímo pomocí SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          price DECIMAL(10, 2) NOT NULL,
          image TEXT,
          category TEXT,
          stock INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    }).catch(e => ({ error: e }));

    if (error) throw error;
    console.log('Tabulka products byla úspěšně vytvořena v Supabase');
  } catch (error) {
    console.error('Chyba při vytváření tabulky products:', error.message);
    // Pokud procedura neexistuje, vytvoříme tabulku pomocí SQL
    try {
      const { error } = await supabase.from('products').select('count').limit(1);
      
      if (error && error.code === '42P01') { // Tabulka neexistuje
        const { error: createError } = await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS products (
              id SERIAL PRIMARY KEY,
              name TEXT NOT NULL,
              description TEXT,
              price DECIMAL(10, 2) NOT NULL,
              image TEXT,
              category TEXT,
              stock INTEGER DEFAULT 0,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
          `
        });
        
        if (createError) throw createError;
        console.log('Tabulka products byla úspěšně vytvořena v Supabase pomocí SQL');
      } else {
        console.log('Tabulka products již existuje v Supabase');
      }
    } catch (sqlError) {
      console.error('Chyba při vytváření tabulky products pomocí SQL:', sqlError.message);
      throw sqlError;
    }
  }
}

/**
 * Funkce pro vytvoření tabulky categories v Supabase
 */
async function createCategoriesTable() {
  try {
    // Vytvoříme tabulku přímo pomocí SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    }).catch(e => ({ error: e }));
    
    if (error) {
      console.error('Chyba při vytváření tabulky categories:', error.message);
    } else {
      console.log('Tabulka categories byla úspěšně vytvořena v Supabase');
    }
  } catch (error) {
    console.error('Chyba při vytváření tabulky categories:', error.message);
    // Pokračujeme i přes chybu
  }
}

/**
 * Funkce pro vytvoření tabulky orders v Supabase
 */
async function createOrdersTable() {
  try {
    // Vytvoříme tabulky přímo pomocí SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          customer_name TEXT NOT NULL,
          customer_email TEXT NOT NULL,
          customer_address TEXT,
          total_amount DECIMAL(10, 2) NOT NULL,
          status TEXT DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS order_items (
          id SERIAL PRIMARY KEY,
          order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
          product_id INTEGER REFERENCES products(id),
          quantity INTEGER NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    }).catch(e => ({ error: e }));
    
    if (error) {
      console.error('Chyba při vytváření tabulek orders a order_items:', error.message);
    } else {
      console.log('Tabulky orders a order_items byly úspěšně vytvořeny v Supabase');
    }
  } catch (error) {
    console.error('Chyba při vytváření tabulek orders a order_items:', error.message);
    // Pokračujeme i přes chybu
  }
}

/**
 * Funkce pro migraci dat z tabulky products
 */
async function migrateProducts() {
  try {
    const products = await getDataFromSQLite('products');
    console.log(`Nalezeno ${products.length} produktů v SQLite.`);

    // Rozdělíme produkty na menší dávky pro lepší zpracování
    const batchSize = 10;
    const batches = [];
    
    for (let i = 0; i < products.length; i += batchSize) {
      batches.push(products.slice(i, i + batchSize));
    }

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`Zpracovávám dávku ${i + 1}/${batches.length} (${batch.length} produktů)...`);
      
      try {
        // Pokusíme se vložit produkty do tabulky
        const { data, error } = await supabase.from('products').upsert(
          batch.map(product => ({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            image: product.image,
            category: product.category,
            stock: product.stock || 0,
            created_at: product.created_at ? new Date(product.created_at) : new Date(),
            updated_at: product.updated_at ? new Date(product.updated_at) : new Date()
          })),
          { onConflict: 'id' }
        );

        if (error) {
          console.error(`Chyba při migraci dávky ${i + 1}:`, error.message);
          errorCount += batch.length;
        } else {
          successCount += batch.length;
          console.log(`Dávka ${i + 1} úspěšně migrována.`);
        }
      } catch (batchError) {
        console.error(`Chyba při zpracování dávky ${i + 1}:`, batchError.message);
        errorCount += batch.length;
        
        // Pokračujeme s další dávkou i přes chybu
        continue;
      }
    }

    console.log(`Migrace produktů dokončena. Úspěšně: ${successCount}, Chyby: ${errorCount}`);
  } catch (error) {
    console.error('Chyba při migraci produktů:', error.message);
    throw error;
  }
}

/**
 * Funkce pro migraci dat z tabulky categories
 */
async function migrateCategories() {
  try {
    // Nejprve zkusíme získat kategorie přímo z tabulky categories, pokud existuje
    let categories = [];
    try {
      categories = await getDataFromSQLite('categories');
      console.log(`Nalezeno ${categories.length} kategorií v SQLite tabulce 'categories'.`);
    } catch (error) {
      console.log('Tabulka categories neexistuje v SQLite, extrahujeme kategorie z produktů...');
      
      // Pokud tabulka categories neexistuje, extrahujeme unikátní kategorie z produktů
      const products = await getDataFromSQLite('products');
      const uniqueCategories = new Set();
      
      products.forEach(product => {
        if (product.category) {
          uniqueCategories.add(product.category);
        }
      });
      
      categories = Array.from(uniqueCategories).map((name, index) => ({
        id: index + 1,
        name,
        description: `Kategorie: ${name}`
      }));
      
      console.log(`Extrahováno ${categories.length} unikátních kategorií z produktů.`);
    }

    if (categories.length === 0) {
      console.log('Žádné kategorie k migraci.');
      return;
    }

    try {
      const { data, error } = await supabase.from('categories').upsert(
        categories.map(category => ({
          id: category.id,
          name: category.name,
          description: category.description,
          created_at: category.created_at ? new Date(category.created_at) : new Date()
        })),
        { onConflict: 'name' }
      );

      if (error) {
        console.error('Chyba při migraci kategorií:', error.message);
      } else {
        console.log(`Úspěšně migrováno ${categories.length} kategorií.`);
      }
    } catch (upsertError) {
      console.error('Chyba při vkládání kategorií:', upsertError.message);
      // Pokračujeme i přes chybu
    }

    console.log(`Migrace kategorií dokončena. Migrováno ${categories.length} kategorií.`);
  } catch (error) {
    console.error('Chyba při migraci kategorií:', error.message);
    throw error;
  }
}

/**
 * Funkce pro migraci dat z tabulky orders
 */
async function migrateOrders() {
  return new Promise((resolve, reject) => {
    try {
      // Zkontrolujeme, zda tabulka orders existuje v SQLite
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='orders'", async (err, row) => {
        if (err) {
          console.error('Chyba při kontrole tabulky orders:', err.message);
          return resolve();
        }
        
        if (!row) {
          console.log('Tabulka orders neexistuje v SQLite, přeskakuji migraci objednávek.');
          return resolve();
        }
        
        try {
          // Získání objednávek z SQLite
          const orders = await getDataFromSQLite('orders');
          console.log(`Nalezeno ${orders.length} objednávek v SQLite.`);

          if (orders.length === 0) {
            console.log('Žádné objednávky k migraci.');
            return resolve();
          }

          let successCount = 0;
          let errorCount = 0;

          // Migrace objednávek
          for (const order of orders) {
            try {
              // Vložení objednávky
              const { data: orderData, error: orderError } = await supabase.from('orders').upsert({
                id: order.id,
                customer_name: order.customer_name,
                customer_email: order.customer_email,
                customer_address: order.customer_address,
                total_amount: order.total_amount,
                status: order.status || 'pending',
                created_at: order.created_at ? new Date(order.created_at) : new Date(),
                updated_at: order.updated_at ? new Date(order.updated_at) : new Date()
              }, { onConflict: 'id' });

              if (orderError) {
                console.error(`Chyba při migraci objednávky ID ${order.id}:`, orderError.message);
                errorCount++;
                continue;
              }

              // Získání položek objednávky
              try {
                const orderItems = await new Promise((resolveItems, rejectItems) => {
                  db.all(`SELECT * FROM order_items WHERE order_id = ?`, [order.id], (err, rows) => {
                    if (err) {
                      rejectItems(err);
                      return;
                    }
                    resolveItems(rows);
                  });
                });

                if (orderItems.length > 0) {
                  // Vložení položek objednávky
                  const { data: itemsData, error: itemsError } = await supabase.from('order_items').upsert(
                    orderItems.map(item => ({
                      id: item.id,
                      order_id: item.order_id,
                      product_id: item.product_id,
                      quantity: item.quantity,
                      price: item.price,
                      created_at: item.created_at ? new Date(item.created_at) : new Date()
                    })),
                    { onConflict: 'id' }
                  );

                  if (itemsError) {
                    console.error(`Chyba při migraci položek objednávky ID ${order.id}:`, itemsError.message);
                  } else {
                    console.log(`Migrováno ${orderItems.length} položek pro objednávku ID ${order.id}.`);
                  }
                }
              } catch (itemsError) {
                console.error(`Chyba při získávání položek objednávky ID ${order.id}:`, itemsError.message);
                // Pokračujeme i přes chybu s položkami
              }

              successCount++;
              console.log(`Objednávka ID ${order.id} úspěšně migrována.`);
            } catch (orderError) {
              console.error(`Chyba při zpracování objednávky ID ${order.id}:`, orderError.message);
              errorCount++;
            }
          }

          console.log(`Migrace objednávek dokončena. Úspěšně: ${successCount}, Chyby: ${errorCount}`);
          resolve();
        } catch (error) {
          console.error('Chyba při migraci objednávek:', error.message);
          resolve();
        }
      });
    } catch (error) {
      console.error('Chyba při migraci objednávek:', error.message);
      resolve();
    }
  });
}

/**
 * Hlavní funkce pro migraci dat
 */
async function migrateData() {
  try {
    console.log('Zahajuji migraci dat ze SQLite do Supabase...');

    // Vytvoření tabulek v Supabase přímo pomocí SQL API
    await createTables();

    // Migrace dat
    console.log('Zahajuji migraci kategorií...');
    await migrateCategories();
    console.log('Zahajuji migraci produktů...');
    await migrateProducts();
    console.log('Zahajuji migraci objednávek...');
    await migrateOrders();

    console.log('Migrace dat úspěšně dokončena!');
  } catch (error) {
    console.error('Chyba při migraci dat:', error.message);
  } finally {
    // Uzavření SQLite databáze
    db.close((err) => {
      if (err) {
        console.error('Chyba při uzavírání SQLite databáze:', err.message);
      } else {
        console.log('SQLite databáze byla úspěšně uzavřena.');
      }
      process.exit(0);
    });
  }
}

// Spuštění migrace
migrateData();