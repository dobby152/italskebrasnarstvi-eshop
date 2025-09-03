import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // For now, return static locations since we don't have a locations table
    const locations = [
      {
        id: 1,
        name: 'Hlavní sklad',
        code: 'MAIN',
        city: 'Praha',
        country: 'Česká republika',
        location_type: 'warehouse',
        is_active: true,
        fulfills_online_orders: true
      },
      {
        id: 2,
        name: 'Prodejna Praha',
        code: 'SHOP_PRG',
        city: 'Praha',
        country: 'Česká republika',
        location_type: 'store',
        is_active: true,
        fulfills_online_orders: false
      }
    ]

    return NextResponse.json(locations)

  } catch (error) {
    console.error('API Route Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}