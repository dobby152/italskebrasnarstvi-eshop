// Create bucket using Management API
const SUPABASE_PROJECT_REF = 'dbnfkzctensbpktgbsgn';
const SUPABASE_ACCESS_TOKEN = 'sbp_cf4e143d271355c377eb2469e2756a4dde4ba076';

async function createBucketViaAPI() {
  console.log('🚀 CREATING SUPABASE BUCKET VIA MANAGEMENT API...\n');

  try {
    // Create bucket via Management API
    const createResponse = await fetch(`https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/storage/buckets`, {
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

    const createResult = await createResponse.text();
    console.log('📦 Create bucket response:', createResponse.status);
    console.log('📦 Response body:', createResult);

    if (createResponse.ok || createResponse.status === 409) {
      console.log('✅ Bucket created or already exists');
      
      // Test if we can list the bucket
      const listResponse = await fetch(`https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/storage/buckets`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`
        }
      });

      if (listResponse.ok) {
        const buckets = await listResponse.json();
        console.log('📋 Available buckets:', buckets.map(b => b.name));
        
        const hasProductImages = buckets.some(b => b.name === 'product-images');
        if (hasProductImages) {
          console.log('🎉 SUCCESS! "product-images" bucket is ready');
          console.log('\n📝 NEXT: Run image upload:');
          console.log('node convert-and-upload-images.js');
          return true;
        }
      }
    }

    return false;

  } catch (error) {
    console.error('❌ API Error:', error.message);
    return false;
  }
}

createBucketViaAPI();