import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('API /filters called')
    
    // Get all products to calculate filter counts
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        price,
        sku,
        normalized_brand,
        normalized_collection,
        collection_name,
        collection_code
      `)

    if (productsError) {
      console.error('Products query error:', productsError)
      return NextResponse.json({ 
        error: 'Failed to fetch products for filters',
        details: productsError 
      }, { status: 500 })
    }

    // Get inventory data for stock filtering
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('inventory')
      .select('sku, total_stock')
    
    if (inventoryError) {
      console.error('Inventory query error:', inventoryError)
    }

    // Create inventory lookup map
    const inventoryMap = new Map<string, number>()
    if (inventoryData) {
      inventoryData.forEach(inv => {
        inventoryMap.set(inv.sku, inv.total_stock || 0)
        // Also store with hyphen format for product matching
        const hyphenSku = inv.sku.replace(/\//g, '-')
        inventoryMap.set(hyphenSku, inv.total_stock || 0)
      })
    }

    if (!products) {
      return NextResponse.json({
        categories: [],
        brands: [],
        materials: [],
        sizes: [],
        priceRange: { min: 0, max: 10000 }
      })
    }

    // Calculate categories with counts
    const categoryMap = new Map<string, { name: string; count: number }>()
    const brandMap = new Map<string, { name: string; count: number }>()
    let minPrice = Number.POSITIVE_INFINITY
    let maxPrice = 0

    products.forEach(product => {
      // Categories/Collections
      if (product.collection_name && product.collection_code) {
        const key = product.collection_code
        if (categoryMap.has(key)) {
          categoryMap.get(key)!.count++
        } else {
          categoryMap.set(key, { name: product.collection_name, count: 1 })
        }
      }

      // Brands
      const brand = product.normalized_brand || 'Piquadro'
      if (brandMap.has(brand)) {
        brandMap.get(brand)!.count++
      } else {
        brandMap.set(brand, { name: brand, count: 1 })
      }

      // Price range
      if (product.price < minPrice) minPrice = product.price
      if (product.price > maxPrice) maxPrice = product.price
    })

    // Convert maps to arrays
    const categories = Array.from(categoryMap.entries()).map(([code, data]) => ({
      id: code,
      name: `${data.name} (${data.count})`,
      count: data.count
    }))

    const brands = Array.from(brandMap.entries()).map(([name, data]) => ({
      id: name,
      name: `${data.name} (${data.count})`,
      count: data.count
    }))

    // Mock data for materials and sizes (replace with real data later)
    const materials = [
      { id: 'kuze', name: 'Kůže (231)', count: 231 },
      { id: 'latka', name: 'Látka (1)', count: 1 },
      { id: 'kuze-latka', name: 'Kůže / Látka (16)', count: 16 }
    ]

    const sizes = [
      { id: 'male', name: 'Malé (56)', count: 56 },
      { id: 'stredni', name: 'Střední (137)', count: 137 },
      { id: 'velke', name: 'Velké (14)', count: 14 }
    ]

    // Calculate in-stock vs total products for availability filter
    let inStockCount = 0
    products.forEach(product => {
      const stock = inventoryMap.get(product.sku) || 0
      if (stock > 0) inStockCount++
    })

    console.log(`Returning filter options - Categories: ${categories.length}, Brands: ${brands.length}`)
    console.log(`Price range: ${minPrice} - ${maxPrice}, In stock: ${inStockCount}/${products.length}`)

    return NextResponse.json({
      categories,
      brands,
      materials,
      sizes,
      priceRange: { 
        min: Math.floor(minPrice), 
        max: Math.ceil(maxPrice) 
      },
      availability: {
        inStock: inStockCount,
        total: products.length
      }
    })

  } catch (error) {
    console.error('Error in filters API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}