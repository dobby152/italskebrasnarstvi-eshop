import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '25')
    const search = url.searchParams.get('search') || ''
    const location = url.searchParams.get('location') || 'all'
    const stockFilter = url.searchParams.get('stockFilter') || 'all'
    const sortBy = url.searchParams.get('sortBy') || 'name'
    const sortOrder = url.searchParams.get('sortOrder') || 'asc'
    
    const offset = (page - 1) * limit

    // Build the query with LEFT JOIN to get product names (fallback if no match)
    let query = supabase
      .from('inventory')
      .select(`
        sku,
        outlet_stock,
        chodov_stock, 
        total_stock,
        updated_at,
        products(name)
      `, { count: 'exact' })

    // Apply search filter (mainly by SKU since products.name may be null)
    if (search) {
      query = query.ilike('sku', `%${search}%`)
    }

    // Apply location filter
    if (location && location !== 'all') {
      if (location === 'chodov') {
        query = query.gt('chodov_stock', 0)
      } else if (location === 'outlet') {
        query = query.gt('outlet_stock', 0)
      } else if (location === 'both') {
        query = query.gt('chodov_stock', 0).gt('outlet_stock', 0)
      }
    }

    // Apply stock filter
    if (stockFilter && stockFilter !== 'all') {
      if (stockFilter === 'low') {
        query = query.lt('total_stock', 10)
      } else if (stockFilter === 'critical') {
        query = query.lt('total_stock', 5)
      } else if (stockFilter === 'out') {
        query = query.eq('total_stock', 0)
      }
    }

    // Apply sorting
    const ascending = sortOrder === 'asc'
    if (sortBy === 'sku') {
      query = query.order('sku', { ascending })
    } else if (sortBy === 'stock') {
      query = query.order('total_stock', { ascending })
    } else {
      // Default sort by SKU if name sorting is requested (since JOIN may not work)
      query = query.order('sku', { ascending })
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: inventory, error, count } = await query

    if (error) {
      console.error('Error fetching inventory:', error)
      throw error
    }

    // Transform inventory data to match expected interface
    const products = (inventory || []).map((item: any) => {
      const currentStock = item.total_stock || 0
      const chodovStock = item.chodov_stock || 0
      const outletStock = item.outlet_stock || 0
      const minStock = 10 // Default minimum stock level since we don't have it in DB
      
      // Determine priority
      let priority: 'critical' | 'high' | 'medium' = 'medium'
      if (currentStock === 0) {
        priority = 'critical'
      } else if (currentStock <= minStock) {
        priority = 'high'
      }

      // Determine location
      let location = 'both'
      if (chodovStock > 0 && outletStock === 0) {
        location = 'chodov'
      } else if (outletStock > 0 && chodovStock === 0) {
        location = 'outlet'
      }

      return {
        sku: item.sku,
        name: item.products?.name || `Produkt ${item.sku}`,
        currentStock,
        chodovStock,
        outletStock,
        minStock,
        location,
        priority
      }
    })

    // Calculate pagination info
    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPreviousPage
      }
    })

  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { sku, chodov_stock, outlet_stock } = body

    if (!sku) {
      return NextResponse.json(
        { error: 'SKU is required' },
        { status: 400 }
      )
    }

    // Update inventory (total_stock is computed automatically)
    const { data, error } = await supabase
      .from('inventory')
      .update({
        chodov_stock,
        outlet_stock,
        updated_at: new Date().toISOString()
      })
      .eq('sku', sku)
      .select()
      .single()

    if (error) {
      console.error('Error updating inventory:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Inventory updated successfully',
      data
    })

  } catch (error) {
    console.error('Error updating inventory:', error)
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    )
  }
}