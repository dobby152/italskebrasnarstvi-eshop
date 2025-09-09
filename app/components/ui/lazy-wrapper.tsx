"use client"

import { Suspense, ReactNode } from 'react'

interface LazyWrapperProps {
  children: ReactNode
  fallback?: ReactNode
}

export function LazyWrapper({ children, fallback }: LazyWrapperProps) {
  const defaultFallback = (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  )
}