import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import { createCachedResponse, CACHE_TTL } from '@/app/lib/cache'
import { getSecurityHeaders } from '@/app/lib/security'

interface CartAbandonmentAnalytics {
  overview: {
    abandonmentRate: number
    recoveryRate: number
    averageCartValue: number
    totalAbandoned: number
    totalRecovered: number
    revenueRecovered: number
  }
  recentAbandoned: {
    id: string
    customerEmail?: string
    cartValue: number
    itemCount: number
    abandonedAt: string
    source: string
    recoveryOffered: boolean
  }[]
  recoveryPerformance: {
    email1Hour: { sent: number, opened: number, clicked: number, converted: number }
    email24Hours: { sent: number, opened: number, clicked: number, converted: number }
    email72Hours: { sent: number, opened: number, clicked: number, converted: number }
  }
  trends: {
    date: string
    abandoned: number
    recovered: number
    recoveryRate: number
  }[]
}

async function fetchCartAbandonmentAnalytics(days: number = 7): Promise<CartAbandonmentAnalytics> {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  // Get abandoned carts
  const { data: abandonedCarts } = await supabase
    .from('abandoned_carts')
    .select('*')
    .gte('created_at', startDate)
    .order('created_at', { ascending: false })

  // Get cart abandonment analytics
  const { data: analyticsData } = await supabase
    .from('cart_abandonment_analytics')
    .select('*')
    .gte('created_at', startDate)

  const totalAbandoned = abandonedCarts?.length || 0
  const totalRecovered = abandonedCarts?.filter(cart => cart.status === 'recovered').length || 0
  const revenueRecovered = abandonedCarts
    ?.filter(cart => cart.status === 'recovered')
    .reduce((sum, cart) => sum + (cart.total_value || 0), 0) || 0

  const averageCartValue = totalAbandoned > 0 
    ? (abandonedCarts?.reduce((sum, cart) => sum + (cart.total_value || 0), 0) || 0) / totalAbandoned 
    : 0

  // Recent abandoned carts
  const recentAbandoned = abandonedCarts
    ?.filter(cart => cart.status === 'abandoned')
    .slice(0, 10)
    .map(cart => ({
      id: cart.id,
      customerEmail: cart.customer_email,
      cartValue: cart.total_value || 0,
      itemCount: cart.cart_items?.length || 0,
      abandonedAt: cart.created_at,
      source: cart.source || 'website',
      recoveryOffered: false // Mock - implement actual tracking
    })) || []

  // Mock recovery performance - implement actual email tracking
  const recoveryPerformance = {
    email1Hour: { sent: 45, opened: 12, clicked: 3, converted: 1 },
    email24Hours: { sent: 89, opened: 28, clicked: 8, converted: 3 },
    email72Hours: { sent: 156, opened: 32, clicked: 7, converted: 2 }
  }

  // Generate trends by day
  const trendsByDay = new Map()
  if (abandonedCarts) {
    abandonedCarts.forEach(cart => {
      const date = cart.created_at.split('T')[0]
      if (!trendsByDay.has(date)) {
        trendsByDay.set(date, { abandoned: 0, recovered: 0 })
      }
      const dayStats = trendsByDay.get(date)
      dayStats.abandoned++
      if (cart.status === 'recovered') {
        dayStats.recovered++
      }
    })
  }

  const trends = Array.from(trendsByDay.entries())
    .map(([date, stats]) => ({
      date,
      abandoned: stats.abandoned,
      recovered: stats.recovered,
      recoveryRate: stats.abandoned > 0 ? stats.recovered / stats.abandoned : 0
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    overview: {
      abandonmentRate: 68.2, // Mock - calculate from actual order/cart data
      recoveryRate: totalAbandoned > 0 ? (totalRecovered / totalAbandoned) * 100 : 0,
      averageCartValue,
      totalAbandoned,
      totalRecovered,
      revenueRecovered
    },
    recentAbandoned,
    recoveryPerformance,
    trends
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')
    
    const getCachedAnalytics = createCachedResponse(
      `cart-abandonment-analytics-${days}d`,
      CACHE_TTL.ANALYTICS,
      () => fetchCartAbandonmentAnalytics(days)
    )

    const analytics = await getCachedAnalytics()
    
    const response = NextResponse.json(analytics)
    
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    return response

  } catch (error) {
    console.error('Cart abandonment analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cart abandonment analytics' }, 
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}