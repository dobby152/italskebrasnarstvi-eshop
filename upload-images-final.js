const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dbnfkzctensbpktgbsgn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Nzk0NDgsImV4cCI6MjA3MTI1NTQ0OH0.vbtmSPS8ul57zeZ3W1LCZFAO0O6nyt475IY2_hGHKws';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function uploadImagesFinal() {
  console.log('🚀 FINAL IMAGE UPLOAD TO SUPABASE...\n');

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
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  
  if (bucketsError) {
    console.log('❌ Error checking buckets:', bucketsError.message);
    return;
  }
  
  const hasBucket = buckets?.some(b => b.name === bucketName);
  
  if (!hasBucket) {
    console.log('❌ Bucket "product-images" not found!');
    console.log('💡 Please create it first:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/dbnfkzctensbpktgbsgn/storage/buckets');
    console.log('   2. Click "New bucket"');
    console.log('   3. Name: product-images');
    console.log('   4. Public: YES');
    console.log('   5. Size limit: 50MB');
    console.log('   6. MIME types: image/jpeg, image/webp, image/png');
    return;
  }
  
  console.log('✅ Bucket found! Starting upload...\n');

  // Get all image folders
  const folders = fs.readdirSync(imagesDir).filter(item => {
    return fs.statSync(path.join(imagesDir, item)).isDirectory();
  });

  console.log(`📁 Found ${folders.length} image folders`);

  let totalProcessed = 0;
  let totalUploaded = 0;
  let totalErrors = 0;
  let totalOriginalSize = 0;
  let totalUploadedSize = 0;

  // FULL UPLOAD - no limits!
  for (let i = 0; i < folders.length; i++) {
    const folder = folders[i];
    const folderPath = path.join(imagesDir, folder);
    
    console.log(`📂 [${i + 1}/${folders.length}] Processing: ${folder}`);

    try {
      const images = fs.readdirSync(folderPath).filter(f => 
        f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg')
      );

      console.log(`   Found ${images.length} images`);

      for (const image of images) {
        const imagePath = path.join(folderPath, image);
        const stats = fs.statSync(imagePath);
        const originalSize = stats.size;
        totalOriginalSize += originalSize;

        if (originalSize > 50 * 1024 * 1024) { // Skip files > 50MB
          console.log(`   ⚠️  Skipping ${image} - too large (${(originalSize / 1024 / 1024).toFixed(1)}MB)`);
          continue;
        }

        try {
          // Convert to WebP with 80% quality
          const webpBuffer = await sharp(imagePath)
            .webp({ quality: 80 })
            .toBuffer();

          const webpSize = webpBuffer.length;
          totalUploadedSize += webpSize;
          const reduction = ((originalSize - webpSize) / originalSize * 100);

          // Upload to Supabase
          const uploadPath = `${folder}/${image.replace(/\.(jpg|jpeg)$/i, '.webp')}`;
          
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(uploadPath, webpBuffer, {
              contentType: 'image/webp',
              upsert: true // Overwrite if exists
            });

          if (error) {
            console.log(`   ❌ ${image} - ${error.message}`);
            totalErrors++;
          } else {
            console.log(`   ✅ ${image} → WebP (-${reduction.toFixed(1)}%)`);
            totalUploaded++;
          }

          totalProcessed++;

          // Progress report every 50 images
          if (totalProcessed % 50 === 0) {
            const progress = ((i / folders.length) * 100).toFixed(1);
            console.log(`\n📊 PROGRESS: ${progress}% folders, ${totalUploaded} uploaded, ${totalErrors} errors\n`);
          }

          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 50));

        } catch (error) {
          console.log(`   ❌ Error processing ${image}: ${error.message}`);
          totalErrors++;
        }
      }

    } catch (error) {
      console.log(`   ❌ Error reading folder ${folder}: ${error.message}`);
      totalErrors++;
    }

    // Delay between folders
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n🎉 UPLOAD COMPLETE!');
  console.log('📊 FINAL SUMMARY:');
  console.log(`   Total images processed: ${totalProcessed}`);
  console.log(`   Successfully uploaded: ${totalUploaded}`);
  console.log(`   Errors: ${totalErrors}`);
  console.log(`   Original size: ${(totalOriginalSize / 1024 / 1024 / 1024).toFixed(2)} GB`);
  console.log(`   Uploaded size: ${(totalUploadedSize / 1024 / 1024 / 1024).toFixed(2)} GB`);
  
  if (totalOriginalSize > 0) {
    const overallReduction = ((totalOriginalSize - totalUploadedSize) / totalOriginalSize * 100);
    console.log(`   Overall reduction: -${overallReduction.toFixed(1)}%`);
  }
  
  if (totalUploaded > 0) {
    console.log('\n🔗 Sample URLs:');
    console.log(`   ${SUPABASE_URL}/storage/v1/object/public/product-images/FOLDER/IMAGE.webp`);
    
    console.log('\n✅ IMAGES ARE LIVE! Check your website:');
    console.log('   https://italskebrasnarstvi-eshop-nu.vercel.app');
  }
}

uploadImagesFinal().catch(console.error);