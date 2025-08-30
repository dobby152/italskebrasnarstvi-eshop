import { NextRequest, NextResponse } from 'next/server'
import { GET_BY_SKU } from '../route'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ baseSku: string }> }
) {
  try {
    const { baseSku } = await params
    const result = await GET_BY_SKU(baseSku)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in variants/[baseSku] route:', error)
    return NextResponse.json(
      { error: 'Failed to fetch variant group', success: false },
      { status: 500 }
    )
  }
}