import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('=== WAREHOUSE STATS API CALLED ===', new Date().toISOString())
    
    // Get count directly
    const { count: totalProducts } = await supabase
      .from('inventory')
      .select('*', { count: 'exact', head: true })

    // Get stock sums 
    const { data: stockData } = await supabase
      .rpc('get_inventory_totals')
      .single()

    // Fallback if RPC doesn't exist - calculate manually
    let chodovStock = 0, outletStock = 0, lowStockAlerts = 0
    
    if (!stockData) {
      const { data: inventory } = await supabase
        .from('inventory')
        .select('chodov_stock, outlet_stock, total_stock')

      if (inventory) {
        chodovStock = inventory.reduce((sum, item) => sum + (item.chodov_stock || 0), 0)
        outletStock = inventory.reduce((sum, item) => sum + (item.outlet_stock || 0), 0)
        lowStockAlerts = inventory.filter(item => (item.total_stock || 0) < 5).length
      }
    } else {
      chodovStock = stockData.chodov_total || 0
      outletStock = stockData.outlet_total || 0
      lowStockAlerts = stockData.low_stock_count || 0
    }

    const totalValue = (chodovStock + outletStock) * 2500
    const recentMovements = Math.floor(Math.random() * 20) + 5 // Temporary

    const result = {
      totalProducts: totalProducts || 0,
      totalValue: Math.round(totalValue),
      lowStockAlerts,
      recentMovements,
      totalLocations: {
        chodov: chodovStock,
        outlet: outletStock
      },
      _debug: {
        timestamp: new Date().toISOString(),
        rawChodov: chodovStock,
        rawOutlet: outletStock
      }
    }

    console.log('Returning warehouse stats:', result)
    return NextResponse.json(result)

  } catch (error) {
    console.error('Error fetching warehouse stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch warehouse statistics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}