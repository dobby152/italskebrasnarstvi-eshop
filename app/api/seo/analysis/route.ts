import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import { createCachedResponse, CACHE_TTL } from '@/app/lib/cache'
import { getSecurityHeaders } from '@/app/lib/security'

interface SEOAnalysis {
  overview: {
    totalPages: number
    indexedPages: number
    avgLoadTime: number
    mobileScore: number
    desktopScore: number
  }
  webVitals: {
    cls: { good: number, needsImprovement: number, poor: number }
    fid: { good: number, needsImprovement: number, poor: number }
    lcp: { good: number, needsImprovement: number, poor: number }
  }
  topPages: Array<{
    url: string
    views: number
    bounceRate: number
    avgTimeOnPage: number
    conversionRate: number
  }>
  keywordRankings: Array<{
    keyword: string
    position: number
    change: number
    volume: number
    difficulty: number
  }>
  technicalIssues: Array<{
    type: 'error' | 'warning' | 'info'
    issue: string
    count: number
    pages: string[]
  }>
}

async function fetchSEOAnalysis(): Promise<SEOAnalysis> {
  // Get web vitals data
  const { data: webVitalsData } = await supabase
    .from('web_vitals')
    .select('metric_name, metric_value')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  // Analyze web vitals
  const webVitals = {
    cls: { good: 0, needsImprovement: 0, poor: 0 },
    fid: { good: 0, needsImprovement: 0, poor: 0 },
    lcp: { good: 0, needsImprovement: 0, poor: 0 }
  }

  if (webVitalsData) {
    webVitalsData.forEach(entry => {
      const metric = entry.metric_name.toLowerCase() as keyof typeof webVitals
      if (!webVitals[metric]) return

      let category: 'good' | 'needsImprovement' | 'poor'
      
      switch (metric) {
        case 'cls':
          category = entry.metric_value <= 0.1 ? 'good' : 
                    entry.metric_value <= 0.25 ? 'needsImprovement' : 'poor'
          break
        case 'fid':
          category = entry.metric_value <= 100 ? 'good' : 
                    entry.metric_value <= 300 ? 'needsImprovement' : 'poor'
          break
        case 'lcp':
          category = entry.metric_value <= 2500 ? 'good' : 
                    entry.metric_value <= 4000 ? 'needsImprovement' : 'poor'
          break
        default:
          return
      }
      
      webVitals[metric][category]++
    })
  }

  // Get product count for total pages estimation
  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })

  // Mock data for demonstration - replace with real analytics integration
  const overview = {
    totalPages: (productCount || 0) + 20, // Products + static pages
    indexedPages: Math.floor(((productCount || 0) + 20) * 0.95),
    avgLoadTime: 1.2,
    mobileScore: 89,
    desktopScore: 95
  }

  const topPages = [
    { url: '/', views: 15420, bounceRate: 0.32, avgTimeOnPage: 145, conversionRate: 0.034 },
    { url: '/produkty', views: 8930, bounceRate: 0.28, avgTimeOnPage: 220, conversionRate: 0.058 },
    { url: '/produkty/damske-kabelky', views: 5640, bounceRate: 0.35, avgTimeOnPage: 180, conversionRate: 0.071 },
    { url: '/produkty/panske-penezenky', views: 4820, bounceRate: 0.29, avgTimeOnPage: 195, conversionRate: 0.089 },
    { url: '/o-nas', views: 2310, bounceRate: 0.45, avgTimeOnPage: 90, conversionRate: 0.012 }
  ]

  const keywordRankings = [
    { keyword: 'italské kožené kabelky', position: 3, change: 2, volume: 1200, difficulty: 65 },
    { keyword: 'piquadro kabelky', position: 1, change: 0, volume: 800, difficulty: 45 },
    { keyword: 'luxusní peněženky', position: 8, change: -2, volume: 2100, difficulty: 78 },
    { keyword: 'značkové kabelky praha', position: 5, change: 1, volume: 650, difficulty: 58 },
    { keyword: 'italské kožené výrobky', position: 12, change: 3, volume: 950, difficulty: 52 }
  ]

  // Mock technical issues - replace with real crawl data
  const technicalIssues = [
    {
      type: 'warning' as const,
      issue: 'Missing alt text for images',
      count: 12,
      pages: ['/produkty/kabelka-abc', '/produkty/penezenka-xyz']
    },
    {
      type: 'info' as const,
      issue: 'Pages with long titles (>60 chars)',
      count: 5,
      pages: ['/produkty/super-dlouhy-nazev-produktu']
    },
    {
      type: 'error' as const,
      issue: '404 errors in sitemap',
      count: 2,
      pages: ['/old-product-url', '/removed-category']
    }
  ]

  return {
    overview,
    webVitals,
    topPages,
    keywordRankings,
    technicalIssues
  }
}

export async function GET(request: NextRequest) {
  try {
    const getCachedAnalysis = createCachedResponse(
      'seo-analysis',
      CACHE_TTL.ANALYTICS,
      fetchSEOAnalysis
    )

    const analysis = await getCachedAnalysis()
    
    const response = NextResponse.json(analysis)
    
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=1800')
    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    return response

  } catch (error) {
    console.error('SEO analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SEO analysis' }, 
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}