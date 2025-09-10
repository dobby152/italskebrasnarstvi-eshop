import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(request.url)
    const days = parseInt(url.searchParams.get('days') || '30')
    const location = url.searchParams.get('location')

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get stock movements for analysis
    let movementsQuery = supabase
      .from('stock_movements')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (location && ['chodov', 'outlet'].includes(location)) {
      movementsQuery = movementsQuery.eq('location', location)
    }

    const { data: movements, error: movementsError } = await movementsQuery

    if (movementsError) {
      console.error('Error fetching movements:', movementsError)
      throw movementsError
    }

    // Get current inventory - simplified without product joins
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select('sku, chodov_stock, outlet_stock, total_stock')

    if (inventoryError) {
      console.error('Error fetching inventory:', inventoryError)
      throw inventoryError
    }

    // Analyze product popularity
    const productActivity = new Map()
    
    movements?.forEach(movement => {
      const key = movement.sku
      if (!productActivity.has(key)) {
        productActivity.set(key, {
          sku: movement.sku,
          totalMovements: 0,
          inMovements: 0,
          outMovements: 0,
          totalQuantityIn: 0,
          totalQuantityOut: 0,
          lastActivity: movement.created_at
        })
      }

      const activity = productActivity.get(key)
      activity.totalMovements++
      
      if (movement.movement_type === 'in') {
        activity.inMovements++
        activity.totalQuantityIn += movement.quantity
      } else {
        activity.outMovements++
        activity.totalQuantityOut += movement.quantity
      }

      if (new Date(movement.created_at) > new Date(activity.lastActivity)) {
        activity.lastActivity = movement.created_at
      }
    })

    // Calculate popularity scores and trends - simplified version
    const productAnalytics = inventory?.map(item => {
      const activity = productActivity.get(item.sku) || {
        totalMovements: 0,
        inMovements: 0,
        outMovements: 0,
        totalQuantityIn: 0,
        totalQuantityOut: 0,
        lastActivity: null
      }

      const currentStock = item.total_stock || 0
      const turnoverRate = activity.totalQuantityOut / Math.max(currentStock, 1)
      
      // Popularity score based on activity and turnover
      const popularityScore = (
        activity.totalMovements * 0.3 +
        activity.outMovements * 0.4 +
        turnoverRate * 0.3
      )

      // Determine trend
      let trend: 'up' | 'down' | 'stable' = 'stable'
      if (activity.totalQuantityOut > activity.totalQuantityIn * 1.2) {
        trend = 'up' // High outflow suggests popularity
      } else if (activity.totalQuantityIn > activity.totalQuantityOut * 1.2) {
        trend = 'down' // High inflow, low outflow suggests declining popularity
      }

      // Stock status
      let stockStatus: 'critical' | 'low' | 'good' | 'excess' = 'good'
      if (currentStock === 0) {
        stockStatus = 'critical'
      } else if (currentStock < 5) {
        stockStatus = 'low'
      } else if (currentStock > activity.totalQuantityOut * 3) {
        stockStatus = 'excess'
      }

      return {
        sku: item.sku,
        name: `Produkt ${item.sku}`, // Simple name until we fix SKU relationship
        category: 'Kožené výrobky', // Default category
        currentStock,
        chodovStock: item.chodov_stock || 0,
        outletStock: item.outlet_stock || 0,
        price: 2500, // Estimated average price
        popularity: {
          score: Math.round(popularityScore * 100) / 100,
          rank: 0, // Will be calculated after sorting
          trend,
          category: popularityScore > 2 ? 'hot' : popularityScore > 1 ? 'popular' : popularityScore > 0.5 ? 'average' : 'slow'
        },
        activity: {
          totalMovements: activity.totalMovements,
          inMovements: activity.inMovements,
          outMovements: activity.outMovements,
          totalQuantityIn: activity.totalQuantityIn,
          totalQuantityOut: activity.totalQuantityOut,
          turnoverRate: Math.round(turnoverRate * 100) / 100,
          lastActivity: activity.lastActivity
        },
        stockStatus,
        recommendations: [] as string[]
      }
    }) || []

    // Sort by popularity and assign ranks
    productAnalytics.sort((a, b) => b.popularity.score - a.popularity.score)
    productAnalytics.forEach((item, index) => {
      item.popularity.rank = index + 1
    })

    // Generate recommendations
    productAnalytics.forEach(item => {
      const recommendations: string[] = []
      
      if (item.stockStatus === 'critical') {
        recommendations.push('Okamžitě doplnit zásoby - produkt není skladem')
      } else if (item.stockStatus === 'low' && item.popularity.trend === 'up') {
        recommendations.push('Doplnit zásoby - populární produkt s nízkým skladem')
      } else if (item.stockStatus === 'excess' && item.popularity.trend === 'down') {
        recommendations.push('Zvážit slevu nebo přesun - přebytečné zásoby')
      }
      
      if (item.popularity.category === 'hot') {
        recommendations.push('Populární produkt - zajistit dostatečné zásoby')
      } else if (item.popularity.category === 'slow' && item.currentStock > 10) {
        recommendations.push('Pomalý prodej - zvážit marketingovou podporu')
      }
      
      if (item.chodovStock > 0 && item.outletStock === 0 && item.popularity.score > 1) {
        recommendations.push('Zvážit převod části zásob na Outlet')
      } else if (item.outletStock > 0 && item.chodovStock === 0 && item.popularity.score > 1) {
        recommendations.push('Zvážit převod části zásob do Chodova')
      }
      
      item.recommendations = recommendations
    })

    // Calculate summary statistics
    const totalProducts = productAnalytics.length
    const hotProducts = productAnalytics.filter(p => p.popularity.category === 'hot').length
    const slowProducts = productAnalytics.filter(p => p.popularity.category === 'slow').length
    const criticalStock = productAnalytics.filter(p => p.stockStatus === 'critical').length
    const excessStock = productAnalytics.filter(p => p.stockStatus === 'excess').length
    
    const averagePopularity = totalProducts > 0 
      ? productAnalytics.reduce((sum, p) => sum + p.popularity.score, 0) / totalProducts 
      : 0

    const topCategories = productAnalytics
      .reduce((acc, item) => {
        const category = item.category
        if (!acc[category]) {
          acc[category] = { name: category, totalMovements: 0, products: 0 }
        }
        acc[category].totalMovements += item.activity.totalMovements
        acc[category].products++
        return acc
      }, {} as Record<string, { name: string; totalMovements: number; products: number }>)

    const categoryAnalytics = Object.values(topCategories)
      .sort((a, b) => b.totalMovements - a.totalMovements)
      .slice(0, 5)

    return NextResponse.json({
      success: true,
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        location
      },
      summary: {
        totalProducts,
        hotProducts,
        slowProducts,
        criticalStock,
        excessStock,
        averagePopularity: Math.round(averagePopularity * 100) / 100
      },
      topProducts: productAnalytics.slice(0, 20),
      categoryAnalytics,
      products: productAnalytics
    })

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}