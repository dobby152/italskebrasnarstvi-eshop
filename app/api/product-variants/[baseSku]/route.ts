import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ baseSku: string }> }
) {
  try {
    const { baseSku } = await params
    
    // Return empty variant group since we don't have variant system implemented yet
    // This prevents 500 errors and allows product pages to load normally
    const variantGroup = {
      baseSku,
      variants: [],
      total: 0,
      success: true
    }
    
    return NextResponse.json(variantGroup)
  } catch (error) {
    console.error('Error in product-variants/[baseSku] route:', error)
    return NextResponse.json(
      { error: 'Failed to fetch variant group', success: false },
      { status: 500 }
    )
  }
}