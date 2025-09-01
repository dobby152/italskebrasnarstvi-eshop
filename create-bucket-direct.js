// Try direct bucket creation via Supabase REST API
const SUPABASE_URL = 'https://dbnfkzctensbpktgbsgn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Nzk0NDgsImV4cCI6MjA3MTI1NTQ0OH0.vbtmSPS8ul57zeZ3W1LCZFAO0O6nyt475IY2_hGHKws';

async function createBucketDirect() {
  console.log('🚀 ATTEMPTING DIRECT BUCKET CREATION...\n');

  try {
    // Method 1: Try storage/v1/bucket endpoint
    console.log('📦 Method 1: Direct storage API...');
    
    const createResponse1 = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: 'product-images',
        name: 'product-images',
        public: true,
        file_size_limit: 52428800,
        allowed_mime_types: ['image/jpeg', 'image/jpg', 'image/webp', 'image/png']
      })
    });

    console.log('Response status:', createResponse1.status);
    const result1 = await createResponse1.text();
    console.log('Response body:', result1);

    if (createResponse1.ok || createResponse1.status === 409) {
      console.log('✅ Method 1 successful!');
      return await testBucket();
    }

    // Method 2: Try rpc call
    console.log('\n📦 Method 2: RPC call...');
    
    const createResponse2 = await fetch(`${SUPABASE_URL}/rest/v1/rpc/storage_create_bucket`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bucket_id: 'product-images',
        bucket_name: 'product-images',
        public: true
      })
    });

    console.log('RPC Response status:', createResponse2.status);
    const result2 = await createResponse2.text();
    console.log('RPC Response body:', result2);

    // Method 3: Direct SQL insert via REST API
    console.log('\n📦 Method 3: Direct SQL insert...');
    
    const sqlResponse = await fetch(`${SUPABASE_URL}/rest/v1/storage_buckets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        id: 'product-images',
        name: 'product-images',
        public: true,
        file_size_limit: 52428800,
        allowed_mime_types: ['image/jpeg', 'image/jpg', 'image/webp', 'image/png']
      })
    });

    console.log('SQL Response status:', sqlResponse.status);
    const result3 = await sqlResponse.text();
    console.log('SQL Response body:', result3);

    return await testBucket();

  } catch (error) {
    console.error('❌ All methods failed:', error.message);
    
    console.log('\n🔧 ALTERNATIVE: Manual SQL execution');
    console.log('Go to: https://supabase.com/dashboard/project/dbnfkzctensbpktgbsgn/sql');
    console.log('And run this SQL:');
    console.log(`
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images', 
  true,
  52428800,
  ARRAY['image/jpeg', 'image/jpg', 'image/webp', 'image/png']
)
ON CONFLICT (id) DO NOTHING;
    `);
    
    return false;
  }
}

async function testBucket() {
  console.log('\n🧪 Testing bucket...');
  
  try {
    // Check if bucket exists by trying to list it
    const listResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket/product-images`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    });

    console.log('List response status:', listResponse.status);
    
    if (listResponse.ok) {
      console.log('✅ Bucket exists and accessible!');
      
      // Test upload
      const fs = require('fs');
      const testFile = 'public/placeholder.svg';
      
      if (fs.existsSync(testFile)) {
        console.log('🧪 Testing file upload...');
        const fileContent = fs.readFileSync(testFile);
        
        const uploadResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/product-images/test-upload.svg`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'image/svg+xml'
          },
          body: fileContent
        });

        console.log('Upload response status:', uploadResponse.status);
        
        if (uploadResponse.ok) {
          console.log('✅ Upload successful!');
          console.log('🔗 Test URL:', `${SUPABASE_URL}/storage/v1/object/public/product-images/test-upload.svg`);
          
          console.log('\n🚀 READY TO UPLOAD IMAGES!');
          console.log('Run: node convert-and-upload-images.js');
          return true;
        }
      }
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

createBucketDirect();