# 📦 MANUAL BUCKET CREATION

## QUICK STEPS:

### 1. Go to Supabase Dashboard:
🔗 **https://supabase.com/dashboard/project/dbnfkzctensbpktgbsgn/storage/buckets**

### 2. Click "New bucket"

### 3. Fill settings:
```
Bucket name: product-images
Public bucket: ✅ YES (IMPORTANT!)
File size limit: 50 MB
Allowed MIME types: 
- image/jpeg
- image/webp  
- image/png
- image/jpg
```

### 4. Click "Create bucket"

---

## ALTERNATIVE: SQL Method

If web interface doesn't work, go to **SQL Editor** and run:

```sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images', 
  true,
  52428800, 
  ARRAY['image/jpeg', 'image/jpg', 'image/webp', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

-- Set up policies
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Public insert access" ON storage.objects  
  FOR INSERT WITH CHECK (bucket_id = 'product-images');

-- Verify
SELECT * FROM storage.buckets WHERE id = 'product-images';
```

---

## AFTER BUCKET IS CREATED:

Run image upload:
```bash
node convert-and-upload-images.js
```

**Current API is ready - just needs images! 🚀**