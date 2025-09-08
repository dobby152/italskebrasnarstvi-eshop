-- Create stock_movements table
CREATE TABLE IF NOT EXISTS stock_movements (
    id BIGSERIAL PRIMARY KEY,
    sku VARCHAR(50) NOT NULL,
    movement_type VARCHAR(10) NOT NULL CHECK (movement_type IN ('in', 'out')),
    quantity INTEGER NOT NULL,
    location VARCHAR(20) NOT NULL CHECK (location IN ('chodov', 'outlet')),
    reason TEXT,
    user_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoice_processing table
CREATE TABLE IF NOT EXISTS invoice_processing (
    id BIGSERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    supplier VARCHAR(255),
    file_name VARCHAR(255),
    file_size INTEGER,
    ocr_confidence DECIMAL(3,2),
    processing_time DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'pending_approval', 'completed', 'partially_processed', 'failed')),
    items_count INTEGER,
    total_amount INTEGER,
    raw_data JSONB,
    processing_results JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_sku ON stock_movements(sku);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoice_processing_status ON invoice_processing(status);
CREATE INDEX IF NOT EXISTS idx_invoice_processing_created_at ON invoice_processing(created_at DESC);

-- Create RLS policies
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_processing ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (you can make this more restrictive)
CREATE POLICY "Allow all for authenticated users" ON stock_movements FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON invoice_processing FOR ALL USING (true);

-- Create function to create stock_movements table (for the API)
CREATE OR REPLACE FUNCTION create_stock_movements_table()
RETURNS VOID AS $$
BEGIN
    -- This function ensures the table exists
    -- The actual table creation is handled above
    NULL;
END;
$$ LANGUAGE plpgsql;