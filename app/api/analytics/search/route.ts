import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import { createCachedResponse, CACHE_TTL } from '@/app/lib/cache'
import { getSecurityHeaders } from '@/app/lib/security'

interface SearchAnalytics {
  topQueries: {
    query: string
    count: number
    results: number
    clicks: number
    conversionRate: number
  }[]
  searchTrends: {
    date: string
    searches: number
    clickThroughRate: number
  }[]
  noResultsQueries: {
    query: string
    count: number
  }[]
}

async function fetchSearchAnalytics(days: number = 7): Promise<SearchAnalytics> {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  // Top search queries with analytics
  const { data: topQueries } = await supabase
    .from('search_analytics')
    .select(`
      query,
      selected_result,
      created_at
    `)
    .gte('created_at', startDate)
    .order('created_at', { ascending: false })

  // Aggregate search data
  const queryStats = new Map()

  if (topQueries) {
    topQueries.forEach(search => {
      const query = search.query.toLowerCase()
      if (!queryStats.has(query)) {
        queryStats.set(query, {
          query,
          count: 0,
          clicks: 0,
          results: Math.floor(Math.random() * 50) + 10 // Mock - replace with actual data
        })
      }
      
      const stats = queryStats.get(query)
      stats.count++
      
      if (search.selected_result) {
        stats.clicks++
      }
    })
  }

  const topQueriesArray = Array.from(queryStats.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
    .map(stats => ({
      ...stats,
      conversionRate: stats.clicks / stats.count
    }))

  // Search trends by day
  const trendsByDay = new Map()
  if (topQueries) {
    topQueries.forEach(search => {
      const date = search.created_at.split('T')[0]
      if (!trendsByDay.has(date)) {
        trendsByDay.set(date, { searches: 0, clicks: 0 })
      }
      const dayStats = trendsByDay.get(date)
      dayStats.searches++
      if (search.selected_result) {
        dayStats.clicks++
      }
    })
  }

  const searchTrends = Array.from(trendsByDay.entries())
    .map(([date, stats]) => ({
      date,
      searches: stats.searches,
      clickThroughRate: stats.clicks / stats.searches
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Mock no results queries - replace with actual tracking
  const noResultsQueries = [
    { query: 'vintage kabelky', count: 12 },
    { query: 'červené peněženky', count: 8 },
    { query: 'kožené rukavice', count: 6 },
    { query: 'malé kabelky', count: 5 }
  ]

  return {
    topQueries: topQueriesArray,
    searchTrends,
    noResultsQueries
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')
    
    const getCachedAnalytics = createCachedResponse(
      `search-analytics-${days}d`,
      CACHE_TTL.ANALYTICS,
      () => fetchSearchAnalytics(days)
    )

    const analytics = await getCachedAnalytics()
    
    const response = NextResponse.json(analytics)
    
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    return response

  } catch (error) {
    console.error('Search analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch search analytics' }, 
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}