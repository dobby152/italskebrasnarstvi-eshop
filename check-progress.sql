
-- Check current progress
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN collection_code IS NOT NULL THEN 1 END) as updated_products,
  COUNT(CASE WHEN collection_code IS NULL THEN 1 END) as remaining_products,
  ROUND(
    COUNT(CASE WHEN collection_code IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 
    1
  ) as completion_percent
FROM products;

-- Show collection distribution
SELECT 
  collection_name,
  collection_code,
  COUNT(*) as count
FROM products 
WHERE collection_code IS NOT NULL
GROUP BY collection_name, collection_code
ORDER BY count DESC;
