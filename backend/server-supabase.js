/**
 * Server.js - Hlavní soubor serveru pro e-shop Italské brašnářství
 * Verze pro Supabase
 */

// Načtení proměnných prostředí z .env souboru
require('dotenv').config();

// Import potřebných modulů
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { supabase } = require('./config/supabase-config');

// Vytvoření instance Express aplikace
const app = express();

// Nastavení portu
const PORT = process.env.PORT || 3001;

// Middleware pro parsování JSON a URL-encoded dat
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Povolení CORS pro všechny požadavky
app.use(cors());

// Nastavení statické složky pro obrázky
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/images', express.static(path.join(__dirname, '../../images')));

// Konfigurace multer pro nahrávání souborů
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    // Vytvoření složky, pokud neexistuje
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generování unikátního názvu souboru
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

// Základní endpoint pro kontrolu, zda server běží
app.get('/', (req, res) => {
  res.json({ message: 'API pro Italské brašnářství běží! (Supabase verze)' });
});

// Endpoint pro získání všech produktů s podporou paginácie, vyhľadávania a filtrovania
app.get('/api/products', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      collection = '',
      brand = '',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    console.log('🔍 Products API called with params:', { page: pageNum, limit: limitNum, search, collection, brand, sortBy, sortOrder });

    // Základný query
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' });

    // Vyhľadávanie v názve a popise
    if (search && search.trim()) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Filtrovanie podľa kategórie
    if (collection && collection.trim() && collection !== 'all') {
      query = query.eq('category_id', collection);
    }

    // Filtrovanie podľa značky
    if (brand && brand.trim() && brand !== 'all') {
      query = query.eq('brand_id', brand);
    }

    // Sortovanie
    const validSortColumns = ['name', 'price', 'created_at', 'updated_at'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'asc' ? 'asc' : 'desc';
    query = query.order(sortColumn, { ascending: order === 'asc' });

    // Paginácia - pouze pokud limit není příliš vysoký (pro zobrazení všech produktů)
    if (limitNum < 1000) {
      query = query.range(offset, offset + limitNum - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // Načítanie tagů pre všetky produkty
    const productIds = data.map(p => p.id);
    const { data: productTagsData, error: tagsError } = await supabase
      .from('product_tags')
      .select(`
        product_id,
        tags (
          id,
          name,
          color
        )
      `)
      .in('product_id', productIds);

    if (tagsError) {
      console.error('Chyba při načítání tagů:', tagsError);
    }

    // Vytvorenie mapy tagů pre produkty
    const productTagsMap = {};
    if (productTagsData) {
      productTagsData.forEach(item => {
        if (!productTagsMap[item.product_id]) {
          productTagsMap[item.product_id] = [];
        }
        productTagsMap[item.product_id].push(item.tags);
      });
    }

    // Transformácia dát pre kompatibilitu s frontend
    const transformedProducts = data.map(product => {
      // Spracovanie obrázkov - použiť images array ak existuje, inak image_url
      let imageUrls = [];
      console.log('🖼️ Processing product images:', { id: product.id, images: product.images, image_url: product.image_url });
      // Fix URL paths by removing redundant 'images/' prefix
      
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        // Remove redundant 'images/' prefix from each URL
        imageUrls = product.images.map(img => img.replace(/^images\//, '')).filter(img => img && img.trim());
        console.log('✅ Using images array:', imageUrls);
      } else if (product.image_url) {
        // Remove redundant 'images/' prefix from single URL
        imageUrls = [product.image_url.replace(/^images\//, '')];
        console.log('✅ Using image_url:', imageUrls);
      }
      
      const transformedProduct = {
        ...product,
        // Kompatibilita so starým rozhraním
        name: product.name, // name_cz neexistuje v Supabase
        collection: null, // collection_cz neexistuje v Supabase
        description: product.description, // description_cz neexistuje v Supabase
        stock: 10, // Dočasne nastavené na 10
        image: imageUrls[0] || null,
        images: imageUrls,
        mainImage: imageUrls[0] || null,
        tags: productTagsMap[product.id] || []
      };
      
      console.log('🔄 Transformed product:', { id: transformedProduct.id, image: transformedProduct.image, images: transformedProduct.images, tags: transformedProduct.tags });
      return transformedProduct;
    });

    const totalPages = Math.ceil(count / limitNum);

    console.log('✅ Products API response:', { 
      productsCount: transformedProducts.length, 
      total: count, 
      totalPages,
      page: pageNum 
    });

    res.json({
      products: transformedProducts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages
      }
    });
  } catch (error) {
    console.error('❌ Chyba při získávání produktů:', error.message);
    res.status(500).json({ error: 'Chyba při získávání produktů' });
  }
});

// Endpoint pro získání produktu podle ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Produkt nebyl nalezen' });
      }
      throw error;
    }

    // Transformácia dát pre kompatibilitu s frontend (same logic as SKU endpoint)
    let imageUrls = [];
    console.log('🖼️ Processing product images for ID:', id, { images: data.images, image_url: data.image_url });
    
    if (data.images && Array.isArray(data.images) && data.images.length > 0) {
      // Remove redundant 'images/' prefix from each URL
      const cleanImages = data.images.map(img => img.replace(/^images\//, '')).filter(img => img && img.trim());
      
      // Try to find all images in the product folder
      if (cleanImages.length > 0) {
        const firstImagePath = cleanImages[0];
        const folderPath = firstImagePath.split('/')[0];
        const fullFolderPath = path.join(__dirname, '../../images', folderPath);
        
        try {
          if (fs.existsSync(fullFolderPath)) {
            const folderImages = fs.readdirSync(fullFolderPath)
              .filter(file => file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.png'))
              .slice(0, 10) // Limit to 10 images for detail page
              .map(file => `${folderPath}/${file}`);
            
            if (folderImages.length > 0) {
              imageUrls = folderImages;
              console.log('✅ Using folder images for ID:', id, imageUrls.length, 'images from', folderPath);
            } else {
              imageUrls = cleanImages;
              console.log('✅ Using database images (no folder found):', imageUrls);
            }
          } else {
            imageUrls = cleanImages;
            console.log('✅ Using database images (folder not exists):', imageUrls);
          }
        } catch (error) {
          console.log('❌ Error reading folder:', error.message);
          imageUrls = cleanImages;
        }
      } else {
        imageUrls = cleanImages;
      }
    } else if (data.image_url) {
      imageUrls = [data.image_url.replace(/^images\//, '')];
    }
    
    const transformedProduct = {
      ...data,
      stock: 10, // Dočasne nastavené na 10
      image: imageUrls[0] || null,
      images: imageUrls,
      mainImage: imageUrls[0] || null
    };

    res.json(transformedProduct);
  } catch (error) {
    console.error(`Chyba při získávání produktu ID ${req.params.id}:`, error.message);
    res.status(500).json({ error: 'Chyba při získávání produktu' });
  }
});

// Endpoint pro získání produktu podle SKU
app.get('/api/products/sku/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    console.log('🔍 Fetching product by SKU:', sku);
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('sku', sku)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('❌ Product not found for SKU:', sku);
        return res.status(404).json({ error: 'Produkt nebyl nalezen' });
      }
      throw error;
    }

    console.log('✅ Product found for SKU:', sku, 'Product ID:', data.id);
    
    // Transformácia dát pre kompatibilitu s frontend
    let imageUrls = [];
    if (data.images && Array.isArray(data.images) && data.images.length > 0) {
      // Remove redundant 'images/' prefix from each URL
      const cleanImages = data.images.map(img => img.replace(/^images\//, '')).filter(img => img && img.trim());
      
      // Try to find all images in the product folder
      if (cleanImages.length > 0) {
        const firstImagePath = cleanImages[0];
        const folderPath = firstImagePath.split('/')[0];
        const fullFolderPath = path.join(__dirname, '../../images', folderPath);
        
        try {
          if (fs.existsSync(fullFolderPath)) {
            const folderImages = fs.readdirSync(fullFolderPath)
              .filter(file => file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.png'))
              .slice(0, 10) // Limit to 10 images for detail page
              .map(file => `${folderPath}/${file}`);
            
            if (folderImages.length > 0) {
              imageUrls = folderImages;
              console.log('✅ Using folder images for SKU:', sku, imageUrls.length, 'images from', folderPath);
            } else {
              imageUrls = cleanImages;
              console.log('✅ Using database images (no folder found):', imageUrls);
            }
          } else {
            imageUrls = cleanImages;
            console.log('✅ Using database images (folder not exists):', imageUrls);
          }
        } catch (error) {
          console.log('❌ Error reading folder:', error.message);
          imageUrls = cleanImages;
        }
      } else {
        imageUrls = cleanImages;
      }
    } else if (data.image_url) {
      imageUrls = [data.image_url.replace(/^images\//, '')];
    }
    
    const transformedProduct = {
      ...data,
      stock: 10, // Dočasne nastavené na 10
      image: imageUrls[0] || null,
      images: imageUrls,
      mainImage: imageUrls[0] || null
    };

    res.json(transformedProduct);
  } catch (error) {
    console.error(`Chyba při získávání produktu SKU ${req.params.sku}:`, error.message);
    res.status(500).json({ error: 'Chyba při získávání produktu' });
  }
});

// Endpoint pro vytvoření nového produktu
app.post('/api/products', upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, category_id } = req.body;
    
    // Validace vstupních dat
    if (!name || !price) {
      return res.status(400).json({ error: 'Název a cena jsou povinné údaje' });
    }

    // Příprava dat pro vložení
    const productData = {
      name,
      description,
      price: parseFloat(price),
      category_id: category_id ? parseInt(category_id) : null,
      image_url: req.file ? `/uploads/${req.file.filename}` : null
    };

    // Vložení produktu do databáze
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select();

    if (error) throw error;

    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Chyba při vytváření produktu:', error.message);
    res.status(500).json({ error: 'Chyba při vytváření produktu' });
  }
});

// Endpoint pro aktualizaci produktu
app.put('/api/products/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category_id } = req.body;
    
    // Validace vstupních dat
    if (!name || !price) {
      return res.status(400).json({ error: 'Název a cena jsou povinné údaje' });
    }

    // Příprava dat pro aktualizaci
    const productData = {
      name,
      description,
      price: parseFloat(price),
      category_id: category_id ? parseInt(category_id) : null,
      updated_at: new Date()
    };

    // Pokud byl nahrán nový obrázek, aktualizujeme cestu
    if (req.file) {
      productData.image_url = `/uploads/${req.file.filename}`;
    }

    // Aktualizace produktu v databázi
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select();

    if (error) throw error;

    if (data.length === 0) {
      return res.status(404).json({ error: 'Produkt nebyl nalezen' });
    }

    res.json(data[0]);
  } catch (error) {
    console.error(`Chyba při aktualizaci produktu ID ${req.params.id}:`, error.message);
    res.status(500).json({ error: 'Chyba při aktualizaci produktu' });
  }
});

// Endpoint pro smazání produktu
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Nejprve získáme produkt, abychom mohli smazat jeho obrázek
    const { data: product, error: selectError } = await supabase
      .from('products')
      .select('image')
      .eq('id', id)
      .single();

    if (selectError) {
      if (selectError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Produkt nebyl nalezen' });
      }
      throw selectError;
    }

    // Smazání produktu z databáze
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // Smazání obrázku, pokud existuje
    if (product.image && product.image.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, product.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.json({ message: 'Produkt byl úspěšně smazán' });
  } catch (error) {
    console.error(`Chyba při mazání produktu ID ${req.params.id}:`, error.message);
    res.status(500).json({ error: 'Chyba při mazání produktu' });
  }
});

// Endpoint pro získání všech kategorií
app.get('/api/categories', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*');

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Chyba při získávání kategorií:', error.message);
    res.status(500).json({ error: 'Chyba při získávání kategorií' });
  }
});

// Endpoint pro získání všech kolekcí (kategorií)
app.get('/api/collections', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .order('name');

    if (error) throw error;

    // Přidáme možnost "Všechny" na začátek
    const collections = [
      { id: 'all', name: 'Všechny kategorie' },
      ...data.map(category => ({ id: category.id.toString(), name: category.name }))
    ];

    res.json(collections);
  } catch (error) {
    console.error('Chyba při získávání kolekcí:', error.message);
    res.status(500).json({ error: 'Chyba při získávání kolekcí' });
  }
});

// Endpoint pro získání všech značek
app.get('/api/brands', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .order('name');

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Chyba při získávání značek:', error.message);
    res.status(500).json({ error: 'Chyba při získávání značek' });
  }
});

// Endpoint pro získání všech kolekcí
app.get('/api/collections', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .order('name');

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Chyba při získávání kolekcí:', error.message);
    res.status(500).json({ error: 'Chyba při získávání kolekcí' });
  }
});

// Endpoint pro získání všech tagů
app.get('/api/tags', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name');

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Chyba při získávání tagů:', error.message);
    res.status(500).json({ error: 'Chyba při získávání tagů' });
  }
});

// Endpoint pro získání tagů produktu
app.get('/api/products/:productId/tags', async (req, res) => {
  try {
    const { productId } = req.params;
    const { data, error } = await supabase
      .from('product_tags')
      .select(`
        tags (
          id,
          name,
          color
        )
      `)
      .eq('product_id', productId);

    if (error) throw error;

    const tags = data.map(item => item.tags);
    res.json(tags);
  } catch (error) {
    console.error(`Chyba při získávání tagů produktu ${req.params.productId}:`, error.message);
    res.status(500).json({ error: 'Chyba při získávání tagů produktu' });
  }
});

// Endpoint pro získání produktů podle kategorie
app.get('/api/products/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category_id', categoryId);

    if (error) throw error;
    
    // Upravíme cesty k obrázkům pro frontend
    const transformedData = data.map(product => {
      // Zpracování pole obrázků
      if (product.images && Array.isArray(product.images)) {
        product.images = product.images.map(img => {
          // Odstranění prefixu 'images/' z URL obrázku
          return img.replace(/^images\//, '');
        });
      }
      
      // Zpracování hlavního obrázku
      if (product.image_url && typeof product.image_url === 'string') {
        product.image_url = product.image_url.replace(/^images\//, '');
      }
      
      return product;
    });

    res.json(transformedData);
  } catch (error) {
    console.error(`Chyba při získávání produktů kategorie ${req.params.categoryId}:`, error.message);
    res.status(500).json({ error: 'Chyba při získávání produktů podle kategorie' });
  }
});

// Endpoint pro získání produktů podle značky
app.get('/api/products/brand/:brandId', async (req, res) => {
  try {
    const { brandId } = req.params;
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('brand_id', brandId);

    if (error) throw error;
    
    // Upravíme cesty k obrázkům pro frontend
    const transformedData = data.map(product => {
      // Zpracování pole obrázků
      if (product.images && Array.isArray(product.images)) {
        product.images = product.images.map(img => {
          // Odstranění prefixu 'images/' z URL obrázku
          return img.replace(/^images\//, '');
        });
      }
      
      // Zpracování hlavního obrázku
      if (product.image_url && typeof product.image_url === 'string') {
        product.image_url = product.image_url.replace(/^images\//, '');
      }
      
      return product;
    });

    res.json(transformedData);
  } catch (error) {
    console.error(`Chyba při získávání produktů značky ${req.params.brandId}:`, error.message);
    res.status(500).json({ error: 'Chyba při získávání produktů podle značky' });
  }
});

// Endpoint pro vytvoření objednávky
app.post('/api/orders', async (req, res) => {
  try {
    const { customer_name, customer_email, customer_address, items, total_amount } = req.body;
    
    // Validace vstupních dat
    if (!customer_name || !customer_email || !items || !total_amount) {
      return res.status(400).json({ error: 'Chybí povinné údaje pro vytvoření objednávky' });
    }

    // Vytvoření objednávky
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          customer_name,
          customer_email,
          customer_address,
          total_amount: parseFloat(total_amount),
          status: 'pending'
        }
      ])
      .select();

    if (orderError) throw orderError;

    // Vytvoření položek objednávky
    const orderItems = items.map(item => ({
      order_id: order[0].id,
      product_id: item.id,
      quantity: item.quantity,
      price: parseFloat(item.price)
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    res.status(201).json({
      message: 'Objednávka byla úspěšně vytvořena',
      order_id: order[0].id
    });
  } catch (error) {
    console.error('Chyba při vytváření objednávky:', error.message);
    res.status(500).json({ error: 'Chyba při vytváření objednávky' });
  }
});

// Endpoint pro získání všech objednávek
app.get('/api/orders', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*');

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Chyba při získávání objednávek:', error.message);
    res.status(500).json({ error: 'Chyba při získávání objednávek' });
  }
});

// Endpoint pro získání detailu objednávky včetně položek
app.get('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Získání objednávky
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError) {
      if (orderError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Objednávka nebyla nalezena' });
      }
      throw orderError;
    }

    // Získání položek objednávky
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        id,
        quantity,
        price,
        products (id, name, image)
      `)
      .eq('order_id', id);

    if (itemsError) throw itemsError;

    // Spojení dat
    const result = {
      ...order,
      items: items
    };

    res.json(result);
  } catch (error) {
    console.error(`Chyba při získávání objednávky ID ${req.params.id}:`, error.message);
    res.status(500).json({ error: 'Chyba při získávání detailu objednávky' });
  }
});

// Endpoint pro aktualizaci stavu objednávky
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Chybí stav objednávky' });
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date() })
      .eq('id', id)
      .select();

    if (error) throw error;

    if (data.length === 0) {
      return res.status(404).json({ error: 'Objednávka nebyla nalezena' });
    }

    res.json(data[0]);
  } catch (error) {
    console.error(`Chyba při aktualizaci stavu objednávky ID ${req.params.id}:`, error.message);
    res.status(500).json({ error: 'Chyba při aktualizaci stavu objednávky' });
  }
});

// Endpoint pro získání statistik
app.get('/api/stats', async (req, res) => {
  try {
    // Počet produktů
    const { count: productCount, error: productError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true });

    if (productError) throw productError;

    // Počet kategorií
    const { count: categoryCount, error: categoryError } = await supabase
      .from('categories')
      .select('id', { count: 'exact', head: true });

    if (categoryError) throw categoryError;

    // Počet objednávek
    const { count: orderCount, error: orderError } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true });

    if (orderError) throw orderError;

    // Celková hodnota objednávek
    const { data: totalSales, error: salesError } = await supabase
      .from('orders')
      .select('total_amount');

    if (salesError) throw salesError;

    const totalAmount = totalSales.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);

    res.json({
      totalProducts: { count: productCount },
      totalCategories: { count: categoryCount },
      totalOrders: { count: orderCount },
      totalSales: totalAmount,
      // Legacy format for compatibility
      products: productCount,
      categories: categoryCount,
      orders: orderCount,
      total_sales: totalAmount
    });
  } catch (error) {
    console.error('Chyba při získávání statistik:', error.message);
    res.status(500).json({ error: 'Chyba při získávání statistik' });
  }
});

// Inventory management endpoints
app.get('/api/inventory', async (req, res) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, sku, price, stock, low_stock_threshold')
      .order('stock', { ascending: true });

    if (error) throw error;

    // Calculate inventory metrics
    const lowStockProducts = products.filter(p => p.stock <= (p.low_stock_threshold || 5));
    const outOfStockProducts = products.filter(p => p.stock === 0);
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

    res.json({
      products,
      metrics: {
        totalProducts: products.length,
        lowStock: lowStockProducts.length,
        outOfStock: outOfStockProducts.length,
        totalValue: totalValue
      }
    });
  } catch (error) {
    console.error('Chyba při získávání skladových zásob:', error.message);
    res.status(500).json({ error: 'Chyba při získávání skladových zásob' });
  }
});

app.put('/api/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, low_stock_threshold } = req.body;

    const { data, error } = await supabase
      .from('products')
      .update({ 
        stock: parseInt(stock),
        low_stock_threshold: parseInt(low_stock_threshold || 5)
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Chyba při aktualizaci skladových zásob:', error.message);
    res.status(500).json({ error: 'Chyba při aktualizaci skladových zásob' });
  }
});

// Enhanced dashboard stats endpoint
app.get('/api/dashboard-stats', async (req, res) => {
  try {
    // Get products count
    const { count: productCount, error: productError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true });

    if (productError) throw productError;

    // Get orders data for calculations
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('total_amount, created_at, status');

    if (ordersError) throw ordersError;

    // Calculate revenue and growth
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= yesterday;
    });

    const thisMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= thisMonth;
    });

    const lastMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= lastMonth && orderDate < thisMonth;
    });

    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
    const thisMonthRevenue = thisMonthOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
    const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
    
    const revenueGrowth = lastMonthRevenue > 0 ? 
      ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100) : 0;

    // Mock customer data (since we don't have customers table)
    const totalCustomers = Math.floor(orders.length * 0.8); // Estimate based on orders
    const customersGrowth = 12.5; // Mock growth

    res.json({
      totalRevenue: totalRevenue,
      totalOrders: orders.length,
      totalCustomers: totalCustomers,
      totalProducts: { count: productCount },
      revenueGrowth: revenueGrowth,
      ordersGrowth: todayOrders.length,
      customersGrowth: customersGrowth,
      productsGrowth: 0 // No new products tracking yet
    });
  } catch (error) {
    console.error('Chyba při získávání dashboard statistik:', error.message);
    res.status(500).json({ error: 'Chyba při získávání dashboard statistik' });
  }
});

// Spuštění serveru
app.listen(PORT, () => {
  console.log(`Server běží na portu ${PORT}`);
  console.log(`Používá se Supabase databáze`);
});