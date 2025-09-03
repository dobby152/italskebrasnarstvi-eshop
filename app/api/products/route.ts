import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

const SUPABASE_STORAGE_URL = 'https://dbnfkzctensbpktgbsgn.supabase.co/storage/v1/object/public/product-images'

function getSupabaseImageUrl(imagePath: string): string {
  if (!imagePath || typeof imagePath !== 'string') {
    return '/placeholder.svg'
  }
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath
  }
  
  // If it's already a direct path, return as is
  if (imagePath.startsWith('/images/') || imagePath.startsWith('/placeholder')) {
    return imagePath
  }
  
  // Convert database folder-relative path to Supabase URL with WebP
  // Database: "folder-name/image.jpg" → Supabase: "folder-name/image.webp"
  if (imagePath.includes('/') && !imagePath.startsWith('/')) {
    const webpPath = imagePath.replace(/\.(jpg|jpeg)$/i, '.webp')
    return `${SUPABASE_STORAGE_URL}/${webpPath}`
  }
  
  // If it's just a folder name, construct path to first image
  // Pattern: folder-name → folder-name/1_FOLDER_NAME_1.webp
  const folderName = imagePath
  const imageFileName = `1_${folderName.toUpperCase().replace(/-/g, '_')}_1.webp`
  return `${SUPABASE_STORAGE_URL}/${folderName}/${imageFileName}`
}

export async function GET(request: NextRequest) {
  try {
    console.log('API /products called');
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const sortBy = searchParams.get('sortBy') || 'id'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    console.log('Query params:', { page, limit, sortBy, sortOrder });

    // Map sortBy to valid column names
    const validSorts: Record<string, string> = {
      'id': 'id',
      'name': 'name', 
      'price': 'price',
      'created_at': 'created_at'
    }
    const actualSortBy = validSorts[sortBy] || 'id'

    console.log('Using sort column:', actualSortBy);
    
    // Query with pagination
    console.log('Querying with pagination...');
    const offset = (page - 1) * limit
    
    const { data: products, error, count } = await supabase
      .from('products')
      .select('id, name, price, image_url, images, description, sku, normalized_brand, normalized_collection', { count: 'exact' })
      .order(actualSortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json({ 
        error: error.message, 
        details: error.details,
        hint: error.hint,
        code: error.code 
      }, { status: 500 })
    }

    console.log(`Found ${products?.length || 0} products, processing images...`);

    // Transform products with image processing
    const transformedProducts = (products || []).map((product: any) => {
      let images = []
      
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        images = product.images.map((img: string) => {
          if (img.startsWith('http')) {
            return img
          }
          // Direct path to images - no processing needed
          if (img.startsWith('/images/')) {
            return img
          }
          
          // Supabase Storage integration
          return getSupabaseImageUrl(img)
        })
      } else if (product.image_url && product.image_url.trim() !== '') {
        let imageUrl = product.image_url
        
        if (imageUrl.startsWith('http')) {
          images = [imageUrl]
        } else {
          // Direct path to images - no processing needed
          if (imageUrl.startsWith('/images/')) {
            images = [imageUrl]
          } else {
            // Supabase Storage integration  
            images = [getSupabaseImageUrl(imageUrl)]
          }
        }
      }

      // If no images found, try to generate default image from product name/SKU
      if (images.length === 0 && product.sku) {
        // Try to generate image from SKU pattern
        const folderName = product.sku.toLowerCase().replace(/[^a-z0-9]/g, '-')
        const defaultImageUrl = getSupabaseImageUrl(folderName)
        if (defaultImageUrl !== '/placeholder.svg') {
          images = [defaultImageUrl]
        }
      }

      return {
        ...product,
        images,
        image_url: images[0] || '/placeholder.svg',
        brand: product.normalized_brand || null,
        collection: product.normalized_collection || null,
        tags: [],
        hasVariants: false,
        // Set availability based on stock (default to 'in_stock' if stock is null/undefined)
        availability: (product.stock !== null && product.stock !== undefined && product.stock <= 0) ? 'out_of_stock' : 'in_stock',
        // Ensure stock is a number
        stock: product.stock || 10
      }
    })

    console.log(`Transformed ${transformedProducts?.length || 0} products with API image URLs`);

    return NextResponse.json({
      products: transformedProducts || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('API Route Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      }, 
      { status: 500 }
    )
  }
}