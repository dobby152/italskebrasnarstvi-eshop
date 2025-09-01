// Create bucket using SQL via Supabase client
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dbnfkzctensbpktgbsgn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY3OTQ0OCwiZXhwIjoyMDcxMjU1NDQ4fQ.vbtmSPS8ul57zeZ3W1LCZFAO0O6nyt475IY2_hGHKws'; // This might be service key

async function createBucketSQL() {
  console.log('🚀 CREATING BUCKET VIA SQL...\n');

  try {
    // Install supabase if needed
    try {
      require('@supabase/supabase-js');
    } catch (e) {
      console.log('📦 Installing @supabase/supabase-js...');
      const { execSync } = require('child_process');
      execSync('npm install @supabase/supabase-js', { stdio: 'inherit' });
    }

    // Try with service key
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    console.log('🔍 Trying to create bucket with admin client...');

    // Create bucket
    const { data: bucketData, error: bucketError } = await supabaseAdmin.storage.createBucket('product-images', {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/webp', 'image/png']
    });

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ Bucket already exists');
      } else {
        console.log('❌ Bucket creation error:', bucketError.message);
        return false;
      }
    } else {
      console.log('✅ Bucket created:', bucketData);
    }

    // Verify bucket exists
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      console.log('❌ Error listing buckets:', listError.message);
      return false;
    }

    console.log('📋 Available buckets:', buckets.map(b => b.name));
    
    const hasProductImages = buckets.some(b => b.name === 'product-images');
    if (hasProductImages) {
      console.log('🎉 SUCCESS! "product-images" bucket is ready');
      
      // Test upload
      console.log('🧪 Testing upload...');
      const fs = require('fs');
      const testFile = 'public/placeholder.svg';
      
      if (fs.existsSync(testFile)) {
        const fileContent = fs.readFileSync(testFile);
        
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('product-images')
          .upload('test-upload.svg', fileContent, {
            contentType: 'image/svg+xml',
            upsert: true
          });
          
        if (uploadError) {
          console.log('⚠️  Test upload failed:', uploadError.message);
        } else {
          console.log('✅ Test upload successful');
          
          // Get public URL
          const { data: urlData } = supabaseAdmin.storage
            .from('product-images')
            .getPublicUrl('test-upload.svg');
            
          console.log('🔗 Public URL:', urlData.publicUrl);
        }
      }
      
      console.log('\n📝 NEXT: Run full image upload:');
      console.log('node convert-and-upload-images.js');
      return true;
    }

    return false;

  } catch (error) {
    console.error('❌ SQL Error:', error.message);
    return false;
  }
}

createBucketSQL();