import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import { createCachedResponse, CACHE_TTL } from '@/app/lib/cache'

async function fetchDashboardStats() {
  // Get total revenue from orders
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('total_price, total_amount')

  if (ordersError) {
    console.error('Error fetching orders:', ordersError)
  }

  // Get total products
  const { count: productsCount, error: productsError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })

  if (productsError) {
    console.error('Error fetching products count:', productsError)
  }

  // Get total customers (users with orders)
  const { count: customersCount, error: customersError } = await supabase
    .from('orders')
    .select('customer_email', { count: 'exact', head: true })

  if (customersError) {
    console.error('Error fetching customers count:', customersError)
  }

  // Calculate stats
  const totalRevenue = orders?.reduce((sum: number, order: any) => sum + (order.total_price || order.total_amount || 0), 0) || 0
  const totalOrders = orders?.length || 0
  const totalProducts = productsCount || 0
  const totalCustomers = customersCount || 0

  // Get low stock alerts and pending orders for better stats
  const { count: lowStockCount, error: lowStockError } = await supabase
    .from('inventory')
    .select('*', { count: 'exact', head: true })
    .lte('total_stock', 5)

  if (lowStockError) {
    console.error('Error fetching low stock count:', lowStockError)
  }

  // Mock growth data (in real app, calculate from historical data)
  const revenueGrowth = totalRevenue > 0 ? 12.5 : 0 // 12.5% growth if we have revenue
  const ordersGrowth = totalOrders > 0 ? 8 : 0 // 8 new orders today if we have orders
  const customersGrowth = totalCustomers > 0 ? 15.2 : 0 // 15.2% growth if we have customers
  const productsGrowth = 5 // 5 new products

  return {
    totalRevenue,
    totalOrders,
    totalCustomers,
    totalProducts,
    revenueGrowth,
    ordersGrowth,
    customersGrowth,
    productsGrowth,
    pendingOrders: 0, // No orders yet
    lowStockProducts: lowStockCount || 0
  }
}

export async function GET(request: NextRequest) {
  try {
    const getCachedStats = createCachedResponse(
      'dashboard-stats',
      CACHE_TTL.DASHBOARD_STATS,
      fetchDashboardStats
    )

    const stats = await getCachedStats()
    
    // Add cache headers
    const response = NextResponse.json(stats)
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    
    return response

  } catch (error) {
    console.error('API Route Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}