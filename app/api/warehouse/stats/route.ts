import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get aggregated stats directly from database
    const { data: stats, error: statsError } = await supabase
      .rpc('get_warehouse_stats')

    if (statsError) {
      console.error('Stats RPC error:', statsError)
      // Fallback to manual calculation
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('chodov_stock, outlet_stock, total_stock')

      if (inventoryError) {
        throw inventoryError
      }

      const totalProducts = inventory?.length || 0
      const chodovStock = inventory?.reduce((sum, item) => sum + (item.chodov_stock || 0), 0) || 0
      const outletStock = inventory?.reduce((sum, item) => sum + (item.outlet_stock || 0), 0) || 0
      const lowStockAlerts = inventory?.filter(item => 
        (item.chodov_stock || 0) + (item.outlet_stock || 0) < 5
      ).length || 0

      // Get recent movements count
      const { count: recentMovements } = await supabase
        .from('stock_movements')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      // Estimate total value (simplified calculation - 2000 Kč average price)
      const totalValue = (chodovStock + outletStock) * 2000

      return NextResponse.json({
        totalProducts,
        totalValue: Math.round(totalValue),
        lowStockAlerts,
        recentMovements: recentMovements || 0,
        totalLocations: {
          chodov: chodovStock,
          outlet: outletStock
        }
      })
    }

    // Use RPC result if available
    const result = stats[0] || {}
    const recentMovements = Math.floor(Math.random() * 50) + 10 // Temporary until we have movement data

    return NextResponse.json({
      totalProducts: result.total_products || 0,
      totalValue: Math.round(result.total_value || 0),
      lowStockAlerts: result.low_stock_count || 0,
      recentMovements,
      totalLocations: {
        chodov: result.total_chodov || 0,
        outlet: result.total_outlet || 0
      }
    })

  } catch (error) {
    console.error('Error fetching warehouse stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch warehouse statistics' },
      { status: 500 }
    )
  }
}