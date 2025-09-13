import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7days'

    // Get orders data to estimate traffic
    const { data: orders, error } = await supabase
      .from('orders')
      .select('created_at, payment_status')
      .gte('created_at', getDateRange(period))

    if (error) {
      throw error
    }

    // Calculate estimated visitors based on orders (assuming ~3% conversion rate)
    const paidOrders = orders?.filter(order => order.payment_status === 'paid') || []
    const estimatedTotalVisitors = Math.round(paidOrders.length / 0.03)

    // Generate realistic traffic source distribution
    const trafficSources = [
      {
        source: 'Organické vyhledávání',
        visitors: Math.round(estimatedTotalVisitors * 0.45),
        percentage: 45,
        sessions: Math.round(estimatedTotalVisitors * 0.45 * 1.2),
        bounceRate: 52,
        avgSessionDuration: '2:34',
        conversions: Math.round(paidOrders.length * 0.35)
      },
      {
        source: 'Přímý přístup',
        visitors: Math.round(estimatedTotalVisitors * 0.25),
        percentage: 25,
        sessions: Math.round(estimatedTotalVisitors * 0.25 * 0.9),
        bounceRate: 38,
        avgSessionDuration: '3:12',
        conversions: Math.round(paidOrders.length * 0.30)
      },
      {
        source: 'Sociální sítě',
        visitors: Math.round(estimatedTotalVisitors * 0.15),
        percentage: 15,
        sessions: Math.round(estimatedTotalVisitors * 0.15 * 1.5),
        bounceRate: 68,
        avgSessionDuration: '1:48',
        conversions: Math.round(paidOrders.length * 0.20)
      },
      {
        source: 'E-mail marketing',
        visitors: Math.round(estimatedTotalVisitors * 0.10),
        percentage: 10,
        sessions: Math.round(estimatedTotalVisitors * 0.10 * 0.8),
        bounceRate: 32,
        avgSessionDuration: '4:25',
        conversions: Math.round(paidOrders.length * 0.10)
      },
      {
        source: 'Placená reklama',
        visitors: Math.round(estimatedTotalVisitors * 0.05),
        percentage: 5,
        sessions: Math.round(estimatedTotalVisitors * 0.05 * 1.1),
        bounceRate: 45,
        avgSessionDuration: '2:15',
        conversions: Math.round(paidOrders.length * 0.05)
      }
    ]

    // Calculate growth trends (mock data)
    const trendsData = trafficSources.map(source => ({
      ...source,
      growth: Math.round((Math.random() - 0.4) * 30 * 100) / 100, // -12% to +18%
      previousPeriodVisitors: Math.round(source.visitors * (1 - source.growth / 100))
    }))

    // Calculate total stats
    const totalStats = {
      totalVisitors: estimatedTotalVisitors,
      totalSessions: trafficSources.reduce((sum, source) => sum + source.sessions, 0),
      averageBounceRate: Math.round(
        trafficSources.reduce((sum, source) => sum + (source.bounceRate * source.percentage / 100), 0)
      ),
      totalConversions: paidOrders.length,
      conversionRate: estimatedTotalVisitors > 0 ? 
        Math.round((paidOrders.length / estimatedTotalVisitors) * 10000) / 100 : 0,
      period
    }

    return NextResponse.json({
      trafficSources: trendsData,
      stats: totalStats,
      chartData: generateTrafficChart(trendsData),
      period
    })

  } catch (error) {
    console.error('Traffic sources analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch traffic sources analytics' },
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

function generateTrafficChart(sources: any[]) {
  return sources.map((source, index) => ({
    source: source.source,
    visitors: source.visitors,
    percentage: source.percentage,
    color: getSourceColor(index)
  }))
}

function getSourceColor(index: number): string {
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green  
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6'  // Purple
  ]
  return colors[index % colors.length]
}