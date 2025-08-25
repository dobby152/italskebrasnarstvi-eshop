const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const userExperienceAPI = require('./user-experience-api');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Supabase config
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3006'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Static file serving
const frontendImagesPath = path.join(__dirname, '..', 'frontend', 'public', 'images');
const backendImagesPath = path.join(__dirname, '..', 'images');
let finalImagesPath = frontendImagesPath;
if (!fs.existsSync(frontendImagesPath) && fs.existsSync(backendImagesPath)) {
  finalImagesPath = backendImagesPath;
}
app.use('/images', express.static(finalImagesPath));

console.log(`📁 Serving images from: ${finalImagesPath}`);

// Mount User Experience API routes
app.use('/api/user-experience', userExperienceAPI);

// ===============================================
// UTILITY FUNCTIONS
// ===============================================

function getProductImages(product) {
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    const validImages = product.images.filter(img => img && img.trim() !== '');
    if (validImages.length > 0) {
      const uniqueImages = [...new Set(validImages)];
      const seenBaseNames = new Set();
      const qualityFiltered = [];
      
      const sortedImages = uniqueImages.sort((a, b) => {
        const aName = a.split('/').pop() || '';
        const bName = b.split('/').pop() || '';
        return aName.length - bName.length;
      });
      
      for (const img of sortedImages) {
        let baseName = img;
        if (baseName.includes('/')) {
          baseName = baseName.split('/').pop();
        }
        const basePattern = baseName.split('_')[0];
        
        if (seenBaseNames.has(basePattern)) continue;
        seenBaseNames.add(basePattern);
        qualityFiltered.push(img);
        if (qualityFiltered.length >= 4) break;
      }
      
      return qualityFiltered.map(img => {
        if (img.startsWith('/images/')) return img;
        if (img.startsWith('images/')) return `/${img}`;
        return `/images/${img}`;
      });
    }
  }
  
  if (product.image_url && product.image_url.trim() !== '') {
    let imageUrl = product.image_url;
    if (!imageUrl.startsWith('/images/') && !imageUrl.startsWith('http')) {
      if (imageUrl.startsWith('images/')) {
        imageUrl = `/${imageUrl}`;
      } else {
        imageUrl = `/images/${imageUrl}`;
      }
    }
    return [imageUrl];
  }
  
  return ['/placeholder.svg'];
}

// ===============================================
// PRODUCT MANAGEMENT API
// ===============================================

// Get products with enhanced filtering and pagination
app.get('/api/products', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      collection = '', 
      brand = '', 
      sortBy = 'created_at', 
      sortOrder = 'desc',
      priceMin,
      priceMax,
      inStock,
      tags
    } = req.query;

    let query = supabase
      .from('products')
      .select(`
        *,
        product_images (
          id,
          image_path,
          alt_text,
          display_order
        )
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`);
    }
    if (collection && collection !== 'all') {
      query = query.or(`normalized_collection.eq.${collection},collection.eq.${collection}`);
    }
    if (brand && brand !== 'all') {
      query = query.eq('normalized_brand', brand);
    }
    if (priceMin) {
      query = query.gte('price', parseFloat(priceMin));
    }
    if (priceMax) {
      query = query.lte('price', parseFloat(priceMax));
    }
    if (inStock === 'true') {
      query = query.gt('stock', 0);
    }
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query = query.overlaps('tags', tagArray);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    const mappedProducts = (data || []).map(product => {
      const productImages = getProductImages(product);
      return {
        ...product,
        image_url: productImages[0],
        images: productImages,
        name_cz: product.name,
        description_cz: product.description,
        collection: product.normalized_collection,
        brand: product.normalized_brand,
        features: product.tags || [],
        colors: [],
        tags: product.tags || []
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

// Get single product with variants
app.get('/api/products/:id', async (req, res) => {
  try {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        product_images (
          id,
          image_path,
          alt_text,
          display_order
        ),
        product_variants (
          id,
          sku,
          title,
          option1_name,
          option1_value,
          option2_name,
          option2_value,
          option3_name,
          option3_value,
          price,
          compare_at_price,
          track_inventory
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (productError) throw productError;

    const productImages = getProductImages(product);
    const mappedProduct = {
      ...product,
      image_url: productImages[0],
      images: productImages,
      name_cz: product.name,
      description_cz: product.description,
      collection: product.normalized_collection,
      brand: product.normalized_brand,
      features: product.tags || [],
      colors: [],
      tags: product.tags || [],
      variants: product.product_variants || []
    };

    res.json(mappedProduct);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(404).json({ error: 'Product not found' });
  }
});

// Create new product
app.post('/api/products', async (req, res) => {
  try {
    const productData = req.body;

    // Validate required fields
    if (!productData.name || !productData.sku) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Name and SKU are required'
      });
    }

    // Check for duplicate SKU
    const { data: existingSku } = await supabase
      .from('products')
      .select('id')
      .eq('sku', productData.sku);

    if (existingSku && existingSku.length > 0) {
      return res.status(409).json({
        error: 'SKU already exists'
      });
    }

    // Create handle from name
    const handle = productData.name.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();

    const { data: newProduct, error } = await supabase
      .from('products')
      .insert({
        ...productData,
        handle,
        published_at: productData.is_published ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const updateData = req.body;

    if (!updateData.name || !updateData.sku) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Name and SKU are required'
      });
    }

    // Check for duplicate SKU
    const { data: existingSku } = await supabase
      .from('products')
      .select('id, sku')
      .eq('sku', updateData.sku)
      .neq('id', productId);

    if (existingSku && existingSku.length > 0) {
      return res.status(409).json({
        error: 'SKU already exists'
      });
    }

    updateData.updated_at = new Date().toISOString();

    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===============================================
// INVENTORY MANAGEMENT API
// ===============================================

// Get inventory locations
app.get('/api/inventory/locations', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('inventory_locations')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get inventory items with stock levels
app.get('/api/inventory/items', async (req, res) => {
  try {
    const { location_id, low_stock_only } = req.query;

    let query = supabase
      .from('current_stock_levels')
      .select('*')
      .order('product_name');

    if (location_id) {
      // Note: Would need to join with inventory_locations table
      query = query.eq('location_name', location_id);
    }

    if (low_stock_only === 'true') {
      query = query.eq('is_low_stock', true);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update inventory levels
app.put('/api/inventory/items/:id', async (req, res) => {
  try {
    const { available_quantity, cost_per_item, reason } = req.body;

    const { data, error } = await supabase
      .from('inventory_items')
      .update({
        available_quantity,
        cost_per_item,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Create inventory movement record
    await supabase
      .from('inventory_movements')
      .insert({
        inventory_item_id: req.params.id,
        movement_type: 'adjustment',
        quantity_delta: 0, // Will be calculated by trigger
        quantity_after: available_quantity,
        reference_type: 'manual_adjustment',
        reason: reason || 'Manual adjustment',
        created_by: 'admin'
      });

    res.json(data);
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get inventory movements/history
app.get('/api/inventory/movements', async (req, res) => {
  try {
    const { inventory_item_id, limit = 50 } = req.query;

    let query = supabase
      .from('inventory_movements')
      .select(`
        *,
        inventory_items (
          id,
          product_variants (
            sku,
            title
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (inventory_item_id) {
      query = query.eq('inventory_item_id', inventory_item_id);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching inventory movements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===============================================
// ENHANCED ORDER MANAGEMENT API
// ===============================================

// Get orders with enhanced filtering
app.get('/api/orders', async (req, res) => {
  try {
    const { 
      status, 
      fulfillment_status, 
      financial_status, 
      page = 1, 
      limit = 20,
      search 
    } = req.query;

    let query = supabase
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
          fulfilled_quantity,
          refunded_quantity
        )
      `, { count: 'exact' });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (fulfillment_status && fulfillment_status !== 'all') {
      query = query.eq('fulfillment_status', fulfillment_status);
    }
    if (financial_status && financial_status !== 'all') {
      query = query.eq('financial_status', financial_status);
    }
    if (search) {
      query = query.or(`order_number.ilike.%${search}%,customer_email.ilike.%${search}%,customer_name.ilike.%${search}%`);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    // Format for frontend
    const orders = data.map(order => ({
      id: order.id,
      order_number: order.order_number,
      customer: order.customer_name || order.customer_email,
      email: order.customer_email,
      date: order.created_at,
      status: order.status,
      fulfillment_status: order.fulfillment_status,
      financial_status: order.financial_status,
      total: order.total_amount || 0,
      items_count: order.order_items?.length || 0,
      items: order.order_items || []
    }));

    // Calculate stats
    const totalOrders = count || 0;
    const fulfilledOrders = orders.filter(o => o.fulfillment_status === 'fulfilled').length;
    const pendingOrders = orders.filter(o => o.fulfillment_status === 'unfulfilled').length;
    const partiallyFulfilledOrders = orders.filter(o => o.fulfillment_status === 'partial').length;

    res.json({
      orders,
      pagination: {
        total: totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
        page: parseInt(page),
        limit: parseInt(limit)
      },
      stats: {
        totalOrders,
        fulfilledOrders,
        pendingOrders,
        partiallyFulfilledOrders
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single order with full details
app.get('/api/orders/:id', async (req, res) => {
  try {
    const orderId = req.params.id;

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
          product_id,
          variant_id
        ),
        order_events (
          id,
          event_type,
          event_status,
          description,
          details,
          created_by,
          created_at
        ),
        fulfillments (
          id,
          status,
          service,
          tracking_company,
          tracking_number,
          shipped_at,
          delivered_at,
          fulfillment_line_items (
            id,
            quantity,
            order_item_id
          )
        ),
        refunds (
          id,
          amount,
          reason,
          note,
          status,
          processed_at,
          refund_line_items (
            id,
            quantity,
            subtotal,
            order_item_id
          )
        ),
        order_notes (
          id,
          author,
          note,
          created_at
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

    res.json(orderData);
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create fulfillment
app.post('/api/orders/:id/fulfillments', async (req, res) => {
  try {
    const orderId = req.params.id;
    const { service, tracking_company, tracking_number, notify_customer, line_items } = req.body;

    if (!line_items || !Array.isArray(line_items) || line_items.length === 0) {
      return res.status(400).json({ error: 'Line items are required' });
    }

    // Create fulfillment
    const { data: fulfillment, error: fulfillmentError } = await supabase
      .from('fulfillments')
      .insert({
        order_id: orderId,
        service,
        tracking_company,
        tracking_number,
        notify_customer,
        status: 'success',
        shipped_at: new Date().toISOString()
      })
      .select()
      .single();

    if (fulfillmentError) throw fulfillmentError;

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
      await supabase.from('fulfillments').delete().eq('id', fulfillment.id);
      throw lineItemsError;
    }

    // Update order items fulfilled quantities
    for (const item of line_items) {
      const { data: currentItem } = await supabase
        .from('order_items')
        .select('fulfilled_quantity')
        .eq('id', item.order_item_id)
        .single();

      if (currentItem) {
        await supabase
          .from('order_items')
          .update({ 
            fulfilled_quantity: (currentItem.fulfilled_quantity || 0) + item.quantity
          })
          .eq('id', item.order_item_id);
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

// Create refund
app.post('/api/orders/:id/refunds', async (req, res) => {
  try {
    const orderId = req.params.id;
    const { amount, reason, note, gateway, notify_customer, line_items } = req.body;

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
        status: 'success',
        processed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (refundError) throw refundError;

    // Insert refund line items
    const refundLineItems = line_items.map(item => ({
      refund_id: refund.id,
      order_item_id: item.order_item_id,
      quantity: item.quantity,
      subtotal: item.subtotal,
      total_tax: 0
    }));

    const { error: lineItemsError } = await supabase
      .from('refund_line_items')
      .insert(refundLineItems);

    if (lineItemsError) {
      await supabase.from('refunds').delete().eq('id', refund.id);
      throw lineItemsError;
    }

    // Update order items refunded quantities
    for (const item of line_items) {
      const { data: currentItem } = await supabase
        .from('order_items')
        .select('refunded_quantity')
        .eq('id', item.order_item_id)
        .single();

      if (currentItem) {
        await supabase
          .from('order_items')
          .update({ 
            refunded_quantity: (currentItem.refunded_quantity || 0) + item.quantity
          })
          .eq('id', item.order_item_id);
      }
    }

    // Update order financial status
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

// ===============================================
// CUSTOMER MANAGEMENT API
// ===============================================

// Get customers derived from orders
app.get('/api/customers', async (req, res) => {
  try {
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select(`
        customer_email,
        customer_name,
        total_amount,
        created_at,
        status,
        shipping_city
      `)
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    // Group orders by customer email
    const customerMap = new Map();
    
    ordersData.forEach(order => {
      const email = order.customer_email;
      if (!customerMap.has(email)) {
        customerMap.set(email, {
          id: email,
          name: order.customer_name || 'N/A',
          email: email,
          location: order.shipping_city || 'N/A',
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
      
      if (new Date(order.created_at) < new Date(customer.joinDate)) {
        customer.joinDate = order.created_at;
      }
      
      if (new Date(order.created_at) > new Date(customer.lastOrder)) {
        customer.lastOrder = order.created_at;
      }
    });

    // Convert to array and determine customer status
    const customers = Array.from(customerMap.values()).map(customer => {
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

// ===============================================
// ANALYTICS AND DASHBOARD API
// ===============================================

// Get dashboard statistics
app.get('/api/dashboard-stats', async (req, res) => {
  try {
    // Get product stats
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, price, stock, created_at');

    if (productsError) throw productsError;

    // Get order stats
    const { data: ordersData } = await supabase
      .from('orders')
      .select('id, total_amount, created_at, customer_email');

    const totalProducts = productsData.length;
    const totalOrders = ordersData ? ordersData.length : 0;
    
    const totalRevenue = ordersData && ordersData.length > 0 
      ? ordersData.reduce((sum, order) => sum + (order.total_amount || 0), 0)
      : productsData.reduce((sum, product) => sum + (product.price * (product.stock || 0)), 0);
    
    const uniqueCustomers = ordersData 
      ? new Set(ordersData.map(order => order.customer_email)).size
      : 0;
    
    // Calculate growth metrics
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    
    const yesterdayStart = new Date(yesterday);
    yesterdayStart.setHours(0, 0, 0, 0);
    
    const todayOrders = ordersData ? ordersData.filter(order => 
      new Date(order.created_at) >= todayStart
    ).length : 0;
    
    const todayRevenue = ordersData ? ordersData
      .filter(order => new Date(order.created_at) >= todayStart)
      .reduce((sum, order) => sum + (order.total_amount || 0), 0) : 0;
    
    const todayProducts = productsData.filter(p => 
      new Date(p.created_at) >= todayStart
    ).length;

    const stats = {
      totalRevenue: Math.round(totalRevenue),
      totalOrders,
      totalCustomers: uniqueCustomers,
      totalProducts: {
        count: totalProducts
      },
      revenueGrowth: 0,
      ordersGrowth: todayOrders,
      customersGrowth: 0,
      productsGrowth: todayProducts
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get collections and brands
app.get('/api/collections', async (req, res) => {
  try {
    const { data: collectionsData, error } = await supabase
      .from('collections')
      .select('id, name')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    const czechCollectionNames = {
      'Blue Square': 'Modrý čtverec',
      'Muse': 'Múza',
      'Piquadro': 'Piquadro',
      'Urban': 'Městský',
      'Dámské kabelky': 'Dámské kabelky',
      'Peněženky': 'Peněženky'
    };

    const collections = collectionsData.map(collection => ({
      id: collection.name.toLowerCase().replace(/\s+/g, '-'),
      name: czechCollectionNames[collection.name] || collection.name,
      originalName: collection.name,
      dbId: collection.id
    }));

    res.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/brands', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('id, name')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Basic health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Enhanced Italian Leather Goods Eshop API',
    version: '3.0.0',
    features: [
      'Complete product management',
      'Advanced inventory tracking',
      'Enhanced order management with fulfillments & refunds',
      'User authentication & profiles',
      'Shopping cart & wishlist',
      'Customer analytics',
      'Real-time dashboard stats'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Enhanced Eshop API server running on port ${PORT}`);
  console.log(`📊 Features: Products, Inventory, Orders, Customers, Auth, Cart, Wishlist`);
  console.log(`🔗 Database: Supabase with complete user experience schema`);
  console.log(`📁 Images: Serving from ${finalImagesPath}`);
});

module.exports = app;