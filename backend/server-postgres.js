require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { pgPool } = require('./config/supabase');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statické soubory pro obrázky
app.use('/images', express.static(path.join(__dirname, '../../images')));

// Připojení k PostgreSQL
const connectToDatabase = async () => {
  try {
    const client = await pgPool.connect();
    console.log('Připojeno k PostgreSQL databázi.');
    client.release();
    return true;
  } catch (err) {
    console.error('Chyba při připojení k databázi:', err.message);
    return false;
  }
};

// Inicializace databáze
const initializeDatabase = async () => {
  const client = await pgPool.connect();
  try {
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

    await client.query('COMMIT');
    console.log('Databázové tabulky byly úspěšně vytvořeny nebo již existují.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Chyba při inicializaci databáze:', err.message);
  } finally {
    client.release();
  }
};

// Připojení k databázi a inicializace
connectToDatabase().then(connected => {
  if (connected) {
    initializeDatabase();
  }
});

// API endpointy

// Získat všechny produkty s filtrováním a stránkováním
app.get('/api/products', async (req, res) => {
  const { page = 1, limit = 20, search = '', collection = '', sort = 'id', order = 'asc' } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (search) {
      query += ` AND (name_cz ILIKE $${paramIndex} OR sku ILIKE $${paramIndex} OR description_cz ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (collection) {
      query += ` AND collection_cz = $${paramIndex}`;
      params.push(collection);
      paramIndex++;
    }
    
    // Přidání řazení
    const validSortColumns = ['id', 'name_cz', 'price', 'created_at'];
    const validOrders = ['asc', 'desc'];
    
    const sortColumn = validSortColumns.includes(sort) ? sort : 'id';
    const sortOrder = validOrders.includes(order.toLowerCase()) ? order.toLowerCase() : 'asc';
    
    query += ` ORDER BY ${sortColumn} ${sortOrder}`;
    
    // Přidání limitů pro stránkování
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const client = await pgPool.connect();
    try {
      // Získání produktů
      const result = await client.query(query, params);
      
      // Získání celkového počtu produktů pro paginaci
      let countQuery = 'SELECT COUNT(*) as total FROM products WHERE 1=1';
      const countParams = [];
      let countParamIndex = 1;
      
      if (search) {
        countQuery += ` AND (name_cz ILIKE $${countParamIndex} OR sku ILIKE $${countParamIndex} OR description_cz ILIKE $${countParamIndex})`;
        countParams.push(`%${search}%`);
        countParamIndex++;
      }
      
      if (collection) {
        countQuery += ` AND collection_cz = $${countParamIndex}`;
        countParams.push(collection);
      }
      
      const countResult = await client.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);
      
      // Zpracování produktů
      const products = result.rows.map(product => {
        const images = product.local_images ? 
          product.local_images.split(';').map(img => img.trim()).filter(img => img) : [];
        
        return {
          ...product,
          images: images,
          mainImage: images[0] || null
        };
      });
      
      res.json({
        products: products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Chyba při získávání produktů:', err);
    res.status(500).json({ error: err.message });
  }
});

// Získat jeden produkt podle ID
app.get('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const client = await pgPool.connect();
    try {
      const result = await client.query('SELECT * FROM products WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Produkt nenalezen' });
      }
      
      const product = result.rows[0];
      const images = product.local_images ? 
        product.local_images.split(';').map(img => img.trim()).filter(img => img) : [];
      
      const processedProduct = {
        ...product,
        images: images,
        mainImage: images[0] || null
      };
      
      res.json(processedProduct);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Chyba při získávání produktu:', err);
    res.status(500).json({ error: err.message });
  }
});

// Získat kolekce produktů
app.get('/api/collections', async (req, res) => {
  try {
    const client = await pgPool.connect();
    try {
      const result = await client.query(
        'SELECT DISTINCT collection_cz as name FROM products WHERE collection_cz IS NOT NULL AND collection_cz != \'\''
      );
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Chyba při získávání kolekcí:', err);
    res.status(500).json({ error: err.message });
  }
});

// Získat statistiky
app.get('/api/stats', async (req, res) => {
  try {
    const client = await pgPool.connect();
    try {
      const queries = {
        totalProducts: 'SELECT COUNT(*) as count FROM products',
        totalCollections: 'SELECT COUNT(DISTINCT collection_cz) as count FROM products WHERE collection_cz IS NOT NULL AND collection_cz != \'\'',
        avgPrice: 'SELECT AVG(price) as avg FROM products',
        priceRange: 'SELECT MIN(price) as min, MAX(price) as max FROM products'
      };
      
      const stats = {};
      
      for (const [key, query] of Object.entries(queries)) {
        const result = await client.query(query);
        stats[key] = result.rows[0];
      }
      
      res.json(stats);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Chyba při získávání statistik:', err);
    res.status(500).json({ error: err.message });
  }
});

// Vytvořit nový produkt
app.post('/api/products', async (req, res) => {
  const {
    name_cz,
    collection_cz,
    description_cz,
    sku,
    price,
    brand,
    availability = 'in_stock',
    local_images = '',
    online_images = ''
  } = req.body;

  // Validace povinných polí
  if (!name_cz || !sku || !price) {
    return res.status(400).json({ 
      error: 'Chybí povinná pole: name_cz, sku, price' 
    });
  }

  try {
    const client = await pgPool.connect();
    try {
      const result = await client.query(
        `INSERT INTO products (
          name_cz, collection_cz, description_cz, sku, price, 
          brand, availability, local_images, online_images
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          name_cz, collection_cz, description_cz, sku, price,
          brand, availability, local_images, online_images
        ]
      );

      const newProduct = result.rows[0];
      const images = newProduct.local_images ? 
        newProduct.local_images.split(';').map(img => img.trim()).filter(img => img) : [];

      const processedProduct = {
        ...newProduct,
        images: images,
        mainImage: images[0] || null
      };

      res.status(201).json(processedProduct);
    } catch (err) {
      if (err.code === '23505') { // Unique violation
        return res.status(409).json({ error: 'Produkt s tímto SKU již existuje' });
      }
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Chyba při vytváření produktu:', err);
    res.status(500).json({ error: err.message });
  }
});

// Aktualizovat produkt
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const {
    name_cz,
    collection_cz,
    description_cz,
    sku,
    price,
    brand,
    availability,
    local_images,
    online_images
  } = req.body;

  try {
    const client = await pgPool.connect();
    try {
      // Nejprve zkontrolovat, zda produkt existuje
      const checkResult = await client.query('SELECT * FROM products WHERE id = $1', [id]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Produkt nenalezen' });
      }

      const updateQuery = `
        UPDATE products SET 
          name_cz = COALESCE($1, name_cz),
          collection_cz = COALESCE($2, collection_cz),
          description_cz = COALESCE($3, description_cz),
          sku = COALESCE($4, sku),
          price = COALESCE($5, price),
          brand = COALESCE($6, brand),
          availability = COALESCE($7, availability),
          local_images = COALESCE($8, local_images),
          online_images = COALESCE($9, online_images)
        WHERE id = $10
        RETURNING *
      `;

      const result = await client.query(updateQuery, [
        name_cz, collection_cz, description_cz, sku, price,
        brand, availability, local_images, online_images, id
      ]);

      const updatedProduct = result.rows[0];
      const images = updatedProduct.local_images ? 
        updatedProduct.local_images.split(';').map(img => img.trim()).filter(img => img) : [];

      const processedProduct = {
        ...updatedProduct,
        images: images,
        mainImage: images[0] || null
      };

      res.json(processedProduct);
    } catch (err) {
      if (err.code === '23505') { // Unique violation
        return res.status(409).json({ error: 'Produkt s tímto SKU již existuje' });
      }
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Chyba při aktualizaci produktu:', err);
    res.status(500).json({ error: err.message });
  }
});

// Smazat produkt
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const client = await pgPool.connect();
    try {
      // Nejprve zkontrolovat, zda produkt existuje
      const checkResult = await client.query('SELECT * FROM products WHERE id = $1', [id]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Produkt nenalezen' });
      }

      const deletedProduct = checkResult.rows[0];
      await client.query('DELETE FROM products WHERE id = $1', [id]);

      res.json({ 
        message: 'Produkt byl úspěšně smazán',
        deletedProduct: deletedProduct
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Chyba při mazání produktu:', err);
    res.status(500).json({ error: err.message });
  }
});

// API endpointy pro objednávky
app.get('/api/orders', async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    const client = await pgPool.connect();
    try {
      let query = 'SELECT * FROM orders WHERE 1=1';
      let params = [];
      let paramIndex = 1;
      
      if (status && status !== 'all') {
        query += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
      
      if (search) {
        query += ` AND (customer_name ILIKE $${paramIndex} OR customer_email ILIKE $${paramIndex} OR CAST(id AS TEXT) ILIKE $${paramIndex})`;
        const searchTerm = `%${search}%`;
        params.push(searchTerm);
        paramIndex++;
      }
      
      query += ' ORDER BY created_at DESC LIMIT $' + paramIndex + ' OFFSET $' + (paramIndex + 1);
      params.push(parseInt(limit), parseInt(offset));
      
      const result = await client.query(query, params);
      
      // Získat celkový počet objednávek pro paginaci
      let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE 1=1';
      let countParams = [];
      let countParamIndex = 1;
      
      if (status && status !== 'all') {
        countQuery += ` AND status = $${countParamIndex}`;
        countParams.push(status);
        countParamIndex++;
      }
      
      if (search) {
        countQuery += ` AND (customer_name ILIKE $${countParamIndex} OR customer_email ILIKE $${countParamIndex} OR CAST(id AS TEXT) ILIKE $${countParamIndex})`;
        const searchTerm = `%${search}%`;
        countParams.push(searchTerm);
      }
      
      const countResult = await client.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);
      
      // Zpracovat položky objednávek
      const processedOrders = result.rows.map(order => {
        let items = [];
        try {
          items = JSON.parse(order.items || '[]');
        } catch (e) {
          console.error('Chyba při parsování položek objednávky:', e);
        }
        
        return {
          ...order,
          items: items
        };
      });
      
      res.json({
        orders: processedOrders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Chyba při získávání objednávek:', err);
    res.status(500).json({ error: err.message });
  }
});

// Získat jednu objednávku podle ID
app.get('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const client = await pgPool.connect();
    try {
      const result = await client.query('SELECT * FROM orders WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Objednávka nenalezena' });
      }
      
      const order = result.rows[0];
      let items = [];
      try {
        items = JSON.parse(order.items || '[]');
      } catch (e) {
        console.error('Chyba při parsování položek objednávky:', e);
      }
      
      res.json({
        ...order,
        items: items
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Chyba při získávání objednávky:', err);
    res.status(500).json({ error: err.message });
  }
});

// Vytvořit novou objednávku
app.post('/api/orders', async (req, res) => {
  const {
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    billing_address,
    total_amount,
    payment_method,
    items,
    notes
  } = req.body;
  
  // Validace povinných polí
  if (!customer_name || !customer_email || !shipping_address || !total_amount || !items) {
    return res.status(400).json({ 
      error: 'Chybí povinná pole: customer_name, customer_email, shipping_address, total_amount, items' 
    });
  }
  
  // Převést položky na JSON string
  const itemsJson = JSON.stringify(items);
  
  try {
    const client = await pgPool.connect();
    try {
      const result = await client.query(
        `INSERT INTO orders (
          customer_name, customer_email, customer_phone, shipping_address,
          billing_address, total_amount, payment_method, items, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id`,
        [
          customer_name, customer_email, customer_phone, shipping_address,
          billing_address, total_amount, payment_method, itemsJson, notes
        ]
      );
      
      res.status(201).json({
        id: result.rows[0].id,
        message: 'Objednávka byla úspěšně vytvořena'
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Chyba při vytváření objednávky:', err);
    res.status(500).json({ error: err.message });
  }
});

// Aktualizovat stav objednávky
app.put('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { status, payment_status, notes } = req.body;
  
  if (!status && !payment_status && notes === undefined) {
    return res.status(400).json({ error: 'Žádná data k aktualizaci' });
  }
  
  try {
    const client = await pgPool.connect();
    try {
      let updateFields = [];
      let params = [];
      let paramIndex = 1;
      
      if (status) {
        updateFields.push(`status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }
      
      if (payment_status) {
        updateFields.push(`payment_status = $${paramIndex}`);
        params.push(payment_status);
        paramIndex++;
      }
      
      if (notes !== undefined) {
        updateFields.push(`notes = $${paramIndex}`);
        params.push(notes);
        paramIndex++;
      }
      
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(id);
      
      const query = `UPDATE orders SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
      
      const result = await client.query(query, params);
      
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Objednávka nenalezena' });
      }
      
      res.json({
        message: 'Objednávka byla úspěšně aktualizována',
        order: result.rows[0]
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Chyba při aktualizaci objednávky:', err);
    res.status(500).json({ error: err.message });
  }
});

// API endpointy pro analýzy
app.get('/api/analytics/dashboard', async (req, res) => {
  // Prozatím vrátíme statická data
  const salesChartData = [
    { date: '01/05', sales: 15000 },
    { date: '02/05', sales: 18000 },
    { date: '03/05', sales: 16000 },
    { date: '04/05', sales: 19000 },
    { date: '05/05', sales: 22000 },
    { date: '06/05', sales: 20000 },
    { date: '07/05', sales: 25000 }
  ];
  
  const analytics = {
    salesChart: salesChartData,
    grossSales: 1350000,
    discounts: 50000,
    returns: 50000,
    netSales: 1250000,
    goalProgress: 68,
    channelSales: {
      online: 950000,
      other: 300000,
      search: 0
    },
    channelPercentages: {
      online: 76,
      other: 24,
      search: 0
    },
    recentOrders: [
      { id: 'ORD-001', customer: 'Jan Novák', amount: 4500, status: 'completed', date: '2023-05-07' },
      { id: 'ORD-002', customer: 'Eva Svobodová', amount: 2800, status: 'processing', date: '2023-05-06' },
      { id: 'ORD-003', customer: 'Petr Černý', amount: 6200, status: 'completed', date: '2023-05-06' },
      { id: 'ORD-004', customer: 'Marie Dvořáková', amount: 3700, status: 'completed', date: '2023-05-05' },
      { id: 'ORD-005', customer: 'Tomáš Procházka', amount: 5100, status: 'processing', date: '2023-05-05' }
    ]
  };
  
  res.json(analytics);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Něco se pokazilo!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint nenalezen' });
});

// Spuštění serveru
app.listen(PORT, () => {
  console.log(`Server běží na portu ${PORT}`);
  console.log(`API dokumentace: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nZavírám server...');
  try {
    await pgPool.end();
    console.log('Databázové připojení ukončeno.');
  } catch (err) {
    console.error('Chyba při zavírání databázového připojení:', err.message);
  }
  process.exit(0);
});

module.exports = app;