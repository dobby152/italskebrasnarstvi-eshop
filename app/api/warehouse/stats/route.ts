import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Direct query to inventory table - simple and reliable
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select('chodov_stock, outlet_stock, total_stock')

    if (inventoryError) {
      throw inventoryError
    }

    // Calculate stats directly from inventory data
    const totalProducts = inventory?.length || 0
    const chodovStock = inventory?.reduce((sum, item) => sum + (item.chodov_stock || 0), 0) || 0
    const outletStock = inventory?.reduce((sum, item) => sum + (item.outlet_stock || 0), 0) || 0
    const lowStockAlerts = inventory?.filter(item => 
      (item.total_stock || 0) < 5
    ).length || 0

    // Get recent movements count from stock_movements table
    const { count: recentMovements } = await supabase
      .from('stock_movements')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    // Calculate estimated total value (2500 Kč average per item)
    const totalValue = (chodovStock + outletStock) * 2500

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

  } catch (error) {
    console.error('Error fetching warehouse stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch warehouse statistics' },
      { status: 500 }
    )
  }
}