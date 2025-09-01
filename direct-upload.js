const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dbnfkzctensbpktgbsgn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Nzk0NDgsImV4cCI6MjA3MTI1NTQ0OH0.vbtmSPS8ul57zeZ3W1LCZFAO0O6nyt475IY2_hGHKws';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function directUpload() {
  console.log('🚀 DIRECT UPLOAD - BYPASSING BUCKET CHECK...\n');

  // Check dependencies
  try {
    require('sharp');
  } catch (e) {
    console.log('📦 Installing sharp...');
    const { execSync } = require('child_process');
    execSync('npm install sharp', { stdio: 'inherit' });
  }

  const imagesDir = 'public/images';
  
  if (!fs.existsSync(imagesDir)) {
    console.log('❌ Images directory not found');
    return;
  }

  const folders = fs.readdirSync(imagesDir).filter(item => {
    return fs.statSync(path.join(imagesDir, item)).isDirectory();
  });

  console.log(`📁 Found ${folders.length} image folders - STARTING FULL UPLOAD!\n`);

  let totalProcessed = 0;
  let totalUploaded = 0;
  let totalErrors = 0;
  let totalOriginalSize = 0;
  let totalUploadedSize = 0;

  for (let i = 0; i < folders.length; i++) {
    const folder = folders[i];
    const folderPath = path.join(imagesDir, folder);
    
    console.log(`📂 [${i + 1}/${folders.length}] ${folder}`);

    try {
      const images = fs.readdirSync(folderPath).filter(f => 
        f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg')
      );

      for (const image of images) {
        const imagePath = path.join(folderPath, image);
        const stats = fs.statSync(imagePath);
        const originalSize = stats.size;
        totalOriginalSize += originalSize;

        if (originalSize > 50 * 1024 * 1024) {
          console.log(`   ⚠️  Skip ${image} - too large`);
          continue;
        }

        try {
          const webpBuffer = await sharp(imagePath)
            .webp({ quality: 80 })
            .toBuffer();

          const webpSize = webpBuffer.length;
          totalUploadedSize += webpSize;
          const reduction = ((originalSize - webpSize) / originalSize * 100);

          const uploadPath = `${folder}/${image.replace(/\.(jpg|jpeg)$/i, '.webp')}`;
          
          const { data, error } = await supabase.storage
            .from('product-images')
            .upload(uploadPath, webpBuffer, {
              contentType: 'image/webp',
              upsert: true
            });

          if (error) {
            console.log(`   ❌ ${image} - ${error.message}`);
            totalErrors++;
          } else {
            console.log(`   ✅ ${image} (-${reduction.toFixed(0)}%)`);
            totalUploaded++;
          }

          totalProcessed++;

          if (totalProcessed % 100 === 0) {
            const progress = ((i / folders.length) * 100).toFixed(1);
            console.log(`\n📊 PROGRESS: ${progress}% folders, ${totalUploaded} uploaded, ${totalErrors} errors\n`);
          }

          await new Promise(resolve => setTimeout(resolve, 50));

        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
          totalErrors++;
        }
      }

    } catch (error) {
      console.log(`   ❌ Folder error: ${error.message}`);
      totalErrors++;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n🎉 UPLOAD COMPLETE!');
  console.log(`📊 Processed: ${totalProcessed}, Uploaded: ${totalUploaded}, Errors: ${totalErrors}`);
  console.log(`💾 Original: ${(totalOriginalSize / 1024 / 1024 / 1024).toFixed(2)} GB`);
  console.log(`💾 Uploaded: ${(totalUploadedSize / 1024 / 1024 / 1024).toFixed(2)} GB`);
  
  if (totalOriginalSize > 0) {
    const reduction = ((totalOriginalSize - totalUploadedSize) / totalOriginalSize * 100);
    console.log(`📉 Reduction: ${reduction.toFixed(1)}%`);
  }
  
  if (totalUploaded > 0) {
    console.log('\n🔗 Sample URL:');
    console.log(`${SUPABASE_URL}/storage/v1/object/public/product-images/FOLDER/IMAGE.webp`);
    console.log('\n✅ Images are live at: https://italskebrasnarstvi-eshop-nu.vercel.app');
  }
}

directUpload().catch(console.error);