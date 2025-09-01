const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function testCompression() {
  const testFolder = 'public/images/automatic-open-close-windproof-umbrella-om5285om5';
  
  if (!fs.existsSync(testFolder)) {
    console.log('❌ Test folder not found');
    return;
  }
  
  const files = fs.readdirSync(testFolder).filter(f => f.endsWith('.jpg')).slice(0, 3);
  
  console.log('🖼️  KOMPRESNÍ TEST - Vliv na kvalitu\n');
  
  for (const file of files) {
    const inputPath = path.join(testFolder, file);
    const stats = fs.statSync(inputPath);
    const originalSize = stats.size;
    
    console.log(`📷 ${file}`);
    console.log(`   Původní velikost: ${(originalSize / 1024).toFixed(1)} KB`);
    
    try {
      // Test různých úrovní komprese
      const qualities = [90, 80, 70, 60, 50];
      
      for (const quality of qualities) {
        const outputPath = `temp_${quality}_${file}`;
        
        await sharp(inputPath)
          .jpeg({ quality })
          .toFile(outputPath);
          
        const compressedStats = fs.statSync(outputPath);
        const compressedSize = compressedStats.size;
        const reduction = ((originalSize - compressedSize) / originalSize * 100);
        
        console.log(`   Kvalita ${quality}%: ${(compressedSize / 1024).toFixed(1)} KB (-${reduction.toFixed(1)}%)`);
        
        // Clean up
        fs.unlinkSync(outputPath);
      }
      
      // WebP test
      const webpPath = `temp_webp_${file.replace('.jpg', '.webp')}`;
      await sharp(inputPath)
        .webp({ quality: 80 })
        .toFile(webpPath);
        
      const webpStats = fs.statSync(webpPath);
      const webpSize = webpStats.size;
      const webpReduction = ((originalSize - webpSize) / originalSize * 100);
      
      console.log(`   WebP 80%: ${(webpSize / 1024).toFixed(1)} KB (-${webpReduction.toFixed(1)}%)`);
      
      fs.unlinkSync(webpPath);
      
    } catch (error) {
      console.log(`   ❌ Error processing: ${error.message}`);
    }
    
    console.log('');
  }
}

// Install sharp if needed
try {
  require('sharp');
  testCompression().catch(console.error);
} catch (e) {
  console.log('Installing sharp...');
  const { execSync } = require('child_process');
  execSync('npm install sharp', { stdio: 'inherit' });
  console.log('Running compression test...');
  testCompression().catch(console.error);
}