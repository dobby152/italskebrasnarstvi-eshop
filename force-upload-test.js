// Force upload test - bypass bucket listing check
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dbnfkzctensbpktgbsgn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Nzk0NDgsImV4cCI6MjA3MTI1NTQ0OH0.vbtmSPS8ul57zeZ3W1LCZFAO0O6nyt475IY2_hGHKws';

async function forceUploadTest() {
  console.log('🚀 FORCE UPLOAD TEST - BYPASSING BUCKET CHECK...\n');

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Create a simple test file
    const testContent = 'force-upload-test-' + Date.now();
    const testBlob = new Blob([testContent], { type: 'text/plain' });

    console.log('📤 Attempting forced upload...');
    
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload('force-test.txt', testBlob, {
        upsert: true
      });

    if (error) {
      console.log('❌ Upload failed:', error.message);
      
      if (error.message.includes('not found')) {
        console.log('💡 DIAGNOSIS: Bucket truly does not exist');
        console.log('   Please create bucket manually in dashboard');
      } else if (error.message.includes('policy')) {
        console.log('💡 DIAGNOSIS: Bucket exists but has RLS policy issues');
        console.log('   This means we can proceed with upload script');
        console.log('   The upload will fail but will provide detailed error info');
        console.log('   ✅ READY TO RUN: node upload-images-final.js');
      }
    } else {
      console.log('✅ SUCCESS! Upload worked!');
      console.log('📂 Data:', data);
      
      // Test public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl('force-test.txt');
        
      console.log('🔗 Public URL:', urlData.publicUrl);
      
      // Clean up
      await supabase.storage.from('product-images').remove(['force-test.txt']);
      
      console.log('🎉 BUCKET IS READY! Starting full upload...');
      return true;
    }

  } catch (error) {
    console.log('❌ Test error:', error.message);
  }
  
  return false;
}

forceUploadTest();