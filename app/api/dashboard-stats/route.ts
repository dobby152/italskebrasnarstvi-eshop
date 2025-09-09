import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import { createCachedResponse, CACHE_TTL } from '@/app/lib/cache'

async function fetchDashboardStats() {
  // Get total revenue from orders
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('total')

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
  const totalRevenue = orders?.reduce((sum: number, order: any) => sum + (order.total || 0), 0) || 0
  const totalOrders = orders?.length || 0
  const totalProducts = productsCount || 0
  const totalCustomers = customersCount || 0

  // Mock growth data (in real app, calculate from historical data)
  const revenueGrowth = 12.5 // 12.5% growth
  const ordersGrowth = 8 // 8 new orders today
  const customersGrowth = 15.2 // 15.2% growth
  const productsGrowth = 5 // 5 new products

  return {
    totalRevenue,
    totalOrders,
    totalCustomers,
    totalProducts,
    revenueGrowth,
    ordersGrowth,
    customersGrowth,
    productsGrowth
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