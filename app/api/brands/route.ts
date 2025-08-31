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

    // Get unique brands with explicit types
    const brandList = brands?.map((product: any) => product.brand).filter(Boolean) || []
    const uniqueBrands = [...new Set(brandList)]
      .map((name: unknown, index: number) => ({
        id: index + 1,
        name: name as string
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