import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function GET(
  request: NextRequest,
  { params }: { params: { baseSku: string } }
) {
  try {
    const { baseSku } = params
    const url = `${API_BASE_URL}/api/product-variants/${baseSku}`
    
    console.log('🔗 API Route: Proxying variants request to:', url)
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    })
    
    if (!response.ok) {
      console.error('❌ API Route: Backend variants response not ok:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'Failed to fetch variants from backend' },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    console.log('✅ API Route: Successfully proxied variants request')
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ API Route: Error proxying variants request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}