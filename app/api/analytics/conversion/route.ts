import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7days'

    // Get orders data for conversion calculation
    const { data: orders, error } = await supabase
      .from('orders')
      .select('created_at, payment_status')
      .gte('created_at', getDateRange(period))
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    // Generate conversion chart data (mock visitor data)
    const conversionChart = generateConversionChart(orders || [], period)
    
    // Calculate overall conversion rate
    const totalOrders = orders?.filter(order => order.payment_status === 'paid').length || 0
    const estimatedVisitors = totalOrders * 25 // Assume 4% conversion rate
    const conversionRate = estimatedVisitors > 0 ? (totalOrders / estimatedVisitors) * 100 : 0

    // Mock growth data
    const previousRate = conversionRate * 0.92 // Simulate improvement
    const growth = conversionRate > 0 ? ((conversionRate - previousRate) / previousRate) * 100 : 0

    return NextResponse.json({
      conversionChart,
      conversionRate: Math.round(conversionRate * 100) / 100,
      growth: Math.round(growth * 100) / 100,
      totalVisitors: estimatedVisitors,
      totalOrders,
      period
    })

  } catch (error) {
    console.error('Conversion analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversion analytics' },
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

function generateConversionChart(orders: any[], period: string) {
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
      return orderDate >= dayStart && orderDate <= dayEnd && order.payment_status === 'paid'
    })

    // Simulate conversion rate (1.5% - 4.5%)
    const baseRate = 2.8
    const variance = (Math.random() - 0.5) * 2
    const rate = Math.max(1.5, Math.min(4.5, baseRate + variance + (dayOrders.length * 0.1)))

    chart.push({
      date: date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' }),
      rate: Math.round(rate * 10) / 10,
      orders: dayOrders.length,
      visitors: Math.round(dayOrders.length / (rate / 100))
    })
  }

  return chart
}