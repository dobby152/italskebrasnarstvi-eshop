const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const IntelligentImageParser = require('../intelligent_image_parser');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize intelligent image parser
let intelligentImageParser;
function initializeImageParser() {
  try {
    // Use the same logic as image serving - frontend first, then backend
    const frontendImagesPath = path.join(__dirname, '..', 'frontend', 'public', 'images');
    const backendImagesPath = path.join(__dirname, '..', 'images');
    
    let imagesDir = frontendImagesPath;
    if (!fs.existsSync(frontendImagesPath) && fs.existsSync(backendImagesPath)) {
      imagesDir = backendImagesPath;
    }
    
    if (!fs.existsSync(imagesDir)) {
      console.log('❌ Images directory not found, using placeholders');
      console.log(`   Tried: ${frontendImagesPath}`);
      console.log(`   Tried: ${backendImagesPath}`);
      return;
    }
    
    intelligentImageParser = new IntelligentImageParser(imagesDir);
    console.log('✅ Intelligent image parser initialized');
    console.log(`📁 Images directory: ${imagesDir}`);
    console.log(`📁 Found ${fs.readdirSync(imagesDir).length} files in images directory`);
  } catch (error) {
    console.error('❌ Error initializing image parser:', error);
  }
}

function getProductImages(product) {
  // Use images from database if available
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    // Filter out empty strings and ensure proper format
    const validImages = product.images.filter(img => img && img.trim() !== '');
    if (validImages.length > 0) {
      // Remove duplicates using Set
      const uniqueImages = [...new Set(validImages)];
      
      // Further filter for quality - prefer unique base names
      const seenBaseNames = new Set();
      const qualityFiltered = [];
      
      // Sort images by preference - prefer those with shorter names (likely main images)
      const sortedImages = uniqueImages.sort((a, b) => {
        const aName = a.split('/').pop() || '';
        const bName = b.split('/').pop() || '';
        return aName.length - bName.length;
      });
      
      for (const img of sortedImages) {
        // Extract base name without timestamp and extensions
        let baseName = img;
        
        // Remove path prefix for comparison
        if (baseName.includes('/')) {
          baseName = baseName.split('/').pop();
        }
        
        // Very aggressive pattern removal for products like "Ma-a-torebka-Jade-czarna_0_1755554491371.jpg"
        // First remove the main product name pattern
        const basePattern = baseName.split('_')[0]; // Get everything before first underscore
        
        // Skip if we've already seen this base pattern
        if (seenBaseNames.has(basePattern)) {
          continue;
        }
        
        seenBaseNames.add(basePattern);
        qualityFiltered.push(img);
        
        // Limit to maximum 4 images per product for better performance
        if (qualityFiltered.length >= 4) {
          break;
        }
      }
      
      return qualityFiltered.map(img => {
        // If image already starts with /images/, use as is
        if (img.startsWith('/images/')) {
          return img;
        }
        // If image starts with images/, add leading slash
        if (img.startsWith('images/')) {
          return `/${img}`;
        }
        // Otherwise, add /images/ prefix
        return `/images/${img}`;
      });
    }
  }
  
  // Use single image_url if available
  if (product.image_url && product.image_url.trim() !== '') {
    let imageUrl = product.image_url;
    // Ensure proper format
    if (!imageUrl.startsWith('/images/') && !imageUrl.startsWith('http')) {
      if (imageUrl.startsWith('images/')) {
        imageUrl = `/${imageUrl}`;
      } else {
        imageUrl = `/images/${imageUrl}`;
      }
    }
    return [imageUrl];
  }
  
  // Fallback to placeholder
  return ['/placeholder.svg'];
}

// Initialize intelligent image parser
initializeImageParser();

// Supabase config
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static images from frontend public directory
const frontendImagesPath = path.join(__dirname, '..', 'frontend', 'public', 'images');
const backendImagesPath = path.join(__dirname, '..', 'images');

// Try frontend first, then backend location
let finalImagesPath = frontendImagesPath;
if (!fs.existsSync(frontendImagesPath) && fs.existsSync(backendImagesPath)) {
  finalImagesPath = backendImagesPath;
}

console.log(`📁 Serving images from: ${finalImagesPath}`);
console.log(`📁 Images directory exists: ${fs.existsSync(finalImagesPath)}`);

app.use('/images', express.static(finalImagesPath));

// Routes
// app.use('/api/upload', require('./routes/upload')); // Temporarily disabled

// API Routes
// Update product by ID
app.put('/api/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const updateData = req.body;

    // Validate required fields
    if (!updateData.name || !updateData.sku) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Name and SKU are required'
      });
    }

    // Validate price
    if (updateData.price && (isNaN(updateData.price) || updateData.price <= 0)) {
      return res.status(400).json({ 
        error: 'Invalid price',
        details: 'Price must be a positive number'
      });
    }

    // Check if another product with the same SKU exists (excluding current product)
    const { data: existingSku, error: skuError } = await supabase
      .from('products')
      .select('id, sku')
      .eq('sku', updateData.sku)
      .neq('id', productId);

    if (skuError) {
      throw skuError;
    }

    if (existingSku && existingSku.length > 0) {
      return res.status(409).json({
        error: 'SKU already exists',
        details: 'Another product already uses this SKU'
      });
    }

    // Prepare update object with only allowed fields
    const allowedFields = [
      'name', 'sku', 'description', 'price', 'brand', 'collection', 
      'availability', 'local_images', 'online_images', 'stock'
    ];

    const sanitizedUpdate = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        sanitizedUpdate[field] = updateData[field];
      }
    });

    // Add updated timestamp
    sanitizedUpdate.updated_at = new Date().toISOString();

    // Update the product
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update(sanitizedUpdate)
      .eq('id', productId)
      .select(`
        *,
        product_images (
          id,
          image_path,
          alt_text,
          display_order
        )
      `)
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return res.status(404).json({ 
          error: 'Product not found',
          details: 'No product found with the specified ID'
        });
      }
      throw updateError;
    }

    // Add dynamic image URL and other computed fields
    if (updatedProduct) {
      const processedProduct = addImageUrl(updatedProduct);
      res.json(processedProduct);
    } else {
      res.status(404).json({ 
        error: 'Product not found',
        details: 'No product found with the specified ID'
      });
    }
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: 'Failed to update product'
    });
  }
});

// Get products with filtering and pagination
app.get('/api/products', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      collection = '',
      brand = '',
      sku = '', // Add SKU search parameter
      minPrice = '', // Add price filtering
      maxPrice = '', // Add price filtering
      sortBy = 'updated_at',
      sortOrder = 'desc'
    } = req.query;

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      // Search by name, description, or SKU
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`);
    }
    if (sku) {
      // Exact SKU match
      query = query.eq('sku', sku);
    }
    if (collection && collection !== 'all') {
      // Match normalized_collection exactly or use ilike for partial match
      query = query.eq('normalized_collection', collection);
    }
    if (brand && brand !== 'all') {
      query = query.eq('normalized_brand', brand);
    }
    // Apply price filters
    if (minPrice && !isNaN(minPrice)) {
      query = query.gte('price', parseFloat(minPrice));
    }
    if (maxPrice && !isNaN(maxPrice)) {
      query = query.lte('price', parseFloat(maxPrice));
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // Helper function to get color information from SKU
    function getColorInfo(sku) {
      if (!sku || !sku.includes('-')) return null;
      
      const parts = sku.split('-');
      const colorCode = parts[parts.length - 1];
      
      const colorNames = {
        'BLU': 'Modrá', 'N': 'Černá', 'R': 'Červená', 'RO2': 'Růžová',
        'M': 'Hnědá', 'BE': 'Béžová', 'GR': 'Šedá', 'V': 'Fialová',
        'BI': 'Bílá', 'GBE': 'Zeleno-béžová', 'TO': 'Okrová',
        'AZBE2': 'Světle modrá', 'VEVE2': 'Tmavě zelená', 'VIVI2': 'Tmavě fialová',
        'AP': 'Oranžová', 'TM': 'Tyrkysová', 'VETM': 'Zeleno-tyrkysová',
        'OT3': 'Oranžová tmavá', 'W92R': 'Bordová'
      };
      
      const colorHex = {
        'BLU': '#0066CC', 'N': '#000000', 'R': '#CC0000', 'RO2': '#FF69B4',
        'M': '#8B4513', 'BE': '#F5F5DC', 'GR': '#808080', 'V': '#8A2BE2',
        'BI': '#FFFFFF', 'GBE': '#9ACD32', 'TO': '#DAA520',
        'AZBE2': '#87CEEB', 'VEVE2': '#006400', 'VIVI2': '#4B0082',
        'AP': '#FFA500', 'TM': '#40E0D0', 'VETM': '#20B2AA',
        'OT3': '#FF8C00', 'W92R': '#800020'
      };
      
      return {
        colorCode,
        colorName: colorNames[colorCode] || colorCode,
        colorHex: colorHex[colorCode] || '#CCCCCC',
        baseSku: parts.slice(0, -1).join('-')
      };
    }

    // Map products with proper image handling and color info
    const mappedProducts = (data || []).map(product => {
      const productImages = getProductImages(product);
      const colorInfo = getColorInfo(product.sku);
      
      return {
        ...product,
        image_url: productImages[0],
        images: productImages,
        // Add compatibility fields for frontend
        name_cz: product.name,
        description_cz: product.description,
        collection: product.normalized_collection,
        brand: product.normalized_brand,
        features: [],
        colors: colorInfo ? [colorInfo.colorHex] : [],
        colorNames: colorInfo ? [colorInfo.colorName] : [],
        tags: [],
        // Color variant info
        colorCode: colorInfo?.colorCode,
        colorName: colorInfo?.colorName,
        colorHex: colorInfo?.colorHex,
        baseSku: colorInfo?.baseSku,
        hasVariants: !!colorInfo // true if this product has color variants
      };
    });

    res.json({
      products: mappedProducts,
      pagination: {
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      throw error;
    }

    // Map product with proper image handling
    const productImages = getProductImages(data);
    const mappedProduct = {
      ...data,
      image_url: productImages[0],
      images: productImages,
      // Add compatibility fields for frontend
      name_cz: data.name,
      description_cz: data.description,
      collection: data.normalized_collection,
      brand: data.normalized_brand,
      features: [],
      colors: [],
      tags: []
    };

    res.json(mappedProduct);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(404).json({ error: 'Product not found' });
  }
});

// Get variants by base SKU (fixed version)
app.get('/api/variants', async (req, res) => {
  try {
    const { baseSku } = req.query;
    
    if (!baseSku) {
      return res.status(400).json({ error: 'baseSku parameter is required' });
    }

    // Extract base SKU by removing the variant part (everything after the last dash)
    // For example: OM5285OM5-R -> OM5285OM5
    const baseSkuPattern = baseSku.split('-')[0];
    
    // Get all products that match the base SKU pattern
    // Use exact match for base SKU to ensure we only get variants of the same product
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .ilike('sku', `${baseSkuPattern}-%`);

    if (error) {
      console.error('Error fetching variants:', error);
      return res.status(500).json({ error: 'Failed to fetch variants' });
    }

    // Map variants with proper image handling
    const mappedVariants = (data || []).map(variant => {
      const productImages = getProductImages(variant);
      return {
        ...variant,
        image_url: productImages[0],
        images: productImages,
        // Add compatibility fields for frontend
        name_cz: variant.name,
        description_cz: variant.description,
        collection: variant.normalized_collection,
        brand: variant.normalized_brand,
        features: [],
        colors: [],
        tags: []
      };
    });

    res.json(mappedVariants || []);
  } catch (error) {
    console.error('Error fetching variants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get collections with Czech names (based on actual product collections)
app.get('/api/collections', async (req, res) => {
  try {
    // Get unique normalized_collection values from products
    const { data: productCollections, error: collectionsError } = await supabase
      .from('products')
      .select('normalized_collection')
      .not('normalized_collection', 'is', null);

    if (collectionsError) {
      throw collectionsError;
    }

    // Get unique collections
    const uniqueCollections = [...new Set(productCollections.map(p => p.normalized_collection))]
      .filter(c => c && c.trim() !== '')
      .sort();

    // Create Czech translations for collection codes
    const czechCollectionNames = {
      'B2': 'Blue Square 2',
      'BR2': 'Brief 2', 
      'C2OW': 'Coleos 2 Openway',
      'MOS': 'Mose',
      'PQL': 'Piquadro Classic',
      'S125': 'Synchrony 125',
      'S134': 'Synchrony 134', 
      'S135': 'Synchrony 135',
      'S136': 'Synchrony 136',
      'S137': 'Synchrony 137',
      'S138': 'Synchrony 138',
      'W129': 'Wostok 129',
      'W134': 'Wostok 134',
      'W92': 'Wostok 92',
      'W92T': 'Wostok 92 Textile'
    };

    // Add "All" option at the beginning
    const collections = [
      {
        id: 'all',
        name: 'Všechny kolekce',
        originalName: '',
        dbId: null
      },
      ...uniqueCollections.map(collection => ({
        id: collection,
        name: czechCollectionNames[collection] || collection,
        originalName: collection,
        dbId: null
      }))
    ];

    res.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get brands
app.get('/api/brands', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('normalized_brand')
      .not('normalized_brand', 'is', null);

    if (error) {
      throw error;
    }

    const brands = [...new Set(data.map(p => p.normalized_brand))]
      .filter(b => b)
      .map((name, index) => ({ id: index + 1, name }));

    res.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get discounts 
app.get('/api/discounts', async (req, res) => {
  try {
    // Check if discounts table exists and has data
    const { data: discountsData, error: discountsError } = await supabase
      .from('discounts')
      .select(`
        id,
        title,
        description,
        code,
        type,
        value,
        usage_limit,
        usage_count,
        starts_at,
        ends_at,
        is_active
      `)
      .order('created_at', { ascending: false });

    let discounts = [];
    let stats = {
      total: 0,
      active: 0,
      scheduled: 0,
      totalUsage: 0
    };

    if (discountsError) {
      console.log('Discounts table not found, returning empty data:', discountsError.message);
      // Return empty data if table doesn't exist
    } else if (discountsData) {
      // Format discounts for display
      discounts = discountsData.map(discount => {
        const now = new Date();
        const startsAt = new Date(discount.starts_at);
        const endsAt = new Date(discount.ends_at);
        
        let status = 'expired';
        let statusLabel = 'Vypršelá';
        
        if (discount.is_active && startsAt <= now && endsAt >= now) {
          status = 'active';
          statusLabel = 'Aktivní';
        } else if (discount.is_active && startsAt > now) {
          status = 'scheduled';
          statusLabel = 'Naplánovaná';
        }

        return {
          id: discount.id,
          title: discount.title,
          description: discount.description,
          code: discount.code,
          type: discount.type,
          value: discount.type === 'percentage' ? `${discount.value}%` :
                 discount.type === 'fixed_amount' ? `${discount.value} Kč` :
                 'Doprava zdarma',
          usage: discount.usage_count || 0,
          limit: discount.usage_limit,
          status,
          statusLabel,
          startDate: startsAt.toLocaleDateString('cs-CZ'),
          endDate: endsAt.toLocaleDateString('cs-CZ')
        };
      });

      // Calculate stats
      stats = {
        total: discounts.length,
        active: discounts.filter(d => d.status === 'active').length,
        scheduled: discounts.filter(d => d.status === 'scheduled').length,
        totalUsage: discounts.reduce((sum, d) => sum + d.usage, 0)
      };
    }

    res.json({ discounts, stats });
  } catch (error) {
    console.error('Error fetching discounts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get customers derived from orders
app.get('/api/customers', async (req, res) => {
  try {
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (ordersError) {
      console.log('Orders table might not exist, returning empty customer data');
      return res.json({ 
        customers: [], 
        stats: { totalCustomers: 0, newThisMonth: 0, regularCustomers: 0, vipCustomers: 0 } 
      });
    }

    // Group orders by customer email
    const customerMap = new Map();
    
    ordersData.forEach(order => {
      const email = order.customer_email;
      if (!customerMap.has(email)) {
        customerMap.set(email, {
          id: email,
          name: order.customer_name || 'N/A',
          email: email,
          location: order.shipping_address || order.city || 'N/A',
          orders: 0,
          totalSpent: 0,
          lastOrder: order.created_at,
          joinDate: order.created_at,
          status: 'regular'
        });
      }
      
      const customer = customerMap.get(email);
      customer.orders += 1;
      customer.totalSpent += order.total_amount || 0;
      
      // Update join date to earliest order
      if (new Date(order.created_at) < new Date(customer.joinDate)) {
        customer.joinDate = order.created_at;
      }
      
      // Update last order to most recent
      if (new Date(order.created_at) > new Date(customer.lastOrder)) {
        customer.lastOrder = order.created_at;
      }
    });

    // Convert to array and determine customer status
    const customers = Array.from(customerMap.values()).map(customer => {
      // Determine status based on orders and spending
      let status = 'new';
      let statusLabel = 'Nový';
      
      if (customer.orders >= 5 || customer.totalSpent >= 20000) {
        status = 'vip';
        statusLabel = 'VIP';
      } else if (customer.orders >= 2) {
        status = 'regular';
        statusLabel = 'Pravidelný';
      }
      
      return {
        ...customer,
        totalSpent: `${customer.totalSpent.toLocaleString('cs-CZ')} Kč`,
        lastOrder: new Date(customer.lastOrder).toLocaleDateString('cs-CZ'),
        joinDate: new Date(customer.joinDate).toLocaleDateString('cs-CZ'),
        status,
        statusLabel
      };
    });

    // Calculate stats
    const totalCustomers = customers.length;
    const newThisMonth = customers.filter(c => {
      const joinDate = new Date(customerMap.get(c.id).joinDate);
      const thisMonth = new Date();
      thisMonth.setDate(1);
      return joinDate >= thisMonth;
    }).length;
    const regularCustomers = customers.filter(c => c.status === 'regular').length;
    const vipCustomers = customers.filter(c => c.status === 'vip').length;

    const stats = {
      totalCustomers,
      newThisMonth,
      regularCustomers,
      vipCustomers
    };

    res.json({ customers, stats });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single order with full details
app.get('/api/orders/:id', async (req, res) => {
  try {
    const orderId = req.params.id;

    // Get order details
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_name,
          product_sku,
          quantity,
          unit_price,
          total_price,
          fulfillable_quantity,
          fulfilled_quantity,
          refunded_quantity,
          product_id
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError) {
      if (orderError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Order not found' });
      }
      throw orderError;
    }

    // Get order events (timeline)
    const { data: eventsData, error: eventsError } = await supabase
      .from('order_events')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    // Get fulfillments
    const { data: fulfillmentsData, error: fulfillmentsError } = await supabase
      .from('fulfillments')
      .select(`
        *,
        fulfillment_line_items (
          *,
          order_items (*)
        )
      `)
      .eq('order_id', orderId);

    // Get refunds
    const { data: refundsData, error: refundsError } = await supabase
      .from('refunds')
      .select(`
        *,
        refund_line_items (
          *,
          order_items (*)
        )
      `)
      .eq('order_id', orderId);

    // Get order notes
    const { data: notesData, error: notesError } = await supabase
      .from('order_notes')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    // Combine all data
    const orderDetail = {
      ...orderData,
      items: orderData.order_items || [],
      events: eventsData || [],
      fulfillments: fulfillmentsData || [],
      refunds: refundsData || [],
      notes: notesData || []
    };

    // Remove the nested order_items to avoid duplication
    delete orderDetail.order_items;

    res.json(orderDetail);
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create refund for an order
app.post('/api/orders/:id/refunds', async (req, res) => {
  try {
    const orderId = req.params.id;
    const { amount, reason, note, gateway, notify_customer, line_items } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid refund amount is required' });
    }

    if (!line_items || !Array.isArray(line_items) || line_items.length === 0) {
      return res.status(400).json({ error: 'Line items are required' });
    }

    // Create refund
    const { data: refund, error: refundError } = await supabase
      .from('refunds')
      .insert({
        order_id: orderId,
        amount,
        reason,
        note,
        gateway,
        status: 'pending',
        processed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (refundError) {
      throw refundError;
    }

    // Insert refund line items
    const refundLineItems = line_items.map(item => ({
      refund_id: refund.id,
      order_item_id: item.order_item_id,
      quantity: item.quantity,
      subtotal: item.subtotal,
      total_tax: 0 // TODO: Calculate tax if needed
    }));

    const { error: lineItemsError } = await supabase
      .from('refund_line_items')
      .insert(refundLineItems);

    if (lineItemsError) {
      // Cleanup refund if line items failed
      await supabase.from('refunds').delete().eq('id', refund.id);
      throw lineItemsError;
    }

    // Update order items refunded quantities
    for (const item of line_items) {
      const { error: updateError } = await supabase
        .from('order_items')
        .update({ 
          refunded_quantity: supabase.raw('refunded_quantity + ?', [item.quantity])
        })
        .eq('id', item.order_item_id);

      if (updateError) {
        console.error('Error updating refunded quantity:', updateError);
      }
    }

    // Update order financial status if fully refunded
    const { data: orderTotal } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('id', orderId)
      .single();

    if (orderTotal && amount >= orderTotal.total_amount) {
      await supabase
        .from('orders')
        .update({ financial_status: 'refunded' })
        .eq('id', orderId);
    } else {
      await supabase
        .from('orders')
        .update({ financial_status: 'partially_refunded' })
        .eq('id', orderId);
    }

    // Create order event
    await supabase
      .from('order_events')
      .insert({
        order_id: orderId,
        event_type: 'refund',
        event_status: 'success',
        description: `Vráceno ${amount.toLocaleString('cs-CZ')} Kč${reason ? ` (${reason})` : ''}`,
        created_by: 'admin',
        details: {
          refund_id: refund.id,
          amount,
          reason,
          gateway,
          items_count: line_items.length
        }
      });

    // TODO: Send email notification to customer if notify_customer is true
    // TODO: Process actual refund through payment gateway

    res.json({ 
      success: true, 
      refund: {
        ...refund,
        line_items: refundLineItems
      }
    });
  } catch (error) {
    console.error('Error creating refund:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create fulfillment for an order
app.post('/api/orders/:id/fulfillments', async (req, res) => {
  try {
    const orderId = req.params.id;
    const { service, tracking_company, tracking_number, notify_customer, line_items } = req.body;

    // Validate required fields
    if (!line_items || !Array.isArray(line_items) || line_items.length === 0) {
      return res.status(400).json({ error: 'Line items are required' });
    }

    // Start transaction
    const { data: fulfillment, error: fulfillmentError } = await supabase
      .from('fulfillments')
      .insert({
        order_id: orderId,
        service,
        tracking_company,
        tracking_number,
        notify_customer,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (fulfillmentError) {
      throw fulfillmentError;
    }

    // Insert fulfillment line items
    const fulfillmentLineItems = line_items.map(item => ({
      fulfillment_id: fulfillment.id,
      order_item_id: item.order_item_id,
      quantity: item.quantity
    }));

    const { error: lineItemsError } = await supabase
      .from('fulfillment_line_items')
      .insert(fulfillmentLineItems);

    if (lineItemsError) {
      // Cleanup fulfillment if line items failed
      await supabase.from('fulfillments').delete().eq('id', fulfillment.id);
      throw lineItemsError;
    }

    // Update order items fulfilled quantities
    for (const item of line_items) {
      const { error: updateError } = await supabase
        .from('order_items')
        .update({ 
          fulfilled_quantity: supabase.raw('fulfilled_quantity + ?', [item.quantity])
        })
        .eq('id', item.order_item_id);

      if (updateError) {
        console.error('Error updating fulfilled quantity:', updateError);
      }
    }

    // Create order event
    await supabase
      .from('order_events')
      .insert({
        order_id: orderId,
        event_type: 'fulfillment',
        event_status: 'success',
        description: tracking_number 
          ? `Expedice vytvořena se sledovacím číslem: ${tracking_number}`
          : 'Expedice vytvořena',
        created_by: 'admin',
        details: {
          fulfillment_id: fulfillment.id,
          service,
          tracking_company,
          tracking_number,
          items_count: line_items.length
        }
      });

    // TODO: Send email notification to customer if notify_customer is true

    res.json({ 
      success: true, 
      fulfillment: {
        ...fulfillment,
        line_items: fulfillmentLineItems
      }
    });
  } catch (error) {
    console.error('Error creating fulfillment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get orders with stats
app.get('/api/orders', async (req, res) => {
  try {
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (ordersError) {
      console.log('Orders table might not exist or have different schema, returning empty data');
      return res.json({ 
        orders: [], 
        stats: { totalOrders: 0, fulfilledOrders: 0, pendingOrders: 0, partiallyFulfilledOrders: 0 } 
      });
    }

    // Calculate stats
    const totalOrders = ordersData.length;
    const fulfilledOrders = ordersData.filter(order => order.status === 'delivered').length;
    const pendingOrders = ordersData.filter(order => order.status === 'pending').length;
    const partiallyFulfilledOrders = ordersData.filter(order => order.status === 'processing' || order.status === 'shipped').length;

    // Format orders for display
    const orders = ordersData.map(order => ({
      id: order.order_number || order.id,
      customer: order.customer_name || order.customer_email,
      date: order.created_at,
      status: order.status === 'delivered' ? 'fulfilled' : 
             order.status === 'pending' ? 'pending' :
             'partially_fulfilled',
      payment: order.payment_status === 'paid' ? 'paid' : 'pending', 
      total: order.total_amount || 0
    }));

    const stats = {
      totalOrders,
      fulfilledOrders,
      pendingOrders,
      partiallyFulfilledOrders
    };

    res.json({ orders, stats });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get product statistics
app.get('/api/stats', async (req, res) => {
  try {
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, availability, created_at');

    if (productsError) {
      throw productsError;
    }

    // Calculate product statistics
    const total = productsData.length;
    const active = productsData.filter(p => p.availability === 'Skladem').length;
    const outOfStock = productsData.filter(p => p.availability === 'Vyprodáno').length;
    const lowStock = productsData.filter(p => p.availability === 'Poslední kusy').length;

    const stats = {
      total,
      active,
      outOfStock,
      lowStock
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching product stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get dashboard statistics
app.get('/api/dashboard-stats', async (req, res) => {
  try {
    // Get product stats
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, price, created_at');

    if (productsError) {
      throw productsError;
    }

    // Try to get order stats (may not exist)
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id, total_amount, created_at, customer_email')
      .limit(1000);

    // Calculate basic stats
    const totalProducts = productsData.length;
    const totalOrders = ordersData ? ordersData.length : 0;
    
    // Calculate revenue from orders if available, otherwise estimate from product value
    const totalRevenue = ordersData && ordersData.length > 0 
      ? ordersData.reduce((sum, order) => sum + (order.total_amount || 0), 0)
      : productsData.reduce((sum, product) => sum + (product.price || 0), 0);
    
    // Calculate unique customers from orders
    const uniqueCustomers = ordersData 
      ? new Set(ordersData.map(order => order.customer_email)).size
      : 0;
    
    // Calculate growth metrics (compare today vs yesterday)
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    
    const yesterdayStart = new Date(yesterday);
    yesterdayStart.setHours(0, 0, 0, 0);
    
    // Orders growth
    const todayOrders = ordersData ? ordersData.filter(order => 
      new Date(order.created_at) >= todayStart
    ).length : 0;
    
    const yesterdayOrders = ordersData ? ordersData.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= yesterdayStart && orderDate < todayStart;
    }).length : 0;
    
    // Revenue growth
    const todayRevenue = ordersData ? ordersData
      .filter(order => new Date(order.created_at) >= todayStart)
      .reduce((sum, order) => sum + (order.total_amount || 0), 0) : 0;
    
    const yesterdayRevenue = ordersData ? ordersData
      .filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= yesterdayStart && orderDate < todayStart;
      })
      .reduce((sum, order) => sum + (order.total_amount || 0), 0) : 0;
    
    // Products growth  
    const todayProducts = productsData.filter(p => 
      new Date(p.created_at) >= todayStart
    ).length;
    
    // Calculate growth percentages
    const revenueGrowth = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;
    const ordersGrowth = todayOrders;
    const customersGrowth = 0; // Would need customer creation dates
    const productsGrowth = todayProducts;

    const stats = {
      totalRevenue: Math.round(totalRevenue),
      totalOrders,
      totalCustomers: uniqueCustomers,
      totalProducts: {
        count: totalProducts
      },
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      ordersGrowth,
      customersGrowth,
      productsGrowth
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add product endpoint
app.post('/api/products', async (req, res) => {
  try {
    const productData = req.body;
    
    // Validate required fields
    if (!productData.sku) {
      return res.status(400).json({ error: 'SKU is required' });
    }
    
    if (!productData.name) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    // Check if product with this SKU already exists
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('id')
      .eq('sku', productData.sku)
      .single();

    if (existingProduct) {
      return res.status(409).json({ error: 'Product with this SKU already exists' });
    }

    // Prepare product data for insertion
    const insertData = {
      sku: productData.sku,
      name: productData.name,
      description: productData.description || '',
      price: productData.price || 0,
      normalized_brand: (productData.brand || '').toLowerCase(),
      availability: productData.stock > 0 ? 'Skladem' : 'Vyprodáno',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert product
    const { data: newProduct, error: insertError } = await supabase
      .from('products')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Handle images if provided
    if (productData.images && Array.isArray(productData.images) && productData.images.length > 0) {
      const imageInserts = productData.images.map((image, index) => ({
        product_id: newProduct.id,
        image_path: image,
        alt_text: `${productData.name} - ${index + 1}`,
        display_order: index + 1
      }));

      const { error: imageError } = await supabase
        .from('product_images')
        .insert(imageInserts);

      if (imageError) {
        console.error('Error inserting product images:', imageError);
        // Don't fail the entire request if images fail
      }
    }

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Get product color variants by base SKU
app.get('/api/product-variants/:baseSku', async (req, res) => {
  try {
    const { baseSku } = req.params;
    
    // Get all products that have this base SKU (everything before last hyphen)
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .like('sku', `${baseSku}-%`)
      .order('sku');

    if (error) {
      throw error;
    }

    // Color code mappings
    const colorNames = {
      'BLU': 'Modrá',
      'N': 'Černá', 
      'R': 'Červená',
      'RO2': 'Růžová',
      'M': 'Hnědá',
      'BE': 'Béžová',
      'GR': 'Šedá',
      'V': 'Fialová',
      'BI': 'Bílá',
      'GBE': 'Zeleno-béžová',
      'TO': 'Okrová',
      'AZBE2': 'Světle modrá',
      'VEVE2': 'Tmavě zelená',
      'VIVI2': 'Tmavě fialová',
      'AP': 'Oranžová',
      'TM': 'Tyrkysová',
      'VETM': 'Zeleno-tyrkysová',
      'OT3': 'Oranžová tmavá',
      'W92R': 'Bordová'
    };

    // Color hex codes for display
    const colorHex = {
      'BLU': '#0066CC',
      'N': '#000000',
      'R': '#CC0000', 
      'RO2': '#FF69B4',
      'M': '#8B4513',
      'BE': '#F5F5DC',
      'GR': '#808080',
      'V': '#8A2BE2',
      'BI': '#FFFFFF',
      'GBE': '#9ACD32',
      'TO': '#DAA520',
      'AZBE2': '#87CEEB',
      'VEVE2': '#006400',
      'VIVI2': '#4B0082',
      'AP': '#FFA500',
      'TM': '#40E0D0',
      'VETM': '#20B2AA',
      'OT3': '#FF8C00',
      'W92R': '#800020'
    };

    // Group and process variants
    const variants = products.map(product => {
      const parts = product.sku.split('-');
      const colorCode = parts[parts.length - 1];
      
      return {
        id: product.id,
        sku: product.sku,
        name: product.name,
        price: product.price,
        colorCode: colorCode,
        colorName: colorNames[colorCode] || colorCode,
        colorHex: colorHex[colorCode] || '#CCCCCC',
        images: product.images || [],
        availability: product.availability,
        stock: product.stock,
        image_url: product.image ? `/images/${product.image}` : null,
        normalized_collection: product.normalized_collection,
        normalized_brand: product.normalized_brand,
        description: product.description
      };
    });

    // Get base product info from the first variant
    const baseProduct = variants.length > 0 ? {
      id: variants[0].id,
      name: variants[0].name,
      description: variants[0].description,
      normalized_collection: variants[0].normalized_collection,
      normalized_brand: variants[0].normalized_brand,
      baseSku: baseSku
    } : null;

    res.json({
      success: true,
      baseProduct,
      variants,
      totalVariants: variants.length
    });

  } catch (error) {
    console.error('Error fetching product variants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Backend server is running' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  initializeImageParser();
});