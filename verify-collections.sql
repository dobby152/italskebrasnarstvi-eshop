
-- Verification queries
SELECT 
  collection_code,
  collection_name,
  COUNT(*) as product_count
FROM products 
WHERE collection_code IS NOT NULL
GROUP BY collection_code, collection_name
ORDER BY product_count DESC
LIMIT 20;

-- Summary stats
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN collection_code IS NOT NULL THEN 1 END) as products_with_collection,
  ROUND(
    COUNT(CASE WHEN collection_code IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 
    1
  ) as collection_coverage_percent
FROM products;
