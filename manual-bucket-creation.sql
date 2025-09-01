-- SQL commands to create storage bucket manually
-- Run these in Supabase SQL Editor

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images', 
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/jpg', 'image/webp', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Set up RLS policies for public access
CREATE POLICY "Public read access on product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Public insert access on product images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images');

-- 3. Verify bucket was created
SELECT * FROM storage.buckets WHERE id = 'product-images';