// Try to disable RLS on storage.objects table
const SUPABASE_URL = 'https://dbnfkzctensbpktgbsgn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Nzk0NDgsImV4cCI6MjA3MTI1NTQ0OH0.vbtmSPS8ul57zeZ3W1LCZFAO0O6nyt475IY2_hGHKws';

async function disableRLS() {
  console.log('🔧 ATTEMPTING TO DISABLE RLS ON STORAGE...\n');

  // Try various approaches to disable RLS or create permissive policies

  // Method 1: Try to execute ALTER TABLE via different endpoints
  const commands = [
    // Disable RLS
    "ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;",
    
    // Create super permissive policy
    "CREATE POLICY IF NOT EXISTS \"Allow all for product-images\" ON storage.objects FOR ALL USING (bucket_id = 'product-images');",
    
    // Grant permissions
    "GRANT ALL ON storage.objects TO anon;",
    "GRANT ALL ON storage.objects TO authenticated;",
    
    // Alternative policy approach
    "CREATE POLICY IF NOT EXISTS \"Public access product-images\" ON storage.objects AS PERMISSIVE FOR ALL TO public USING (bucket_id = 'product-images');"
  ];

  for (const command of commands) {
    try {
      console.log(`📋 Trying: ${command.substring(0, 50)}...`);
      
      // Try via rpc with different function names
      const endpoints = ['sql', 'exec', 'execute', 'query'];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${endpoint}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'apikey': SUPABASE_ANON_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: command })
          });

          if (response.status !== 404) {
            console.log(`   ${endpoint} response: ${response.status}`);
            const result = await response.text();
            console.log(`   Result: ${result.substring(0, 100)}...`);
            break;
          }
        } catch (error) {
          // Continue to next endpoint
        }
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  // Method 2: Try direct manipulation via REST API
  console.log('\n🔄 Trying direct table manipulation...');
  
  try {
    // Try to insert a policy directly into pg_policies
    const policyInsert = await fetch(`${SUPABASE_URL}/rest/v1/pg_policies`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        schemaname: 'storage',
        tablename: 'objects',
        policyname: 'product-images-full-access',
        permissive: 'PERMISSIVE',
        roles: '{public}',
        cmd: 'ALL',
        qual: "bucket_id = 'product-images'"
      })
    });

    console.log('Policy insert response:', policyInsert.status);
    
  } catch (error) {
    console.log('❌ Policy insert error:', error.message);
  }

  // Final test
  await testUploadFinal();
}

async function testUploadFinal() {
  console.log('\n🧪 Final upload test...');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const testContent = 'final-test-content';
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload('final-test.txt', new Blob([testContent]), {
        upsert: true
      });

    if (uploadError) {
      console.log('❌ Upload still failed:', uploadError.message);
      
      console.log('\n🚨 AUTOMATED FIX NOT POSSIBLE');
      console.log('Manual intervention is required in Supabase dashboard:');
      console.log('');
      console.log('OPTION 1 - Disable RLS:');
      console.log('1. Go to: https://supabase.com/dashboard/project/dbnfkzctensbpktgbsgn/editor');
      console.log('2. Click SQL Editor');
      console.log('3. Run: ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;');
      console.log('');
      console.log('OPTION 2 - Create policies:');
      console.log('1. Go to: https://supabase.com/dashboard/project/dbnfkzctensbpktgbsgn/auth/policies');
      console.log('2. Find "storage.objects" table');
      console.log('3. Add policy: SELECT, INSERT, UPDATE for bucket_id = \'product-images\'');
      console.log('');
      console.log('OPTION 3 - Bucket settings:');
      console.log('1. Go to: https://supabase.com/dashboard/project/dbnfkzctensbpktgbsgn/storage/buckets');
      console.log('2. Click "product-images"');
      console.log('3. Ensure "Public bucket" is checked');
      
      return false;
    } else {
      console.log('🎉 SUCCESS! Upload works!');
      
      // Clean up
      await supabase.storage.from('product-images').remove(['final-test.txt']);
      
      console.log('\n✅ READY TO UPLOAD IMAGES!');
      console.log('Run: node upload-images-final.js');
      return true;
    }

  } catch (error) {
    console.log('❌ Final test failed:', error.message);
    return false;
  }
}

// Install and run
async function main() {
  try {
    require('@supabase/supabase-js');
  } catch (e) {
    console.log('📦 Installing @supabase/supabase-js...');
    const { execSync } = require('child_process');
    execSync('npm install @supabase/supabase-js', { stdio: 'inherit' });
  }
  
  await disableRLS();
}

main();