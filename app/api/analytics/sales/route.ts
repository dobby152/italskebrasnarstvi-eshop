import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7days'
    const channel = searchParams.get('channel') || 'all'

    // Get orders data
    const { data: orders, error } = await supabase
      .from('orders')
      .select('created_at, total_price, total_amount, payment_status')
      .eq('payment_status', 'paid')
      .gte('created_at', getDateRange(period))
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    // Generate sales chart data
    const salesChart = generateSalesChart(orders || [], period)
    
    // Calculate total sales
    const totalSales = orders?.reduce((sum, order) => 
      sum + (order.total_price || order.total_amount || 0), 0
    ) || 0

    // Calculate growth (mock data for now)
    const previousPeriodSales = totalSales * 0.85 // Simulate 15% growth
    const growth = totalSales > 0 ? ((totalSales - previousPeriodSales) / previousPeriodSales) * 100 : 0

    return NextResponse.json({
      salesChart,
      totalSales,
      growth: Math.round(growth * 100) / 100,
      period,
      ordersCount: orders?.length || 0
    })

  } catch (error) {
    console.error('Sales analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales analytics' },
      { status: 500 }
    )
  }
}

function getDateRange(period: string): string {
  const now = new Date()
  let days = 7

  switch (period) {
    case 'today':
      days = 1
      break
    case 'yesterday':
      days = 2
      break
    case '7days':
      days = 7
      break
    case '30days':
      days = 30
      break
    case '90days':
      days = 90
      break
  }

  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  return startDate.toISOString()
}

function generateSalesChart(orders: any[], period: string) {
  const now = new Date()
  const days = period === 'today' ? 1 : period === '7days' ? 7 : period === '30days' ? 30 : 7
  const chart = []

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    const dayOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at)
      return orderDate >= dayStart && orderDate <= dayEnd
    })

    const daySales = dayOrders.reduce((sum, order) => 
      sum + (order.total_price || order.total_amount || 0), 0
    )

    chart.push({
      date: date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' }),
      sales: daySales,
      orders: dayOrders.length
    })
  }

  return chart
}