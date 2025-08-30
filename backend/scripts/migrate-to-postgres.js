require('dotenv').config({ path: '../.env' });
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { pgPool } = require('../config/supabase');

// Cesta k SQLite databázi
const dbPath = path.join(__dirname, '..', 'database.sqlite');

// Připojení k SQLite databázi
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Chyba při připojení k SQLite databázi:', err.message);
    process.exit(1);
  }
  console.log('Připojeno k SQLite databázi pro migraci.');
});

// Funkce pro vytvoření tabulek v PostgreSQL
async function createPostgresTables() {
  const client = await pgPool.connect();
  try {
    // Začátek transakce
    await client.query('BEGIN');

    // Vytvoření tabulky products
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Vytvoření tabulky categories
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name_cz TEXT NOT NULL,
        name_original TEXT,
        slug TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Vytvoření tabulky orders
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_phone TEXT,
        shipping_address TEXT NOT NULL,
        billing_address TEXT,
        total_amount REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        payment_method TEXT,
        payment_status TEXT DEFAULT 'pending',
        items TEXT NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Commit transakce
    await client.query('COMMIT');
    console.log('PostgreSQL tabulky byly úspěšně vytvořeny.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Chyba při vytváření PostgreSQL tabulek:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

// Funkce pro migraci dat z SQLite do PostgreSQL
async function migrateData() {
  try {
    // Nejprve vytvoříme tabulky v PostgreSQL
    await createPostgresTables();

    // Migrace produktů
    await migrateProducts();

    // Migrace kategorií
    await migrateCategories();

    // Migrace objednávek
    await migrateOrders();

    console.log('Migrace dat byla úspěšně dokončena.');
  } catch (err) {
    console.error('Chyba při migraci dat:', err);
  } finally {
    // Uzavření SQLite databáze
    db.close((err) => {
      if (err) {
        console.error('Chyba při zavírání SQLite databáze:', err.message);
      } else {
        console.log('SQLite databáze uzavřena.');
      }
    });

    // Ukončení připojení k PostgreSQL
    await pgPool.end();
    console.log('PostgreSQL připojení ukončeno.');
  }
}

// Funkce pro migraci produktů
async function migrateProducts() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM products', async (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      console.log(`Migrace ${rows.length} produktů...`);

      const client = await pgPool.connect();
      try {
        await client.query('BEGIN');

        for (const product of rows) {
          await client.query(
            `INSERT INTO products (
              name_cz, collection_cz, description_cz, sku, price, 
              local_images, online_images, original_name, original_collection, 
              original_description, brand, availability, product_url, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            ON CONFLICT (sku) DO UPDATE SET
              name_cz = EXCLUDED.name_cz,
              collection_cz = EXCLUDED.collection_cz,
              description_cz = EXCLUDED.description_cz,
              price = EXCLUDED.price,
              local_images = EXCLUDED.local_images,
              online_images = EXCLUDED.online_images,
              original_name = EXCLUDED.original_name,
              original_collection = EXCLUDED.original_collection,
              original_description = EXCLUDED.original_description,
              brand = EXCLUDED.brand,
              availability = EXCLUDED.availability,
              product_url = EXCLUDED.product_url
            `,
            [
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
              product.product_url,
              product.created_at || new Date()
            ]
          );
        }

        await client.query('COMMIT');
        console.log('Produkty byly úspěšně migrovány.');
        resolve();
      } catch (err) {
        await client.query('ROLLBACK');
        reject(err);
      } finally {
        client.release();
      }
    });
  });
}

// Funkce pro migraci kategorií
async function migrateCategories() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM categories', async (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      console.log(`Migrace ${rows.length} kategorií...`);

      const client = await pgPool.connect();
      try {
        await client.query('BEGIN');

        for (const category of rows) {
          await client.query(
            `INSERT INTO categories (
              name_cz, name_original, slug, created_at
            ) VALUES ($1, $2, $3, $4)
            ON CONFLICT (slug) DO UPDATE SET
              name_cz = EXCLUDED.name_cz,
              name_original = EXCLUDED.name_original
            `,
            [
              category.name_cz,
              category.name_original,
              category.slug,
              category.created_at || new Date()
            ]
          );
        }

        await client.query('COMMIT');
        console.log('Kategorie byly úspěšně migrovány.');
        resolve();
      } catch (err) {
        await client.query('ROLLBACK');
        reject(err);
      } finally {
        client.release();
      }
    });
  });
}

// Funkce pro migraci objednávek
async function migrateOrders() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM orders', async (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      console.log(`Migrace ${rows.length} objednávek...`);

      const client = await pgPool.connect();
      try {
        await client.query('BEGIN');

        for (const order of rows) {
          await client.query(
            `INSERT INTO orders (
              customer_name, customer_email, customer_phone, shipping_address,
              billing_address, total_amount, status, payment_method,
              payment_status, items, notes, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            `,
            [
              order.customer_name,
              order.customer_email,
              order.customer_phone,
              order.shipping_address,
              order.billing_address,
              order.total_amount,
              order.status,
              order.payment_method,
              order.payment_status,
              order.items,
              order.notes,
              order.created_at || new Date(),
              order.updated_at || new Date()
            ]
          );
        }

        await client.query('COMMIT');
        console.log('Objednávky byly úspěšně migrovány.');
        resolve();
      } catch (err) {
        await client.query('ROLLBACK');
        reject(err);
      } finally {
        client.release();
      }
    });
  });
}

// Spuštění migrace
migrateData().catch(err => {
  console.error('Chyba při migraci:', err);
  process.exit(1);
});