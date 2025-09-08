"use client"

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  Activity,
  BarChart3,
  ArrowUpDown,
  Scan,
  Search,
  ChevronRight,
  RefreshCw
} from "lucide-react"
import { useWarehouseStats, useLowStockProducts } from '../../../hooks/useWarehouse'

const WarehouseDashboard = () => {
  const { stats, loading: statsLoading, refetch: refetchStats } = useWarehouseStats()
  const { products: lowStockProducts, loading: lowStockLoading } = useLowStockProducts(1, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Skladový systém</h1>
          <p className="text-gray-600 mt-2">Přehled stavu skladových zásob a operací</p>
        </div>
        <Button onClick={refetchStats} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Aktualizovat
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Celkem produktů</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {statsLoading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    (stats?.totalProducts || 0).toLocaleString()
                  )}
                </p>
                <p className="text-xs text-green-600 mt-1">+12% z minulého měsíce</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hodnota skladu</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {statsLoading ? (
                    <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    `${((stats?.totalValue || 0) / 1000000).toFixed(1)}M Kč`
                  )}
                </p>
                <p className="text-xs text-green-600 mt-1">+8% z minulého měsíce</p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Kritické zásoby</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {statsLoading ? (
                    <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    (stats?.lowStockAlerts || 0).toLocaleString()
                  )}
                </p>
                <p className="text-xs text-red-600 mt-1">Vyžaduje pozornost</p>
              </div>
              <div className="p-3 bg-red-50 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pohyby (7 dní)</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {statsLoading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    stats?.recentMovements || 0
                  )}
                </p>
                <p className="text-xs text-purple-600 mt-1">Aktivní provoz</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-full">
                <Activity className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Rychlé akce
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Link href="/admin/sklad/inventory">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2 hover:bg-blue-50 hover:border-blue-200">
                <Search className="h-6 w-6" />
                <span className="text-sm">Procházet sklad</span>
              </Button>
            </Link>
            
            <Link href="/admin/sklad/movements">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2 hover:bg-green-50 hover:border-green-200">
                <ArrowUpDown className="h-6 w-6" />
                <span className="text-sm">Pohyby zásob</span>
              </Button>
            </Link>
            
            <Link href="/admin/sklad/ocr">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2 hover:bg-purple-50 hover:border-purple-200">
                <Scan className="h-6 w-6" />
                <span className="text-sm">Zpracovat fakturu</span>
              </Button>
            </Link>
            
            <Link href="/admin/sklad/analytics">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2 hover:bg-orange-50 hover:border-orange-200">
                <BarChart3 className="h-6 w-6" />
                <span className="text-sm">Analytika</span>
              </Button>
            </Link>
            
            <Link href="/admin/sklad/transfers">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2 hover:bg-indigo-50 hover:border-indigo-200">
                <Package className="h-6 w-6" />
                <span className="text-sm">Převody</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Kritické zásoby
              </CardTitle>
              <Link href="/admin/sklad/inventory?filter=low-stock">
                <Button variant="ghost" size="sm">
                  Zobrazit vše <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <div className="h-6 bg-gray-200 rounded w-8"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : lowStockProducts.length > 0 ? (
                lowStockProducts.slice(0, 5).map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-600">{product.sku}</p>
                        <Badge variant="outline" className="text-xs">
                          {product.location}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive" className="text-xs">
                        {product.currentStock} ks
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">min: {product.minStock}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Žádné kritické zásoby</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Rozložení skladu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Chodov</span>
                  <span className="text-sm text-gray-600">
                    {stats?.totalLocations?.chodov || 0} ks
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{
                      width: `${stats?.totalLocations ? (stats.totalLocations.chodov / (stats.totalLocations.chodov + stats.totalLocations.outlet)) * 100 : 0}%`
                    }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Outlet</span>
                  <span className="text-sm text-gray-600">
                    {stats?.totalLocations?.outlet || 0} ks
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-600 h-3 rounded-full transition-all"
                    style={{
                      width: `${stats?.totalLocations ? (stats.totalLocations.outlet / (stats.totalLocations.chodov + stats.totalLocations.outlet)) * 100 : 0}%`
                    }}
                  ></div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Celkem zásob:</span>
                  <span className="font-medium">
                    {((stats?.totalLocations?.chodov || 0) + (stats?.totalLocations?.outlet || 0)).toLocaleString()} ks
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default WarehouseDashboard