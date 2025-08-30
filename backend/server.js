const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statické soubory pro obrázky
app.use('/images', express.static(path.join(__dirname, '../../images')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Databáze
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'), (err) => {
  if (err) {
    console.error('Chyba při připojení k databázi:', err.message);
  } else {
    console.log('Připojeno k SQLite databázi.');
    initializeDatabase();
  }
});

// Inicializace databáze
function initializeDatabase() {
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

  const createCategoriesTable = `
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_cz TEXT NOT NULL,
      name_original TEXT,
      slug TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.run(createProductsTable, (err) => {
    if (err) {
      console.error('Chyba při vytváření tabulky products:', err.message);
    } else {
      console.log('Tabulka products vytvořena nebo již existuje.');
    }
  });

  const createOrdersTable = `
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.run(createCategoriesTable, (err) => {
    if (err) {
      console.error('Chyba při vytváření tabulky categories:', err.message);
    } else {
      console.log('Tabulka categories vytvořena nebo již existuje.');
    }
  });

  db.run(createOrdersTable, (err) => {
    if (err) {
      console.error('Chyba při vytváření tabulky orders:', err.message);
    } else {
      console.log('Tabulka orders vytvořena nebo již existuje.');
    }
  });
}

// API Routes

// Získat všechny produkty
app.get('/api/products', (req, res) => {
  const { page = 1, limit = 20, search, collection, minPrice, maxPrice } = req.query;
  const offset = (page - 1) * limit;
  
  let query = 'SELECT * FROM products WHERE 1=1';
  let params = [];
  
  if (search) {
    query += ' AND (name_cz LIKE ? OR description_cz LIKE ? OR sku LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  if (collection) {
    query += ' AND collection_cz LIKE ?';
    params.push(`%${collection}%`);
  }
  
  if (minPrice) {
    query += ' AND price >= ?';
    params.push(parseFloat(minPrice));
  }
  
  if (maxPrice) {
    query += ' AND price <= ?';
    params.push(parseFloat(maxPrice));
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Získat celkový počet produktů pro paginaci
    let countQuery = 'SELECT COUNT(*) as total FROM products WHERE 1=1';
    let countParams = [];
    
    if (search) {
      countQuery += ' AND (name_cz LIKE ? OR description_cz LIKE ? OR sku LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (collection) {
      countQuery += ' AND collection_cz LIKE ?';
      countParams.push(`%${collection}%`);
    }
    
    if (minPrice) {
      countQuery += ' AND price >= ?';
      countParams.push(parseFloat(minPrice));
    }
    
    if (maxPrice) {
      countQuery += ' AND price <= ?';
      countParams.push(parseFloat(maxPrice));
    }
    
    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Zpracovat obrázky pro každý produkt
      const processedProducts = rows.map(product => {
        const images = product.local_images ? 
          product.local_images.split(';').map(img => img.trim()).filter(img => img) : [];
        
        return {
          ...product,
          images: images,
          mainImage: images[0] || null
        };
      });
      
      res.json({
        products: processedProducts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit)
        }
      });
    });
  });
});

// Získat produkt podle ID
app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      res.status(404).json({ error: 'Produkt nenalezen' });
      return;
    }
    
    // Zpracovat obrázky
    const images = row.local_images ? 
      row.local_images.split(';').map(img => img.trim()).filter(img => img) : [];
    
    const processedProduct = {
      ...row,
      images: images,
      mainImage: images[0] || null
    };
    
    res.json(processedProduct);
  });
});

// Získat produkt podle SKU
app.get('/api/products/sku/:sku', (req, res) => {
  const { sku } = req.params;
  
  db.get('SELECT * FROM products WHERE sku = ?', [sku], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      res.status(404).json({ error: 'Produkt nenalezen' });
      return;
    }
    
    // Zpracovat obrázky
    const images = row.local_images ? 
      row.local_images.split(';').map(img => img.trim()).filter(img => img) : [];
    
    const processedProduct = {
      ...row,
      images: images,
      mainImage: images[0] || null
    };
    
    res.json(processedProduct);
  });
});

// Získat všechny kolekce
app.get('/api/collections', (req, res) => {
  db.all(`
    SELECT DISTINCT 
      collection_cz as name,
      LOWER(REPLACE(REPLACE(REPLACE(collection_cz, ' ', '-'), 'á', 'a'), 'í', 'i')) as slug,
      COUNT(*) as product_count
    FROM products 
    WHERE collection_cz IS NOT NULL AND collection_cz != ''
    GROUP BY collection_cz
    ORDER BY collection_cz
  `, (err, rows) => {
    if (err) {
      console.error('Error fetching collections:', err)
      res.status(500).json({ error: 'Failed to fetch collections' })
    } else {
      const collections = rows.map((row, index) => ({
        id: index + 1,
        name: row.name,
        slug: row.slug,
        product_count: row.product_count
      }))
      res.json(collections)
    }
  })
});

// Kategorie podle typu produktu
app.get('/api/categories', (req, res) => {
  const categories = [
    {
      id: 1,
      name: 'Batohy a brašny',
      slug: 'batohy-brasny',
      subcategories: [
        { id: 11, name: 'Všechny', slug: 'vsechny', filter: 'backpack,bag,briefcase' },
        { id: 12, name: 'Městské batohy', slug: 'mestske-batohy', filter: 'backpack' },
        { id: 13, name: 'Brašny na notebook', slug: 'brasny-notebook', filter: 'laptop bag,briefcase' },
        { id: 14, name: 'Cestovní tašky', slug: 'cestovni-tasky', filter: 'travel bag' }
      ]
    },
    {
      id: 2,
      name: 'Peněženky',
      slug: 'penezenky',
      subcategories: [
        { id: 21, name: 'Všechny', slug: 'vsechny', filter: 'wallet' },
        { id: 22, name: 'Pánské', slug: 'panske', filter: 'men wallet' },
        { id: 23, name: 'Dámské', slug: 'damske', filter: 'women wallet' },
        { id: 24, name: 'Pouzdra na karty', slug: 'pouzdra-karty', filter: 'card holder' }
      ]
    },
    {
      id: 3,
      name: 'Kufry',
      slug: 'kufry',
      subcategories: [
        { id: 31, name: 'Všechny', slug: 'vsechny', filter: 'suitcase,luggage' },
        { id: 32, name: 'Kabinové', slug: 'kabinove', filter: 'cabin luggage' },
        { id: 33, name: 'Velké', slug: 'velke', filter: 'large suitcase' }
      ]
    },
    {
      id: 4,
      name: 'Doplňky',
      slug: 'doplnky',
      subcategories: [
        { id: 41, name: 'Všechny', slug: 'vsechny', filter: 'accessory' },
        { id: 42, name: 'Klíčenky', slug: 'klicenky', filter: 'keychain' },
        { id: 43, name: 'Opasky', slug: 'opasky', filter: 'belt' }
      ]
    }
  ]
  
  res.json(categories)
});

// Získat statistiky
app.get('/api/stats', (req, res) => {
  const queries = {
    totalProducts: 'SELECT COUNT(*) as count FROM products',
    totalCollections: 'SELECT COUNT(DISTINCT collection_cz) as count FROM products WHERE collection_cz IS NOT NULL AND collection_cz != ""',
    avgPrice: 'SELECT AVG(price) as avg FROM products',
    priceRange: 'SELECT MIN(price) as min, MAX(price) as max FROM products'
  };
  
  const stats = {};
  let completed = 0;
  const total = Object.keys(queries).length;
  
  Object.entries(queries).forEach(([key, query]) => {
    db.get(query, (err, row) => {
      if (err) {
        console.error(`Chyba při získávání ${key}:`, err.message);
      } else {
        stats[key] = row;
      }
      
      completed++;
      if (completed === total) {
        res.json(stats);
      }
    });
  });
});

// Vytvořit nový produkt
app.post('/api/products', (req, res) => {
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

  const insertQuery = `
    INSERT INTO products (
      name_cz, collection_cz, description_cz, sku, price, 
      brand, availability, local_images, online_images
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(insertQuery, [
    name_cz, collection_cz, description_cz, sku, price,
    brand, availability, local_images, online_images
  ], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'Produkt s tímto SKU již existuje' });
      }
      return res.status(500).json({ error: err.message });
    }

    // Vrátit vytvořený produkt
    db.get('SELECT * FROM products WHERE id = ?', [this.lastID], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const images = row.local_images ? 
        row.local_images.split(';').map(img => img.trim()).filter(img => img) : [];

      const processedProduct = {
        ...row,
        images: images,
        mainImage: images[0] || null
      };

      res.status(201).json(processedProduct);
    });
  });
});

// Aktualizovat produkt
app.put('/api/products/:id', (req, res) => {
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

  // Nejprve zkontrolovat, zda produkt existuje
  db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res.status(404).json({ error: 'Produkt nenalezen' });
    }

    const updateQuery = `
      UPDATE products SET 
        name_cz = COALESCE(?, name_cz),
        collection_cz = COALESCE(?, collection_cz),
        description_cz = COALESCE(?, description_cz),
        sku = COALESCE(?, sku),
        price = COALESCE(?, price),
        brand = COALESCE(?, brand),
        availability = COALESCE(?, availability),
        local_images = COALESCE(?, local_images),
        online_images = COALESCE(?, online_images)
      WHERE id = ?
    `;

    db.run(updateQuery, [
      name_cz, collection_cz, description_cz, sku, price,
      brand, availability, local_images, online_images, id
    ], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ error: 'Produkt s tímto SKU již existuje' });
        }
        return res.status(500).json({ error: err.message });
      }

      // Vrátit aktualizovaný produkt
      db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        const images = row.local_images ? 
          row.local_images.split(';').map(img => img.trim()).filter(img => img) : [];

        const processedProduct = {
          ...row,
          images: images,
          mainImage: images[0] || null
        };

        res.json(processedProduct);
      });
    });
  });
});

// Smazat produkt
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;

  // Nejprve zkontrolovat, zda produkt existuje
  db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res.status(404).json({ error: 'Produkt nenalezen' });
    }

    db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({ 
        message: 'Produkt byl úspěšně smazán',
        deletedProduct: row
      });
    });
  });
});

// API endpointy pro slevy
app.get('/api/discounts', (req, res) => {
  // TODO: Implementovat získání slev z databáze
  // Pro nyní vrátíme prázdné pole
  res.json([]);
});

app.post('/api/discounts', (req, res) => {
  // TODO: Implementovat vytvoření slevy
  res.status(501).json({ error: 'Endpoint není implementován' });
});

app.put('/api/discounts/:id', (req, res) => {
  // TODO: Implementovat aktualizaci slevy
  res.status(501).json({ error: 'Endpoint není implementován' });
});

app.delete('/api/discounts/:id', (req, res) => {
  // TODO: Implementovat smazání slevy
  res.status(501).json({ error: 'Endpoint není implementován' });
});

// API endpointy pro analýzy
app.get('/api/analytics/sales', (req, res) => {
  // TODO: Implementovat získání prodejních dat
  res.json([]);
});

app.get('/api/analytics/top-products', (req, res) => {
  // TODO: Implementovat získání nejprodávanějších produktů
  res.json([]);
});

app.get('/api/analytics/traffic-sources', (req, res) => {
  // TODO: Implementovat získání zdrojů návštěvnosti
  res.json([]);
});

app.get('/api/analytics/conversion', (req, res) => {
  // TODO: Implementovat získání konverzních dat
  res.json([]);
});

// API endpointy pro košík
app.get('/api/cart', (req, res) => {
  // TODO: Implementovat získání košíku (session-based nebo user-based)
  res.json({ items: [] });
});

app.post('/api/cart/add', (req, res) => {
  // TODO: Implementovat přidání produktu do košíku
  res.status(501).json({ error: 'Endpoint není implementován' });
});

app.put('/api/cart/update', (req, res) => {
  // TODO: Implementovat aktualizaci množství v košíku
  res.status(501).json({ error: 'Endpoint není implementován' });
});

app.delete('/api/cart/remove/:productId', (req, res) => {
  // TODO: Implementovat odebrání produktu z košíku
  res.status(501).json({ error: 'Endpoint není implementován' });
});

// API endpointy pro objednávky
app.get('/api/orders', (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const offset = (page - 1) * limit;
  
  let query = 'SELECT * FROM orders WHERE 1=1';
  let params = [];
  
  if (status && status !== 'all') {
    query += ' AND status = ?';
    params.push(status);
  }
  
  if (search) {
    query += ' AND (customer_name LIKE ? OR customer_email LIKE ? OR id LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Získat celkový počet objednávek pro paginaci
    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE 1=1';
    let countParams = [];
    
    if (status && status !== 'all') {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    
    if (search) {
      countQuery += ' AND (customer_name LIKE ? OR customer_email LIKE ? OR id LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Zpracovat položky objednávek
      const processedOrders = rows.map(order => {
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
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit)
        }
      });
    });
  });
});

// Získat objednávku podle ID
app.get('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM orders WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      res.status(404).json({ error: 'Objednávka nenalezena' });
      return;
    }
    
    // Zpracovat položky objednávky
    let items = [];
    try {
      items = JSON.parse(row.items || '[]');
    } catch (e) {
      console.error('Chyba při parsování položek objednávky:', e);
    }
    
    const processedOrder = {
      ...row,
      items: items
    };
    
    res.json(processedOrder);
  });
});

// Vytvořit novou objednávku
app.post('/api/orders', (req, res) => {
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
  
  if (!customer_name || !customer_email || !shipping_address || !total_amount || !items) {
    res.status(400).json({ error: 'Chybí povinné údaje' });
    return;
  }
  
  const itemsJson = JSON.stringify(items);
  
  const query = `
    INSERT INTO orders (
      customer_name, customer_email, customer_phone, shipping_address,
      billing_address, total_amount, payment_method, items, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, [
    customer_name, customer_email, customer_phone, shipping_address,
    billing_address, total_amount, payment_method, itemsJson, notes
  ], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.status(201).json({
      id: this.lastID,
      message: 'Objednávka byla úspěšně vytvořena'
    });
  });
});

// Aktualizovat stav objednávky
app.put('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const { status, payment_status, notes } = req.body;
  
  let updateFields = [];
  let params = [];
  
  if (status) {
    updateFields.push('status = ?');
    params.push(status);
  }
  
  if (payment_status) {
    updateFields.push('payment_status = ?');
    params.push(payment_status);
  }
  
  if (notes !== undefined) {
    updateFields.push('notes = ?');
    params.push(notes);
  }
  
  if (updateFields.length === 0) {
    res.status(400).json({ error: 'Žádná data k aktualizaci' });
    return;
  }
  
  updateFields.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);
  
  const query = `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`;
  
  db.run(query, params, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Objednávka nenalezena' });
      return;
    }
    
    res.json({ message: 'Objednávka byla úspěšně aktualizována' });
  });
});

app.post('/api/cart/apply-promo', (req, res) => {
  const { promoCode } = req.body;
  
  // TODO: Implementovat validaci promo kódů z databáze
  // Pro nyní simulujeme základní validaci
  const validPromoCodes = {
    'WELCOME10': { type: 'percentage', value: 10, description: 'Sleva 10% pro nové zákazníky' },
    'SAVE500': { type: 'fixed', value: 500, description: 'Sleva 500 Kč' }
  };
  
  if (validPromoCodes[promoCode]) {
    res.json({
      success: true,
      discount: validPromoCodes[promoCode]
    });
  } else {
    res.status(400).json({
      success: false,
      error: 'Neplatný promo kód'
    });
  }
});

// API endpoint pro statistiky dashboardu
app.get('/api/dashboard-stats', (req, res) => {
  // Simulace dat pro statistiky
  const stats = {
    totalRevenue: 1250000,
    totalOrders: 342,
    totalCustomers: 189,
    totalProducts: 76,
    revenueGrowth: 12.5,
    ordersGrowth: 8.3,
    customersGrowth: 15.2,
    productsGrowth: 4.7
  };
  
  res.json(stats);
});

// API endpoint pro analytická data
app.get('/api/analytics', (req, res) => {
  const { period, channel } = req.query;
  
  // Simulace dat pro analytiku
  const salesChartData = [
    { date: '01/05', sales: 12000 },
    { date: '02/05', sales: 18000 },
    { date: '03/05', sales: 15000 },
    { date: '04/05', sales: 22000 },
    { date: '05/05', sales: 28000 },
    { date: '06/05', sales: 32000 },
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

// Upload routes
const uploadRoutes = require('./routes/upload');
app.use('/api/upload', uploadRoutes);

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
process.on('SIGINT', () => {
  console.log('\nZavírám server...');
  db.close((err) => {
    if (err) {
      console.error('Chyba při zavírání databáze:', err.message);
    } else {
      console.log('Databáze uzavřena.');
    }
    process.exit(0);
  });
});

module.exports = app;