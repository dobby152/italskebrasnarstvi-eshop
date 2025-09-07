-- Quick setup for supplier orders table
-- Run this in Supabase SQL Editor: https://dbnfkzctensbpktgbsgn.supabase.co

-- Create supplier_orders table
CREATE TABLE IF NOT EXISTS supplier_orders (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  product_sku VARCHAR(100) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  color_variant VARCHAR(100),
  quantity INTEGER DEFAULT 1,
  message TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'contacted_supplier', 'ordered', 'received', 'completed', 'cancelled')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  supplier_contact_info JSONB,
  supplier_notes TEXT,
  admin_notes TEXT,
  estimated_delivery DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  contacted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_supplier_orders_status ON supplier_orders(status);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_created_at ON supplier_orders(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_supplier_orders_updated_at 
  BEFORE UPDATE ON supplier_orders 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE supplier_orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public insert" ON supplier_orders;
DROP POLICY IF EXISTS "Allow public select" ON supplier_orders;
DROP POLICY IF EXISTS "Allow public update" ON supplier_orders;

-- Create policies for demo (adjust for production)
CREATE POLICY "Allow public insert" ON supplier_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select" ON supplier_orders FOR SELECT USING (true);
CREATE POLICY "Allow public update" ON supplier_orders FOR UPDATE USING (true);

-- Create statistics view
CREATE OR REPLACE VIEW order_statistics AS
SELECT 
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
  COUNT(*) FILTER (WHERE status = 'contacted_supplier') as contacted_orders,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as orders_today,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as orders_this_week
FROM supplier_orders;

-- Insert demo data
INSERT INTO supplier_orders (
  customer_name, customer_email, customer_phone, 
  product_sku, product_name, color_variant, 
  quantity, message, priority
) VALUES 
('Jan Novák', 'jan.novak@email.cz', '+420 123 456 789', 
 'OM5285OM5-VE', 'Pánská peněženka', 'Zelená', 
 1, 'Potřebuji tento produkt co nejdříve na dárek.', 'high'),
('Marie Svobodová', 'marie.s@email.cz', '+420 987 654 321', 
 'CA3444MOS-N', 'Batoh na notebook', 'Černá', 
 2, 'Objednávám pro celou rodinu.', 'normal')
ON CONFLICT DO NOTHING;

-- Check if everything was created
SELECT 
  'Table created' as status,
  COUNT(*) as demo_records
FROM supplier_orders;