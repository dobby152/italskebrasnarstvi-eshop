import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ baseSku: string }> }
) {
  try {
    const { baseSku } = await params
    
    // Proxy to the main variants endpoint with baseSku parameter
    const url = new URL('/api/variants', request.url)
    url.searchParams.set('baseSku', baseSku)
    
    const response = await fetch(url.toString())
    
    if (!response.ok) {
      throw new Error(`Failed to fetch variants: ${response.statusText}`)
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in variants/[baseSku] route:', error)
    return NextResponse.json(
      { error: 'Failed to fetch variant group', success: false },
      { status: 500 }
    )
  }
}