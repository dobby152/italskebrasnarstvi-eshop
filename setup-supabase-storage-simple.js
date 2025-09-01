// Simple setup using existing Supabase client
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dbnfkzctensbpktgbsgn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Nzk0NDgsImV4cCI6MjA3MTI1NTQ0OH0.vbtmSPS8ul57zeZ3W1LCZFAO0O6nyt475IY2_hGHKws';

async function setupStorageSimple() {
  console.log('🚀 SETTING UP SUPABASE STORAGE (SIMPLE METHOD)...\n');

  try {
    // Install supabase-js if needed
    try {
      require('@supabase/supabase-js');
    } catch (e) {
      console.log('Installing @supabase/supabase-js...');
      const { execSync } = require('child_process');
      execSync('npm install @supabase/supabase-js', { stdio: 'inherit' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Test connection
    console.log('🔗 Testing Supabase connection...');
    const { data: testData } = await supabase.from('products').select('id').limit(1);
    console.log('✅ Connected to Supabase successfully');

    // List existing buckets
    console.log('📦 Checking existing storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('❌ Error listing buckets:', bucketsError.message);
    } else {
      console.log('📋 Existing buckets:', buckets.map(b => b.name));
      
      const hasProductImages = buckets.some(b => b.name === 'product-images');
      if (hasProductImages) {
        console.log('✅ "product-images" bucket already exists');
      } else {
        console.log('⚠️  "product-images" bucket not found');
        console.log('💡 You need to create it manually in Supabase dashboard:');
        console.log('   1. Go to https://supabase.com/dashboard/project/dbnfkzctensbpktgbsgn/storage/buckets');
        console.log('   2. Create new bucket: "product-images"');
        console.log('   3. Make it public');
        console.log('   4. Set file size limit to 50MB');
      }
    }

    // Test upload to existing bucket or create test
    if (buckets && buckets.length > 0) {
      const testBucket = buckets[0].name;
      console.log(`🧪 Testing upload to "${testBucket}"...`);
      
      const fs = require('fs');
      const testImagePath = 'public/placeholder.svg';
      
      if (fs.existsSync(testImagePath)) {
        const fileContent = fs.readFileSync(testImagePath);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(testBucket)
          .upload('test-upload.svg', fileContent, {
            contentType: 'image/svg+xml',
            upsert: true
          });
          
        if (uploadError) {
          console.log('❌ Upload failed:', uploadError.message);
          console.log('💡 You may need to set up bucket policies in Supabase dashboard');
        } else {
          console.log('✅ Test upload successful:', uploadData);
          
          // Get public URL
          const { data: urlData } = supabase.storage
            .from(testBucket)
            .getPublicUrl('test-upload.svg');
            
          console.log('🔗 Public URL:', urlData.publicUrl);
        }
      }
    }

    console.log('\n📝 MANUAL STEPS NEEDED:');
    console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/dbnfkzctensbpktgbsgn');
    console.log('2. Navigate to Storage > Buckets');
    console.log('3. Create bucket "product-images" with these settings:');
    console.log('   - Name: product-images');
    console.log('   - Public: YES');
    console.log('   - File size limit: 50MB');
    console.log('   - Allowed MIME types: image/jpeg, image/webp, image/png');
    console.log('4. Then run: node convert-and-upload-images.js');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

setupStorageSimple();