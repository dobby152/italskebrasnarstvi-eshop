const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dbnfkzctensbpktgbsgn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Nzk0NDgsImV4cCI6MjA3MTI1NTQ0OH0.vbtmSPS8ul57zeZ3W1LCZFAO0O6nyt475IY2_hGHKws';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createBucketIfNeeded() {
  console.log('🔧 ATTEMPTING TO CREATE/CONFIGURE BUCKET...\n');

  try {
    // Try to create the bucket
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('product-images', {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['image/jpeg', 'image/webp', 'image/png', 'image/jpg']
    });

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ Bucket already exists');
        
        // Try to update bucket to be public
        const { error: updateError } = await supabase.storage.updateBucket('product-images', {
          public: true,
          fileSizeLimit: 52428800,
          allowedMimeTypes: ['image/jpeg', 'image/webp', 'image/png', 'image/jpg']
        });
        
        if (updateError) {
          console.log('⚠️  Could not update bucket settings:', updateError.message);
        } else {
          console.log('✅ Bucket settings updated');
        }
      } else {
        console.log('❌ Bucket creation failed:', bucketError.message);
      }
    } else {
      console.log('✅ Bucket created successfully!');
    }

  } catch (error) {
    console.log('❌ Bucket operation error:', error.message);
  }

  // Try simple upload test
  console.log('\n🧪 Testing upload after bucket operations...');
  
  const testContent = 'bucket-test-' + Date.now();
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload('bucket-test.txt', new Blob([testContent]), { upsert: true });

  if (error) {
    console.log('❌ Test upload still failed:', error.message);
    
    if (error.message.includes('policy')) {
      console.log('\n🚨 RLS POLICY ISSUE DETECTED');
      console.log('📋 Manual fix required:');
      console.log('   1. Go to: https://supabase.com/dashboard/project/dbnfkzctensbpktgbsgn/storage/buckets');
      console.log('   2. Click "product-images" → Configuration → Set "Public bucket" = YES');
      console.log('   3. OR go to SQL Editor and run: ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;');
      console.log('\n⚡ PROCEEDING WITH UPLOAD ANYWAY (will show detailed errors)...\n');
    }
    return false;
  } else {
    console.log('✅ Upload test successful!');
    await supabase.storage.from('product-images').remove(['bucket-test.txt']);
    return true;
  }
}

async function uploadImagesWithBucketHandling() {
  console.log('🚀 COMPREHENSIVE IMAGE UPLOAD WITH BUCKET MANAGEMENT...\n');

  // Check dependencies
  try {
    require('sharp');
  } catch (e) {
    console.log('📦 Installing sharp...');
    const { execSync } = require('child_process');
    execSync('npm install sharp', { stdio: 'inherit' });
  }

  // Create/configure bucket
  const bucketReady = await createBucketIfNeeded();

  const imagesDir = 'public/images';
  
  if (!fs.existsSync(imagesDir)) {
    console.log('❌ Images directory not found at:', imagesDir);
    return;
  }

  const folders = fs.readdirSync(imagesDir).filter(item => {
    return fs.statSync(path.join(imagesDir, item)).isDirectory();
  });

  console.log(`📁 Found ${folders.length} image folders`);
  console.log(`${bucketReady ? '✅' : '⚠️ '} Bucket status: ${bucketReady ? 'Ready' : 'Has issues - will show detailed errors'}`);

  let totalProcessed = 0;
  let totalUploaded = 0;
  let totalErrors = 0;
  let policyErrors = 0;

  // Upload first 5 folders as test (remove limit for full upload)
  const testFolders = folders.slice(0, 5);
  console.log(`\n🧪 TESTING WITH FIRST ${testFolders.length} FOLDERS...\n`);

  for (let i = 0; i < testFolders.length; i++) {
    const folder = testFolders[i];
    const folderPath = path.join(imagesDir, folder);
    
    console.log(`📂 [${i + 1}/${testFolders.length}] Processing: ${folder}`);

    try {
      const images = fs.readdirSync(folderPath).filter(f => 
        f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg')
      );

      console.log(`   Found ${images.length} images`);

      for (const image of images.slice(0, 2)) { // Test with 2 images per folder
        const imagePath = path.join(folderPath, image);
        
        try {
          const webpBuffer = await sharp(imagePath)
            .webp({ quality: 80 })
            .toBuffer();

          const uploadPath = `${folder}/${image.replace(/\\.(jpg|jpeg)$/i, '.webp')}`;
          
          const { data, error } = await supabase.storage
            .from('product-images')
            .upload(uploadPath, webpBuffer, {
              contentType: 'image/webp',
              upsert: true
            });

          if (error) {
            console.log(`   ❌ ${image} - ${error.message}`);
            if (error.message.includes('policy')) policyErrors++;
            totalErrors++;
          } else {
            console.log(`   ✅ ${image} → WebP uploaded`);
            totalUploaded++;
          }

          totalProcessed++;

        } catch (error) {
          console.log(`   ❌ Error processing ${image}: ${error.message}`);
          totalErrors++;
        }
      }

    } catch (error) {
      console.log(`   ❌ Error reading folder ${folder}: ${error.message}`);
      totalErrors++;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n📊 TEST UPLOAD SUMMARY:');
  console.log(`   Processed: ${totalProcessed}`);
  console.log(`   Uploaded: ${totalUploaded}`);
  console.log(`   Errors: ${totalErrors}`);
  console.log(`   Policy errors: ${policyErrors}`);

  if (policyErrors > 0) {
    console.log('\n🚨 RLS POLICY ERRORS DETECTED!');
    console.log('📋 To fix, choose one option:');
    console.log('');
    console.log('OPTION 1 - Make bucket public:');
    console.log('  https://supabase.com/dashboard/project/dbnfkzctensbpktgbsgn/storage/buckets');
    console.log('  → product-images → Configuration → Public bucket = YES');
    console.log('');
    console.log('OPTION 2 - Disable RLS:');
    console.log('  https://supabase.com/dashboard/project/dbnfkzctensbpktgbsgn/editor');
    console.log('  → SQL: ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;');
    console.log('');
    console.log('After fixing, run full upload with: node upload-images-final.js');
  } else if (totalUploaded > 0) {
    console.log('\n🎉 UPLOAD WORKING! Ready for full batch.');
    console.log('🔗 Sample URL: ${SUPABASE_URL}/storage/v1/object/public/product-images/FOLDER/IMAGE.webp');
    console.log('Run full upload: node upload-images-final.js');
  }
}

uploadImagesWithBucketHandling().catch(console.error);