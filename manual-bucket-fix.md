# MANUAL BUCKET CONFIGURATION REQUIRED

The automated bucket policy configuration failed due to API limitations. Please complete these steps manually:

## Option 1: Create New Public Bucket (Recommended)
1. Go to: https://supabase.com/dashboard/project/dbnfkzctensbpktgbsgn/storage/buckets
2. Delete existing "product-images" bucket if present
3. Click "New bucket"
4. Settings:
   - Name: `product-images`
   - Public: **YES** ✅
   - File size limit: `52428800` (50MB)
   - Allowed MIME types: `image/jpeg,image/webp,image/png`

## Option 2: Fix Existing Bucket Policies
1. Go to: https://supabase.com/dashboard/project/dbnfkzctensbpktgbsgn/editor
2. Click "SQL Editor"
3. Run this SQL:

```sql
-- Allow public access to product-images bucket
CREATE POLICY IF NOT EXISTS "Public read access on product-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY IF NOT EXISTS "Public upload access on product-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY IF NOT EXISTS "Public update access on product-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY IF NOT EXISTS "Public delete access on product-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images');
```

## Option 3: Disable RLS (Nuclear Option)
1. Go to: https://supabase.com/dashboard/project/dbnfkzctensbpktgbsgn/editor
2. Run: `ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;`

## After Configuration
Run: `node upload-images-final.js`

The upload script will:
- Convert 14,000+ images to WebP (60% size reduction)
- Upload to Supabase Storage with progress tracking
- Handle errors gracefully
- Provide final status and sample URLs

**Expected Upload Time: 30-45 minutes**
**Data Transfer: ~1GB (down from 2.4GB)**