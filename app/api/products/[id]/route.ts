import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import fs from 'fs'
import path from 'path'

const SUPABASE_STORAGE_URL = 'https://dbnfkzctensbpktgbsgn.supabase.co/storage/v1/object/public/product-images'

// Cache for inventory data
let inventoryCache: any = null
let cacheTime: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function getInventoryData(): any {
  const now = Date.now()
  
  if (inventoryCache && (now - cacheTime) < CACHE_DURATION) {
    return inventoryCache
  }
  
  try {
    const inventoryPath = path.join(process.cwd(), 'inventory-parsed.json')
    const inventoryContent = fs.readFileSync(inventoryPath, 'utf-8')
    inventoryCache = JSON.parse(inventoryContent)
    cacheTime = now
    return inventoryCache
  } catch (error) {
    console.error('Error loading inventory data:', error)
    return null
  }
}

function getStockForSku(sku: string): number {
  if (!sku) return 0
  
  const inventoryData = getInventoryData()
  if (!inventoryData) return 0
  
  let totalStock = 0
  
  // Sum stock from all locations
  Object.keys(inventoryData.inventory).forEach(location => {
    const items = inventoryData.inventory[location]
    items.forEach((item: any) => {
      if (item.productId === sku || 
          item.productId.includes(sku) || 
          sku.includes(item.productId)) {
        totalStock += item.stock
      }
    })
  })
  
  return totalStock
}

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
  if (imagePath.includes('/') && !imagePath.startsWith('/')) {
    const webpPath = imagePath.replace(/\.(jpg|jpeg)$/i, '.webp')
    return `${SUPABASE_STORAGE_URL}/${webpPath}`
  }
  
  // If it's just a folder name, construct path to first image
  const folderName = imagePath
  const imageFileName = `1_${folderName.toUpperCase().replace(/-/g, '_')}_1.webp`
  return `${SUPABASE_STORAGE_URL}/${folderName}/${imageFileName}`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Transform product with image processing (same logic as products route)
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

    const transformedProduct = {
      ...product,
      images,
      image_url: images[0] || null,
      brand: product.normalized_brand || null,
      collection: product.normalized_collection || null,
      hasVariants: false,
      // Get real stock from inventory data
      stock: getStockForSku(product.sku),
      // Set availability based on real stock
      availability: getStockForSku(product.sku) > 0 ? 'in_stock' : 'out_of_stock'
    }

    return NextResponse.json(transformedProduct)

  } catch (error) {
    console.error('API Route Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}