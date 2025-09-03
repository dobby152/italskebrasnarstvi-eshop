"use client"

import { useState, useEffect } from 'react'
import { Package, MapPin, AlertCircle } from 'lucide-react'
import { Card, CardContent } from './ui/card'

interface StockLocation {
  location: string
  stock: number
}

interface StockData {
  sku: string
  locations: StockLocation[]
  totalStock: number
  available: boolean
  lastUpdated: string | null
  error?: string
}

interface StockDisplayProps {
  sku: string
}

export default function StockDisplay({ sku }: StockDisplayProps) {
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStock = async () => {
      if (!sku) return
      
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/products/${sku}/stock`)
        
        if (response.ok) {
          const data = await response.json()
          setStockData(data)
        } else {
          setError('Nepodařilo se načíst skladové zásoby')
        }
      } catch (err) {
        console.error('Error fetching stock data:', err)
        setError('Chyba při načítání skladových zásob')
      } finally {
        setLoading(false)
      }
    }

    fetchStock()
  }, [sku])

  if (loading) {
    return (
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-blue-600 animate-pulse" />
            <span className="text-sm text-blue-800">Načítám skladové zásoby...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !stockData) {
    return (
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">
              {error || 'Skladové zásoby nejsou k dispozici'}
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStockStatus = (totalStock: number) => {
    if (totalStock === 0) return { 
      color: 'red', 
      text: 'Není skladem',
      cardClass: 'bg-red-50 border-red-200',
      iconClass: 'text-red-600',
      textClass: 'text-red-800'
    }
    if (totalStock <= 3) return { 
      color: 'yellow', 
      text: 'Posledné kusy',
      cardClass: 'bg-yellow-50 border-yellow-200',
      iconClass: 'text-yellow-600',
      textClass: 'text-yellow-800'
    }
    if (totalStock <= 10) return { 
      color: 'orange', 
      text: 'Omezená dostupnost',
      cardClass: 'bg-orange-50 border-orange-200',
      iconClass: 'text-orange-600',
      textClass: 'text-orange-800'
    }
    return { 
      color: 'green', 
      text: 'Skladem',
      cardClass: 'bg-green-50 border-green-200',
      iconClass: 'text-green-600',
      textClass: 'text-green-800'
    }
  }

  const status = getStockStatus(stockData.totalStock)

  return (
    <Card className={status.cardClass}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Main stock status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className={`h-5 w-5 ${status.iconClass}`} />
              <span className={`font-medium ${status.textClass}`}>
                {status.text}
              </span>
            </div>
            <span className={`font-bold ${status.textClass}`}>
              {stockData.totalStock} ks celkem
            </span>
          </div>

          {/* Location breakdown */}
          {stockData.locations.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-gray-600 font-medium">Dostupnost podle skladů:</div>
              {stockData.locations.map((location, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-gray-500" />
                    <span className="text-gray-700">{location.location}</span>
                  </div>
                  <span className={`font-medium ${location.stock > 0 ? 'text-gray-900' : 'text-gray-500'}`}>
                    {location.stock} ks
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Last updated */}
          {stockData.lastUpdated && (
            <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
              Aktualizováno: {new Date(stockData.lastUpdated).toLocaleDateString('cs-CZ', {
                day: 'numeric',
                month: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}