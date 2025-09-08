import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get total products and stock levels from inventory
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select('*')

    if (inventoryError) {
      console.error('Inventory error:', inventoryError)
      throw inventoryError
    }

    // Get all products for additional stats
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('price, stock')

    if (productsError) {
      console.error('Products error:', productsError)
      throw productsError
    }

    // Calculate stats
    const totalProducts = inventory?.length || 0
    const totalValue = products?.reduce((sum, product) => {
      const stock = product.stock || 0
      const price = product.price || 0
      return sum + (stock * price)
    }, 0) || 0

    // Calculate location distribution
    const chodovStock = inventory?.reduce((sum, item) => sum + (item.chodov_stock || 0), 0) || 0
    const outletStock = inventory?.reduce((sum, item) => sum + (item.outlet_stock || 0), 0) || 0

    // Count low stock alerts (products with stock < 5)
    const lowStockAlerts = inventory?.filter(item => 
      (item.chodov_stock || 0) + (item.outlet_stock || 0) < 5
    ).length || 0

    // Calculate recent movements (mock for now - could be from stock_movements table)
    const recentMovements = Math.floor(Math.random() * 200) + 50

    return NextResponse.json({
      totalProducts,
      totalValue: Math.round(totalValue),
      lowStockAlerts,
      recentMovements,
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