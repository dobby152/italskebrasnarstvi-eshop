const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Load and cache image mappings
const imageCache = new Map();
function loadImageMappings() {
  try {
    const imagesDir = path.join(__dirname, '..', 'frontend', 'public', 'images');
    if (!fs.existsSync(imagesDir)) {
      console.log('Images directory not found, using placeholders');
      return;
    }
    
    const imageFiles = fs.readdirSync(imagesDir).filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg'));
    console.log(`Loading ${imageFiles.length} product images...`);
    
    imageFiles.forEach(filename => {
      const parts = filename.split('_');
      if (parts.length >= 3) {
        const productId = parts[0];
        const size = parts[1]; // small, medium, large
        
        if (!imageCache.has(productId)) {
          imageCache.set(productId, {});
        }
        
        const productImages = imageCache.get(productId);
        if (!productImages[size]) {
          productImages[size] = [];
        }
        productImages[size].push(filename);
      }
    });
    
    console.log(`Cached images for ${imageCache.size} products`);
  } catch (error) {
    console.error('Error loading image mappings:', error);
  }
}

function getProductImages(productId) {
  if (!productId) return ['/placeholder.svg'];
  
  const productImages = imageCache.get(productId.toString());
  if (!productImages) return ['/placeholder.svg'];
  
  // Prefer medium size images, fallback to small, then large
  const mediumImages = productImages.medium || [];
  const smallImages = productImages.small || [];
  const largeImages = productImages.large || [];
  
  const allImages = [...mediumImages, ...smallImages, ...largeImages];
  if (allImages.length === 0) return ['/placeholder.svg'];
  
  // Return up to 4 images for variety
  const selectedImages = allImages.slice(0, 4).map(img => `/images/${img}`);
  return selectedImages;
}

// Initialize image mappings
loadImageMappings();

// Supabase config
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware
app.use(cors());
app.use(express.json());

// Products endpoint
app.get('/api/products', async (req, res) => {
  try {
    console.log('Fetching products...');
    const { page = 1, limit = 20, search = '', collection = '', brand = '' } = req.query;

    let query = supabase.from('products').select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (collection && collection !== 'all') {
      query = query.eq('normalized_collection', collection);
    }
    if (brand && brand !== 'all') {
      query = query.eq('normalized_brand', brand);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log(`Fetched ${data?.length || 0} products out of ${count} total`);

    // Map products
    const products = (data || []).map(product => {
      const productImages = getProductImages(product.id);
      return {
        ...product,
        image_url: productImages[0],
        images: productImages,
        name_cz: product.name,
        description_cz: product.description,
        collection: product.normalized_collection,
        brand: product.normalized_brand,
        features: [],
        colors: [],
        tags: []
      };
    });

    // Get total count separately if count is not working correctly
    let totalCount = count;
    if (!totalCount || totalCount === 0) {
      // Fallback: get count from a separate query
      const { count: fallbackCount } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true });
      totalCount = fallbackCount;
    }

    res.json({
      products,
      pagination: {
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Collections endpoint
app.get('/api/collections', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('normalized_collection')
      .not('normalized_collection', 'is', null);

    if (error) throw error;

    const collections = [...new Set(data.map(p => p.normalized_collection))]
      .filter(c => c)
      .map((name, index) => ({ id: index + 1, name }));

    res.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// Brands endpoint
app.get('/api/brands', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('normalized_brand')
      .not('normalized_brand', 'is', null);

    if (error) throw error;

    const brands = [...new Set(data.map(p => p.normalized_brand))]
      .filter(b => b)
      .map((name, index) => ({ id: index + 1, name }));

    res.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!', timestamp: new Date().toISOString() });
});

// Orders endpoints
app.get('/api/orders', async (req, res) => {
  try {
    console.log('📋 Fetching orders...');
    
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_sku,
          product_name,
          quantity,
          unit_price,
          total_price
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching orders:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Found ${orders?.length || 0} orders`);
    res.json(orders || []);
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single order with details
app.get('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 Fetching order ${id}...`);
    
    // Get order with items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_sku,
          product_name,
          quantity,
          unit_price,
          total_price,
          refunded_quantity
        )
      `)
      .eq('id', id)
      .single();

    if (orderError) {
      console.error('❌ Error fetching order:', orderError);
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order events (if table exists)
    let events = [];
    try {
      const { data: eventsData } = await supabase
        .from('order_events')
        .select('*')
        .eq('order_id', id)
        .order('created_at', { ascending: true });
      events = eventsData || [];
    } catch (e) {
      console.log('⚠️ order_events table not found, skipping events');
    }

    // Get fulfillments (if table exists)
    let fulfillments = [];
    try {
      const { data: fulfillmentsData } = await supabase
        .from('fulfillments')
        .select(`
          *,
          fulfillment_line_items (*)
        `)
        .eq('order_id', id)
        .order('created_at', { ascending: false });
      fulfillments = fulfillmentsData || [];
    } catch (e) {
      console.log('⚠️ fulfillments table not found, skipping fulfillments');
    }

    // Get refunds (if table exists)
    let refunds = [];
    try {
      const { data: refundsData } = await supabase
        .from('refunds')
        .select(`
          *,
          refund_line_items (*)
        `)
        .eq('order_id', id)
        .order('created_at', { ascending: false });
      refunds = refundsData || [];
    } catch (e) {
      console.log('⚠️ refunds table not found, skipping refunds');
    }

    const result = {
      ...order,
      events,
      fulfillments,
      refunds
    };

    console.log(`✅ Order ${id} fetched successfully`);
    res.json(result);
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dashboard stats endpoint
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    console.log('📊 Fetching dashboard stats...');
    
    // Total orders
    const { count: totalOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (ordersError) throw ordersError;

    // Total revenue
    const { data: revenueData, error: revenueError } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('financial_status', 'paid');

    if (revenueError) throw revenueError;

    const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

    // Pending orders
    const { count: pendingOrders, error: pendingError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('fulfillment_status', 'unfulfilled');

    if (pendingError) throw pendingError;

    // Total customers (unique emails)
    const { data: customersData, error: customersError } = await supabase
      .from('orders')
      .select('customer_email')
      .not('customer_email', 'is', null);

    if (customersError) throw customersError;

    const uniqueCustomers = new Set(customersData?.map(o => o.customer_email)).size;

    const stats = {
      totalOrders: totalOrders || 0,
      totalRevenue: totalRevenue,
      pendingOrders: pendingOrders || 0,
      totalCustomers: uniqueCustomers
    };

    console.log('✅ Dashboard stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Inventory endpoints
app.get('/api/inventory/stock-levels', async (req, res) => {
  try {
    console.log('📦 Fetching stock levels...');
    
    const { data: stockLevels, error } = await supabase
      .from('current_stock_levels')
      .select('*');

    if (error) {
      console.error('❌ Error fetching stock levels:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Found ${stockLevels?.length || 0} stock level records`);
    res.json(stockLevels || []);
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/inventory/locations', async (req, res) => {
  try {
    console.log('🏪 Fetching inventory locations...');
    
    const { data: locations, error } = await supabase
      .from('inventory_locations')
      .select('*')
      .order('name');

    if (error) {
      console.error('❌ Error fetching locations:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Found ${locations?.length || 0} inventory locations`);
    res.json(locations || []);
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/inventory/movements', async (req, res) => {
  try {
    console.log('📊 Fetching inventory movements...');
    
    const { data: movements, error } = await supabase
      .from('inventory_movements')
      .select(`
        *,
        inventory_items (
          variant_id,
          product_variants (
            sku,
            title
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('❌ Error fetching movements:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Found ${movements?.length || 0} inventory movements`);
    res.json(movements || []);
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Enhanced backend server running', status: 'OK' });
});

app.listen(PORT, () => {
  console.log(`🚀 Enhanced backend server running on port ${PORT}`);
  console.log(`🔗 Test: http://localhost:${PORT}/api/test`);
  console.log(`🔗 Orders: http://localhost:${PORT}/api/orders`);
  console.log(`🔗 Dashboard: http://localhost:${PORT}/api/dashboard/stats`);
});

// Handle process termination gracefully
process.on('SIGTERM', () => {
  console.log('🛑 Server shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Server shutting down gracefully');
  process.exit(0);
});