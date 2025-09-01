import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

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
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    console.log('Query params:', { page, limit, sortBy, sortOrder });

    // Very basic query to test table access
    console.log('Testing table access...');
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, price, image_url, images, description, sku')
      .order('name', { ascending: true })
      .limit(limit)

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

    console.log(`Found ${products?.length || 0} products`);

    return NextResponse.json({
      products: transformedProducts || [],
      pagination: {
        total: products?.length || 0,
        page,
        limit,
        pages: 1
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