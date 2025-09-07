-- Create inventory table for multi-branch stock management
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(100) NOT NULL UNIQUE,
  outlet_stock INTEGER DEFAULT 0,
  chodov_stock INTEGER DEFAULT 0,
  total_stock INTEGER GENERATED ALWAYS AS (outlet_stock + chodov_stock) STORED,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_total_stock ON inventory(total_stock);
CREATE INDEX IF NOT EXISTS idx_inventory_outlet_stock ON inventory(outlet_stock);  
CREATE INDEX IF NOT EXISTS idx_inventory_chodov_stock ON inventory(chodov_stock);

-- Create update trigger
CREATE OR REPLACE FUNCTION update_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_inventory_updated_at 
  BEFORE UPDATE ON inventory 
  FOR EACH ROW 
  EXECUTE FUNCTION update_inventory_updated_at();

-- Enable RLS
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust for production)
DROP POLICY IF EXISTS "Allow public select" ON inventory;
DROP POLICY IF EXISTS "Allow public insert" ON inventory;
DROP POLICY IF EXISTS "Allow public update" ON inventory;

CREATE POLICY "Allow public select" ON inventory FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON inventory FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON inventory FOR UPDATE USING (true);

-- Test the table
SELECT 'inventory table created successfully' as status;