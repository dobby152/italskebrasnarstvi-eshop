import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Fetch products with stock information from the main products table
    const { data: products, error } = await supabase
      .from('products')
      .select('id, sku, name, stock, price')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching stock levels:', error)
      return NextResponse.json({ 
        error: error.message,
        details: error.details,
        hint: error.hint 
      }, { status: 500 })
    }

    // Transform data to match expected format
    const stockLevels = products?.map((product: any) => ({
      sku: product.sku,
      product_name: product.name,
      variant_title: 'Default',
      location_name: 'Hlavní sklad',
      available_quantity: product.stock || 0,
      committed_quantity: 0,
      incoming_quantity: 0,
      sellable_quantity: product.stock || 0,
      cost_per_item: product.price || 0,
      is_low_stock: (product.stock || 0) < 10
    })) || []

    return NextResponse.json(stockLevels)

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