'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, DollarSign, Package, ShoppingCart, BarChart3, PieChart, Activity, Target } from 'lucide-react'

interface InventoryStats {
  store: string
  total_products: number
  total_stock: number
  total_value: string
  avg_price: string
  in_stock: number
  out_of_stock: number
}

interface AnalyticsData {
  stores: string[]
  comparison: {
    chodov: {
      totalProducts: number
      totalStock: number
      totalValue: number
    }
    outlet: {
      totalProducts: number
      totalStock: number
      totalValue: number
    }
  }
  totalValue: number
  totalProducts: number
  totalStock: number
}

interface MarginData {
  store: string
  averageMargin: number
  averageMarkup: number
  totalProducts: number
  margins: Array<{
    sku: string
    sellingPrice: number
    purchasePrice: number
    marginPercent: number
    markupPercent: number
    stock: number
    totalValue: number
  }>
}

interface StockData {
  store: string
  summary: {
    outOfStock: number
    lowStock: number
    mediumStock: number
    highStock: number
    totalInventoryValue: number
  }
  details: {
    outOfStock: any[]
    lowStock: any[]
  }
}

interface RevenueData {
  dailyRevenue: number
  monthlyRevenue: number
  yearlyRevenue: number
  avgOrderValue: number
  totalOrders: number
  revenueGrowth: number
}

export default function InventoryDashboard() {
  const [stats, setStats] = useState<InventoryStats[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [marginData, setMarginData] = useState<{chodov: MarginData | null, outlet: MarginData | null}>({chodov: null, outlet: null})
  const [stockData, setStockData] = useState<{chodov: StockData | null, outlet: StockData | null}>({chodov: null, outlet: null})
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load analytics data
      const [analyticsResponse, chodovOverview, outletOverview, chodovMargins, outletMargins, chodovStock, outletStock] = await Promise.all([
        fetch('/api/inventory/analytics?store=all&analysis=overview'),
        fetch('/api/inventory/analytics?store=chodov&analysis=overview'),
        fetch('/api/inventory/analytics?store=outlet&analysis=overview'),
        fetch('/api/inventory/analytics?store=chodov&analysis=margins'),
        fetch('/api/inventory/analytics?store=outlet&analysis=margins'),
        fetch('/api/inventory/analytics?store=chodov&analysis=stock'),
        fetch('/api/inventory/analytics?store=outlet&analysis=stock')
      ])

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json()
        setAnalytics(analyticsData)
      }

      // Load margin data
      if (chodovMargins.ok && outletMargins.ok) {
        const [chodovMarginData, outletMarginData] = await Promise.all([
          chodovMargins.json(),
          outletMargins.json()
        ])
        setMarginData({chodov: chodovMarginData, outlet: outletMarginData})
      }

      // Load stock data
      if (chodovStock.ok && outletStock.ok) {
        const [chodovStockData, outletStockData] = await Promise.all([
          chodovStock.json(),
          outletStock.json()
        ])
        setStockData({chodov: chodovStockData, outlet: outletStockData})
      }

      // Load real stats from API responses
      if (chodovOverview.ok && outletOverview.ok) {
        const [chodovData, outletData] = await Promise.all([
          chodovOverview.json(),
          outletOverview.json()
        ])
        
        setStats([
          {
            store: 'CHODOV',
            total_products: chodovData.totalProducts,
            total_stock: chodovData.totalStock,
            total_value: chodovData.totalValue.toString(),
            avg_price: chodovData.avgPrice.toString(),
            in_stock: chodovData.inStock,
            out_of_stock: chodovData.outOfStock
          },
          {
            store: 'OUTLET',
            total_products: outletData.totalProducts,
            total_stock: outletData.totalStock,
            total_value: outletData.totalValue.toString(),
            avg_price: outletData.avgPrice.toString(),
            in_stock: outletData.inStock,
            out_of_stock: outletData.outOfStock
          }
        ])
      }

      // Load real revenue data
      try {
        const [dailyRevenue, monthlyRevenue, yearlyRevenue, overallRevenue] = await Promise.all([
          fetch('/api/revenue/analytics?period=today&analysis=overview'),
          fetch('/api/revenue/analytics?period=month&analysis=overview'),
          fetch('/api/revenue/analytics?period=year&analysis=overview'),
          fetch('/api/revenue/analytics?analysis=overview')
        ])

        const [dailyData, monthlyData, yearlyData, overallData] = await Promise.all([
          dailyRevenue.ok ? dailyRevenue.json() : { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 },
          monthlyRevenue.ok ? monthlyRevenue.json() : { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 },
          yearlyRevenue.ok ? yearlyRevenue.json() : { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 },
          overallRevenue.ok ? overallRevenue.json() : { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, revenueGrowth: 0 }
        ])

        setRevenueData({
          dailyRevenue: dailyData.totalRevenue,
          monthlyRevenue: monthlyData.totalRevenue,
          yearlyRevenue: yearlyData.totalRevenue,
          avgOrderValue: overallData.avgOrderValue,
          totalOrders: overallData.totalOrders,
          revenueGrowth: overallData.revenueGrowth
        })
      } catch (error) {
        console.error('Error loading revenue data:', error)
        // Fallback to zero values
        setRevenueData({
          dailyRevenue: 0,
          monthlyRevenue: 0,
          yearlyRevenue: 0,
          avgOrderValue: 0,
          totalOrders: 0,
          revenueGrowth: 0
        })
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading data:', error)
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery) return
    
    try {
      const response = await fetch(`/api/inventory/search?q=${encodeURIComponent(searchQuery)}&store=all&limit=20`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.results || [])
      }
    } catch (error) {
      console.error('Search error:', error)
    }
  }

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Business Intelligence Dashboard</h1>
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  const getTotalPotentialRevenue = () => {
    if (!analytics) return 0
    return analytics.totalValue
  }

  const getTotalPurchaseCosts = () => {
    if (!marginData.chodov || !marginData.outlet) return 0
    
    const chodovCost = marginData.chodov.margins.reduce((sum, item) => 
      sum + (item.purchasePrice * item.stock), 0
    )
    const outletCost = marginData.outlet.margins.reduce((sum, item) => 
      sum + (item.purchasePrice * item.stock), 0
    )
    
    return chodovCost + outletCost
  }

  const getAverageMargin = () => {
    if (!marginData.chodov || !marginData.outlet) return 0
    return (marginData.chodov.averageMargin + marginData.outlet.averageMargin) / 2
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab()
      case 'margins':
        return renderMarginsTab()
      case 'stock':
        return renderStockTab()
      case 'revenue':
        return renderRevenueTab()
      default:
        return renderOverviewTab()
    }
  }

  const renderOverviewTab = () => {
    const totalValue = stats.reduce((sum, stat) => sum + parseFloat(stat.total_value), 0)
    const totalProducts = stats.reduce((sum, stat) => sum + stat.total_products, 0)
    const totalStock = stats.reduce((sum, stat) => sum + stat.total_stock, 0)

    return (
      <>
        {/* Overall Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Celková hodnota inventáře</h3>
                <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalValue)}</p>
              </div>
              <DollarSign className="h-12 w-12 text-blue-500 opacity-20" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Celkový počet produktů</h3>
                <p className="text-3xl font-bold text-green-600">{totalProducts.toLocaleString('cs-CZ')}</p>
              </div>
              <Package className="h-12 w-12 text-green-500 opacity-20" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Celkový sklad</h3>
                <p className="text-3xl font-bold text-purple-600">{totalStock.toLocaleString('cs-CZ')} ks</p>
              </div>
              <Activity className="h-12 w-12 text-purple-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Průměrná marže</h3>
                <p className="text-3xl font-bold text-orange-600">{getAverageMargin().toFixed(1)}%</p>
              </div>
              <Target className="h-12 w-12 text-orange-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Store Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {stats.map((store) => (
            <div key={store.store} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gray-800 text-white p-4">
                <h2 className="text-xl font-bold">{store.store}</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Produkty celkem</p>
                    <p className="text-2xl font-bold">{store.total_products.toLocaleString('cs-CZ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Skladem</p>
                    <p className="text-2xl font-bold text-green-600">{store.total_stock.toLocaleString('cs-CZ')} ks</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Hodnota inventáře</p>
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(store.total_value)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Průměrná cena</p>
                    <p className="text-xl font-bold">{formatCurrency(store.avg_price)}</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Skladem</p>
                      <p className="font-semibold text-green-600">{store.in_stock} produktů</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Vyprodáno</p>
                      <p className="font-semibold text-red-600">{store.out_of_stock} produktů</p>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{width: `${(store.in_stock / store.total_products) * 100}%`}}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {Math.round((store.in_stock / store.total_products) * 100)}% produktů skladem
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Klíčové metriky</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {Math.round((stats.find(s => s.store === 'CHODOV')?.in_stock || 0) / 
                           (stats.find(s => s.store === 'CHODOV')?.total_products || 1) * 100)}%
              </p>
              <p className="text-sm text-gray-600">CHODOV dostupnost</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {Math.round((stats.find(s => s.store === 'OUTLET')?.in_stock || 0) / 
                           (stats.find(s => s.store === 'OUTLET')?.total_products || 1) * 100)}%
              </p>
              <p className="text-sm text-gray-600">OUTLET dostupnost</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(parseFloat(stats.find(s => s.store === 'CHODOV')?.avg_price || '0'))}
              </p>
              <p className="text-sm text-gray-600">CHODOV průměr</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(parseFloat(stats.find(s => s.store === 'OUTLET')?.avg_price || '0'))}
              </p>
              <p className="text-sm text-gray-600">OUTLET průměr</p>
            </div>
          </div>
        </div>
      </>
    )
  }

  const renderMarginsTab = () => {
    if (!marginData.chodov || !marginData.outlet) {
      return <div className="text-center py-8">Načítání dat marží...</div>
    }

    const totalPurchaseCost = getTotalPurchaseCosts()
    const totalRevenuePotential = getTotalPotentialRevenue()
    const totalPotentialProfit = totalRevenuePotential - totalPurchaseCost

    return (
      <>
        {/* Profit Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Potenciální tržby</h3>
            <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalRevenuePotential)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Nákupní náklady</h3>
            <p className="text-3xl font-bold text-red-600">{formatCurrency(totalPurchaseCost)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Potenciální zisk</h3>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(totalPotentialProfit)}</p>
          </div>
        </div>

        {/* Store Margins Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {[marginData.chodov, marginData.outlet].map((data) => (
            <div key={data.store} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gray-800 text-white p-4">
                <h2 className="text-xl font-bold">{data.store} - Analýza marží</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Průměrná marže</p>
                    <p className="text-2xl font-bold text-green-600">{data.averageMargin.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Průměrný markup</p>
                    <p className="text-2xl font-bold text-blue-600">{data.averageMarkup.toFixed(1)}%</p>
                  </div>
                </div>
                
                <h4 className="font-semibold text-gray-700 mb-2">Top produkty podle marže:</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {data.margins.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="truncate flex-1 mr-2">{item.sku}</span>
                      <span className="font-medium text-green-600">{item.marginPercent.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    )
  }

  const renderStockTab = () => {
    if (!stockData.chodov || !stockData.outlet) {
      return <div className="text-center py-8">Načítání skladových dat...</div>
    }

    return (
      <>
        {/* Stock Status Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {[stockData.chodov, stockData.outlet].map((data) => (
            <div key={data.store} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gray-800 text-white p-4">
                <h2 className="text-xl font-bold">{data.store} - Skladové zásoby</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{data.summary.outOfStock}</p>
                    <p className="text-sm text-gray-600">Vyprodáno</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{data.summary.lowStock}</p>
                    <p className="text-sm text-gray-600">Nízký sklad</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{data.summary.mediumStock}</p>
                    <p className="text-sm text-gray-600">Střední sklad</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{data.summary.highStock}</p>
                    <p className="text-sm text-gray-600">Vysoký sklad</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Celková hodnota skladu</p>
                  <p className="text-xl font-bold text-blue-600">{formatCurrency(data.summary.totalInventoryValue)}</p>
                </div>
                
                {data.details.outOfStock.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Vyprodané produkty:</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {data.details.outOfStock.slice(0, 10).map((item, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          {item.sku} - {formatCurrency(item.selling_price_incl_vat)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </>
    )
  }

  const renderRevenueTab = () => {
    if (!revenueData) {
      return <div className="text-center py-8">Načítání dat tržeb...</div>
    }

    return (
      <>
        {/* Revenue Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Dnešní tržby</h3>
                <p className="text-3xl font-bold text-blue-600">{formatCurrency(revenueData.dailyRevenue)}</p>
              </div>
              <TrendingUp className="h-12 w-12 text-blue-500 opacity-20" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Měsíční tržby</h3>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(revenueData.monthlyRevenue)}</p>
              </div>
              <BarChart3 className="h-12 w-12 text-green-500 opacity-20" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Průměrná objednávka</h3>
                <p className="text-3xl font-bold text-purple-600">{formatCurrency(revenueData.avgOrderValue)}</p>
              </div>
              <ShoppingCart className="h-12 w-12 text-purple-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Celkem objednávek</h3>
                <p className="text-3xl font-bold text-orange-600">{revenueData.totalOrders.toLocaleString('cs-CZ')}</p>
              </div>
              <Package className="h-12 w-12 text-orange-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Revenue Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Status tržeb</h2>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">Eshop je připraven pro tržby!</h3>
            <p className="text-gray-600 mb-4">
              Všechny systémy jsou nastaveny. Jakmile začnou přicházet objednávky, zde budete vidět reálná data o tržbách.
            </p>
            <div className="text-sm text-gray-500">
              <p>• Produktový katalog: ✅ {analytics?.totalProducts || 0} produktů</p>
              <p>• Inventář: ✅ {analytics?.totalStock || 0} kusů na skladě</p>
              <p>• Hodnota inventáře: ✅ {formatCurrency(analytics?.totalValue || 0)}</p>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Business Intelligence Dashboard</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Přehled
            </button>
            <button
              onClick={() => setActiveTab('margins')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'margins'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Marže
            </button>
            <button
              onClick={() => setActiveTab('stock')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'stock'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Sklad
            </button>
            <button
              onClick={() => setActiveTab('revenue')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'revenue'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Tržby
            </button>
          </div>
        </div>

        {renderTabContent()}

        {/* Search & Analytics */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Vyhledávání produktů</h2>
          
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Zadejte SKU nebo název produktu..."
              className="flex-1 border border-gray-300 rounded-md px-4 py-2"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Vyhledat
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prodejna</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prodejní cena</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skladem</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marže</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {searchResults.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.store}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.selling_price_incl_vat || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.stock || 0} ks
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.stock_status === 'high_stock' ? 'bg-green-100 text-green-800' :
                          item.stock_status === 'medium_stock' ? 'bg-yellow-100 text-yellow-800' :
                          item.stock_status === 'low_stock' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.stock_status === 'high_stock' ? 'Vysoký sklad' :
                           item.stock_status === 'medium_stock' ? 'Střední sklad' :
                           item.stock_status === 'low_stock' ? 'Nízký sklad' :
                           'Vyprodáno'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.margin_percentage ? `${item.margin_percentage}%` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}