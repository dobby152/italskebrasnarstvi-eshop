const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 12;

// ===============================================
// AUTHENTICATION MIDDLEWARE
// ===============================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }
  next();
};

// ===============================================
// USER REGISTRATION & AUTHENTICATION
// ===============================================

// Register new user
router.post('/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, acceptsMarketing } = req.body;

    // Validate required fields
    if (!email || !password || !firstName) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Email, password, and first name are required'
      });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('customers')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const { data: newUser, error } = await supabase
      .from('customers')
      .insert({
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        phone,
        accepts_marketing: acceptsMarketing || false,
        email_verification_token: emailVerificationToken,
        email_verified: false,
        state: 'enabled'
      })
      .select()
      .single();

    if (error) throw error;

    // Create default wishlist
    await supabase
      .from('wishlists')
      .insert({
        customer_id: newUser.id,
        name: 'Má wishlist',
        is_default: true
      });

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    await supabase
      .from('user_sessions')
      .insert({
        customer_id: newUser.id,
        session_token: sessionToken,
        device_info: req.headers['user-agent'] ? { userAgent: req.headers['user-agent'] } : {},
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        emailVerified: newUser.email_verified
      },
      token,
      sessionToken
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Get user with password hash
    const { data: user, error } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(423).json({ error: 'Account temporarily locked' });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordValid) {
      // Increment login attempts
      const loginAttempts = (user.login_attempts || 0) + 1;
      const lockUntil = loginAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null; // 30 min lock

      await supabase
        .from('customers')
        .update({ 
          login_attempts: loginAttempts,
          locked_until: lockUntil
        })
        .eq('id', user.id);

      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset login attempts and update last login
    await supabase
      .from('customers')
      .update({
        login_attempts: 0,
        locked_until: null,
        last_login_at: new Date().toISOString()
      })
      .eq('id', user.id);

    // Generate JWT token
    const expiresIn = rememberMe ? '30d' : '7d';
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn }
    );

    // Create session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000);
    
    await supabase
      .from('user_sessions')
      .insert({
        customer_id: user.id,
        session_token: sessionToken,
        device_info: req.headers['user-agent'] ? { userAgent: req.headers['user-agent'] } : {},
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        expires_at: expiresAt
      });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        emailVerified: user.email_verified,
        preferredLanguage: user.preferred_language,
        preferredCurrency: user.preferred_currency
      },
      token,
      sessionToken
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout user
router.post('/auth/logout', authenticateToken, async (req, res) => {
  try {
    const sessionToken = req.headers['x-session-token'];
    
    if (sessionToken) {
      await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('session_token', sessionToken);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// ===============================================
// USER PROFILE MANAGEMENT
// ===============================================

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('customers')
      .select(`
        id, email, first_name, last_name, phone, date_of_birth,
        gender, avatar_url, accepts_marketing, email_verified,
        preferred_language, preferred_currency, marketing_preferences,
        created_at, last_login_at, orders_count, total_spent
      `)
      .eq('id', req.user.userId)
      .single();

    if (error) throw error;

    // Get user addresses
    const { data: addresses } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', req.user.userId)
      .order('is_default', { ascending: false });

    // Get user preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('customer_id', req.user.userId);

    res.json({
      user: {
        ...user,
        addresses: addresses || [],
        preferences: preferences || []
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { 
      firstName, lastName, phone, dateOfBirth, gender, 
      acceptsMarketing, preferredLanguage, preferredCurrency 
    } = req.body;

    const updateData = {};
    if (firstName !== undefined) updateData.first_name = firstName;
    if (lastName !== undefined) updateData.last_name = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (dateOfBirth !== undefined) updateData.date_of_birth = dateOfBirth;
    if (gender !== undefined) updateData.gender = gender;
    if (acceptsMarketing !== undefined) updateData.accepts_marketing = acceptsMarketing;
    if (preferredLanguage !== undefined) updateData.preferred_language = preferredLanguage;
    if (preferredCurrency !== undefined) updateData.preferred_currency = preferredCurrency;

    updateData.updated_at = new Date().toISOString();

    const { data: updatedUser, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', req.user.userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ===============================================
// SHOPPING CART MANAGEMENT
// ===============================================

// Get user's shopping cart
router.get('/cart', optionalAuth, async (req, res) => {
  try {
    const customerId = req.user?.userId;
    const sessionId = req.headers['x-session-id'];

    if (!customerId && !sessionId) {
      return res.status(400).json({ error: 'Customer ID or session ID required' });
    }

    let query = supabase
      .from('shopping_carts')
      .select(`
        *,
        shopping_cart_items (
          id,
          quantity,
          unit_price,
          total_price,
          added_at,
          products (
            id, name, sku, brand, image_url
          ),
          product_variants (
            id, sku, title, option1_value, option2_value, option3_value, price
          )
        )
      `)
      .eq('status', 'active');

    if (customerId) {
      query = query.eq('customer_id', customerId);
    } else {
      query = query.eq('session_id', sessionId);
    }

    const { data: carts, error } = await query;

    if (error) throw error;

    const cart = carts && carts.length > 0 ? carts[0] : null;

    res.json({
      cart: cart || {
        id: null,
        items: [],
        subtotal: 0,
        total_amount: 0,
        items_count: 0
      }
    });

  } catch (error) {
    console.error('Cart fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// Add item to cart
router.post('/cart/items', optionalAuth, async (req, res) => {
  try {
    const { productId, variantId, quantity = 1 } = req.body;
    const customerId = req.user?.userId;
    const sessionId = req.headers['x-session-id'];

    if (!productId) {
      return res.status(400).json({ error: 'Product ID required' });
    }

    if (!customerId && !sessionId) {
      return res.status(400).json({ error: 'Customer ID or session ID required' });
    }

    // Get or create cart
    let cart;
    const cartQuery = supabase
      .from('shopping_carts')
      .select('*')
      .eq('status', 'active');

    if (customerId) {
      cartQuery.eq('customer_id', customerId);
    } else {
      cartQuery.eq('session_id', sessionId);
    }

    const { data: existingCarts } = await cartQuery;

    if (existingCarts && existingCarts.length > 0) {
      cart = existingCarts[0];
    } else {
      // Create new cart
      const { data: newCart, error } = await supabase
        .from('shopping_carts')
        .insert({
          customer_id: customerId,
          session_id: sessionId,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        })
        .select()
        .single();

      if (error) throw error;
      cart = newCart;
    }

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, price, stock')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let unitPrice = product.price;
    let variantDetails = null;

    // Get variant details if specified
    if (variantId) {
      const { data: variant } = await supabase
        .from('product_variants')
        .select('*')
        .eq('id', variantId)
        .single();

      if (variant) {
        unitPrice = variant.price || product.price;
        variantDetails = variant;
      }
    }

    // Check if item already exists in cart
    const { data: existingItems } = await supabase
      .from('shopping_cart_items')
      .select('*')
      .eq('cart_id', cart.id)
      .eq('product_id', productId)
      .eq('variant_id', variantId || null);

    if (existingItems && existingItems.length > 0) {
      // Update existing item
      const existingItem = existingItems[0];
      const newQuantity = existingItem.quantity + quantity;
      const newTotalPrice = newQuantity * unitPrice;

      const { data: updatedItem, error } = await supabase
        .from('shopping_cart_items')
        .update({
          quantity: newQuantity,
          total_price: newTotalPrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        message: 'Cart item updated',
        item: updatedItem
      });
    } else {
      // Add new item
      const totalPrice = quantity * unitPrice;

      const { data: newItem, error } = await supabase
        .from('shopping_cart_items')
        .insert({
          cart_id: cart.id,
          product_id: productId,
          variant_id: variantId,
          quantity,
          unit_price: unitPrice,
          total_price: totalPrice
        })
        .select()
        .single();

      if (error) throw error;

      res.json({
        message: 'Item added to cart',
        item: newItem
      });
    }

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// Update cart item quantity
router.put('/cart/items/:itemId', optionalAuth, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }

    // Get item details
    const { data: item, error: itemError } = await supabase
      .from('shopping_cart_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    // Update item
    const newTotalPrice = quantity * item.unit_price;

    const { data: updatedItem, error } = await supabase
      .from('shopping_cart_items')
      .update({
        quantity,
        total_price: newTotalPrice,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'Cart item updated',
      item: updatedItem
    });

  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
});

// Remove item from cart
router.delete('/cart/items/:itemId', optionalAuth, async (req, res) => {
  try {
    const { itemId } = req.params;

    const { error } = await supabase
      .from('shopping_cart_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;

    res.json({ message: 'Item removed from cart' });

  } catch (error) {
    console.error('Remove cart item error:', error);
    res.status(500).json({ error: 'Failed to remove cart item' });
  }
});

// ===============================================
// WISHLIST MANAGEMENT
// ===============================================

// Get user's wishlists
router.get('/wishlists', authenticateToken, async (req, res) => {
  try {
    const { data: wishlists, error } = await supabase
      .from('wishlists')
      .select(`
        *,
        wishlist_items (
          id,
          priority,
          notes,
          price_when_added,
          quantity_desired,
          added_at,
          products (
            id, name, sku, brand, price, image_url
          ),
          product_variants (
            id, sku, title, option1_value, option2_value, price
          )
        )
      `)
      .eq('customer_id', req.user.userId)
      .order('is_default', { ascending: false })
      .order('created_at');

    if (error) throw error;

    res.json({ wishlists: wishlists || [] });

  } catch (error) {
    console.error('Wishlist fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch wishlists' });
  }
});

// Add product to wishlist
router.post('/wishlists/:wishlistId/items', authenticateToken, async (req, res) => {
  try {
    const { wishlistId } = req.params;
    const { productId, variantId, priority = 0, notes, quantityDesired = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID required' });
    }

    // Get product price for tracking
    const { data: product } = await supabase
      .from('products')
      .select('price')
      .eq('id', productId)
      .single();

    let priceWhenAdded = product?.price || 0;

    if (variantId) {
      const { data: variant } = await supabase
        .from('product_variants')
        .select('price')
        .eq('id', variantId)
        .single();

      if (variant) {
        priceWhenAdded = variant.price || priceWhenAdded;
      }
    }

    // Check if item already exists
    const { data: existingItems } = await supabase
      .from('wishlist_items')
      .select('id')
      .eq('wishlist_id', wishlistId)
      .eq('product_id', productId)
      .eq('variant_id', variantId || null);

    if (existingItems && existingItems.length > 0) {
      return res.status(409).json({ error: 'Item already in wishlist' });
    }

    // Add item to wishlist
    const { data: newItem, error } = await supabase
      .from('wishlist_items')
      .insert({
        wishlist_id: wishlistId,
        product_id: productId,
        variant_id: variantId,
        priority,
        notes,
        price_when_added: priceWhenAdded,
        quantity_desired: quantityDesired
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'Product added to wishlist',
      item: newItem
    });

  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

// ===============================================
// RECENTLY VIEWED PRODUCTS
// ===============================================

// Get recently viewed products
router.get('/recently-viewed', optionalAuth, async (req, res) => {
  try {
    const customerId = req.user?.userId;
    const sessionId = req.headers['x-session-id'];
    const limit = parseInt(req.query.limit) || 10;

    if (!customerId && !sessionId) {
      return res.json({ products: [] });
    }

    let query = supabase
      .from('recently_viewed_products')
      .select(`
        viewed_at,
        view_duration,
        products (
          id, name, sku, brand, price, image_url
        )
      `)
      .order('viewed_at', { ascending: false })
      .limit(limit);

    if (customerId) {
      query = query.eq('customer_id', customerId);
    } else {
      query = query.eq('session_id', sessionId);
    }

    const { data: recentlyViewed, error } = await query;

    if (error) throw error;

    res.json({
      products: recentlyViewed || []
    });

  } catch (error) {
    console.error('Recently viewed error:', error);
    res.status(500).json({ error: 'Failed to fetch recently viewed products' });
  }
});

// Track product view
router.post('/track-view/:productId', optionalAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { viewDuration = 0 } = req.body;
    const customerId = req.user?.userId;
    const sessionId = req.headers['x-session-id'];

    if (!customerId && !sessionId) {
      return res.json({ message: 'View tracked (anonymous)' });
    }

    // Use the database function to track the view
    const { error } = await supabase.rpc('track_product_view', {
      p_customer_id: customerId,
      p_session_id: sessionId,
      p_product_id: parseInt(productId),
      p_view_duration: viewDuration
    });

    if (error) {
      console.error('Track view error:', error);
      // Don't fail the request if view tracking fails
    }

    res.json({ message: 'View tracked successfully' });

  } catch (error) {
    console.error('Track view error:', error);
    res.status(200).json({ message: 'View tracking failed but request successful' });
  }
});

// ===============================================
// USER PREFERENCES
// ===============================================

// Get user preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('customer_id', req.user.userId);

    if (error) throw error;

    // Convert to key-value object
    const preferencesObj = {};
    if (preferences) {
      preferences.forEach(pref => {
        preferencesObj[pref.preference_key] = pref.preference_value;
      });
    }

    res.json({ preferences: preferencesObj });

  } catch (error) {
    console.error('Preferences fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// Update user preference
router.put('/preferences/:key', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const { data: preference, error } = await supabase
      .from('user_preferences')
      .upsert({
        customer_id: req.user.userId,
        preference_key: key,
        preference_value: value,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'Preference updated successfully',
      preference
    });

  } catch (error) {
    console.error('Preference update error:', error);
    res.status(500).json({ error: 'Failed to update preference' });
  }
});

module.exports = router;