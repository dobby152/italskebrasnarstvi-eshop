-- 🚀 QUICK SECURE SETUP FOR ITALIAN LEATHER ESHOP
-- Copy and paste this into your Supabase SQL Editor

-- Create users table
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
  address JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  refresh_token VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert test admin user (password: admin123456)
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
VALUES (
  'admin@test.cz',
  '$2b$12$rQZ1bSh1UqV8CZK2BqG/sO0dKxNGp0x1Lhx4Hx5p0uV4XcF6sK8w.',
  'Admin',
  'Test',
  'admin',
  true,
  true
) ON CONFLICT (email) DO NOTHING;

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(refresh_token);

-- Success message
SELECT 'Database setup complete! Admin login: admin@test.cz / admin123456' as message;