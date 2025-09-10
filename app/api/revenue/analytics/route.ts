import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') // 'today', 'week', 'month', 'year'
    const analysis = searchParams.get('analysis') // 'overview', 'trends', 'products'

    switch (analysis) {
      case 'overview':
        return await getRevenueOverview(period)
      case 'trends':
        return await getRevenueTrends(period)
      case 'products':
        return await getProductRevenue(period)
      default:
        return await getRevenueOverview(period)
    }

  } catch (error) {
    console.error('Error in revenue analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch revenue analytics' },
      { status: 500 }
    )
  }
}

async function getRevenueOverview(period: string | null) {
  let dateFilter = ''
  
  switch (period) {
    case 'today':
      dateFilter = "AND DATE(created_at) = CURRENT_DATE"
      break
    case 'week':
      dateFilter = "AND created_at >= CURRENT_DATE - INTERVAL '7 days'"
      break
    case 'month':
      dateFilter = "AND created_at >= CURRENT_DATE - INTERVAL '30 days'"
      break
    case 'year':
      dateFilter = "AND created_at >= CURRENT_DATE - INTERVAL '365 days'"
      break
    default:
      dateFilter = ''
  }

  // Get order data
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .not('total_amount', 'is', null)

  if (ordersError) {
    console.error('Orders error:', ordersError)
  }

  const orderData = orders || []

  // Calculate metrics
  const totalOrders = orderData.length
  const totalRevenue = orderData.reduce((sum, order) => sum + parseFloat(order.total_amount || '0'), 0)
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Get pending orders count
  const pendingOrders = orderData.filter(order => order.status === 'pending').length
  const completedOrders = orderData.filter(order => order.status === 'completed').length

  // Calculate conversion metrics (placeholder - would need visitor data)
  const conversionRate = 0 // Would calculate from visitor/order data

  // Calculate growth (placeholder - would need historical data)
  const revenueGrowth = 0

  return NextResponse.json({
    period: period || 'all',
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalOrders,
    avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    pendingOrders,
    completedOrders,
    conversionRate,
    revenueGrowth,
    ordersByStatus: {
      pending: pendingOrders,
      completed: completedOrders,
      processing: orderData.filter(order => order.status === 'processing').length,
      shipped: orderData.filter(order => order.status === 'shipped').length,
      cancelled: orderData.filter(order => order.status === 'cancelled').length
    }
  })
}

async function getRevenueTrends(period: string | null) {
  // Get orders with dates
  const { data: orders, error } = await supabase
    .from('orders')
    .select('total_amount, created_at, status')
    .not('total_amount', 'is', null)
    .order('created_at', { ascending: true })

  if (error) throw error

  // Group by date/period
  const trends = []
  const orderData = orders || []

  if (orderData.length === 0) {
    // Return empty trends for current month
    const currentDate = new Date()
    for (let i = 29; i >= 0; i--) {
      const date = new Date(currentDate)
      date.setDate(date.getDate() - i)
      trends.push({
        date: date.toISOString().split('T')[0],
        revenue: 0,
        orders: 0
      })
    }
  } else {
    // Process actual data
    const dailyData: { [key: string]: { revenue: number, orders: number } } = {}
    
    orderData.forEach(order => {
      const date = new Date(order.created_at).toISOString().split('T')[0]
      if (!dailyData[date]) {
        dailyData[date] = { revenue: 0, orders: 0 }
      }
      dailyData[date].revenue += parseFloat(order.total_amount)
      dailyData[date].orders += 1
    })

    // Convert to array
    Object.entries(dailyData).forEach(([date, data]) => {
      trends.push({
        date,
        revenue: Math.round(data.revenue * 100) / 100,
        orders: data.orders
      })
    })
  }

  return NextResponse.json({
    period: period || 'all',
    trends
  })
}

async function getProductRevenue(period: string | null) {
  // Get order items with product info
  const { data: orderItems, error } = await supabase
    .from('order_items')
    .select(`
      *,
      product:products(*),
      order:orders(created_at, status)
    `)

  if (error) throw error

  const itemData = orderItems || []

  // Group by product
  const productRevenue: { [key: string]: any } = {}

  itemData.forEach((item: any) => {
    const productId = item.product_id
    const productName = item.product?.name || 'Unknown Product'
    const productSku = item.product?.sku || 'Unknown SKU'
    
    if (!productRevenue[productId]) {
      productRevenue[productId] = {
        productId,
        productName,
        productSku,
        totalRevenue: 0,
        totalQuantity: 0,
        orderCount: 0
      }
    }
    
    productRevenue[productId].totalRevenue += parseFloat(item.price) * item.quantity
    productRevenue[productId].totalQuantity += item.quantity
    productRevenue[productId].orderCount += 1
  })

  // Convert to array and sort by revenue
  const topProducts = Object.values(productRevenue)
    .map((product: any) => ({
      ...product,
      totalRevenue: Math.round(product.totalRevenue * 100) / 100,
      avgOrderValue: Math.round((product.totalRevenue / product.orderCount) * 100) / 100
    }))
    .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
    .slice(0, 20)

  return NextResponse.json({
    period: period || 'all',
    topProducts,
    totalProducts: Object.keys(productRevenue).length
  })
}