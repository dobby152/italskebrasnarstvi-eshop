-- SUPABASE PRODUCT DUPLICATE ANALYSIS AND CLEANUP QUERIES
-- Generated based on the duplicate analysis report
-- =========================================================

-- 1. QUERY TO FIND DUPLICATE SKUs (Currently none found, but useful for future monitoring)
SELECT 
    sku,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ') as product_ids,
    STRING_AGG(name, ' | ') as product_names,
    STRING_AGG(price::text, ', ') as prices
FROM products 
WHERE sku IS NOT NULL AND sku != ''
GROUP BY sku 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- 2. QUERY TO FIND EXACT NAME DUPLICATES
-- This query finds products with identical names but different SKUs (color variants)
SELECT 
    LOWER(TRIM(name)) as normalized_name,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ') as product_ids,
    STRING_AGG(sku, ', ') as skus,
    STRING_AGG(price::text, ', ') as prices,
    STRING_AGG(COALESCE(normalized_collection, 'N/A'), ', ') as collections,
    STRING_AGG(COALESCE(normalized_brand, 'N/A'), ', ') as brands
FROM products 
WHERE name IS NOT NULL AND TRIM(name) != ''
GROUP BY LOWER(TRIM(name))
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- 3. IDENTIFY POTENTIAL PRODUCT VARIANTS
-- Products with same name but different SKUs might be color/size variants
WITH name_groups AS (
    SELECT 
        LOWER(TRIM(name)) as normalized_name,
        COUNT(*) as variant_count,
        ARRAY_AGG(id ORDER BY id) as product_ids,
        ARRAY_AGG(sku ORDER BY id) as skus,
        ARRAY_AGG(price ORDER BY id) as prices,
        MIN(price) as min_price,
        MAX(price) as max_price,
        AVG(price) as avg_price
    FROM products 
    WHERE name IS NOT NULL AND TRIM(name) != ''
    GROUP BY LOWER(TRIM(name))
    HAVING COUNT(*) > 1
)
SELECT 
    normalized_name,
    variant_count,
    product_ids,
    skus,
    prices,
    CASE 
        WHEN min_price = max_price THEN 'Same Price'
        WHEN max_price - min_price > avg_price * 0.5 THEN 'Major Price Difference'
        ELSE 'Minor Price Difference'
    END as price_analysis,
    ROUND(avg_price, 2) as avg_price,
    max_price - min_price as price_spread
FROM name_groups
ORDER BY variant_count DESC, price_spread DESC;

-- 4. DATA QUALITY CHECK - MISSING ESSENTIAL FIELDS
SELECT 
    'Missing Names' as issue_type,
    COUNT(*) as count
FROM products 
WHERE name IS NULL OR TRIM(name) = ''

UNION ALL

SELECT 
    'Missing/Invalid Prices' as issue_type,
    COUNT(*) as count
FROM products 
WHERE price IS NULL OR price <= 0

UNION ALL

SELECT 
    'Negative Stock' as issue_type,
    COUNT(*) as count
FROM products 
WHERE stock < 0

UNION ALL

SELECT 
    'Missing SKU' as issue_type,
    COUNT(*) as count
FROM products 
WHERE sku IS NULL OR TRIM(sku) = ''

UNION ALL

SELECT 
    'Missing Descriptions' as issue_type,
    COUNT(*) as count
FROM products 
WHERE description IS NULL OR TRIM(description) = ''

UNION ALL

SELECT 
    'Missing Images' as issue_type,
    COUNT(*) as count
FROM products 
WHERE (images IS NULL OR jsonb_array_length(images) = 0) 
  AND (image_url IS NULL OR TRIM(image_url) = '');

-- 5. SUSPICIOUS PRICE VARIATIONS FOR SAME PRODUCT NAME
-- Identifies products with same name but significantly different prices
WITH price_analysis AS (
    SELECT 
        LOWER(TRIM(name)) as normalized_name,
        COUNT(*) as product_count,
        MIN(price) as min_price,
        MAX(price) as max_price,
        AVG(price) as avg_price,
        STDDEV(price) as price_stddev,
        ARRAY_AGG(DISTINCT sku) as all_skus,
        ARRAY_AGG(id ORDER BY price DESC) as product_ids_by_price
    FROM products 
    WHERE name IS NOT NULL AND TRIM(name) != '' AND price > 0
    GROUP BY LOWER(TRIM(name))
    HAVING COUNT(*) > 1
)
SELECT 
    normalized_name,
    product_count,
    min_price,
    max_price,
    ROUND(avg_price, 2) as avg_price,
    ROUND(price_stddev, 2) as price_std_deviation,
    ROUND((max_price - min_price) / avg_price * 100, 1) as price_variation_percent,
    all_skus,
    product_ids_by_price,
    CASE 
        WHEN (max_price - min_price) / avg_price > 1.0 THEN 'MAJOR PRICE ISSUE'
        WHEN (max_price - min_price) / avg_price > 0.5 THEN 'Moderate Price Variation'
        ELSE 'Minor Price Variation'
    END as price_issue_level
FROM price_analysis
WHERE price_stddev > 0
ORDER BY price_variation_percent DESC;

-- 6. IDENTIFY ORPHANED PRODUCT IMAGES
-- Check if product_images table references exist for products
SELECT 
    p.id as product_id,
    p.name,
    p.sku,
    CASE 
        WHEN pi.id IS NOT NULL THEN 'Has Product Images'
        WHEN p.images IS NOT NULL AND jsonb_array_length(p.images) > 0 THEN 'Has Images Array'
        WHEN p.image_url IS NOT NULL AND p.image_url != '' THEN 'Has Image URL'
        ELSE 'NO IMAGES'
    END as image_status,
    COALESCE(jsonb_array_length(p.images), 0) as images_count
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
WHERE p.id IS NOT NULL
ORDER BY 
    CASE 
        WHEN pi.id IS NULL AND (p.images IS NULL OR jsonb_array_length(p.images) = 0) 
             AND (p.image_url IS NULL OR p.image_url = '') THEN 1
        ELSE 2
    END,
    p.id;

-- 7. CLEANUP SUGGESTIONS - SAFE OPERATIONS
-- These are READ-ONLY queries to help understand what could be cleaned up

-- Find products that might be variants of the same base product
WITH potential_variants AS (
    SELECT 
        LOWER(TRIM(name)) as base_name,
        COUNT(*) as variant_count,
        ARRAY_AGG(id ORDER BY created_at) as product_ids,
        ARRAY_AGG(sku ORDER BY created_at) as skus,
        ARRAY_AGG(price ORDER BY created_at) as prices,
        STRING_AGG(COALESCE(normalized_collection, ''), ', ') as collections
    FROM products 
    WHERE name IS NOT NULL AND TRIM(name) != ''
    GROUP BY LOWER(TRIM(name))
    HAVING COUNT(*) > 1
)
SELECT 
    base_name,
    variant_count,
    product_ids,
    skus,
    prices,
    collections,
    'POTENTIAL VARIANTS - Consider creating base product with variants' as suggestion
FROM potential_variants
WHERE variant_count BETWEEN 2 AND 10  -- Reasonable variant count
ORDER BY variant_count DESC;

-- 8. PRODUCTS WITH POTENTIAL ENCODING/CHARACTER ISSUES
SELECT 
    id,
    name,
    sku,
    LENGTH(name) as name_length,
    'Potential character encoding issue' as issue
FROM products 
WHERE name ~ '[^\x00-\x7F]'  -- Contains non-ASCII characters
   OR name LIKE '%**%'        -- Contains markdown formatting
   OR name LIKE '%â€%'        -- Common encoding issue pattern
   OR LENGTH(name) > 200      -- Unusually long names
ORDER BY name_length DESC;

-- 9. SUMMARY STATISTICS
SELECT 
    'Total Products' as metric,
    COUNT(*) as value
FROM products

UNION ALL

SELECT 
    'Products with Unique Names' as metric,
    COUNT(DISTINCT LOWER(TRIM(name))) as value
FROM products 
WHERE name IS NOT NULL AND TRIM(name) != ''

UNION ALL

SELECT 
    'Products with Unique SKUs' as metric,
    COUNT(DISTINCT sku) as value
FROM products 
WHERE sku IS NOT NULL AND TRIM(sku) != ''

UNION ALL

SELECT 
    'Duplicate Name Groups' as metric,
    COUNT(*) as value
FROM (
    SELECT LOWER(TRIM(name))
    FROM products 
    WHERE name IS NOT NULL AND TRIM(name) != ''
    GROUP BY LOWER(TRIM(name))
    HAVING COUNT(*) > 1
) t

UNION ALL

SELECT 
    'Products in Duplicate Groups' as metric,
    SUM(duplicate_count) as value
FROM (
    SELECT COUNT(*) as duplicate_count
    FROM products 
    WHERE name IS NOT NULL AND TRIM(name) != ''
    GROUP BY LOWER(TRIM(name))
    HAVING COUNT(*) > 1
) t;

-- 10. RECOMMENDED CLEANUP ACTIONS (READ-ONLY ANALYSIS)
-- DO NOT RUN THESE AS-IS - THESE ARE SUGGESTIONS FOR MANUAL REVIEW

/*
-- EXAMPLE: Update products to have consistent naming
-- (Only run after manual review of the data)

-- Step 1: Identify the canonical version of each duplicate group
-- Step 2: Consider merging similar products or creating variant relationships
-- Step 3: Update product descriptions to be more specific

-- For products with exact same names, consider:
-- 1. Adding size/color/variant info to the name
-- 2. Creating a variants relationship
-- 3. Ensuring SKUs properly distinguish variants

-- Example cleanup (DO NOT run without review):
UPDATE products 
SET name = name || ' - ' || SUBSTRING(sku FROM '[A-Z]+$')
WHERE id IN (
    -- IDs of products that need disambiguating names
    SELECT id FROM products 
    WHERE LOWER(TRIM(name)) IN (
        SELECT LOWER(TRIM(name))
        FROM products 
        GROUP BY LOWER(TRIM(name))
        HAVING COUNT(*) > 1
    )
);
*/