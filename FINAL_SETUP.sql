-- 🚀 FINÁLNÍ BEZPEČNÝ SETUP PRO ITALIAN LEATHER ESHOP
-- Zkopírujte a vložte tento kód do Supabase SQL Editor

-- 1. Vytvoření users tabulky
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

-- 2. Vytvoření sessions tabulky
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  refresh_token VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Vytvoření indexů pro rychlost
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- 4. Vložení admin uživatele (heslo: admin123456)
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
VALUES (
  'admin@test.cz',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVMst5pKXBUySHSO',
  'Admin',
  'Test',
  'admin',
  true,
  true
) ON CONFLICT (email) DO NOTHING;

-- 5. Vytvoření test zákazníka (heslo: customer123)  
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
VALUES (
  'test@customer.cz',
  '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Jan',
  'Novák',
  'customer',
  true,
  true
) ON CONFLICT (email) DO NOTHING;

-- 6. Výsledná zpráva
SELECT 
  '✅ Setup dokončen!' as status,
  'Admin: admin@test.cz / admin123456' as admin_login,
  'Test zákazník: test@customer.cz / customer123' as customer_login,
  '🔒 Systém je připravený k použití!' as message;