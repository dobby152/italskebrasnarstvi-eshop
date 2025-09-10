import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get pagination parameters
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('inventory')
      .select('*', { count: 'exact', head: true })
      .lt('total_stock', 10)

    // Direct query to inventory for low stock products with pagination
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select('sku, chodov_stock, outlet_stock, total_stock')
      .lt('total_stock', 10) // Products with less than 10 total stock
      .order('total_stock', { ascending: true })
      .range(offset, offset + limit - 1)

    if (inventoryError) {
      console.error('Inventory error:', inventoryError)
      throw inventoryError
    }

    // Format low stock products
    const lowStockProducts = inventory?.map(item => {
      const chodovStock = item.chodov_stock || 0
      const outletStock = item.outlet_stock || 0
      const totalStock = item.total_stock || 0

      let location = 'Žádná pobočka'
      if (chodovStock > 0 && outletStock === 0) {
        location = 'Pouze Chodov'
      } else if (chodovStock === 0 && outletStock > 0) {
        location = 'Pouze Outlet'
      } else if (chodovStock > 0 && outletStock > 0) {
        location = 'Obě pobočky'
      }

      return {
        sku: item.sku,
        name: `Produkt ${item.sku}`, // Simple name until we fix SKU relationship
        currentStock: totalStock,
        chodovStock,
        outletStock,
        minStock: 5, // Standard minimum stock
        location,
        priority: totalStock === 0 ? 'critical' : totalStock < 3 ? 'high' : 'medium'
      }
    }) || []

    const totalPages = Math.ceil((totalCount || 0) / limit)

    return NextResponse.json({
      products: lowStockProducts,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: totalCount || 0,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching low stock products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch low stock products' },
      { status: 500 }
    )
  }
}