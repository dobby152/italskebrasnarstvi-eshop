import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ baseSku: string }> }
) {
  try {
    const { baseSku } = await params
    
    // For now, return empty variant group since we don't have variant data in our current database
    // This prevents the 500 error and allows the product page to load normally
    const variantGroup = {
      baseSku,
      variants: []
    }
    
    return NextResponse.json(variantGroup)
  } catch (error) {
    console.error('Error in variants/[baseSku] route:', error)
    return NextResponse.json(
      { error: 'Failed to fetch variant group', success: false },
      { status: 500 }
    )
  }
}