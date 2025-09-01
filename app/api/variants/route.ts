import { NextRequest, NextResponse } from 'next/server'

// GET /api/variants - Return empty variants for now since we don't have variant system implemented
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const baseProductId = searchParams.get('baseProductId')
    const baseSku = searchParams.get('baseSku')

    // For any request, return empty variants to prevent 500 errors
    if (baseProductId || baseSku) {
      return NextResponse.json({
        baseProduct: null,
        variants: [],
        success: true
      })
    }

    // Return empty base products list
    return NextResponse.json({
      baseProducts: [],
      success: true
    })

  } catch (error) {
    console.error('Error in variants API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch variants', success: false },
      { status: 500 }
    )
  }
}

