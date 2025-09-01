// Test if bucket exists by trying to upload directly
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dbnfkzctensbpktgbsgn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Nzk0NDgsImV4cCI6MjA3MTI1NTQ0OH0.vbtmSPS8ul57zeZ3W1LCZFAO0O6nyt475IY2_hGHKws';

async function testBucketExists() {
  console.log('🧪 TESTING BUCKET EXISTENCE...\n');

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Method 1: List buckets
    console.log('📋 Method 1: Listing buckets...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.log('❌ List error:', listError.message);
    } else {
      console.log('📦 Found buckets:', buckets.map(b => b.name));
    }

    // Method 2: Try direct upload test
    console.log('\n📤 Method 2: Testing direct upload...');
    const testContent = 'test-content';
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload('test-file.txt', new Blob([testContent]), {
        upsert: true
      });

    if (uploadError) {
      console.log('❌ Upload error:', uploadError.message);
      
      if (uploadError.message.includes('not found')) {
        console.log('💡 Bucket "product-images" definitely does not exist');
        console.log('⚠️  Please double-check bucket creation in dashboard');
      } else if (uploadError.message.includes('policy')) {
        console.log('✅ Bucket exists but has policy restrictions');
        console.log('💡 Try setting bucket policies or making it fully public');
      }
    } else {
      console.log('✅ Upload successful! Bucket exists and is accessible');
      console.log('📂 Upload result:', uploadData);
      
      // Get public URL to verify
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl('test-file.txt');
        
      console.log('🔗 Test file URL:', urlData.publicUrl);
      
      // Clean up test file
      const { error: deleteError } = await supabase.storage
        .from('product-images')
        .remove(['test-file.txt']);
        
      if (!deleteError) {
        console.log('🗑️  Test file cleaned up');
      }
    }

    // Method 3: Direct bucket info
    console.log('\n📋 Method 3: Direct bucket info...');
    const bucketInfoResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket/product-images`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    });

    console.log('Bucket info response status:', bucketInfoResponse.status);
    
    if (bucketInfoResponse.ok) {
      const bucketInfo = await bucketInfoResponse.json();
      console.log('✅ Bucket info:', bucketInfo);
    } else {
      const errorText = await bucketInfoResponse.text();
      console.log('❌ Bucket info error:', errorText);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n🔍 DIAGNOSIS:');
  console.log('If upload test failed with "not found" = bucket doesn\'t exist');
  console.log('If upload test failed with "policy" = bucket exists but needs policy setup');
  console.log('If upload test succeeded = ready to upload images!');
}

// Install supabase if needed
async function main() {
  try {
    require('@supabase/supabase-js');
  } catch (e) {
    console.log('📦 Installing @supabase/supabase-js...');
    const { execSync } = require('child_process');
    execSync('npm install @supabase/supabase-js', { stdio: 'inherit' });
  }
  
  await testBucketExists();
}

main();