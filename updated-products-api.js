// Updated products API route for Supabase storage
// Save as: app/api/products/route.ts

const SUPABASE_STORAGE_URL = 'https://dbnfkzctensbpktgbsgn.supabase.co/storage/v1/object/public/product-images';

// Helper function to get Supabase image URL
function getSupabaseImageUrl(imagePath) {
  if (!imagePath || typeof imagePath !== 'string') {
    return '/placeholder.svg';
  }
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // If it's already a direct path, return as is
  if (imagePath.startsWith('/images/') || imagePath.startsWith('/placeholder')) {
    return imagePath;
  }
  
  // Convert database folder-relative path to Supabase URL
  // Database: "folder-name/image.jpg" → Supabase: "folder-name/image.webp"
  if (imagePath.includes('/') && !imagePath.startsWith('/')) {
    const webpPath = imagePath.replace(/\.(jpg|jpeg)$/i, '.webp');
    return `${SUPABASE_STORAGE_URL}/${webpPath}`;
  }
  
  // If it's just a folder name, construct path to first image
  // Pattern: folder-name → folder-name/1_FOLDER_NAME_1.webp
  const folderName = imagePath;
  const imageFileName = `1_${folderName.toUpperCase().replace(/-/g, '_')}_1.webp`;
  return `${SUPABASE_STORAGE_URL}/${folderName}/${imageFileName}`;
}

// Updated transformation logic for products route:

/*
// Transform products with Supabase image processing
const transformedProducts = (products || []).map((product) => {
  let images = []
  
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    images = product.images.map((img) => getSupabaseImageUrl(img))
  } else if (product.image_url && product.image_url.trim() !== '') {
    images = [getSupabaseImageUrl(product.image_url)]
  }

  return {
    ...product,
    images,
    image_url: images[0] || '/placeholder.svg',
    brand: product.normalized_brand || null,
    collection: product.normalized_collection || null,
    hasVariants: false
  }
})
*/

console.log(`
📝 COPY THIS CODE TO YOUR API FILES:

1. Add the helper function to both:
   - app/api/products/route.ts
   - app/api/products/[id]/route.ts

2. Replace the image transformation logic

3. Update the constant with your actual Supabase URL

4. The API will now return Supabase storage URLs instead of local paths
`);

module.exports = { getSupabaseImageUrl };