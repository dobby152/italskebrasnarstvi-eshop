"use client"

import { Card, CardContent, CardHeader, CardTitle } from "../app/components/ui/card"
import { Button } from "../app/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../app/components/ui/select"
import { Badge } from "../app/components/ui/badge"
import {
  ShoppingCart,
  ChevronRight,
  CreditCard,
  RotateCcw,
  Apple,
  TrendingUp,
  Users,
  DollarSign,
  Package,
  Eye,
  Calendar,
  Filter,
  ChevronDown,
  Globe,
  Camera,
  MoreHorizontal
} from "lucide-react"
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { useStats } from "../app/hooks/useStats"
import { useAnalytics } from "../app/hooks/useAnalytics"
import { useState } from "react"

export default function DashboardContent() {
  const [dateRange, setDateRange] = useState('today')
  const [channel, setChannel] = useState('all')
  
  const { data: stats, isLoading: statsLoading, error: statsError } = useStats()
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useAnalytics({
    period: dateRange,
    channel: channel
  })
  
  const chartData = analytics?.salesChart || []
  
  if (statsLoading || analyticsLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Načítám dashboard...</p>
          </div>
        </div>
      </div>
    )
  }
  
  if (statsError || analyticsError) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Chyba při načítání dat</p>
            <p className="text-gray-600 text-sm">{statsError?.message || analyticsError?.message}</p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 mb-6 lg:mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1 lg:mb-2">Domů</h1>
          <p className="text-sm lg:text-base text-gray-600">Přehled vašeho obchodu</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-gray-500" />
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všechny kanály</SelectItem>
                <SelectItem value="online">Online obchod</SelectItem>
                <SelectItem value="pos">Pokladna</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Dnes</SelectItem>
                <SelectItem value="yesterday">Včera</SelectItem>
                <SelectItem value="7days">Posledních 7 dní</SelectItem>
                <SelectItem value="30days">Posledních 30 dní</SelectItem>
                <SelectItem value="90days">Posledních 90 dní</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Celkové tržby</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalRevenue ? `${stats.totalRevenue.toLocaleString('cs-CZ')} Kč` : '0 Kč'}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className={`h-4 w-4 mr-1 ${stats?.revenueGrowth && stats.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  <span className={`text-sm font-medium ${stats?.revenueGrowth && stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats?.revenueGrowth ? `${stats.revenueGrowth > 0 ? '+' : ''}${stats.revenueGrowth.toFixed(1)}%` : '0%'}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs. včera</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Objednávky</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalOrders || 0}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-sm text-blue-600 font-medium">+{stats?.ordersGrowth || 0}</span>
                  <span className="text-sm text-gray-500 ml-1">nové dnes</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Zákazníci</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.total || 0}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-orange-500 mr-1" />
                  <span className="text-sm text-orange-600 font-medium">+{stats?.new_this_month || 0}</span>
                  <span className="text-sm text-gray-500 ml-1">nárůst</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Produkty</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalProducts?.count || 0}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-sm text-yellow-600 font-medium">+{stats?.productsGrowth || 0}</span>
                  <span className="text-sm text-gray-500 ml-1">nové</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart */}
      <div className="mt-8">
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-gray-900">Tržby za posledních 7 dní</CardTitle>
              <div className="flex items-center gap-2">
                <Select defaultValue="7days">
                  <SelectTrigger className="w-32 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">7 dní</SelectItem>
                    <SelectItem value="30days">30 dní</SelectItem>
                    <SelectItem value="90days">90 dní</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    tickFormatter={(value) => `${value} Kč`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                    formatter={(value) => [`${value} Kč`, 'Tržby']}
                  />
                  <Bar 
                    dataKey="sales" 
                    fill="#3B82F6" 
                    radius={[4, 4, 0, 0]}
                    className="hover:opacity-80 transition-opacity"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Action Items */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Úkoly k dokončení</h2>
            <Button variant="outline" size="sm" className="text-sm">
              Zobrazit vše
            </Button>
          </div>
          
          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <Package className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">6 objednávek k vyřízení</p>
                    <p className="text-sm text-gray-500">Nové objednávky čekají na zpracování</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-orange-100 text-orange-800 text-xs px-2 py-1">URGENTNÍ</Badge>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">50+ plateb k zachycení</p>
                    <p className="text-sm text-gray-500">Platby čekají na potvrzení</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800 text-xs px-2 py-1">NOVÉ</Badge>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                    <RotateCcw className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">1 zpětné zúčtování ke kontrole</p>
                    <p className="text-sm text-gray-500">Vyžaduje okamžitou pozornost</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-100 text-red-800 text-xs px-2 py-1">KRITICKÉ</Badge>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Promotional Card */}
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold">💡</span>
                    </div>
                    <span className="text-xs font-medium uppercase tracking-wide opacity-90">DOPORUČENÍ</span>
                  </div>
                  <h3 className="text-xl font-bold leading-tight">Přepněte na Shopify Payments a nabídněte Apple Pay</h3>
                  <p className="text-white/90 text-sm leading-relaxed">
                    Získejte více konverzí s rychlejším a bezpečnějším způsobem placení. Snižte poplatky a zjednodušte správu plateb.
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <Button className="bg-white text-green-600 hover:bg-gray-50 font-semibold px-4 py-2">
                      Nastavit Shopify Payments
                    </Button>
                    <Button variant="ghost" className="text-white hover:bg-white/10 text-sm">
                      Zjistit více
                    </Button>
                  </div>
                </div>
                <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <CreditCard className="h-10 w-10 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Section */}
        <div className="space-y-6">
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-gray-900">Rozpis celkových tržeb</CardTitle>
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">Brutto tržby</span>
                  </div>
                  <span className="font-semibold text-gray-900">{analytics?.grossSales ? `${analytics.grossSales.toLocaleString('cs-CZ')} Kč` : '0 Kč'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-600">Slevy</span>
                  </div>
                  <span className="font-semibold text-orange-600">-{analytics?.discounts ? `${analytics.discounts.toLocaleString('cs-CZ')} Kč` : '0 Kč'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-gray-600">Vrácené</span>
                  </div>
                  <span className="font-semibold text-red-600">-{analytics?.returns ? `${analytics.returns.toLocaleString('cs-CZ')} Kč` : '0 Kč'}</span>
                </div>
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="font-bold text-gray-900">Netto tržby</span>
                    <span className="font-bold text-xl text-gray-900">{analytics?.netSales ? `${analytics.netSales.toLocaleString('cs-CZ')} Kč` : '0 Kč'}</span>
                  </div>
                </div>
                
                {/* Simple Progress Bar */}
                <div className="mt-6">
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>Pokrok k cíli</span>
                    <span>{analytics?.goalProgress ? `${analytics.goalProgress}%` : '0%'}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: `${analytics?.goalProgress || 0}%`}}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-gray-900">Tržby podle kanálu</CardTitle>
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Online obchod</p>
                      <p className="text-xs text-gray-500">{analytics?.channelPercentages?.online || 0}% tržeb</p>
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900">{analytics?.channelSales?.online ? `${analytics.channelSales.online.toLocaleString('cs-CZ')} Kč` : '0 Kč'}</span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Package className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Ostatní</p>
                      <p className="text-xs text-gray-500">{analytics?.channelPercentages?.other || 0}% tržeb</p>
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900">{analytics?.channelSales?.other ? `${analytics.channelSales.other.toLocaleString('cs-CZ')} Kč` : '0 Kč'}</span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Eye className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Vyhledávač</p>
                      <p className="text-xs text-gray-500">{analytics?.channelPercentages?.search || 0}% tržeb</p>
                    </div>
                  </div>
                  <span className="font-semibold text-gray-500">{analytics?.channelSales?.search ? `${analytics.channelSales.search.toLocaleString('cs-CZ')} Kč` : '0 Kč'}</span>
                </div>
                
                {/* Channel Performance Chart */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>Výkonnost kanálů</span>
                    <span>Tento měsíc</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{width: `${analytics?.channelPercentages?.online || 0}%`}}></div>
                      </div>
                      <span className="text-xs text-gray-500 w-12">{analytics?.channelPercentages?.online || 0}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-purple-500 h-1.5 rounded-full" style={{width: `${analytics?.channelPercentages?.other || 0}%`}}></div>
                      </div>
                      <span className="text-xs text-gray-500 w-12">{analytics?.channelPercentages?.other || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}