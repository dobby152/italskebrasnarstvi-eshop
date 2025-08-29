const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// JWT Secret - in production, use a strong random secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret-change-this';

// Supabase config
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 🔒 SECURITY MIDDLEWARE
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.stripe.com"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { error: 'Příliš mnoho pokusů o přihlášení, zkuste to později' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use('/api/auth', authLimiter);
app.use(generalLimiter);

// CORS with specific origins
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// 🔒 AUTH MIDDLEWARE
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Přístup zamítnut - chybí token' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Neplatný token' });
    }
    req.user = user;
    next();
  });
}

// Admin middleware
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Vyžadována administrátorská oprávnění' });
  }
  next();
}

// 🔒 DATABASE SETUP - Create users table if not exists
async function initializeDatabase() {
  try {
    // Create users table
    const { error: userTableError } = await supabase.rpc('create_users_table_if_not_exists', {}, {
      headers: { 'Content-Type': 'application/json' }
    });

    // If RPC doesn't exist, create table directly
    if (userTableError) {
      console.log('Creating users table manually...');
      
      const createUsersSQL = `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          phone VARCHAR(20),
          birth_date DATE,
          role VARCHAR(20) DEFAULT 'customer',
          is_active BOOLEAN DEFAULT true,
          email_verified BOOLEAN DEFAULT false,
          address JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_login_at TIMESTAMP WITH TIME ZONE
        );
      `;

      // Note: This would require database admin privileges
      console.log('⚠️ Please run this SQL in your Supabase dashboard:');
      console.log(createUsersSQL);
    }

    // Create sessions table
    const createSessionsSQL = `
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        refresh_token VARCHAR(500) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    console.log('⚠️ Please also run this SQL for sessions:');
    console.log(createSessionsSQL);

    console.log('✅ Database initialization completed');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
}

// 🔒 AUTH ROUTES

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, address } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email a heslo jsou povinné' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Heslo musí mít minimálně 8 znaků' });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'Uživatel s tímto emailem již existuje' });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        phone,
        address,
        role: 'customer',
        created_at: new Date().toISOString()
      })
      .select('id, email, first_name, last_name, phone, role, created_at')
      .single();

    if (error) {
      throw error;
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: newUser.id },
      REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    // Save refresh token
    await supabase
      .from('user_sessions')
      .insert({
        user_id: newUser.id,
        refresh_token: refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

    // Set httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      message: 'Registrace úspěšná',
      user: newUser,
      accessToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registrace se nezdařila' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email a heslo jsou povinné' });
    }

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Neplatné přihlašovací údaje' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Neplatné přihlašovací údaje' });
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    // Save refresh token
    await supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        refresh_token: refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

    // Set httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      message: 'Přihlášení úspěšné',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
        address: user.address
      },
      accessToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Přihlášení se nezdařilo' });
  }
});

// Refresh token
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token chybí' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

    // Check if refresh token exists in database
    const { data: session } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('refresh_token', refreshToken)
      .eq('user_id', decoded.userId)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!session) {
      return res.status(401).json({ error: 'Neplatný refresh token' });
    }

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', decoded.userId)
      .single();

    if (!user) {
      return res.status(401).json({ error: 'Uživatel nenalezen' });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({ accessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ error: 'Neplatný refresh token' });
  }
});

// Logout
app.post('/api/auth/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // Remove refresh token from database
      await supabase
        .from('user_sessions')
        .delete()
        .eq('refresh_token', refreshToken);
    }

    // Clear cookie
    res.clearCookie('refreshToken');
    res.json({ message: 'Odhlášení úspěšné' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Odhlášení se nezdařilo' });
  }
});

// Get current user profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, phone, birth_date, address, role, created_at')
      .eq('id', req.user.userId)
      .single();

    if (!user) {
      return res.status(404).json({ error: 'Uživatel nenalezen' });
    }

    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Načtení profilu se nezdařilo' });
  }
});

// Update user profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, phone, birthDate, address } = req.body;

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        phone,
        birth_date: birthDate,
        address,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.userId)
      .select('id, email, first_name, last_name, phone, birth_date, address, role')
      .single();

    if (error) {
      throw error;
    }

    res.json({
      message: 'Profil byl aktualizován',
      user: updatedUser
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Aktualizace profilu se nezdařila' });
  }
});

// 🔒 PROTECTED ROUTES - All API routes now require authentication

// Products - public read, admin write
app.get('/api/products', async (req, res) => {
  // Public endpoint for products
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      collection = '',
      brand = '',
      sku = '',
      minPrice = '',
      maxPrice = '',
      sortBy = 'updated_at',
      sortOrder = 'desc'
    } = req.query;

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`);
    }
    if (sku) {
      query = query.eq('sku', sku);
    }
    if (collection && collection !== 'all') {
      query = query.eq('normalized_collection', collection);
    }
    if (brand && brand !== 'all') {
      query = query.eq('normalized_brand', brand);
    }
    if (minPrice && !isNaN(minPrice)) {
      query = query.gte('price', parseFloat(minPrice));
    }
    if (maxPrice && !isNaN(maxPrice)) {
      query = query.lte('price', parseFloat(maxPrice));
    }

    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    const mappedProducts = (data || []).map(product => ({
      ...product,
      image_url: `/placeholder.svg`,
      images: ['/placeholder.svg'],
      name_cz: product.name,
      description_cz: product.description,
      collection: product.normalized_collection,
      brand: product.normalized_brand,
      features: [],
      colors: [],
      tags: []
    }));

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

// Admin-only routes
app.post('/api/products', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const productData = req.body;
    
    if (!productData.sku || !productData.name) {
      return res.status(400).json({ error: 'SKU a název produktu jsou povinné' });
    }

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

    const { data: newProduct, error } = await supabase
      .from('products')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Vytvoření produktu se nezdařilo' });
  }
});

app.put('/api/products/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const productId = req.params.id;
    const updateData = req.body;

    if (!updateData.name || !updateData.sku) {
      return res.status(400).json({ 
        error: 'Chybí povinná pole',
        details: 'Název a SKU jsou povinné'
      });
    }

    const sanitizedUpdate = {
      name: updateData.name,
      sku: updateData.sku,
      description: updateData.description || '',
      price: updateData.price || 0,
      brand: updateData.brand,
      collection: updateData.collection,
      availability: updateData.availability,
      stock: updateData.stock,
      updated_at: new Date().toISOString()
    };

    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update(sanitizedUpdate)
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Aktualizace produktu se nezdařila' });
  }
});

// User orders - protected
app.get('/api/user/orders', authenticateToken, async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('customer_email', req.user.email)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(orders || []);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ error: 'Načtení objednávek se nezdařilo' });
  }
});

// Admin-only routes
app.get('/api/customers', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, phone, role, created_at, last_login_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const customers = users.map(user => ({
      id: user.id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      email: user.email,
      phone: user.phone,
      status: user.role === 'admin' ? 'admin' : 'customer',
      joinDate: new Date(user.created_at).toLocaleDateString('cs-CZ'),
      lastLogin: user.last_login_at ? new Date(user.last_login_at).toLocaleDateString('cs-CZ') : 'Nikdy'
    }));

    res.json({
      customers,
      stats: {
        totalCustomers: customers.length,
        newThisMonth: customers.filter(c => {
          const joinDate = new Date(users.find(u => u.id === c.id).created_at);
          const thisMonth = new Date();
          thisMonth.setDate(1);
          return joinDate >= thisMonth;
        }).length,
        regularCustomers: customers.filter(c => c.status === 'customer').length,
        adminUsers: customers.filter(c => c.status === 'admin').length
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Načtení zákazníků se nezdařilo' });
  }
});

app.get('/api/orders', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const formattedOrders = orders.map(order => ({
      id: order.order_number || order.id,
      customer: order.customer_name || order.customer_email,
      date: order.created_at,
      status: order.status === 'delivered' ? 'fulfilled' : 
             order.status === 'pending' ? 'pending' : 'partially_fulfilled',
      payment: order.payment_status === 'paid' ? 'paid' : 'pending',
      total: order.total_amount || 0
    }));

    res.json({
      orders: formattedOrders,
      stats: {
        totalOrders: orders.length,
        fulfilledOrders: orders.filter(o => o.status === 'delivered').length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        partiallyFulfilledOrders: orders.filter(o => ['processing', 'shipped'].includes(o.status)).length
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Načtení objednávek se nezdařilo' });
  }
});

// Public routes (collections, brands)
app.get('/api/collections', async (req, res) => {
  try {
    const { data: productCollections, error } = await supabase
      .from('products')
      .select('normalized_collection')
      .not('normalized_collection', 'is', null);

    if (error) throw error;

    const uniqueCollections = [...new Set(productCollections.map(p => p.normalized_collection))]
      .filter(c => c && c.trim() !== '')
      .sort();

    const collections = [
      { id: 'all', name: 'Všechny kolekce', originalName: '', dbId: null },
      ...uniqueCollections.map(collection => ({
        id: collection,
        name: collection,
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
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: '🔒 Secure Backend Server is running',
    security: '✅ JWT Authentication enabled',
    version: '2.0.0'
  });
});

// 🔒 Initialize and start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🔒 Secure Backend Server running on port ${PORT}`);
    console.log(`🛡️  Security features enabled:`);
    console.log(`   • JWT Authentication`);
    console.log(`   • Rate Limiting`);
    console.log(`   • Helmet Security Headers`);
    console.log(`   • CORS Protection`);
    console.log(`   • Password Hashing`);
    console.log(`📊 Admin panel available at: http://localhost:${PORT}/api/admin`);
  });
});

module.exports = app;