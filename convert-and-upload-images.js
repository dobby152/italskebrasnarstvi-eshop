const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dbnfkzctensbpktgbsgn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Nzk0NDgsImV4cCI6MjA3MTI1NTQ0OH0.vbtmSPS8ul57zeZ3W1LCZFAO0O6nyt475IY2_hGHKws';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function convertAndUploadImages() {
  console.log('🚀 CONVERTING AND UPLOADING IMAGES TO SUPABASE...\n');

  // Check dependencies
  try {
    require('sharp');
    require('@supabase/supabase-js');
  } catch (e) {
    console.log('📦 Installing dependencies...');
    const { execSync } = require('child_process');
    execSync('npm install sharp @supabase/supabase-js', { stdio: 'inherit' });
    console.log('✅ Dependencies installed\n');
  }

  const imagesDir = 'public/images';
  const bucketName = 'product-images';
  
  if (!fs.existsSync(imagesDir)) {
    console.log('❌ Images directory not found');
    return;
  }

  // Check if bucket exists
  console.log('🔍 Checking bucket...');
  const { data: buckets } = await supabase.storage.listBuckets();
  const hasBucket = buckets?.some(b => b.name === bucketName);
  
  if (!hasBucket) {
    console.log('❌ Bucket "product-images" not found!');
    console.log('💡 Please create it first in Supabase dashboard');
    console.log('   Go to: https://supabase.com/dashboard/project/dbnfkzctensbpktgbsgn/storage/buckets');
    return;
  }
  console.log('✅ Bucket found');

  // Get all image folders
  const folders = fs.readdirSync(imagesDir).filter(item => {
    return fs.statSync(path.join(imagesDir, item)).isDirectory();
  });

  console.log(`📁 Found ${folders.length} image folders`);

  let totalProcessed = 0;
  let totalUploaded = 0;
  let totalErrors = 0;
  const maxFolders = 10; // Limit for testing - remove this for full upload

  console.log(`\n🎯 Processing first ${maxFolders} folders (for testing)...\n`);

  for (let i = 0; i < Math.min(folders.length, maxFolders); i++) {
    const folder = folders[i];
    const folderPath = path.join(imagesDir, folder);
    
    console.log(`📂 Processing folder ${i + 1}/${maxFolders}: ${folder}`);

    try {
      const images = fs.readdirSync(folderPath).filter(f => 
        f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg')
      );

      console.log(`   Found ${images.length} images`);

      for (const image of images.slice(0, 3)) { // Max 3 images per folder for testing
        const imagePath = path.join(folderPath, image);
        const stats = fs.statSync(imagePath);
        const originalSize = stats.size;

        if (originalSize > 50 * 1024 * 1024) { // Skip files > 50MB
          console.log(`   ⚠️  Skipping ${image} - too large (${(originalSize / 1024 / 1024).toFixed(1)}MB)`);
          continue;
        }

        try {
          // Convert to WebP
          const webpBuffer = await sharp(imagePath)
            .webp({ quality: 80 })
            .toBuffer();

          const webpSize = webpBuffer.length;
          const reduction = ((originalSize - webpSize) / originalSize * 100);

          // Upload to Supabase
          const uploadPath = `${folder}/${image.replace(/\.(jpg|jpeg)$/i, '.webp')}`;
          
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(uploadPath, webpBuffer, {
              contentType: 'image/webp',
              upsert: true
            });

          if (error) {
            console.log(`   ❌ Upload failed: ${image} - ${error.message}`);
            totalErrors++;
          } else {
            console.log(`   ✅ ${image} → WebP (-${reduction.toFixed(1)}%) - ${(webpSize / 1024).toFixed(1)}KB`);
            totalUploaded++;
          }

          totalProcessed++;

          // Add small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          console.log(`   ❌ Error processing ${image}: ${error.message}`);
          totalErrors++;
        }
      }

    } catch (error) {
      console.log(`   ❌ Error reading folder ${folder}: ${error.message}`);
      totalErrors++;
    }

    // Add delay between folders
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n📊 UPLOAD SUMMARY:');
  console.log(`   Total processed: ${totalProcessed}`);
  console.log(`   Successfully uploaded: ${totalUploaded}`);
  console.log(`   Errors: ${totalErrors}`);
  
  if (totalUploaded > 0) {
    console.log('\n🔗 Sample URL format:');
    console.log(`   ${SUPABASE_URL}/storage/v1/object/public/product-images/FOLDER/IMAGE.webp`);
    
    console.log('\n📝 NEXT STEPS:');
    console.log('1. Update API to use Supabase URLs');
    console.log('2. Remove maxFolders limit and run full upload');
    console.log('3. Deploy to Vercel');
  }
}

convertAndUploadImages().catch(console.error);