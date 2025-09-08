import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('=== WAREHOUSE DEBUG API ===')
    
    // Test direct SQL query
    const { data: rawData, error: rawError } = await supabase
      .from('inventory')
      .select('chodov_stock, outlet_stock, total_stock')
      .limit(5)

    console.log('Raw data sample:', rawData)
    console.log('Raw error:', rawError)

    // Get full stats
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select('chodov_stock, outlet_stock, total_stock')

    if (inventoryError) {
      console.error('Inventory error:', inventoryError)
      throw inventoryError
    }

    const totalProducts = inventory?.length || 0
    const chodovStock = inventory?.reduce((sum, item) => sum + (item.chodov_stock || 0), 0) || 0
    const outletStock = inventory?.reduce((sum, item) => sum + (item.outlet_stock || 0), 0) || 0
    const lowStockAlerts = inventory?.filter(item => (item.total_stock || 0) < 5).length || 0

    console.log('Calculated stats:', {
      totalProducts,
      chodovStock,
      outletStock,
      lowStockAlerts
    })

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        totalProducts,
        chodovStock,
        outletStock,
        lowStockAlerts,
        totalValue: (chodovStock + outletStock) * 2500
      },
      sampleData: rawData?.slice(0, 3)
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}