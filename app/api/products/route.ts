import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import { extractBaseSku, extractVariantCode, getColorInfo } from '@/app/lib/smart-variants'
import { categorizeProduct, PRODUCT_CATEGORIES } from '@/app/lib/product-categories'

// Create SEO-friendly slug from product name and ID
function createSEOSlug(name: string, id: number): string {
  const slug = name
    .toLowerCase()
    .normalize('NFD') // Normalize unicode characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .trim()
  
  return `${slug}-${id}`
}

const SUPABASE_STORAGE_URL = 'https://dbnfkzctensbpktgbsgn.supabase.co/storage/v1/object/public/product-images'

function getSupabaseImageUrl(imagePath: string): string {
  if (!imagePath) return '/placeholder.svg'
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
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
    const sortBy = searchParams.get('sortBy') || 'availability'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    console.log('Query params:', { page, limit, sortBy, sortOrder });

    // Query products with inventory data joined
    console.log('Querying products with inventory...');
    const offset = (page - 1) * limit
    
    // Get all products first, then join with inventory manually
    const collectionFilter = searchParams.get('collection')
    
    let query = supabase
      .from('products')
      .select(`
        id, 
        name, 
        price, 
        image_url, 
        images, 
        description, 
        sku, 
        normalized_brand, 
        normalized_collection,
        collection_name,
        collection_code
      `, { count: 'exact' })
      .limit(Math.max(limit * 3, 100)) // Get enough records for deduplication, but not all
    
    // Add collection filter if provided
    if (collectionFilter) {
      query = query.eq('collection_code', collectionFilter)
    }
    
    // Add search filter if provided
    const searchFilter = searchParams.get('search')
    if (searchFilter) {
      query = query.or(`sku.ilike.%${searchFilter}%,name.ilike.%${searchFilter}%`)
    }

    // Add brand filter
    const brandFilter = searchParams.get('brand')
    if (brandFilter) {
      query = query.eq('normalized_brand', brandFilter)
    }

    // NOTE: Category filter will be applied after fetching products
    // since categories are based on product name keywords, not collection_code
    const categoriesFilter = searchParams.get('categories')

    // Add price filter
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    if (minPrice) {
      query = query.gte('price', parseInt(minPrice))
    }
    if (maxPrice) {
      query = query.lte('price', parseInt(maxPrice))
    }
    
    const { data: products, error: productsError, count } = await query
    
    if (productsError) {
      console.error('Products query error:', productsError)
      return NextResponse.json({ 
        error: 'Failed to fetch products',
        details: productsError 
      }, { status: 500 })
    }

    // Get all inventory data
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('inventory')
      .select('sku, outlet_stock, chodov_stock, total_stock')
    
    if (inventoryError) {
      console.error('Inventory query error:', inventoryError)
      // Continue without inventory data
    }

    // Create inventory lookup map with both SKU formats for compatibility
    const inventoryMap = new Map<string, any>()
    if (inventoryData) {
      inventoryData.forEach(inv => {
        // Store with original SKU (with /)
        inventoryMap.set(inv.sku, inv)
        // Also store with hyphen format for product matching
        const hyphenSku = inv.sku.replace(/\//g, '-')
        inventoryMap.set(hyphenSku, inv)
      })
    }

    if (!products) {
      return NextResponse.json({
        products: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalProducts: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      })
    }

    console.log(`Found ${products.length} products, processing with inventory...`);

    // Create a map of base SKUs to variants for generating color variants
    const baseSkuMap = new Map<string, any[]>()
    products.forEach(product => {
      const baseSku = extractBaseSku(product.sku)
      if (!baseSkuMap.has(baseSku)) {
        baseSkuMap.set(baseSku, [])
      }
      baseSkuMap.get(baseSku)!.push(product)
    })

    // Group products by base SKU to avoid duplicates
    const groupedProducts = new Map<string, any>()
    const processedProducts = products.map(product => {
      const inventory = inventoryMap.get(product.sku)
      const totalStock = inventory?.total_stock || 0
      const outletStock = inventory?.outlet_stock || 0
      const chodovStock = inventory?.chodov_stock || 0

      // Generate color variants for this product
      const baseSku = extractBaseSku(product.sku)
      const relatedProducts = baseSkuMap.get(baseSku) || []
      const colorVariants = relatedProducts.map(relatedProduct => {
        const variantCode = extractVariantCode(relatedProduct.sku)
        const colorInfo = getColorInfo(variantCode)
        
        return {
          colorName: colorInfo.name,
          hexColor: colorInfo.hex,
          colorCode: variantCode,
          sku: relatedProduct.sku
        }
      })

      // Use first image from images array if image_url is null
      const primaryImage = product.image_url || (product.images && product.images.length > 0 ? product.images[0] : null)
      
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        description: product.description,
        sku: product.sku,
        normalized_brand: product.normalized_brand,
        brand: product.normalized_brand || 'Piquadro',
        normalized_collection: product.normalized_collection,
        image_url: getSupabaseImageUrl(primaryImage),
        images: product.images ? product.images.map((img: string) => getSupabaseImageUrl(img)) : [],
        // Add SEO-friendly slug
        slug: createSEOSlug(product.name, product.id),
        // Collection information
        collection_name: product.collection_name,
        collection_code: product.collection_code,
        // Stock information
        totalStock,
        outletStock,
        chodovStock,
        available: totalStock > 0,
        // Color variants
        colorVariants: colorVariants.length > 1 ? colorVariants : [],
        // Sorting priority: available products first, then by stock level
        sortPriority: totalStock > 0 ? totalStock + 1000 : 0
      }
    })

    // Improved deduplication by base SKU with better variant handling
    const uniqueProducts: any[] = []
    const seenBaseSku = new Set<string>()
    
    processedProducts.forEach(product => {
      const baseSku = extractBaseSku(product.sku)
      
      if (!seenBaseSku.has(baseSku)) {
        seenBaseSku.add(baseSku)
        
        // Find all variants of this base SKU
        const allVariants = processedProducts.filter(p => extractBaseSku(p.sku) === baseSku)
        console.log(`Deduplicating ${baseSku}: found ${allVariants.length} variants`)
        
        // Calculate combined stats for all variants
        const totalStockAllVariants = allVariants.reduce((sum, variant) => sum + (variant.totalStock || 0), 0)
        const anyVariantAvailable = allVariants.some(variant => variant.available)
        
        // Choose the best representative variant (highest stock, then shortest/cleanest name)
        const bestVariant = allVariants.reduce((best, current) => {
          // Primary: prefer variants with stock
          if ((current.totalStock || 0) > (best.totalStock || 0)) return current
          if ((current.totalStock || 0) < (best.totalStock || 0)) return best
          
          // Secondary: prefer shorter, cleaner names (less likely to have color suffix)
          if (current.name.length < best.name.length) return current
          if (current.name.length > best.name.length) return best
          
          // Tertiary: prefer the first one alphabetically
          return current.name.localeCompare(best.name) < 0 ? current : best
        })
        
        // Create clean product name by removing color suffixes from name
        const cleanName = bestVariant.name
          .replace(/\s*-\s*[A-Z0-9]+\d*$/i, '') // Remove " - XX" suffix
          .replace(/\s*\([^)]*\)$/i, '') // Remove "(color)" suffix
          .trim()
        
        uniqueProducts.push({
          ...bestVariant,
          name: cleanName, // Use clean name without color suffix
          totalStock: totalStockAllVariants,
          available: anyVariantAvailable,
          sortPriority: anyVariantAvailable ? totalStockAllVariants + 1000 : 0,
          variantCount: allVariants.length, // Add count of available variants
          allVariantSkus: allVariants.map(v => v.sku) // Keep reference to all variants
        })
      }
    })

    // Filter products by categories if requested (using keyword-based categories)
    let filteredProducts = uniqueProducts
    if (categoriesFilter) {
      const requestedCategories = categoriesFilter.split(',')
      console.log('Filtering by categories:', requestedCategories)
      
      filteredProducts = filteredProducts.filter(product => {
        const detectedCategory = categorizeProduct(product.name)
        const matches = requestedCategories.includes(detectedCategory || '')
        if (matches) {
          console.log(`Product "${product.name}" matches category ${detectedCategory}`)
        }
        return matches
      })
      
      console.log(`After category filtering: ${filteredProducts.length} products`)
    }

    // Filter products by availability if requested
    const inStockOnly = searchParams.get('inStockOnly') === 'true'
    if (inStockOnly) {
      filteredProducts = filteredProducts.filter(p => p.available)
    }

    // Sort products by availability (available first, then by stock amount)
    let sortedProducts = [...filteredProducts]
    
    if (sortBy === 'availability') {
      // Always show available products first, regardless of sortOrder
      // Within each group (available/unavailable), sort by total stock
      sortedProducts.sort((a, b) => {
        // Primary sort: available products first
        if (a.available && !b.available) return -1
        if (!a.available && b.available) return 1
        
        // Secondary sort: within same availability, sort by stock level
        if (sortOrder === 'desc') {
          return b.totalStock - a.totalStock
        } else {
          return a.totalStock - b.totalStock
        }
      })
    } else {
      // For other sorting options, still prioritize availability but allow custom sorting
      const validSorts: Record<string, keyof typeof processedProducts[0]> = {
        'id': 'id',
        'name': 'name', 
        'price': 'price',
      }
      
      const actualSortBy = validSorts[sortBy] || 'id'
      
      sortedProducts.sort((a, b) => {
        // Always show available products first
        if (a.available && !b.available) return -1
        if (!a.available && b.available) return 1
        
        // Within same availability group, sort by the requested field
        const aVal = a[actualSortBy]
        const bVal = b[actualSortBy]
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
        }
        return 0
      })
    }

    // Apply pagination after sorting
    const startIndex = offset
    const endIndex = offset + limit
    const paginatedProducts = sortedProducts.slice(startIndex, endIndex)

    const totalProducts = sortedProducts.length
    const totalPages = Math.ceil(totalProducts / limit)

    console.log(`Returning ${paginatedProducts.length} products for page ${page}`);
    console.log(`Stock info - Available: ${sortedProducts.filter(p => p.available).length}, Out of stock: ${sortedProducts.filter(p => !p.available).length}`);

    return NextResponse.json({
      products: paginatedProducts,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    })

  } catch (error) {
    console.error('Error in products API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}