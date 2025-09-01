import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('API /products called');
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const collection = searchParams.get('collection') || ''
    const brand = searchParams.get('brand') || ''
    const sortBy = searchParams.get('sortBy') || 'id'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const priceMin = searchParams.get('priceMin')
    const priceMax = searchParams.get('priceMax')
    const inStock = searchParams.get('inStock')
    const tags = searchParams.get('tags')

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`)
    }

    if (collection) {
      const collectionId = parseInt(collection)
      if (!isNaN(collectionId)) {
        query = query.eq('collection_id', collectionId)
      }
    }

    if (brand) {
      const brandId = parseInt(brand)
      if (!isNaN(brandId)) {
        query = query.eq('brand_id', brandId)
      }
    }

    if (priceMin && !isNaN(parseFloat(priceMin))) {
      query = query.gte('price', parseFloat(priceMin))
    }

    if (priceMax && !isNaN(parseFloat(priceMax))) {
      query = query.lte('price', parseFloat(priceMax))
    }

    if (inStock === 'true') {
      query = query.gt('inventory_quantity', 0)
    }

    if (tags) {
      query = query.contains('tags', [tags])
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: products, error, count } = await query

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json({ 
        error: error.message, 
        details: error.details,
        hint: error.hint,
        code: error.code 
      }, { status: 500 })
    }

    // Transform products with image processing
    const transformedProducts = (products || []).map((product: any) => {
      let images = []
      
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        images = product.images.map((img: string) => {
          if (img.startsWith('http')) {
            return img
          }
          let cleanPath = img
          if (cleanPath.startsWith('/images/')) {
            cleanPath = cleanPath.substring(8)
          } else if (cleanPath.startsWith('images/')) {
            cleanPath = cleanPath.substring(7)
          }
          return `/api/images/${cleanPath}`
        })
      } else if (product.image_url && product.image_url.trim() !== '') {
        let imageUrl = product.image_url
        
        if (imageUrl.startsWith('http')) {
          images = [imageUrl]
        } else {
          let cleanPath = imageUrl
          if (cleanPath.startsWith('/images/')) {
            cleanPath = cleanPath.substring(8)
          } else if (cleanPath.startsWith('images/')) {
            cleanPath = cleanPath.substring(7)
          }
          images = [`/api/images/${cleanPath}`]
        }
      }

      return {
        ...product,
        images,
        image_url: images[0] || null,
        hasVariants: false
      }
    })

    return NextResponse.json({
      products: transformedProducts,
      pagination: {
        total: count || 0,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit)
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