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
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const priceMin = searchParams.get('priceMin')
    const priceMax = searchParams.get('priceMax')
    const inStock = searchParams.get('inStock')
    const tags = searchParams.get('tags')
    
    console.log('Supabase client:', !!supabase);

    let query = supabase
      .from('products')
      .select('*')

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

    if (priceMin) {
      query = query.gte('price', parseFloat(priceMin))
    }

    if (priceMax) {
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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform products with image processing
    const transformedProducts = products?.map((product: any) => {
      // Process images
      let images = []
      
      // Use images array if available
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        images = product.images?.map((img: string) => {
          if (img.startsWith('/images/') || img.startsWith('http')) {
            return img
          }
          return `/images/${img}`
        })
      } else if (product.image_url && product.image_url.trim() !== '') {
        let imageUrl = product.image_url
        if (!imageUrl.startsWith('/images/') && !imageUrl.startsWith('http')) {
          imageUrl = `/images/${imageUrl}`
        }
        images = [imageUrl]
      }

      return {
        ...product,
        images,
        image_url: images[0] || null,
        hasVariants: false // No variants table exists
      }
    }) || []

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      products: transformedProducts,
      pagination: {
        total: totalCount || 0,
        page,
        limit,
        pages: Math.ceil((totalCount || 0) / limit)
      }
    })

  } catch (error) {
    console.error('API Route Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}