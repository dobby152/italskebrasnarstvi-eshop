// Test the image filtering logic
function filterImagesByColor(images, colorCode) {
  if (!images || images.length === 0) return [];
  
  const filteredImages = images.filter(imageUrl => {
    // Extract filename from URL
    const filename = imageUrl.split('/').pop() || '';
    
    // Look for color code pattern in filename like CA3214B3-N_ or CA3214B3-CU_
    const colorPattern = new RegExp(`-${colorCode.toUpperCase()}_`, 'i');
    const matches = colorPattern.test(filename);
    console.log(`Testing ${filename} with pattern -${colorCode.toUpperCase()}_ : ${matches}`);
    return matches;
  });
  
  // If no color-specific images found, return first few images as fallback
  if (filteredImages.length === 0 && images.length > 0) {
    console.log('No color-specific images found, using fallback');
    return images.slice(0, 3); // Return first 3 images as fallback
  }
  
  return filteredImages;
}

// Test with actual data
const testImages = [
  "https://dbnfkzctensbpktgbsgn.supabase.co/storage/v1/object/public/product-images/automatic-open-close-windproof-umbrella-om5285om5/1_OM5285OM5-BLU_1.webp",
  "https://dbnfkzctensbpktgbsgn.supabase.co/storage/v1/object/public/product-images/automatic-open-close-windproof-umbrella-om5285om5/2_OM5285OM5-BLU_1_2.webp",
  "https://dbnfkzctensbpktgbsgn.supabase.co/storage/v1/object/public/product-images/automatic-open-close-windproof-umbrella-om5285om5/8_OM5285OM5-N_1.webp",
  "https://dbnfkzctensbpktgbsgn.supabase.co/storage/v1/object/public/product-images/automatic-open-close-windproof-umbrella-om5285om5/9_OM5285OM5-N_1_2.webp"
];

console.log('=== Testing BLU variant ===');
const bluImages = filterImagesByColor(testImages, 'BLU');
console.log('BLU filtered images:', bluImages.length);

console.log('\n=== Testing N variant ===');
const nImages = filterImagesByColor(testImages, 'N');
console.log('N filtered images:', nImages.length);