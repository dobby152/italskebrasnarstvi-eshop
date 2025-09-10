"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { simpleStockService, SimpleStock } from '../lib/simple-stock-service'
import { Package, MapPin } from 'lucide-react'

interface SimpleStockDisplayProps {
  sku: string
  showLocations?: boolean
}

export default function SimpleStockDisplay({ sku, showLocations = true }: SimpleStockDisplayProps) {
  const [stock, setStock] = useState<SimpleStock | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sku) {
      setLoading(false)
      return
    }

    const fetchStock = async () => {
      setLoading(true)
      try {
        console.log(`🔍 SimpleStockDisplay: Fetching stock for SKU: ${sku}`)
        const stockData = await simpleStockService.getProductStock(sku)
        console.log(`📦 SimpleStockDisplay: Received stock data:`, stockData)
        setStock(stockData)
      } catch (error) {
        console.error('Error fetching stock:', error)
        setStock(null)
      } finally {
        setLoading(false)
      }
    }

    fetchStock()
  }, [sku])

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="bg-gray-200 h-20 rounded-lg mb-2"></div>
      </div>
    )
  }

  if (!stock) {
    return (
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600 text-sm">Informace o dostupnosti nejsou k dispozici</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock': return 'bg-green-50 border-green-200 text-green-800'
      case 'low-stock': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'out-of-stock': return 'bg-red-50 border-red-200 text-red-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in-stock': return '✅'
      case 'low-stock': return '⚠️'
      case 'out-of-stock': return '❌'
      default: return '📦'
    }
  }

  return (
    <Card className={`border-2 ${getStatusColor(stock.status)}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Main status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getStatusIcon(stock.status)}</span>
              <span className="font-semibold">{stock.text}</span>
            </div>
            {stock.totalStock > 0 && (
              <Badge variant="outline" className="font-medium">
                {stock.totalStock} ks celkem
              </Badge>
            )}
          </div>

          {/* Location breakdown */}
          {showLocations && stock.totalStock > 0 && (
            <div className="space-y-2 pt-2 border-t border-current border-opacity-20">
              <div className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Dostupnost v prodejnách:
              </div>
              <div className="grid grid-cols-1 gap-1 text-sm">
                {stock.chodovStock > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">PIQUADRO Westfield Chodov:</span>
                    <Badge variant="secondary" className="text-xs">
                      {stock.chodovStock} ks
                    </Badge>
                  </div>
                )}
                {stock.outletStock > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">PIQUADRO Premium Outlet:</span>
                    <Badge variant="secondary" className="text-xs">
                      {stock.outletStock} ks
                    </Badge>
                  </div>
                )}
              </div>
              
              {/* Store Addresses */}
              <div className="mt-3 pt-2 border-t border-current border-opacity-20">
                <div className="text-xs text-gray-600 space-y-2">
                  {stock.chodovStock > 0 && (
                    <div>
                      <div className="font-medium text-gray-700">Partnerská prodejna - PIQUADRO Westfield Chodov</div>
                      <div>Roztylská 2321/19, Praha 11-Chodov 148 00, Česko</div>
                      <div>Po — Ne: 9.00 — 21.00 hod.</div>
                    </div>
                  )}
                  {stock.outletStock > 0 && (
                    <div>
                      <div className="font-medium text-gray-700">Partnerská prodejna - PIQUADRO Premium Outlet Prague</div>
                      <div>Ke Kopanině 421, Tuchoměřice 252 67, Česko</div>
                      <div>Po — Ne: 10.00 — 20.00 hod.</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Out of stock message */}
          {stock.totalStock === 0 && (
            <div className="text-xs text-gray-600 pt-2 border-t border-current border-opacity-20">
              Aktuálně není skladem. Kontaktujte nás pro informace o dostupnosti.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}