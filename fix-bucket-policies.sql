-- Fix bucket policies for product-images bucket
-- Run this in Supabase SQL Editor

-- 1. Allow public reads from product-images bucket
CREATE POLICY IF NOT EXISTS "Public read access on product-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- 2. Allow public uploads to product-images bucket  
CREATE POLICY IF NOT EXISTS "Public upload access on product-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

-- 3. Allow updates (for upsert)
CREATE POLICY IF NOT EXISTS "Public update access on product-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- 4. Allow deletes (for cleanup)
CREATE POLICY IF NOT EXISTS "Public delete access on product-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images');

-- 5. Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
AND policyname LIKE '%product-images%';

-- 6. Verify bucket exists and is public
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets 
WHERE name = 'product-images';