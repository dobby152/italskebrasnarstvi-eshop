import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sku: string }> }
) {
  try {
    const { sku: rawSku } = await params
    const sku = decodeURIComponent(rawSku)
    
    // Direct database query to avoid circular dependency
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select('sku, outlet_stock, chodov_stock, total_stock, updated_at')
      .eq('sku', sku)
      .single()

    let locations = []
    let totalStock = 0

    if (inventory && !inventoryError) {
      // Add locations with stock
      if (inventory.chodov_stock > 0) {
        locations.push({
          name: 'Prodejna Chodov',
          stock: inventory.chodov_stock,
          available: inventory.chodov_stock
        })
      }

      if (inventory.outlet_stock > 0) {
        locations.push({
          name: 'Outlet Štěrboholy', 
          stock: inventory.outlet_stock,
          available: inventory.outlet_stock
        })
      }

      totalStock = inventory.total_stock || 0
    } else {
      // Fallback to products table
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('sku, availability')
        .eq('sku', sku)
        .single()

      if (product && !productError && product.availability > 0) {
        locations.push({
          name: 'Skladem',
          stock: product.availability,
          available: product.availability
        })
        totalStock = product.availability
      }
    }
    
    return NextResponse.json({
      sku,
      locations,
      totalStock,
      available: totalStock,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching stock:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    )
  }
}