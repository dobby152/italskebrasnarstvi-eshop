-- SQL procedury pro Supabase

-- Procedura pro vytvoření tabulky products
CREATE OR REPLACE FUNCTION create_products_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image TEXT,
    category TEXT,
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  
  RAISE NOTICE 'Tabulka products byla úspěšně vytvořena';
END;
$$ LANGUAGE plpgsql;

-- Procedura pro spuštění SQL příkazů
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql;

-- Vytvoření indexů pro lepší výkon
CREATE OR REPLACE FUNCTION create_indexes()
RETURNS void AS $$
BEGIN
  -- Index pro vyhledávání produktů podle kategorie
  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
  
  -- Index pro vyhledávání produktů podle ceny
  CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
  
  -- Index pro vyhledávání objednávek podle stavu
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  
  -- Index pro vyhledávání objednávek podle zákazníka
  CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
  
  RAISE NOTICE 'Indexy byly úspěšně vytvořeny';
END;
$$ LANGUAGE plpgsql;

-- Procedura pro vytvoření RLS (Row Level Security) politik
CREATE OR REPLACE FUNCTION setup_rls()
RETURNS void AS $$
BEGIN
  -- Povolení RLS pro tabulky
  ALTER TABLE products ENABLE ROW LEVEL SECURITY;
  ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
  ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
  ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
  
  -- Vytvoření politik pro tabulku products
  CREATE POLICY products_select_policy ON products
    FOR SELECT USING (true); -- Kdokoliv může číst produkty
  
  CREATE POLICY products_insert_policy ON products
    FOR INSERT WITH CHECK (auth.role() = 'authenticated'); -- Pouze přihlášení uživatelé mohou vkládat
  
  CREATE POLICY products_update_policy ON products
    FOR UPDATE USING (auth.role() = 'authenticated'); -- Pouze přihlášení uživatelé mohou aktualizovat
  
  CREATE POLICY products_delete_policy ON products
    FOR DELETE USING (auth.role() = 'authenticated'); -- Pouze přihlášení uživatelé mohou mazat
  
  -- Podobné politiky pro ostatní tabulky
  -- Categories
  CREATE POLICY categories_select_policy ON categories
    FOR SELECT USING (true);
  
  CREATE POLICY categories_insert_policy ON categories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  
  CREATE POLICY categories_update_policy ON categories
    FOR UPDATE USING (auth.role() = 'authenticated');
  
  CREATE POLICY categories_delete_policy ON categories
    FOR DELETE USING (auth.role() = 'authenticated');
  
  -- Orders
  CREATE POLICY orders_select_policy ON orders
    FOR SELECT USING (auth.role() = 'authenticated');
  
  CREATE POLICY orders_insert_policy ON orders
    FOR INSERT WITH CHECK (true); -- Kdokoliv může vytvořit objednávku
  
  CREATE POLICY orders_update_policy ON orders
    FOR UPDATE USING (auth.role() = 'authenticated');
  
  CREATE POLICY orders_delete_policy ON orders
    FOR DELETE USING (auth.role() = 'authenticated');
  
  -- Order Items
  CREATE POLICY order_items_select_policy ON order_items
    FOR SELECT USING (auth.role() = 'authenticated');
  
  CREATE POLICY order_items_insert_policy ON order_items
    FOR INSERT WITH CHECK (true); -- Kdokoliv může vytvořit položku objednávky
  
  CREATE POLICY order_items_update_policy ON order_items
    FOR UPDATE USING (auth.role() = 'authenticated');
  
  CREATE POLICY order_items_delete_policy ON order_items
    FOR DELETE USING (auth.role() = 'authenticated');
  
  RAISE NOTICE 'RLS politiky byly úspěšně nastaveny';
END;
$$ LANGUAGE plpgsql;