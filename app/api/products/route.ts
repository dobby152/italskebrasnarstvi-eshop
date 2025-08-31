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
      .select(`
        *,
        product_images (
          id,
          image_path,
          alt_text,
          display_order
        ),
        product_variants (
          id,
          sku,
          title,
          option1_name,
          option1_value,
          option2_name,
          option2_value,
          option3_name,
          option3_value,
          price,
          compare_at_price,
          inventory_quantity,
          weight,
          created_at,
          updated_at
        )
      `)

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`)
    }

    if (collection) {
      query = query.eq('collection', collection)
    }

    if (brand) {
      query = query.eq('brand', brand)
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
      if (product.product_images && product.product_images.length > 0) {
        images = product.product_images
          .sort((a: any, b: any) => (a.display_order || 999) - (b.display_order || 999))
          .map((img: any) => img.image_path.startsWith('/images/') ? img.image_path : `/images/${img.image_path}`)
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
        hasVariants: product.product_variants && product.product_variants.length > 1
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