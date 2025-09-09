"use client"

import { useEffect } from 'react'

export function ClientWebVitals() {
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return

    const loadWebVitals = async () => {
      try {
        const { onCLS, onINP, onFCP, onLCP, onTTFB } = await import('web-vitals')
        
        const sendToAnalytics = (metric: any) => {
          // Send to Google Analytics if available
          if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', metric.name, {
              event_category: 'Web Vitals',
              event_label: metric.id,
              value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
              non_interaction: true,
            })
          }
          
          // Send to custom analytics endpoint
          fetch('/api/analytics/web-vitals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: metric.name,
              value: metric.value,
              id: metric.id,
              url: window.location.href,
              timestamp: Date.now()
            })
          }).catch(() => {
            // Silently fail if analytics endpoint is not available
          })
        }

        // Track all Core Web Vitals
        onCLS(sendToAnalytics)
        onINP(sendToAnalytics)
        onFCP(sendToAnalytics)
        onLCP(sendToAnalytics)
        onTTFB(sendToAnalytics)
      } catch (error) {
        // Silently fail if web-vitals is not available
        console.warn('Web Vitals tracking failed to load:', error)
      }
    }

    loadWebVitals()
  }, [])

  return null
}