
-- Check how many products now have collections
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN collection_code IS NOT NULL THEN 1 END) as products_with_collection,
  ROUND(
    COUNT(CASE WHEN collection_code IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 
    1
  ) as collection_coverage_percent
FROM products;

-- Show top collections
SELECT 
  collection_code,
  collection_name,
  COUNT(*) as product_count
FROM products 
WHERE collection_code IS NOT NULL
GROUP BY collection_code, collection_name
ORDER BY product_count DESC;

-- Show some examples
SELECT sku, collection_name, collection_code
FROM products 
WHERE collection_code IS NOT NULL
LIMIT 10;
