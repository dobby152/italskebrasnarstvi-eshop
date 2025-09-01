// Try creating bucket via direct SQL execution
const SUPABASE_URL = 'https://dbnfkzctensbpktgbsgn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Nzk0NDgsImV4cCI6MjA3MTI1NTQ0OH0.vbtmSPS8ul57zeZ3W1LCZFAO0O6nyt475IY2_hGHKws';

async function createBucketSQL() {
  console.log('🚀 ATTEMPTING SQL-BASED BUCKET CREATION...\n');

  try {
    // Create a custom RPC function to create bucket
    console.log('📦 Creating bucket via raw SQL...');
    
    // First, let's try to create a SQL function that can create the bucket
    const functionSQL = `
    CREATE OR REPLACE FUNCTION create_product_images_bucket()
    RETURNS TEXT AS $$
    BEGIN
      -- Insert bucket
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
        file_size_limit = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types;
      
      RETURN 'Bucket created successfully';
    EXCEPTION 
      WHEN OTHERS THEN
        RETURN 'Error: ' || SQLERRM;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    // Try to create the function via RPC
    const createFunctionResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: functionSQL
      })
    });

    console.log('Function creation status:', createFunctionResponse.status);
    const funcResult = await createFunctionResponse.text();
    console.log('Function creation result:', funcResult);

    // Now try to call the function
    if (createFunctionResponse.ok) {
      const callFunctionResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_product_images_bucket`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      });

      console.log('Function call status:', callFunctionResponse.status);
      const callResult = await callFunctionResponse.text();
      console.log('Function call result:', callResult);
    }

    // Alternative: Try direct bucket creation via storage client
    console.log('\n🔄 Alternative: Using Supabase client...');
    
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data: createData, error: createError } = await supabase
      .storage
      .createBucket('product-images', {
        public: true,
        fileSizeLimit: 52428800,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/webp', 'image/png']
      });

    if (createError) {
      console.log('Client bucket creation error:', createError.message);
      
      if (createError.message.includes('already exists')) {
        console.log('✅ Bucket already exists!');
        return await testBucketExists();
      }
    } else {
      console.log('✅ Bucket created via client:', createData);
      return await testBucketExists();
    }

  } catch (error) {
    console.error('❌ SQL method failed:', error.message);
  }

  console.log('\n💡 MANUAL CREATION NEEDED');
  console.log('Please go to: https://supabase.com/dashboard/project/dbnfkzctensbpktgbsgn/storage/buckets');
  console.log('And create bucket: product-images (public: true, size: 50MB)');
  
  return false;
}

async function testBucketExists() {
  console.log('\n🧪 Testing if bucket exists...');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.log('❌ Error listing buckets:', error.message);
      return false;
    }

    console.log('📋 Available buckets:', buckets.map(b => b.name));
    
    const hasProductImages = buckets.some(b => b.name === 'product-images');
    
    if (hasProductImages) {
      console.log('🎉 SUCCESS! "product-images" bucket exists!');
      console.log('\n🚀 READY TO UPLOAD IMAGES!');
      console.log('Run: node convert-and-upload-images.js');
      return true;
    } else {
      console.log('❌ "product-images" bucket not found');
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Install supabase-js if needed then run
async function main() {
  try {
    require('@supabase/supabase-js');
  } catch (e) {
    console.log('📦 Installing @supabase/supabase-js...');
    const { execSync } = require('child_process');
    execSync('npm install @supabase/supabase-js', { stdio: 'inherit' });
  }
  
  await createBucketSQL();
}

main();