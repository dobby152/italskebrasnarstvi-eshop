// Fix bucket policies via SQL execution through REST API
const SUPABASE_URL = 'https://dbnfkzctensbpktgbsgn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Nzk0NDgsImV4cCI6MjA3MTI1NTQ0OH0.vbtmSPS8ul57zeZ3W1LCZFAO0O6nyt475IY2_hGHKws';

async function fixBucketPolicies() {
  console.log('🔧 ATTEMPTING TO FIX BUCKET POLICIES VIA API...\n');

  // Method 1: Try executing SQL via rpc
  const policies = [
    {
      name: "Public read access on product-images",
      sql: "CREATE POLICY IF NOT EXISTS \"Public read access on product-images\" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');"
    },
    {
      name: "Public upload access on product-images", 
      sql: "CREATE POLICY IF NOT EXISTS \"Public upload access on product-images\" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');"
    },
    {
      name: "Public update access on product-images",
      sql: "CREATE POLICY IF NOT EXISTS \"Public update access on product-images\" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');"
    }
  ];

  for (const policy of policies) {
    try {
      console.log(`📋 Creating policy: ${policy.name}`);
      
      // Try direct SQL execution
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: policy.sql
        })
      });

      console.log(`   Response status: ${response.status}`);
      const result = await response.text();
      console.log(`   Result: ${result}`);

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  // Method 2: Try direct policy creation via storage API
  console.log('\n🔄 Alternative: Direct storage policy API...');
  
  try {
    const policyResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket/product-images/policy`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        public: true,
        policies: {
          select: true,
          insert: true,
          update: true,
          delete: true
        }
      })
    });

    console.log('Policy API response status:', policyResponse.status);
    const policyResult = await policyResponse.text();
    console.log('Policy API result:', policyResult);

  } catch (error) {
    console.log('❌ Policy API error:', error.message);
  }

  // Method 3: Try updating bucket to be fully public
  console.log('\n🔄 Alternative: Update bucket to public...');
  
  try {
    const updateResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket/product-images`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        public: true,
        file_size_limit: 52428800,
        allowed_mime_types: ['image/jpeg', 'image/jpg', 'image/webp', 'image/png']
      })
    });

    console.log('Update bucket response status:', updateResponse.status);
    const updateResult = await updateResponse.text();
    console.log('Update bucket result:', updateResult);

  } catch (error) {
    console.log('❌ Update bucket error:', error.message);
  }

  // Test if policies are now working
  console.log('\n🧪 Testing upload after policy fixes...');
  await testUploadAfterFix();
}

async function testUploadAfterFix() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const testContent = 'test-after-policy-fix';
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload('policy-test.txt', new Blob([testContent]), {
        upsert: true
      });

    if (uploadError) {
      console.log('❌ Upload still failed:', uploadError.message);
      
      if (uploadError.message.includes('policy')) {
        console.log('\n💡 MANUAL INTERVENTION NEEDED:');
        console.log('1. Go to: https://supabase.com/dashboard/project/dbnfkzctensbpktgbsgn/storage/buckets');
        console.log('2. Click on "product-images" bucket');
        console.log('3. Go to "Configuration" tab');
        console.log('4. Set "Public bucket" to YES');
        console.log('5. Or go to "Policies" tab and disable RLS');
      }
      
      return false;
    } else {
      console.log('✅ Upload successful after policy fix!');
      console.log('📂 Upload result:', uploadData);
      
      // Clean up
      await supabase.storage.from('product-images').remove(['policy-test.txt']);
      
      console.log('\n🚀 POLICIES FIXED! Ready to upload images!');
      return true;
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

// Install supabase if needed then run
async function main() {
  try {
    require('@supabase/supabase-js');
  } catch (e) {
    console.log('📦 Installing @supabase/supabase-js...');
    const { execSync } = require('child_process');
    execSync('npm install @supabase/supabase-js', { stdio: 'inherit' });
  }
  
  const success = await fixBucketPolicies();
  
  if (success) {
    console.log('\n✅ Ready to start image upload!');
    console.log('Run: node upload-images-final.js');
  }
}

main();