import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const store = searchParams.get('store') // 'chodov', 'outlet', or 'all'
    const analysis = searchParams.get('analysis') // 'overview', 'margins', 'stock', 'trends'

    let query
    let table

    switch (store) {
      case 'chodov':
        table = 'inventory_chodov'
        break
      case 'outlet':
        table = 'inventory_outlet'
        break
      default:
        // Combined analysis for both stores
        return await getCombinedAnalytics(analysis)
    }

    switch (analysis) {
      case 'overview':
        return await getStoreOverview(table)
      case 'margins':
        return await getMarginAnalysis(table)
      case 'stock':
        return await getStockAnalysis(table)
      case 'trends':
        return await getTrendAnalysis(table)
      default:
        return await getStoreOverview(table)
    }

  } catch (error) {
    console.error('Error in inventory analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory analytics' },
      { status: 500 }
    )
  }
}

async function getStoreOverview(table: string) {
  const { data, error } = await supabase.rpc('get_store_overview', { 
    table_name: table 
  })

  if (error) {
    // Fallback to direct query if RPC doesn't exist
    const { data: fallbackData, error: fallbackError } = await supabase
      .from(table)
      .select('*')
    
    if (fallbackError) throw fallbackError

    // Calculate overview metrics from raw data
    const totalProducts = fallbackData.length
    const totalStock = fallbackData.reduce((sum: number, item: any) => sum + (item.stock || 0), 0)
    const totalValue = fallbackData.reduce((sum: number, item: any) => 
      sum + ((item.selling_price_incl_vat || 0) * (item.stock || 0)), 0
    )
    const avgPrice = fallbackData.reduce((sum: number, item: any) => 
      sum + (item.selling_price_incl_vat || 0), 0
    ) / totalProducts

    return NextResponse.json({
      store: table.replace('inventory_', '').toUpperCase(),
      totalProducts,
      totalStock,
      totalValue: Math.round(totalValue * 100) / 100,
      avgPrice: Math.round(avgPrice * 100) / 100,
      inStock: fallbackData.filter((item: any) => (item.stock || 0) > 0).length,
      outOfStock: fallbackData.filter((item: any) => (item.stock || 0) === 0).length
    })
  }

  return NextResponse.json(data)
}

async function getMarginAnalysis(table: string) {
  const { data, error } = await supabase
    .from(table)
    .select('sku, selling_price_incl_vat, purchase_price_excl_vat, stock')
    .not('selling_price_incl_vat', 'is', null)
    .not('purchase_price_excl_vat', 'is', null)
    .gt('selling_price_incl_vat', 0)
    .gt('purchase_price_excl_vat', 0)

  if (error) throw error

  const margins = data.map((item: any) => {
    const sellingPrice = item.selling_price_incl_vat
    const purchasePrice = item.purchase_price_excl_vat
    const marginPercent = ((sellingPrice - purchasePrice) / sellingPrice) * 100
    const markupPercent = ((sellingPrice - purchasePrice) / purchasePrice) * 100
    
    return {
      sku: item.sku,
      sellingPrice,
      purchasePrice,
      marginPercent: Math.round(marginPercent * 100) / 100,
      markupPercent: Math.round(markupPercent * 100) / 100,
      stock: item.stock,
      totalValue: Math.round(sellingPrice * item.stock * 100) / 100
    }
  })

  const avgMargin = margins.reduce((sum, item) => sum + item.marginPercent, 0) / margins.length
  const avgMarkup = margins.reduce((sum, item) => sum + item.markupPercent, 0) / margins.length

  return NextResponse.json({
    store: table.replace('inventory_', '').toUpperCase(),
    averageMargin: Math.round(avgMargin * 100) / 100,
    averageMarkup: Math.round(avgMarkup * 100) / 100,
    totalProducts: margins.length,
    margins: margins.sort((a, b) => b.marginPercent - a.marginPercent).slice(0, 50) // Top 50
  })
}

async function getStockAnalysis(table: string) {
  const { data, error } = await supabase
    .from(table)
    .select('sku, selling_price_incl_vat, stock')
    .not('selling_price_incl_vat', 'is', null)

  if (error) throw error

  const stockAnalysis = {
    outOfStock: data.filter(item => item.stock === 0),
    lowStock: data.filter(item => item.stock > 0 && item.stock <= 2),
    mediumStock: data.filter(item => item.stock > 2 && item.stock <= 5),
    highStock: data.filter(item => item.stock > 5)
  }

  const totalValue = data.reduce((sum, item) => 
    sum + (item.selling_price_incl_vat * item.stock), 0
  )

  return NextResponse.json({
    store: table.replace('inventory_', '').toUpperCase(),
    summary: {
      outOfStock: stockAnalysis.outOfStock.length,
      lowStock: stockAnalysis.lowStock.length,
      mediumStock: stockAnalysis.mediumStock.length,
      highStock: stockAnalysis.highStock.length,
      totalInventoryValue: Math.round(totalValue * 100) / 100
    },
    details: {
      outOfStock: stockAnalysis.outOfStock.slice(0, 20),
      lowStock: stockAnalysis.lowStock.slice(0, 20)
    }
  })
}

async function getTrendAnalysis(table: string) {
  // For now, return basic analysis since we don't have historical data
  const { data, error } = await supabase
    .from(table)
    .select('sku, selling_price_incl_vat, purchase_price_excl_vat, stock, created_at')
    .not('selling_price_incl_vat', 'is', null)
    .order('selling_price_incl_vat', { ascending: false })

  if (error) throw error

  // Group products by price ranges
  const priceRanges = {
    'under_1000': data.filter(item => item.selling_price_incl_vat < 1000),
    '1000_to_3000': data.filter(item => item.selling_price_incl_vat >= 1000 && item.selling_price_incl_vat < 3000),
    '3000_to_5000': data.filter(item => item.selling_price_incl_vat >= 3000 && item.selling_price_incl_vat < 5000),
    'over_5000': data.filter(item => item.selling_price_incl_vat >= 5000)
  }

  return NextResponse.json({
    store: table.replace('inventory_', '').toUpperCase(),
    priceDistribution: {
      'Pod 1000 Kč': priceRanges.under_1000.length,
      '1000-3000 Kč': priceRanges['1000_to_3000'].length,
      '3000-5000 Kč': priceRanges['3000_to_5000'].length,
      'Nad 5000 Kč': priceRanges.over_5000.length
    },
    topProducts: data.slice(0, 10),
    recentlyAdded: data.slice(-10).reverse()
  })
}

async function getCombinedAnalytics(analysis: string | null) {
  const [chodovData, outletData] = await Promise.all([
    supabase.from('inventory_chodov').select('*').not('selling_price_incl_vat', 'is', null),
    supabase.from('inventory_outlet').select('*').not('selling_price_incl_vat', 'is', null)
  ])

  if (chodovData.error || outletData.error) {
    throw new Error('Failed to fetch combined data')
  }

  const chodov = chodovData.data || []
  const outlet = outletData.data || []

  const combinedStats = {
    chodov: {
      totalProducts: chodov.length,
      totalStock: chodov.reduce((sum, item) => sum + (item.stock || 0), 0),
      totalValue: chodov.reduce((sum, item) => sum + ((item.selling_price_incl_vat || 0) * (item.stock || 0)), 0)
    },
    outlet: {
      totalProducts: outlet.length,
      totalStock: outlet.reduce((sum, item) => sum + (item.stock || 0), 0),
      totalValue: outlet.reduce((sum, item) => sum + ((item.selling_price_incl_vat || 0) * (item.stock || 0)), 0)
    }
  }

  return NextResponse.json({
    stores: ['CHODOV', 'OUTLET'],
    comparison: combinedStats,
    totalValue: combinedStats.chodov.totalValue + combinedStats.outlet.totalValue,
    totalProducts: combinedStats.chodov.totalProducts + combinedStats.outlet.totalProducts,
    totalStock: combinedStats.chodov.totalStock + combinedStats.outlet.totalStock
  })
}