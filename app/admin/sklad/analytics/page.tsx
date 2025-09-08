"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Package,
  AlertTriangle,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react"
import { useAnalytics } from '../../../hooks/useTransfers'

const AnalyticsPage = () => {
  const { analytics, loading } = useAnalytics(30)

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUpRight className="h-4 w-4 text-green-600" />
      case 'down': return <ArrowDownRight className="h-4 w-4 text-red-600" />
      default: return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'hot': return '🔥'
      case 'popular': return '📈' 
      case 'average': return '📊'
      default: return '🐌'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'hot': return 'bg-red-100 text-red-800 border-red-200'
      case 'popular': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'average': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Analytika skladu</h2>
        <p className="text-gray-600">Analýza popularity produktů a optimalizace zásob (30 dní)</p>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Populární produkty</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    {analytics.summary?.hotProducts || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Vysoká aktivita</p>
                </div>
                <div className="p-3 bg-red-50 rounded-full">
                  <Star className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pomalé produkty</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">
                    {analytics.summary?.slowProducts || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Nízká aktivita</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-full">
                  <TrendingDown className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Kritické zásoby</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    {analytics.summary?.criticalStock || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Okamžitá pozornost</p>
                </div>
                <div className="p-3 bg-red-50 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Přebytečné zásoby</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {analytics.summary?.excessStock || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Možná optimalizace</p>
                </div>
                <div className="p-3 bg-green-50 rounded-full">
                  <Package className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Top produkty podle popularity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 bg-gray-200 rounded"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                      <div className="w-16 h-6 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : analytics.topProducts.length > 0 ? (
              <div className="space-y-3">
                {analytics.topProducts.slice(0, 10).map((product, index) => (
                  <div key={product.sku} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full border-2 border-gray-300 text-sm font-bold text-gray-700">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 truncate">{product.name}</p>
                          <div className="text-lg">{getCategoryIcon(product.popularity.category)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-white px-2 py-1 rounded border">
                            {product.sku}
                          </code>
                          <Badge variant="outline" className={getCategoryColor(product.popularity.category)}>
                            {product.popularity.category === 'hot' ? 'Žhavé' :
                             product.popularity.category === 'popular' ? 'Populární' :
                             product.popularity.category === 'average' ? 'Průměrné' : 'Pomalé'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      {getTrendIcon(product.popularity.trend)}
                      <div>
                        <div className="text-lg font-bold text-gray-900">
                          {product.popularity.score.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {product.currentStock} ks
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Žádná analytická data</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              Aktivita podle kategorií
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2"></div>
                  </div>
                ))}
              </div>
            ) : analytics.categoryAnalytics.length > 0 ? (
              <div className="space-y-4">
                {analytics.categoryAnalytics.map((category, index) => {
                  const maxMovements = Math.max(...analytics.categoryAnalytics.map(c => c.totalMovements))
                  const percentage = maxMovements > 0 ? (category.totalMovements / maxMovements) * 100 : 0
                  
                  return (
                    <div key={category.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{category.name}</span>
                        <div className="text-right">
                          <span className="text-sm font-bold text-gray-900">
                            {category.totalMovements}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">pohybů</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            index === 0 ? 'bg-blue-600' :
                            index === 1 ? 'bg-green-600' :
                            index === 2 ? 'bg-yellow-600' :
                            index === 3 ? 'bg-red-600' : 'bg-purple-600'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {category.products} produktů
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Žádná data o kategoriích</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AnalyticsPage