import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get products with low stock from inventory
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select(`
        sku,
        chodov_stock,
        outlet_stock,
        products!inner(
          name,
          name_cz,
          description,
          description_cz
        )
      `)

    if (inventoryError) {
      console.error('Inventory error:', inventoryError)
      throw inventoryError
    }

    // Filter and format low stock products
    const lowStockProducts = inventory
      ?.filter(item => {
        const totalStock = (item.chodov_stock || 0) + (item.outlet_stock || 0)
        return totalStock < 10 // Consider less than 10 as low stock
      })
      .map(item => {
        const chodovStock = item.chodov_stock || 0
        const outletStock = item.outlet_stock || 0
        const totalStock = chodovStock + outletStock
        
        let location = 'Nedostupné'
        if (chodovStock > 0 && outletStock > 0) {
          location = 'Chodov & Outlet'
        } else if (chodovStock > 0) {
          location = 'Chodov'
        } else if (outletStock > 0) {
          location = 'Outlet'
        }

        return {
          sku: item.sku,
          name: (item.products as any)?.name_cz || (item.products as any)?.name || 'Neznámý produkt',
          currentStock: totalStock,
          chodovStock,
          outletStock,
          minStock: totalStock === 0 ? 5 : Math.max(5, totalStock + 3), // Dynamic min stock
          location,
          priority: totalStock === 0 ? 'critical' : totalStock < 3 ? 'high' : 'medium'
        }
      })
      .sort((a, b) => {
        // Sort by priority: critical -> high -> medium
        const priorityOrder = { critical: 3, high: 2, medium: 1 }
        return priorityOrder[b.priority as keyof typeof priorityOrder] - 
               priorityOrder[a.priority as keyof typeof priorityOrder]
      }) || []

    return NextResponse.json(lowStockProducts)

  } catch (error) {
    console.error('Error fetching low stock products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch low stock products' },
      { status: 500 }
    )
  }
}