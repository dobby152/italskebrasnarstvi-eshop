import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🚀 API Route: GET /api/products/[id] called')
  try {
    const { id } = await params
    console.log('📝 API Route: Received ID parameter:', id)
    
    // Check if id is numeric (actual ID) or string (slug)
    const isNumericId = /^\d+$/.test(id)
    
    if (isNumericId) {
      // Handle numeric ID - direct proxy to backend
      const url = `${API_BASE_URL}/api/products/${id}`
      
      console.log('🔗 API Route: Proxying product request by ID to:', url)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        console.error('❌ API Route: Backend response not ok:', response.status, response.statusText)
        return NextResponse.json(
          { error: 'Failed to fetch product from backend' },
          { status: response.status }
        )
      }
      
      const data = await response.json()
      console.log('✅ API Route: Successfully proxied product request by ID')
      
      return NextResponse.json(data)
    } else {
      // Handle slug - search for product by generated slug
      const productsUrl = `${API_BASE_URL}/api/products?limit=1000`
      
      console.log('🔗 API Route: Searching for product with slug:', id)
      
      const productsResponse = await fetch(productsUrl)
      
      if (!productsResponse.ok) {
        console.error('❌ API Route: Failed to fetch products:', productsResponse.status)
        return NextResponse.json(
          { error: 'Failed to fetch products from backend' },
          { status: productsResponse.status }
        )
      }
      
      const productsData = await productsResponse.json()
      const products = productsData.products || []
      
      // Generate slug from product name and find matching product
      const product = products.find((p: any) => {
        const generatedSlug = p.name
          .toLowerCase()
          .normalize('NFD') // Normalize unicode characters
          .replace(/[\u0300-\u036f]/g, '') // Remove diacritics (accents)
          .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
          .trim()
        
        // Create full slug with product ID
        const fullSlug = `${generatedSlug}-${p.id}`
        
        
        return fullSlug === id || generatedSlug === id
      })
      
      if (!product) {
        console.error('❌ API Route: Product not found for slug:', id)
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      
      console.log('✅ API Route: Found product for slug:', id, 'ID:', product.id)
      
      return NextResponse.json(product)
    }
  } catch (error) {
    console.error('❌ API Route: Error processing product request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}