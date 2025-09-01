const SUPABASE_PROJECT_REF = 'dbnfkzctensbpktgbsgn';
const SUPABASE_ACCESS_TOKEN = 'sbp_cf4e143d271355c377eb2469e2756a4dde4ba076';
const SUPABASE_URL = 'https://dbnfkzctensbpktgbsgn.supabase.co';

async function setupStorage() {
  console.log('🚀 SETTING UP SUPABASE STORAGE FOR IMAGES...\n');

  try {
    // 1. Create storage bucket
    console.log('📦 Creating "product-images" bucket...');
    
    const createBucketResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: 'product-images',
        name: 'product-images',
        public: true,
        file_size_limit: 52428800, // 50MB
        allowed_mime_types: ['image/jpeg', 'image/jpg', 'image/webp', 'image/png']
      })
    });

    if (createBucketResponse.status === 409) {
      console.log('✅ Bucket "product-images" already exists');
    } else if (createBucketResponse.ok) {
      console.log('✅ Created bucket "product-images"');
    } else {
      const error = await createBucketResponse.json();
      console.log(`❌ Bucket creation failed:`, error);
    }

    // 2. Update bucket policies for public access
    console.log('🔐 Setting up bucket policies...');
    
    const policyResponse = await fetch(`${SUPABASE_URL}/rest/v1/storage/buckets`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Nzk0NDgsImV4cCI6MjA3MTI1NTQ0OH0.vbtmSPS8ul57zeZ3W1LCZFAO0O6nyt475IY2_hGHKws'
      },
      body: JSON.stringify({
        id: 'product-images',
        public: true
      })
    });

    console.log('Policy response status:', policyResponse.status);

    // 3. Check bucket exists and get info
    console.log('📋 Checking bucket status...');
    
    const listResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket/product-images`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      }
    });

    if (listResponse.ok) {
      const bucketInfo = await listResponse.json();
      console.log('✅ Bucket info:', bucketInfo);
    }

    // 4. Test upload a small file
    console.log('🧪 Testing upload...');
    
    const testImagePath = 'public/placeholder.svg';
    const fs = require('fs');
    
    if (fs.existsSync(testImagePath)) {
      const fileContent = fs.readFileSync(testImagePath);
      
      const uploadResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/product-images/test-upload.svg`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'image/svg+xml'
        },
        body: fileContent
      });

      if (uploadResponse.ok) {
        console.log('✅ Test upload successful');
        
        // Get public URL
        const publicURL = `${SUPABASE_URL}/storage/v1/object/public/product-images/test-upload.svg`;
        console.log('🔗 Test image URL:', publicURL);
      } else {
        const error = await uploadResponse.text();
        console.log('❌ Test upload failed:', error);
      }
    }

    console.log('\n🎉 SUPABASE STORAGE SETUP COMPLETE!');
    console.log('\n📝 NEXT STEPS:');
    console.log('1. Run: node convert-and-upload-images.js');
    console.log('2. Update API to use Supabase URLs');
    console.log('3. Deploy to Vercel');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

setupStorage();