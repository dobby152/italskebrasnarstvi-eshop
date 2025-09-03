"use client"

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import {
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
} from "lucide-react"
import { useStats } from "../hooks/useStats"
import { useAnalytics } from "../hooks/useAnalytics"
import { useState } from "react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

export function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30days')
  const { data: stats, isLoading: statsLoading } = useStats()
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics({
    period: dateRange,
    channel: 'all'
  })

  const salesData = analytics?.salesChart || []
  const conversionData = analytics?.conversionChart || []

  if (statsLoading || analyticsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Analytika</h1>
              <p className="text-muted-foreground">Sledujte výkonnost vašeho obchodu a trendy</p>
            </div>
            <div className="flex items-center gap-3">
              <select 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-border rounded-md text-sm bg-background"
              >
                <option value="30days">Posledních 30 dní</option>
                <option value="7days">Posledních 7 dní</option>
                <option value="today">Dnes</option>
                <option value="yesterday">Včera</option>
              </select>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-card-foreground">
                      {stats?.totalRevenue ? `${stats.totalRevenue.toLocaleString('cs-CZ')} Kč` : '0 Kč'}
                    </div>
                    <div className="text-sm text-muted-foreground">Celkové tržby</div>
                  </div>
                  <div className={`flex items-center gap-1 ${stats?.revenueGrowth && stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats?.revenueGrowth && stats.revenueGrowth >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span className="text-sm font-medium">
                      {stats?.revenueGrowth ? `${stats.revenueGrowth > 0 ? '+' : ''}${stats.revenueGrowth.toFixed(1)}%` : '0%'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-card-foreground">{stats?.totalOrders || 0}</div>
                    <div className="text-sm text-muted-foreground">Objednávky</div>
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">+{stats?.ordersGrowth || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-card-foreground">{analytics?.totalVisitors || 0}</div>
                    <div className="text-sm text-muted-foreground">Návštěvníci</div>
                  </div>
                  <div className={`flex items-center gap-1 ${analytics?.visitorsGrowth && analytics.visitorsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analytics?.visitorsGrowth && analytics.visitorsGrowth >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span className="text-sm font-medium">
                      {analytics?.visitorsGrowth ? `${analytics.visitorsGrowth > 0 ? '+' : ''}${analytics.visitorsGrowth.toFixed(1)}%` : '0%'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-card-foreground">
                      {analytics?.conversionRate ? `${analytics.conversionRate.toFixed(1)}%` : '0%'}
                    </div>
                    <div className="text-sm text-muted-foreground">Konverzní poměr</div>
                  </div>
                  <div className={`flex items-center gap-1 ${analytics?.conversionGrowth && analytics.conversionGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analytics?.conversionGrowth && analytics.conversionGrowth >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span className="text-sm font-medium">
                      {analytics?.conversionGrowth ? `${analytics.conversionGrowth > 0 ? '+' : ''}${analytics.conversionGrowth.toFixed(1)}%` : '0%'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Sales Chart */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Tržby za posledních 15 dní</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="var(--chart-1)"
                      fill="var(--chart-1)"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Conversion Rate Chart */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Konverzní poměr</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={conversionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="var(--chart-2)"
                      strokeWidth={3}
                      dot={{ fill: "var(--chart-2)", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Products */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Nejprodávanější produkty</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.topProducts && analytics.topProducts.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.topProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                          </div>
                          <div>
                            <div className="font-medium text-sm">{product.name}</div>
                            <div className="text-xs text-muted-foreground">{product.sales} prodejů</div>
                          </div>
                        </div>
                        <div className="font-medium">{product.revenue} Kč</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Žádná data o nejprodávanějších produktech
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Traffic Sources */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Zdroje návštěvnosti</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.trafficSources && analytics.trafficSources.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.trafficSources.map((source, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{source.source}</span>
                          <span className="font-medium text-card-foreground">{source.visitors}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-chart-1 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${source.percentage}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground text-right">{source.percentage}%</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Žádná data o zdrojích návštěvnosti
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Nedávná aktivita</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className={`w-8 h-8 ${activity.type === 'order' ? 'bg-green-100' : activity.type === 'customer' ? 'bg-blue-100' : 'bg-yellow-100'} rounded-full flex items-center justify-center`}>
                          {activity.type === 'order' ? (
                            <ShoppingCart className="h-4 w-4 text-green-600" />
                          ) : activity.type === 'customer' ? (
                            <Users className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Package className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-card-foreground">{activity.description}</div>
                          <div className="text-xs text-muted-foreground">{activity.time}</div>
                        </div>
                        {activity.amount && (
                          <div className="text-sm font-medium text-card-foreground">{activity.amount}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Žádná nedávná aktivita
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  )
}
