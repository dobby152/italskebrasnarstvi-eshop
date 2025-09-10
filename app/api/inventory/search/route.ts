import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const store = searchParams.get('store') || 'all' // 'chodov', 'outlet', or 'all'
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const hasStock = searchParams.get('hasStock')
    const sortBy = searchParams.get('sortBy') || 'sku' // 'sku', 'price', 'stock', 'margin'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let results = []

    if (store === 'all') {
      // Search both stores
      const [chodovResults, outletResults] = await Promise.all([
        searchStore('inventory_chodov', 'CHODOV', query, { minPrice, maxPrice, hasStock }),
        searchStore('inventory_outlet', 'OUTLET', query, { minPrice, maxPrice, hasStock })
      ])
      results = [...chodovResults, ...outletResults]
    } else {
      const tableName = store === 'chodov' ? 'inventory_chodov' : 'inventory_outlet'
      results = await searchStore(tableName, store.toUpperCase(), query, { minPrice, maxPrice, hasStock })
    }

    // Sort results
    results = sortResults(results, sortBy, sortOrder)

    // Paginate
    const total = results.length
    const paginatedResults = results.slice(offset, offset + limit)

    return NextResponse.json({
      results: paginatedResults,
      total,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(total / limit),
      filters: {
        query,
        store,
        minPrice,
        maxPrice,
        hasStock,
        sortBy,
        sortOrder
      }
    })

  } catch (error) {
    console.error('Error in inventory search:', error)
    return NextResponse.json(
      { error: 'Failed to search inventory' },
      { status: 500 }
    )
  }
}

async function searchStore(tableName: string, storeName: string, query: string, filters: any) {
  let queryBuilder = supabase
    .from(tableName)
    .select('*')

  // Text search
  if (query) {
    queryBuilder = queryBuilder.ilike('sku', `%${query}%`)
  }

  // Price filters
  if (filters.minPrice) {
    queryBuilder = queryBuilder.gte('selling_price_incl_vat', parseFloat(filters.minPrice))
  }
  if (filters.maxPrice) {
    queryBuilder = queryBuilder.lte('selling_price_incl_vat', parseFloat(filters.maxPrice))
  }

  // Stock filter
  if (filters.hasStock === 'true') {
    queryBuilder = queryBuilder.gt('stock', 0)
  } else if (filters.hasStock === 'false') {
    queryBuilder = queryBuilder.eq('stock', 0)
  }

  const { data, error } = await queryBuilder

  if (error) throw error

  // Add store info and calculated fields
  return (data || []).map((item: any) => {
    const margin = item.selling_price_incl_vat && item.purchase_price_excl_vat
      ? ((item.selling_price_incl_vat - item.purchase_price_excl_vat) / item.selling_price_incl_vat) * 100
      : null

    return {
      ...item,
      store: storeName,
      margin_percentage: margin ? Math.round(margin * 100) / 100 : null,
      inventory_value: item.selling_price_incl_vat * (item.stock || 0),
      stock_status: getStockStatus(item.stock || 0)
    }
  })
}

function sortResults(results: any[], sortBy: string, sortOrder: string) {
  return results.sort((a, b) => {
    let valueA, valueB

    switch (sortBy) {
      case 'price':
        valueA = a.selling_price_incl_vat || 0
        valueB = b.selling_price_incl_vat || 0
        break
      case 'stock':
        valueA = a.stock || 0
        valueB = b.stock || 0
        break
      case 'margin':
        valueA = a.margin_percentage || 0
        valueB = b.margin_percentage || 0
        break
      case 'value':
        valueA = a.inventory_value || 0
        valueB = b.inventory_value || 0
        break
      default: // 'sku'
        valueA = a.sku || ''
        valueB = b.sku || ''
    }

    if (sortOrder === 'desc') {
      return valueA < valueB ? 1 : -1
    } else {
      return valueA > valueB ? 1 : -1
    }
  })
}

function getStockStatus(stock: number) {
  if (stock === 0) return 'out_of_stock'
  if (stock <= 2) return 'low_stock'
  if (stock <= 5) return 'medium_stock'
  return 'high_stock'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'bulk_update_stock':
        return await bulkUpdateStock(data)
      case 'bulk_update_prices':
        return await bulkUpdatePrices(data)
      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in inventory POST:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

async function bulkUpdateStock(updates: any[]) {
  const results = []

  for (const update of updates) {
    const { store, sku, stock } = update
    const tableName = store === 'CHODOV' ? 'inventory_chodov' : 'inventory_outlet'

    const { data, error } = await supabase
      .from(tableName)
      .update({ 
        stock,
        updated_at: new Date().toISOString()
      })
      .eq('sku', sku)
      .select()

    results.push({
      sku,
      store,
      success: !error,
      error: error?.message || null,
      data
    })
  }

  return NextResponse.json({
    message: 'Bulk stock update completed',
    results,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length
  })
}

async function bulkUpdatePrices(updates: any[]) {
  const results = []

  for (const update of updates) {
    const { store, sku, selling_price, purchase_price } = update
    const tableName = store === 'CHODOV' ? 'inventory_chodov' : 'inventory_outlet'

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (selling_price !== undefined) {
      updateData.selling_price_incl_vat = selling_price
    }
    if (purchase_price !== undefined) {
      updateData.purchase_price_excl_vat = purchase_price
    }

    const { data, error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('sku', sku)
      .select()

    results.push({
      sku,
      store,
      success: !error,
      error: error?.message || null,
      data
    })
  }

  return NextResponse.json({
    message: 'Bulk price update completed',
    results,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length
  })
}