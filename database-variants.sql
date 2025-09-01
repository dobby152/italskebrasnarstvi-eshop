-- Create variant tables for product variants system
-- Run these queries in Supabase SQL Editor

-- Create base_products table for grouping variants
CREATE TABLE IF NOT EXISTS base_products (
  id SERIAL PRIMARY KEY,
  base_sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  brand TEXT,
  collection TEXT,
  category TEXT,
  tags TEXT[],
  base_price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create product_variants table for individual color/size variants
CREATE TABLE IF NOT EXISTS product_variants (
  id SERIAL PRIMARY KEY,
  base_product_id INTEGER REFERENCES base_products(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  color_name TEXT,
  color_code TEXT,
  hex_color TEXT,
  size TEXT,
  material TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  inventory_quantity INTEGER DEFAULT 0,
  inventory_policy TEXT DEFAULT 'deny',
  requires_shipping BOOLEAN DEFAULT true,
  weight DECIMAL(8,2),
  status TEXT DEFAULT 'active',
  availability TEXT DEFAULT 'in_stock',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create variant_images table for variant-specific images
CREATE TABLE IF NOT EXISTS variant_images (
  id SERIAL PRIMARY KEY,
  variant_id INTEGER REFERENCES product_variants(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  position INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_variants_base_product_id ON product_variants(base_product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_variant_images_variant_id ON variant_images(variant_id);
CREATE INDEX IF NOT EXISTS idx_base_products_base_sku ON base_products(base_sku);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_base_products_updated_at BEFORE UPDATE ON base_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security) - optional
ALTER TABLE base_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_images ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed)
CREATE POLICY "Enable read access for all users" ON base_products FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON product_variants FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON variant_images FOR SELECT USING (true);

COMMENT ON TABLE base_products IS 'Base product information for grouping variants';
COMMENT ON TABLE product_variants IS 'Individual product variants with color, size, etc.';
COMMENT ON TABLE variant_images IS 'Images specific to product variants';