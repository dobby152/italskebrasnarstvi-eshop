import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const authToken = request.headers.get('authorization')
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    const params = new URLSearchParams()
    if (status) params.append('status', status)
    if (search) params.append('search', search)
    if (limit) params.append('limit', limit)
    if (offset) params.append('offset', offset)
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user-experience/orders?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': authToken
      }
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to load orders' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Orders load error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}