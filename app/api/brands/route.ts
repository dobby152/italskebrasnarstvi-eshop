import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function GET(request: NextRequest) {
  try {
    const url = `${API_BASE_URL}/api/brands`
    
    console.log('🔗 API Route: Proxying brands request to:', url)
    
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
        { error: 'Failed to fetch brands from backend' },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    console.log('✅ API Route: Successfully proxied brands request')
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ API Route: Error proxying brands request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}