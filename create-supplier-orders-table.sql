-- SQL script to create supplier orders table in Supabase
-- Run this in Supabase SQL Editor

-- Create supplier_orders table for out-of-stock product requests
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_supplier_orders_status ON supplier_orders(status);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_created_at ON supplier_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_product_sku ON supplier_orders(product_sku);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_customer_email ON supplier_orders(customer_email);

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

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE supplier_orders ENABLE ROW LEVEL SECURITY;

-- Policy for public insert (customers can create orders)
CREATE OR REPLACE POLICY "Allow public insert" ON supplier_orders
  FOR INSERT WITH CHECK (true);

-- Policy for admin select/update (admins can view and manage all orders)
CREATE OR REPLACE POLICY "Allow admin select" ON supplier_orders
  FOR SELECT USING (true);

CREATE OR REPLACE POLICY "Allow admin update" ON supplier_orders
  FOR UPDATE USING (true);

-- Create order_statistics view for admin dashboard
CREATE OR REPLACE VIEW order_statistics AS
SELECT 
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
  COUNT(*) FILTER (WHERE status = 'contacted_supplier') as contacted_orders,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as orders_today,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as orders_this_week
FROM supplier_orders;

-- Insert some demo data for testing
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
 2, 'Objednávám pro celou rodinu.', 'normal'),
('Petr Dvořák', 'petr.dvorak@firma.cz', '+420 555 123 456', 
 'OM5288OM6-R', 'Automatický deštník', 'Červená', 
 1, 'Firemní objednávka, faktura na firmu.', 'normal');

COMMENT ON TABLE supplier_orders IS 'Orders for out-of-stock products that need to be requested from suppliers';
COMMENT ON COLUMN supplier_orders.status IS 'Order status: pending, contacted_supplier, ordered, received, completed, cancelled';
COMMENT ON COLUMN supplier_orders.priority IS 'Order priority: low, normal, high, urgent';
COMMENT ON COLUMN supplier_orders.supplier_contact_info IS 'JSON with supplier contact details';
COMMENT ON COLUMN supplier_orders.supplier_notes IS 'Notes about supplier communication';
COMMENT ON COLUMN supplier_orders.admin_notes IS 'Internal admin notes';