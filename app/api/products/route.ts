import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('API /products called');
    
    // First test Supabase connection
    try {
      const { data: testConnection } = await supabase.auth.getSession()
      console.log('Supabase connection test successful');
    } catch (connError) {
      console.error('Supabase connection failed:', connError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }
    
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
      .select('id, name, price, image_url, images, description, sku', { count: 'exact' })
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
          return `/images/${img}`
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
            images = [`/images/${imageUrl}`]
          }
        }
      }

      return {
        ...product,
        images,
        image_url: images[0] || null,
        hasVariants: false
      }
    })

    console.log(`Transformed ${transformedProducts?.length || 0} products with API image URLs`);

    return NextResponse.json({
      products: transformedProducts || [],
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