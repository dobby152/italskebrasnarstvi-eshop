-- 🔒 SECURE DATABASE SCHEMA FOR ITALIAN LEATHER ESHOP
-- Run this SQL in your Supabase SQL Editor

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  birth_date DATE,
  role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  address JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Create user sessions table for refresh tokens
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  refresh_token VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user orders table (if not exists)
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(200),
  customer_phone VARCHAR(20),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  financial_status VARCHAR(50) DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  shipping_address JSONB DEFAULT '{}',
  billing_address JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order items table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_sku VARCHAR(100) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  fulfillable_quantity INTEGER DEFAULT 0,
  fulfilled_quantity INTEGER DEFAULT 0,
  refunded_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order events table (for tracking order history)
CREATE TABLE IF NOT EXISTS order_events (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_status VARCHAR(50) NOT NULL,
  description TEXT,
  created_by VARCHAR(100),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fulfillments table
CREATE TABLE IF NOT EXISTS fulfillments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  service VARCHAR(100),
  tracking_company VARCHAR(100),
  tracking_number VARCHAR(255),
  notify_customer BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'delivered', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fulfillment line items table
CREATE TABLE IF NOT EXISTS fulfillment_line_items (
  id SERIAL PRIMARY KEY,
  fulfillment_id INTEGER REFERENCES fulfillments(id) ON DELETE CASCADE,
  order_item_id INTEGER REFERENCES order_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create refunds table
CREATE TABLE IF NOT EXISTS refunds (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  reason VARCHAR(255),
  note TEXT,
  gateway VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create refund line items table
CREATE TABLE IF NOT EXISTS refund_line_items (
  id SERIAL PRIMARY KEY,
  refund_id INTEGER REFERENCES refunds(id) ON DELETE CASCADE,
  order_item_id INTEGER REFERENCES order_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal DECIMAL(10,2) NOT NULL,
  total_tax DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order notes table
CREATE TABLE IF NOT EXISTS order_notes (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create discounts table
CREATE TABLE IF NOT EXISTS discounts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'free_shipping')),
  value DECIMAL(10,2) NOT NULL,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discounts_updated_at BEFORE UPDATE ON discounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert admin user (password: admin123456)
-- Note: This is a hashed version of 'admin123456' with bcrypt (12 rounds)
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
VALUES (
  'admin@italske-brasnarsvi.cz',
  '$2b$12$rQZ1bSh1UqV8CZK2BqG/sO0dKxNGp0x1Lhx4Hx5p0uV4XcF6sK8w.',  -- admin123456
  'Admin',
  'User',
  'admin',
  true,
  true
) ON CONFLICT (email) DO NOTHING;

-- Create Row Level Security (RLS) policies

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only see and update their own data
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text OR 
                   EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid()::int AND users.role = 'admin'));

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Only admins can create users (registration will be handled by API)
CREATE POLICY "Admins can manage all users" ON users
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid()::int AND users.role = 'admin'));

-- Enable RLS on orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can only see their own orders, admins can see all
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (user_id = auth.uid()::int OR 
                   EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid()::int AND users.role = 'admin'));

-- Enable RLS on user_sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own sessions
CREATE POLICY "Users can manage their own sessions" ON user_sessions
  FOR ALL USING (user_id = auth.uid()::int);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON products TO anon, authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON user_sessions TO authenticated;
GRANT ALL ON orders TO authenticated;
GRANT ALL ON order_items TO authenticated;
GRANT ALL ON order_events TO authenticated;
GRANT ALL ON fulfillments TO authenticated;
GRANT ALL ON fulfillment_line_items TO authenticated;
GRANT ALL ON refunds TO authenticated;
GRANT ALL ON refund_line_items TO authenticated;
GRANT ALL ON order_notes TO authenticated;
GRANT SELECT ON discounts TO anon, authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMENT ON TABLE users IS '🔒 User accounts with secure authentication';
COMMENT ON TABLE user_sessions IS '🔒 Secure session management with refresh tokens';
COMMENT ON TABLE orders IS '📦 Customer orders with full tracking';
COMMENT ON COLUMN users.password_hash IS '🔒 Bcrypt hashed passwords (12 rounds)';
COMMENT ON COLUMN user_sessions.refresh_token IS '🔒 JWT refresh tokens for session management';

-- Successful setup message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Secure database schema created successfully!';
  RAISE NOTICE '🔒 Admin user: admin@italske-brasnarsvi.cz (password: admin123456)';
  RAISE NOTICE '🛡️  Row Level Security enabled';
  RAISE NOTICE '📊 All tables and indexes created';
END $$;