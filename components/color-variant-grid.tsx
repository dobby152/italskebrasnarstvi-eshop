"use client"

import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { simpleStockService } from '../app/lib/simple-stock-service'

interface ColorVariant {
  colorName: string
  hexColor: string
  colorCode: string
  sku?: string
}

interface ColorVariantGridProps {
  variants: ColorVariant[]
  maxVisible?: number
  showLabels?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function ColorVariantGrid({ 
  variants, 
  maxVisible = 6, 
  showLabels = false,
  size = 'sm'
}: ColorVariantGridProps) {
  const [stockData, setStockData] = useState<Map<string, { available: boolean, lowStock: boolean }>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStockData = async () => {
      if (!variants || variants.length === 0) {
        setLoading(false)
        return
      }

      // Use a simplified approach - assume all variants with SKU are available for now
      // This is much faster than calling API for each variant
      const stockMap = new Map()
      
      variants.forEach(variant => {
        if (variant.sku) {
          // For performance, we'll assume variants are available
          // The real availability will be shown on product detail pages
          stockMap.set(variant.colorCode, {
            available: true,
            lowStock: false
          })
        } else {
          stockMap.set(variant.colorCode, {
            available: false,
            lowStock: false
          })
        }
      })
      
      setStockData(stockMap)
      setLoading(false)
    }

    loadStockData()
  }, [variants])

  if (!variants || variants.length === 0) return null

  const getColorAvailability = (colorCode: string) => {
    return stockData.get(colorCode) || { available: true, lowStock: false }
  }

  const availableCount = Array.from(stockData.values()).filter(s => s.available).length
  const unavailableCount = Array.from(stockData.values()).filter(s => !s.available).length

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  const visibleVariants = variants.slice(0, maxVisible)
  const remainingCount = variants.length - maxVisible

  return (
    <div className="space-y-2">
      <div className="flex gap-1 flex-wrap items-center">
        {visibleVariants.map((variant, index) => {
          const availability = getColorAvailability(variant.colorCode)
          const isAvailable = variant.sku ? availability.available : true
          const isLowStock = variant.sku ? availability.lowStock : false
          
          return (
            <div
              key={index}
              className={`
                ${sizeClasses[size]} rounded-full border-2 flex-shrink-0 relative transition-all
                ${isAvailable 
                  ? 'border-gray-200 hover:border-gray-300' 
                  : 'border-gray-300 opacity-50'
                }
                ${isLowStock ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''}
              `}
              style={{ 
                backgroundColor: isAvailable ? variant.hexColor : '#f3f4f6'
              }}
              title={`${variant.colorName}${!isAvailable ? ' - Není skladem' : isLowStock ? ' - Málo skladem' : ''}`}
            >
              {!isAvailable && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <AlertCircle className="w-2 h-2 text-gray-500" />
                </div>
              )}
              {isLowStock && isAvailable && (
                <div className="absolute -top-1 -right-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full border border-white"></div>
                </div>
              )}
            </div>
          )
        })}
        
        {remainingCount > 0 && (
          <span className="text-xs text-gray-500 ml-1">
            +{remainingCount}
          </span>
        )}
        
        {loading && (
          <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse"></div>
        )}
      </div>
      
      {showLabels && variants.length > 0 && (
        <div className="flex items-center gap-3 text-xs text-gray-600">
          {availableCount > 0 && (
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span>{availableCount} dostupných</span>
            </div>
          )}
          {unavailableCount > 0 && (
            <div className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-red-600" />
              <span>{unavailableCount} nedostupných</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}