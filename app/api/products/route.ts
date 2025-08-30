import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString()
    const url = `${API_BASE_URL}/api/products${queryString ? `?${queryString}` : ''}`
    
    console.log('🔗 API Route: Proxying request to:', url)
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    })
    
    if (!response.ok) {
      console.error('❌ API Route: Backend response not ok:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'Failed to fetch products from backend' },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    console.log('✅ API Route: Successfully proxied products request')
    
    // Map products data to fix common issues
    if (data.products) {
      data.products = data.products.map((product: any) => ({
        ...product,
        image_url: product.image_url || '/placeholder.svg',
        images: product.images || ['/placeholder.svg'],
        name_cz: product.name_cz || product.name,
        description_cz: product.description_cz || product.description,
        collection: product.normalized_collection || product.collection,
        brand: product.normalized_brand || product.brand,
        features: product.features || [],
        colors: product.colors || [],
        tags: product.tags || []
      }))
      
      // Keep original total count from backend - don't modify it
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ API Route: Error proxying products request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}