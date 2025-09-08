"use client"

import { Package, MapPin, AlertCircle, Truck, Clock, Store } from 'lucide-react'
import { Card, CardContent } from './ui/card'
import { useProductStock } from '../hooks/useStock'
import { stockService, BRANCHES } from '../lib/stock-service'

interface StockDisplayProps {
  sku: string
}

export default function StockDisplay({ sku }: StockDisplayProps) {
  const { stock, loading, error, refetch } = useProductStock(sku)

  // Get stock status with branch information
  const stockStatus = stock ? stockService.getStockStatus(stock) : null

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

  if (error) {
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

  if (!stock || !stockStatus) {
    return (
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">Skladové zásoby nejsou k dispozici</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getColorClasses = (color: string) => {
    const colorClasses = {
      red: {
        cardClass: 'bg-red-50 border-red-200',
        iconClass: 'text-red-600',
        textClass: 'text-red-800'
      },
      yellow: {
        cardClass: 'bg-yellow-50 border-yellow-200',
        iconClass: 'text-yellow-600',
        textClass: 'text-yellow-800'
      },
      orange: {
        cardClass: 'bg-orange-50 border-orange-200',
        iconClass: 'text-orange-600',
        textClass: 'text-orange-800'
      },
      green: {
        cardClass: 'bg-green-50 border-green-200',
        iconClass: 'text-green-600',
        textClass: 'text-green-800'
      },
      blue: {
        cardClass: 'bg-blue-50 border-blue-200',
        iconClass: 'text-blue-600',
        textClass: 'text-blue-800'
      }
    } as const
    
    return colorClasses[color as keyof typeof colorClasses] || colorClasses.red
  }

  const classes = getColorClasses(stockStatus.color)

  return (
    <Card className={classes.cardClass}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Main stock status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className={`h-5 w-5 ${classes.iconClass}`} />
              <span className={`font-medium ${classes.textClass}`}>
                {stockStatus.text}
              </span>
            </div>
            <span className={`font-bold ${classes.textClass}`}>
              {stock.totalStock} ks celkem
            </span>
          </div>

          {/* Branch locations with real data */}
          {stock.locations && stock.locations.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-gray-600 font-medium">Dostupnost v partnerských prodejnách:</div>
              {stock.locations.map((location, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Store className="h-3 w-3 text-gray-500" />
                    <div className="flex flex-col">
                      <span className="text-gray-700 font-medium">{location.location}</span>
                      {/* Show address and hours for branch locations */}
                      {location.branch_id === BRANCHES.CHODOV.id && (
                        <div className="text-xs text-gray-500">
                          <div>{BRANCHES.CHODOV.address}</div>
                          <div>{BRANCHES.CHODOV.hours}</div>
                        </div>
                      )}
                      {location.branch_id === BRANCHES.OUTLET.id && (
                        <div className="text-xs text-gray-500">
                          <div>{BRANCHES.OUTLET.address}</div>
                          <div>{BRANCHES.OUTLET.hours}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${location.stock > 0 ? 'text-gray-900' : 'text-gray-500'}`}>
                      {location.stock} ks
                    </span>
                    {location.stock > 0 && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Last updated info */}
          {stock.lastUpdated && (
            <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-200">
              <Clock className="h-3 w-3" />
              <span>
                Aktualizováno: {stock.lastUpdated.toLocaleString('cs-CZ')}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}