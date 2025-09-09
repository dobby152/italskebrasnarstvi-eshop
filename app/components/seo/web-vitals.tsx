"use client"

import { useEffect } from 'react'

// Web Vitals tracking component
export function WebVitals() {
  useEffect(() => {
    const trackWebVitals = async () => {
      const { onCLS, onFID, onFCP, onLCP, onTTFB } = await import('web-vitals')
      
      const sendToAnalytics = (metric: any) => {
        // Send to your analytics service
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', metric.name, {
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
        }).catch(console.error)
      }

      // Track all Core Web Vitals
      onCLS(sendToAnalytics)
      onFID(sendToAnalytics)
      onFCP(sendToAnalytics)
      onLCP(sendToAnalytics)
      onTTFB(sendToAnalytics)
    }

    trackWebVitals()
  }, [])

  return null
}

// Performance monitoring hook
export function usePerformanceMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn('Long task detected:', {
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime
            })
            
            // Send to analytics
            fetch('/api/analytics/performance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'long-task',
                name: entry.name,
                duration: entry.duration,
                startTime: entry.startTime,
                url: window.location.href
              })
            }).catch(console.error)
          }
        }
      })
      
      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] })
      } catch (e) {
        // Long tasks API not supported
      }

      // Monitor layout shifts
      const layoutShiftObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.hadRecentInput) continue
          
          if ((entry as any).value > 0.1) {
            console.warn('Large layout shift detected:', {
              value: (entry as any).value,
              sources: (entry as any).sources
            })
          }
        }
      })
      
      try {
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] })
      } catch (e) {
        // Layout shift API not supported
      }

      return () => {
        longTaskObserver.disconnect()
        layoutShiftObserver.disconnect()
      }
    }
  }, [])
}

declare global {
  interface Window {
    gtag: (...args: any[]) => void
  }
}