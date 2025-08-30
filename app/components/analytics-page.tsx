"use client"

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import {
  Home,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Percent,
  Smartphone,
  Store,
  TrendingUp,
  TrendingDown,
  Download,
} from "lucide-react"
import Link from "next/link"
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

const sidebarItems = [
  { icon: Home, label: "Domů", href: "/" },
  { icon: ShoppingCart, label: "Objednávky", badge: "46", href: "/objednavky" },
  { icon: Package, label: "Produkty", href: "/produkty" },
  { icon: Users, label: "Zákazníci", href: "/zakaznici" },
  { icon: BarChart3, label: "Analytika", active: true, href: "/analytika" },
  { icon: Percent, label: "Slevy", href: "/slevy" },
  { icon: Smartphone, label: "Aplikace", href: "/aplikace" },
]

const salesChannels = [{ icon: Store, label: "Online obchod" }]

// Demo data removed - will be replaced with real API data
const salesData: any[] = []

// Demo data removed - will be replaced with real API data
const topProductsData: any[] = []

// Demo data removed - will be replaced with real API data
const trafficSourcesData: any[] = []

// Demo data removed - will be replaced with real API data
const conversionData: any[] = []

export function AnalyticsPage() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-4">
          <h1 className="text-xl font-bold text-sidebar-foreground">Shopify</h1>
        </div>

        <nav className="flex-1 px-2">
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <Link key={item.label} href={item.href}>
                <div
                  className={`flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${
                    item.active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8">
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Prodejní kanály
            </h3>
            <div className="space-y-1">
              {salesChannels.map((channel) => (
                <div
                  key={channel.label}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md cursor-pointer transition-colors"
                >
                  <channel.icon className="h-4 w-4" />
                  <span>{channel.label}</span>
                </div>
              ))}
            </div>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Analytika</h1>
              <p className="text-muted-foreground">Sledujte výkonnost vašeho obchodu a trendy</p>
            </div>
            <div className="flex items-center gap-3">
              <select className="px-3 py-2 border border-border rounded-md text-sm bg-background">
                <option>Posledních 30 dní</option>
                <option>Posledních 7 dní</option>
                <option>Tento měsíc</option>
                <option>Minulý měsíc</option>
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
                    <div className="text-2xl font-bold text-card-foreground">$32,847</div>
                    <div className="text-sm text-muted-foreground">Celkové tržby</div>
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">+12.5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-card-foreground">1,247</div>
                    <div className="text-sm text-muted-foreground">Objednávky</div>
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">+8.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-card-foreground">18,450</div>
                    <div className="text-sm text-muted-foreground">Návštěvníci</div>
                  </div>
                  <div className="flex items-center gap-1 text-red-600">
                    <TrendingDown className="h-4 w-4" />
                    <span className="text-sm font-medium">-3.1%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-card-foreground">3.4%</div>
                    <div className="text-sm text-muted-foreground">Konverzní poměr</div>
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">+0.8%</span>
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
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={topProductsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {topProductsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-4">
                  {topProductsData.map((product, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: product.color }} />
                        <span className="text-muted-foreground">{product.name}</span>
                      </div>
                      <span className="font-medium text-card-foreground">{product.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Traffic Sources */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Zdroje návštěvnosti</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {trafficSourcesData.map((source, index) => (
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
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Nedávná aktivita</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <ShoppingCart className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-card-foreground">Nová objednávka #1247</div>
                    <div className="text-xs text-muted-foreground">před 5 minutami</div>
                  </div>
                  <div className="text-sm font-medium text-card-foreground">$89.99</div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-card-foreground">Nový zákazník se registroval</div>
                    <div className="text-xs text-muted-foreground">před 12 minutami</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Package className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-card-foreground">Produkt má nízký stav</div>
                    <div className="text-xs text-muted-foreground">před 1 hodinou</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-card-foreground">Týdenní zpráva je připravena</div>
                    <div className="text-xs text-muted-foreground">před 2 hodinami</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
