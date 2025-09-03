import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import { getVariantsForBaseSku, extractBaseSku } from '@/app/lib/smart-variants'

const SUPABASE_STORAGE_URL = 'https://dbnfkzctensbpktgbsgn.supabase.co/storage/v1/object/public/product-images'

function getSupabaseImageUrl(imagePath: string): string {
  if (!imagePath || typeof imagePath !== 'string') {
    return '/placeholder.svg'
  }
  
  console.log('🔧 variants getSupabaseImageUrl processing:', imagePath);
  
  if (imagePath.startsWith('http')) {
    console.log('✅ Already full URL:', imagePath);
    return imagePath
  }
  
  if (imagePath.startsWith('/images/') || imagePath.startsWith('/placeholder')) {
    console.log('✅ Already local path:', imagePath);
    return imagePath
  }
  
  // CRITICAL FIX: Handle raw filenames like "1_CA4818AP-GR_1.jpg"
  if (/^[0-9]+_[A-Z0-9-]+_[A-Z0-9-]+\.(jpg|jpeg|png|webp)$/i.test(imagePath)) {
    console.log('🚨 Raw filename detected, returning placeholder for:', imagePath);
    return '/placeholder.svg'
  }
  
  if (imagePath.includes('/') && !imagePath.startsWith('/')) {
    const webpPath = imagePath.replace(/\.(jpg|jpeg)$/i, '.webp')
    const finalUrl = `${SUPABASE_STORAGE_URL}/${webpPath}`;
    console.log('🔗 Folder path converted:', imagePath, '->', finalUrl);
    return finalUrl
  }
  
  const folderName = imagePath
  const imageFileName = `1_${folderName.toUpperCase().replace(/-/g, '_')}_1.webp`
  const finalUrl = `${SUPABASE_STORAGE_URL}/${folderName}/${imageFileName}`;
  console.log('📁 Folder name converted:', imagePath, '->', finalUrl);
  return finalUrl
}

// GET /api/variants - Smart variant detection with color-based image filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const baseSku = searchParams.get('baseSku')

    if (baseSku) {
      console.log(`🔍 Finding variants for base SKU: ${baseSku}`)
      
      // Fetch all products that could be variants
      const { data: allProducts, error } = await supabase
        .from('products')
        .select('*')
        .order('sku')

      if (error) {
        console.error('Error fetching products:', error)
        throw error
      }

      // Transform products with proper images
      const transformedProducts = allProducts.map((product: any) => {
        let images = []
        
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
          images = product.images.map((img: string) => {
            if (img.startsWith('http')) return img
            if (img.startsWith('/images/')) return img
            return getSupabaseImageUrl(img)
          })
        } else if (product.image_url && product.image_url.trim() !== '') {
          let imageUrl = product.image_url
          if (imageUrl.startsWith('http')) {
            images = [imageUrl]
          } else if (imageUrl.startsWith('/images/')) {
            images = [imageUrl]
          } else {
            images = [getSupabaseImageUrl(imageUrl)]
          }
        }

        return {
          ...product,
          images,
          brand: product.normalized_brand || null,
          collection: product.normalized_collection || null,
          availability: (product.stock !== null && product.stock !== undefined && product.stock <= 0) ? 'out_of_stock' : 'in_stock',
          stock: product.stock || 10
        }
      })

      // Use smart variant detection
      const variants = getVariantsForBaseSku(transformedProducts, baseSku)

      console.log(`✅ Found ${variants.length} variants for base SKU: ${baseSku}`)

      return NextResponse.json({
        baseSku,
        variants,
        total: variants.length,
        success: true
      })
    }

    // Return empty for other requests
    return NextResponse.json({
      baseProducts: [],
      success: true
    })

  } catch (error) {
    console.error('Error in variants API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch variants', success: false },
      { status: 500 }
    )
  }
}

