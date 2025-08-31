import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { data: brands, error } = await supabase
      .from('products')
      .select('brand')
      .not('brand', 'is', null)
      .not('brand', 'eq', '')

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get unique brands
    const uniqueBrands = [...new Set(brands?.map((p: any) => p.brand).filter(Boolean))]
      .map((name: any, index: number) => ({
        id: index + 1,
        name: name
      }))

    return NextResponse.json({ brands: uniqueBrands })

  } catch (error) {
    console.error('API Route Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}