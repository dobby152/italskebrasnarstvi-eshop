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

    console.log('Building query with params:', { page, limit, sortBy, sortOrder });

    // Start with basic query first
    let query = supabase
      .from('products')
      .select('*')
      .limit(limit)

    // Apply sorting if column exists  
    if (['created_at', 'name', 'price'].includes(sortBy)) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    }

    console.log('Executing simple products query...');
    const { data: products, error } = await query

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