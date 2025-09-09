import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import { getSecurityHeaders } from '@/app/lib/security'

interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB'
  value: number
  id: string
  url: string
  timestamp: number
}

export async function POST(request: NextRequest) {
  try {
    const metric: WebVitalsMetric = await request.json()
    
    // Validate metric data
    if (!metric.name || typeof metric.value !== 'number' || !metric.url) {
      return NextResponse.json(
        { error: 'Invalid metric data' },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    // Get user agent for device detection
    const userAgent = request.headers.get('user-agent') || ''
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent)
    
    // Store web vitals data
    await supabase
      .from('web_vitals')
      .insert({
        metric_name: metric.name,
        metric_value: metric.value,
        metric_id: metric.id,
        url: metric.url,
        user_agent: userAgent,
        is_mobile: isMobile,
        timestamp: new Date(metric.timestamp).toISOString(),
        created_at: new Date().toISOString()
      })

    // Check for performance issues and alert if needed
    const thresholds = {
      CLS: 0.1,      // Good: 0.1, Poor: 0.25
      FID: 100,      // Good: 100ms, Poor: 300ms  
      FCP: 1800,     // Good: 1.8s, Poor: 3.0s
      LCP: 2500,     // Good: 2.5s, Poor: 4.0s
      TTFB: 800      // Good: 800ms, Poor: 1800ms
    }

    const isGood = metric.value <= thresholds[metric.name]
    
    if (!isGood) {
      // Log performance issue
      console.warn(`Poor ${metric.name} detected:`, {
        value: metric.value,
        threshold: thresholds[metric.name],
        url: metric.url
      })
      
      // You could send alerts here for critical performance issues
    }

    return NextResponse.json(
      { success: true, performance: isGood ? 'good' : 'poor' },
      { headers: getSecurityHeaders() }
    )

  } catch (error) {
    console.error('Web Vitals tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to track web vitals' },
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}