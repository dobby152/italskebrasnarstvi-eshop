"use client"

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import {
  Home,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Percent,
  Smartphone,
  Store,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Plus,
  Calendar,
  Tag,
  Gift,
} from "lucide-react"
import Link from "next/link"
import { useDiscounts } from "../hooks/use-discounts"

const sidebarItems = [
  { icon: Home, label: "Domů", href: "/" },
  { icon: ShoppingCart, label: "Objednávky", badge: "46", href: "/objednavky" },
  { icon: Package, label: "Produkty", href: "/produkty" },
  { icon: Users, label: "Zákazníci", href: "/zakaznici" },
  { icon: BarChart3, label: "Analytika", href: "/analytika" },
  { icon: Percent, label: "Slevy", active: true, href: "/slevy" },
  { icon: Smartphone, label: "Aplikace", href: "/aplikace" },
]

const salesChannels = [{ icon: Store, label: "Online obchod" }]



const getStatusBadge = (status: string, label: string) => {
  const variants = {
    active: "bg-green-100 text-green-800",
    expired: "bg-red-100 text-red-800",
    scheduled: "bg-blue-100 text-blue-800",
  }

  return <Badge className={`${variants[status as keyof typeof variants]} border-0`}>{label}</Badge>
}

const getDiscountIcon = (type: string) => {
  switch (type) {
    case "percentage":
      return <Percent className="h-4 w-4" />
    case "fixed":
      return <Tag className="h-4 w-4" />
    case "shipping":
      return <Gift className="h-4 w-4" />
    default:
      return <Percent className="h-4 w-4" />
  }
}

const getUsageProgress = (usage: number, limit: number | null) => {
  if (!limit) return 0
  return (usage / limit) * 100
}

export function DiscountsPage() {
  const { discounts, stats, loading, error } = useDiscounts()

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Načítám slevy...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">Chyba při načítání slev: {error}</p>
            <Button onClick={() => window.location.reload()}>Zkusit znovu</Button>
          </div>
        </div>
      </div>
    )
  }

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
              <h1 className="text-2xl font-bold text-foreground">Slevy</h1>
              <p className="text-muted-foreground">Vytvářejte a spravujte slevové kódy a akce</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline">Export</Button>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Vytvořit slevu
              </Button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Hledat slevy..." className="pl-10" />
            </div>
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <Filter className="h-4 w-4" />
              Filtrovat
            </Button>
            <select className="px-3 py-2 border border-border rounded-md text-sm bg-background">
              <option>Všechny slevy</option>
              <option>Aktivní</option>
              <option>Naplánované</option>
              <option>Vypršelé</option>
            </select>
            <select className="px-3 py-2 border border-border rounded-md text-sm bg-background">
              <option>Všechny typy</option>
              <option>Procentuální</option>
              <option>Pevná částka</option>
              <option>Doprava zdarma</option>
            </select>
          </div>

          {/* Discounts Table */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Slevy ({stats?.total || 0})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr className="text-left">
                      <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Sleva
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Kód
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Typ
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Hodnota
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Využití
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Stav
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Platnost
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Akce
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {discounts.map((discount) => (
                      <tr key={discount.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              {getDiscountIcon(discount.type)}
                            </div>
                            <div>
                              <div className="font-medium text-card-foreground cursor-pointer hover:underline">
                                {discount.title}
                              </div>
                              <div className="text-sm text-muted-foreground">{discount.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <code className="px-2 py-1 bg-muted rounded text-sm font-mono">{discount.code}</code>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground capitalize">
                          {discount.type === "percentage" && "Procentuální"}
                          {discount.type === "fixed" && "Pevná částka"}
                          {discount.type === "shipping" && "Doprava"}
                        </td>
                        <td className="px-6 py-4 font-medium text-card-foreground">{discount.value}</td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-card-foreground">
                              {discount.usage}
                              {discount.limit && ` / ${discount.limit}`}
                            </div>
                            {discount.limit && (
                              <div className="w-full bg-muted rounded-full h-1.5">
                                <div
                                  className="bg-chart-1 h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${getUsageProgress(discount.usage, discount.limit)}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(discount.status, discount.statusLabel)}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {discount.startDate}
                            </div>
                            <div className="text-xs mt-1">do {discount.endDate}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-card-foreground">{stats?.total || 0}</div>
                <div className="text-sm text-muted-foreground">Celkem slev</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{stats?.active || 0}</div>
                <div className="text-sm text-muted-foreground">Aktivní slevy</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{stats?.scheduled || 0}</div>
                <div className="text-sm text-muted-foreground">Naplánované</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-card-foreground">{stats?.totalUsage || 0}</div>
                <div className="text-sm text-muted-foreground">Celkem využití</div>
              </CardContent>
            </Card>
          </div>

          {/* Discount Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Nejúspěšnější slevy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {discounts
                  .filter((d) => d.status === "active")
                  .sort((a, b) => b.usage - a.usage)
                  .slice(0, 3)
                  .map((discount) => (
                    <div key={discount.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          {getDiscountIcon(discount.type)}
                        </div>
                        <div>
                          <div className="font-medium text-card-foreground">{discount.title}</div>
                          <div className="text-sm text-muted-foreground">{discount.code}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-card-foreground">{discount.usage}</div>
                        <div className="text-sm text-muted-foreground">využití</div>
                      </div>
                    </div>
                  ))}
                {discounts.filter((d) => d.status === "active").length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Percent className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Žádné aktivní slevy</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Nadcházející slevy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {discounts
                  .filter((d) => d.status === "scheduled")
                  .map((discount) => (
                    <div key={discount.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          {getDiscountIcon(discount.type)}
                        </div>
                        <div>
                          <div className="font-medium text-card-foreground">{discount.title}</div>
                          <div className="text-sm text-muted-foreground">Začíná {discount.startDate}</div>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 border-0">Naplánována</Badge>
                    </div>
                  ))}
                {discounts.filter((d) => d.status === "scheduled").length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Žádné naplánované slevy</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
