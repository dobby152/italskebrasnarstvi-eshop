const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Get all products with pagination for admin
router.get('/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' });

    // Add search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: products, error, count } = await query
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      products,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('❌ Admin - Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product by ID
router.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('❌ Admin - Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Update product
router.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Add updated timestamp
    updates.updated_at = new Date().toISOString();

    const { data: product, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    console.log(`✅ Admin - Updated product ${id}:`, updates);
    res.json(product);
  } catch (error) {
    console.error('❌ Admin - Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Bulk update products
router.put('/products/bulk', async (req, res) => {
  try {
    const { productIds, updates } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: 'Product IDs array is required' });
    }

    // Add updated timestamp
    updates.updated_at = new Date().toISOString();

    const { data: products, error } = await supabase
      .from('products')
      .update(updates)
      .in('id', productIds)
      .select('*');

    if (error) throw error;

    console.log(`✅ Admin - Bulk updated ${products.length} products:`, updates);
    res.json({ 
      updated: products.length,
      products 
    });
  } catch (error) {
    console.error('❌ Admin - Error bulk updating products:', error);
    res.status(500).json({ error: 'Failed to bulk update products' });
  }
});

// Get product statistics
router.get('/stats', async (req, res) => {
  try {
    // Get counts
    const { data: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    const { data: activeProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { data: inStockProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('availability', 'in_stock');

    // Get recent updates
    const { data: recentUpdates } = await supabase
      .from('products')
      .select('id, sku, name, updated_at')
      .order('updated_at', { ascending: false })
      .limit(10);

    // Get brand statistics
    const { data: brandStats } = await supabase
      .from('products')
      .select('brand')
      .not('brand', 'is', null);

    const brandCounts = {};
    brandStats.forEach(p => {
      brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
    });

    res.json({
      totalProducts: totalProducts?.length || 0,
      activeProducts: activeProducts?.length || 0,
      inStockProducts: inStockProducts?.length || 0,
      recentUpdates,
      brandCounts
    });
  } catch (error) {
    console.error('❌ Admin - Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Delete product
router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;

    console.log(`✅ Admin - Deleted product ${id}`);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('❌ Admin - Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Create new product
router.post('/products', async (req, res) => {
  try {
    const productData = req.body;
    productData.created_at = new Date().toISOString();
    productData.updated_at = new Date().toISOString();

    const { data: product, error } = await supabase
      .from('products')
      .insert([productData])
      .select('*')
      .single();

    if (error) throw error;

    console.log(`✅ Admin - Created new product:`, product.sku);
    res.status(201).json(product);
  } catch (error) {
    console.error('❌ Admin - Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Newsletter subscribers management
router.get('/newsletter', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Create newsletter_subscribers table if it doesn't exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'newsletter_subscribers');

    if (!tables?.length) {
      // Table doesn't exist, create it
      const { error: createError } = await supabase.rpc('create_newsletter_table');
      if (createError) {
        console.log('📧 Creating newsletter table manually...');
        // We'll handle this in the frontend for now
      }
    }

    const { data: subscribers, error, count } = await supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error && error.code === '42P01') {
      // Table doesn't exist, return empty result
      return res.json({
        subscribers: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          pages: 0
        }
      });
    }

    if (error) throw error;

    res.json({
      subscribers: subscribers || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('❌ Admin - Error fetching newsletter subscribers:', error);
    res.status(500).json({ error: 'Failed to fetch newsletter subscribers' });
  }
});

// Add newsletter subscriber
router.post('/newsletter', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    // Check if subscriber already exists
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Email already subscribed' });
    }

    const { data: subscriber, error } = await supabase
      .from('newsletter_subscribers')
      .insert([{
        email,
        subscribed_at: new Date().toISOString(),
        active: true
      }])
      .select('*')
      .single();

    if (error) throw error;

    console.log(`📧 New newsletter subscriber: ${email}`);
    res.status(201).json(subscriber);
  } catch (error) {
    console.error('❌ Admin - Error adding newsletter subscriber:', error);
    res.status(500).json({ error: 'Failed to add newsletter subscriber' });
  }
});

// Unsubscribe from newsletter
router.delete('/newsletter/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({ active: false, unsubscribed_at: new Date().toISOString() })
      .eq('email', email);

    if (error) throw error;

    console.log(`📧 Newsletter unsubscribe: ${email}`);
    res.json({ message: 'Successfully unsubscribed' });
  } catch (error) {
    console.error('❌ Admin - Error unsubscribing from newsletter:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

module.exports = router;