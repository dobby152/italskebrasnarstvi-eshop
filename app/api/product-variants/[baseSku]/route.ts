import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ baseSku: string }> }
) {
  try {
    const { baseSku } = await params
    
    // Redirect to main variants API
    const url = new URL('/api/variants', request.url)
    url.searchParams.set('baseSku', baseSku)
    
    const response = await fetch(url.toString(), {
      headers: request.headers
    })
    
    if (!response.ok) {
      throw new Error(`Variants API error: ${response.statusText}`)
    }
    
    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Error in product-variants/[baseSku] route:', error)
    return NextResponse.json(
      { 
        baseSku: (await params).baseSku,
        variants: [],
        total: 0,
        success: false,
        error: 'Failed to fetch variant group'
      },
      { status: 500 }
    )
  }
}