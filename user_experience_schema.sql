-- ===============================================
-- 👤 USER EXPERIENCE & PERSONAL ACCOUNT SCHEMA
-- ===============================================
-- Enhanced user management and personalization system
-- ===============================================

BEGIN;

-- ===============================================
-- 1. ENHANCED USER AUTHENTICATION & PROFILES
-- ===============================================

-- Enhanced customers table with authentication
ALTER TABLE customers ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP WITH TIME ZONE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'cs';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferred_currency VARCHAR(3) DEFAULT 'CZK';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS marketing_preferences JSONB DEFAULT '{}';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- User sessions for login tracking
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences and settings
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    preference_key VARCHAR(100) NOT NULL,
    preference_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_id, preference_key)
);

-- ===============================================
-- 2. ADVANCED SHOPPING CART SYSTEM
-- ===============================================

-- Enhanced shopping cart with persistence
CREATE TABLE IF NOT EXISTS shopping_carts (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    session_id VARCHAR(255), -- for guest users
    status VARCHAR(20) DEFAULT 'active', -- active, abandoned, converted, expired
    subtotal DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'CZK',
    abandoned_at TIMESTAMP WITH TIME ZONE,
    converted_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cart items with detailed tracking
CREATE TABLE IF NOT EXISTS shopping_cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INTEGER REFERENCES shopping_carts(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    variant_id INTEGER REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved for later items
CREATE TABLE IF NOT EXISTS saved_cart_items (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    variant_id INTEGER REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    saved_from_cart_id INTEGER REFERENCES shopping_carts(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 3. WISHLIST & FAVORITES SYSTEM
-- ===============================================

-- User wishlists (multiple lists per user)
CREATE TABLE IF NOT EXISTS wishlists (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL DEFAULT 'Má wishlist',
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    share_token VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wishlist items
CREATE TABLE IF NOT EXISTS wishlist_items (
    id SERIAL PRIMARY KEY,
    wishlist_id INTEGER REFERENCES wishlists(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    variant_id INTEGER REFERENCES product_variants(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 0, -- 0=low, 1=medium, 2=high
    notes TEXT,
    price_when_added DECIMAL(10,2),
    quantity_desired INTEGER DEFAULT 1,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product favorites (quick like system)
CREATE TABLE IF NOT EXISTS product_favorites (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_id, product_id)
);

-- Recently viewed products
CREATE TABLE IF NOT EXISTS recently_viewed_products (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    session_id VARCHAR(255), -- for guest users
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    view_duration INTEGER DEFAULT 0, -- seconds spent viewing
    UNIQUE(customer_id, product_id, session_id)
);

-- ===============================================
-- 4. ENHANCED ORDER HISTORY & TRACKING
-- ===============================================

-- Order reviews and ratings (for future use)
CREATE TABLE IF NOT EXISTS order_feedback (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
    delivery_rating INTEGER CHECK (delivery_rating BETWEEN 1 AND 5),
    product_quality_rating INTEGER CHECK (product_quality_rating BETWEEN 1 AND 5),
    comment TEXT,
    would_recommend BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order notifications and communication
CREATE TABLE IF NOT EXISTS order_notifications (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- order_confirmed, payment_received, shipped, delivered
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    sent_via VARCHAR(20), -- email, sms, push, in_app
    sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 5. ADDRESS BOOK MANAGEMENT
-- ===============================================

-- Enhanced customer addresses with labels and validation
ALTER TABLE customer_addresses ADD COLUMN IF NOT EXISTS address_label VARCHAR(100);
ALTER TABLE customer_addresses ADD COLUMN IF NOT EXISTS address_type VARCHAR(20) DEFAULT 'shipping'; -- shipping, billing, both
ALTER TABLE customer_addresses ADD COLUMN IF NOT EXISTS is_validated BOOLEAN DEFAULT false;
ALTER TABLE customer_addresses ADD COLUMN IF NOT EXISTS validation_source VARCHAR(50);
ALTER TABLE customer_addresses ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE customer_addresses ADD COLUMN IF NOT EXISTS coordinates POINT;
ALTER TABLE customer_addresses ADD COLUMN IF NOT EXISTS timezone VARCHAR(50);

-- Shipping preferences per address
CREATE TABLE IF NOT EXISTS address_shipping_preferences (
    id SERIAL PRIMARY KEY,
    address_id INTEGER REFERENCES customer_addresses(id) ON DELETE CASCADE,
    preferred_carrier VARCHAR(100),
    delivery_instructions TEXT,
    access_codes VARCHAR(255),
    preferred_delivery_time VARCHAR(50), -- morning, afternoon, evening
    weekend_delivery BOOLEAN DEFAULT false,
    signature_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 6. USER BEHAVIOR ANALYTICS
-- ===============================================

-- Search history for personalization
CREATE TABLE IF NOT EXISTS search_history (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    search_query TEXT NOT NULL,
    results_count INTEGER DEFAULT 0,
    clicked_product_id INTEGER REFERENCES products(id),
    clicked_position INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Category browsing history
CREATE TABLE IF NOT EXISTS browsing_history (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    page_type VARCHAR(50) NOT NULL, -- product, category, search, homepage
    page_identifier VARCHAR(255), -- product_id, category_slug, etc.
    referrer_url TEXT,
    time_spent INTEGER DEFAULT 0, -- seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase patterns and preferences
CREATE TABLE IF NOT EXISTS purchase_patterns (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    preferred_brands TEXT[],
    preferred_categories TEXT[],
    preferred_price_range NUMRANGE,
    seasonal_preferences JSONB,
    size_preferences JSONB,
    color_preferences TEXT[],
    last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 7. INDEXES FOR PERFORMANCE
-- ===============================================

-- User session indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_customer_id ON user_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Shopping cart indexes
CREATE INDEX IF NOT EXISTS idx_shopping_carts_customer_id ON shopping_carts(customer_id);
CREATE INDEX IF NOT EXISTS idx_shopping_carts_session_id ON shopping_carts(session_id);
CREATE INDEX IF NOT EXISTS idx_shopping_carts_status ON shopping_carts(status);
CREATE INDEX IF NOT EXISTS idx_shopping_cart_items_cart_id ON shopping_cart_items(cart_id);

-- Wishlist indexes
CREATE INDEX IF NOT EXISTS idx_wishlists_customer_id ON wishlists(customer_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist_id ON wishlist_items(wishlist_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id ON wishlist_items(product_id);
CREATE INDEX IF NOT EXISTS idx_product_favorites_customer_id ON product_favorites(customer_id);

-- Recently viewed indexes
CREATE INDEX IF NOT EXISTS idx_recently_viewed_customer_id ON recently_viewed_products(customer_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_viewed_at ON recently_viewed_products(viewed_at);

-- Address indexes
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_is_default ON customer_addresses(is_default);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_search_history_customer_id ON search_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_browsing_history_customer_id ON browsing_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_browsing_history_created_at ON browsing_history(created_at);

-- ===============================================
-- 8. TRIGGERS AND FUNCTIONS
-- ===============================================

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() OR (last_accessed_at < NOW() - INTERVAL '30 days');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update cart totals
CREATE OR REPLACE FUNCTION update_cart_totals()
RETURNS TRIGGER AS $$
DECLARE
    cart_subtotal DECIMAL(10,2);
BEGIN
    -- Calculate new subtotal
    SELECT COALESCE(SUM(total_price), 0) INTO cart_subtotal
    FROM shopping_cart_items
    WHERE cart_id = COALESCE(NEW.cart_id, OLD.cart_id);
    
    -- Update cart totals
    UPDATE shopping_carts 
    SET 
        subtotal = cart_subtotal,
        total_amount = cart_subtotal, -- will be enhanced with tax/discount calculation
        updated_at = NOW()
    WHERE id = COALESCE(NEW.cart_id, OLD.cart_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for cart total updates
CREATE TRIGGER trigger_update_cart_totals
    AFTER INSERT OR UPDATE OR DELETE ON shopping_cart_items
    FOR EACH ROW
    EXECUTE FUNCTION update_cart_totals();

-- Function to track product views
CREATE OR REPLACE FUNCTION track_product_view(
    p_customer_id INTEGER,
    p_session_id VARCHAR(255),
    p_product_id INTEGER,
    p_view_duration INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO recently_viewed_products (customer_id, session_id, product_id, view_duration, viewed_at)
    VALUES (p_customer_id, p_session_id, p_product_id, p_view_duration, NOW())
    ON CONFLICT (customer_id, product_id, session_id) 
    DO UPDATE SET 
        viewed_at = NOW(),
        view_duration = EXCLUDED.view_duration;
        
    -- Keep only last 50 viewed products per user
    DELETE FROM recently_viewed_products 
    WHERE (customer_id = p_customer_id OR session_id = p_session_id)
    AND id NOT IN (
        SELECT id FROM recently_viewed_products 
        WHERE (customer_id = p_customer_id OR session_id = p_session_id)
        ORDER BY viewed_at DESC 
        LIMIT 50
    );
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- 9. USEFUL VIEWS
-- ===============================================

-- View: Customer Summary
CREATE OR REPLACE VIEW customer_summary AS
SELECT 
    c.id,
    c.email,
    c.first_name,
    c.last_name,
    c.created_at as registered_at,
    c.last_login_at,
    c.orders_count,
    c.total_spent,
    COUNT(DISTINCT w.id) as wishlists_count,
    COUNT(DISTINCT wli.id) as wishlist_items_count,
    COUNT(DISTINCT pf.id) as favorite_products_count,
    COUNT(DISTINCT ca.id) as saved_addresses_count,
    CASE 
        WHEN c.total_spent >= 50000 THEN 'VIP'
        WHEN c.total_spent >= 20000 THEN 'Gold'
        WHEN c.total_spent >= 5000 THEN 'Silver'
        ELSE 'Bronze'
    END as tier_level
FROM customers c
LEFT JOIN wishlists w ON c.id = w.customer_id
LEFT JOIN wishlist_items wli ON w.id = wli.wishlist_id
LEFT JOIN product_favorites pf ON c.id = pf.customer_id
LEFT JOIN customer_addresses ca ON c.id = ca.customer_id
GROUP BY c.id, c.email, c.first_name, c.last_name, c.created_at, 
         c.last_login_at, c.orders_count, c.total_spent;

-- View: Popular Products (from wishlists and favorites)
CREATE OR REPLACE VIEW popular_products AS
SELECT 
    p.id,
    p.name,
    p.sku,
    p.price,
    p.brand,
    COUNT(DISTINCT wli.id) as wishlist_adds,
    COUNT(DISTINCT pf.id) as favorites_count,
    COUNT(DISTINCT rvp.id) as recent_views,
    (COUNT(DISTINCT wli.id) * 3 + COUNT(DISTINCT pf.id) * 2 + COUNT(DISTINCT rvp.id)) as popularity_score
FROM products p
LEFT JOIN wishlist_items wli ON p.id = wli.product_id
LEFT JOIN product_favorites pf ON p.id = pf.product_id
LEFT JOIN recently_viewed_products rvp ON p.id = rvp.product_id AND rvp.viewed_at > NOW() - INTERVAL '30 days'
GROUP BY p.id, p.name, p.sku, p.price, p.brand
ORDER BY popularity_score DESC;

-- View: Cart Abandonment Analysis
CREATE OR REPLACE VIEW cart_abandonment_analysis AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_carts,
    COUNT(*) FILTER (WHERE status = 'abandoned') as abandoned_carts,
    COUNT(*) FILTER (WHERE status = 'converted') as converted_carts,
    ROUND(
        (COUNT(*) FILTER (WHERE status = 'converted')::DECIMAL / 
         NULLIF(COUNT(*), 0)) * 100, 2
    ) as conversion_rate,
    AVG(total_amount) FILTER (WHERE status = 'converted') as avg_converted_value,
    AVG(total_amount) FILTER (WHERE status = 'abandoned') as avg_abandoned_value
FROM shopping_carts
WHERE created_at > NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

COMMIT;

-- ===============================================
-- SUCCESS MESSAGE
-- ===============================================
DO $$ 
BEGIN 
    RAISE NOTICE '👤 USER EXPERIENCE SCHEMA DEPLOYED SUCCESSFULLY!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Enhanced Authentication: Sessions, preferences, security';
    RAISE NOTICE '🛒 Advanced Shopping Cart: Persistent, guest support, abandonment tracking';
    RAISE NOTICE '❤️ Wishlist System: Multiple lists, sharing, favorites';
    RAISE NOTICE '📦 Order Tracking: Notifications, feedback, detailed history';
    RAISE NOTICE '📍 Address Book: Multiple addresses, shipping preferences';
    RAISE NOTICE '📊 User Analytics: Behavior tracking, purchase patterns';
    RAISE NOTICE '⚡ Performance: 15+ indexes for fast queries';
    RAISE NOTICE '🔧 Automation: Triggers, cleanup functions, real-time updates';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Ready for enhanced user experience implementation!';
END $$;