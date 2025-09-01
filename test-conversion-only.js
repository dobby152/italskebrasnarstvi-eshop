const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function testConversionOnly() {
  console.log('🧪 TESTING IMAGE CONVERSION (NO UPLOAD)...\n');

  // Check dependencies
  try {
    require('sharp');
  } catch (e) {
    console.log('📦 Installing sharp...');
    const { execSync } = require('child_process');
    execSync('npm install sharp', { stdio: 'inherit' });
    console.log('✅ Sharp installed\n');
  }

  const imagesDir = 'public/images';
  
  if (!fs.existsSync(imagesDir)) {
    console.log('❌ Images directory not found');
    return;
  }

  // Get first few folders for testing
  const folders = fs.readdirSync(imagesDir).filter(item => {
    return fs.statSync(path.join(imagesDir, item)).isDirectory();
  }).slice(0, 3);

  console.log(`📁 Testing first ${folders.length} folders...\n`);

  let totalProcessed = 0;
  let totalOriginalSize = 0;
  let totalConvertedSize = 0;

  for (const folder of folders) {
    const folderPath = path.join(imagesDir, folder);
    
    console.log(`📂 Processing folder: ${folder}`);

    try {
      const images = fs.readdirSync(folderPath).filter(f => 
        f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg')
      ).slice(0, 2); // Just 2 images per folder

      console.log(`   Found ${images.length} images to test`);

      for (const image of images) {
        const imagePath = path.join(folderPath, image);
        const stats = fs.statSync(imagePath);
        const originalSize = stats.size;
        totalOriginalSize += originalSize;

        if (originalSize > 50 * 1024 * 1024) {
          console.log(`   ⚠️  Skipping ${image} - too large (${(originalSize / 1024 / 1024).toFixed(1)}MB)`);
          continue;
        }

        try {
          // Convert to WebP (in memory, no file write)
          const webpBuffer = await sharp(imagePath)
            .webp({ quality: 80 })
            .toBuffer();

          const webpSize = webpBuffer.length;
          totalConvertedSize += webpSize;
          const reduction = ((originalSize - webpSize) / originalSize * 100);

          console.log(`   ✅ ${image}: ${(originalSize / 1024).toFixed(1)}KB → ${(webpSize / 1024).toFixed(1)}KB (-${reduction.toFixed(1)}%)`);
          totalProcessed++;

        } catch (error) {
          console.log(`   ❌ Error processing ${image}: ${error.message}`);
        }
      }

    } catch (error) {
      console.log(`   ❌ Error reading folder ${folder}: ${error.message}`);
    }

    console.log('');
  }

  console.log('📊 CONVERSION TEST SUMMARY:');
  console.log(`   Images processed: ${totalProcessed}`);
  console.log(`   Original total size: ${(totalOriginalSize / 1024 / 1024).toFixed(1)} MB`);
  console.log(`   Converted total size: ${(totalConvertedSize / 1024 / 1024).toFixed(1)} MB`);
  
  if (totalOriginalSize > 0) {
    const overallReduction = ((totalOriginalSize - totalConvertedSize) / totalOriginalSize * 100);
    console.log(`   Overall reduction: -${overallReduction.toFixed(1)}%`);
    
    // Extrapolate to full 2.4GB
    const estimatedFinalSize = (2.4 * (totalConvertedSize / totalOriginalSize));
    console.log(`   Estimated final size for 2.4GB: ~${estimatedFinalSize.toFixed(1)} GB`);
  }
  
  console.log('\n✅ Conversion test complete - ready for actual upload!');
}

testConversionOnly().catch(console.error);