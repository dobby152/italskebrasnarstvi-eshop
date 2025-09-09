"use client"

import { useEffect } from 'react'

export function ClientWebVitals() {
  useEffect(() => {
    // Basic performance tracking without web-vitals library
    if (typeof window === 'undefined') return

    // Track basic page load metrics
    const trackPageLoad = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        console.log('Page Load Time:', navigation.loadEventEnd - navigation.fetchStart)
        console.log('DOM Content Loaded:', navigation.domContentLoadedEventEnd - navigation.fetchStart)
      }
    }

    // Track when page becomes interactive
    if (document.readyState === 'complete') {
      trackPageLoad()
    } else {
      window.addEventListener('load', trackPageLoad)
    }
  }, [])

  return null
}