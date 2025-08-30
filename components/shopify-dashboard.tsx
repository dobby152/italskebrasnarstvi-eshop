"use client"

import { Card, CardContent, CardHeader, CardTitle } from "../app/components/ui/card"
import { Button } from "../app/components/ui/button"
import { Badge } from "../app/components/ui/badge"
import {
  Home,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Percent,
  Smartphone,
  Store,
  ChevronRight,
  CreditCard,
  RotateCcw,
  Apple,
} from "lucide-react"
import { BarChart, Bar, ResponsiveContainer } from "recharts"
import Link from "next/link"

// Demo data removed - will be replaced with real API data
const chartData: any[] = []

const sidebarItems = [
  { icon: Home, label: "Domů", active: true, href: "/" },
  { icon: ShoppingCart, label: "Objednávky", badge: "46", href: "/objednavky" },
  { icon: Package, label: "Produkty", href: "/produkty" },
  { icon: Users, label: "Zákazníci", href: "/zakaznici" },
  { icon: BarChart3, label: "Analytika", href: "/analytika" },
  { icon: Percent, label: "Slevy", href: "/slevy" },
  { icon: Smartphone, label: "Aplikace", href: "/aplikace" },
]

const salesChannels = [{ icon: Store, label: "Online obchod" }]

export function ShopifyDashboard() {
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
              <h1 className="text-2xl font-bold text-foreground">Domů</h1>
              <p className="text-muted-foreground">
                Ahoj Richardě — zde je přehled toho, co se dnes děje ve vašem obchodě.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <select className="px-3 py-2 border border-border rounded-md text-sm bg-background">
                <option>Všechny kanály</option>
              </select>
              <select className="px-3 py-2 border border-border rounded-md text-sm bg-background">
                <option>Dnes</option>
              </select>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">CELKOVÉ TRŽBY</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">$218.84</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-muted-foreground">8 celkem objednávek</span>
                  <Button variant="link" className="text-xs p-0 h-auto text-primary">
                    Zobrazit zprávu
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">CELKOVÉ RELACE</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">199</div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-accent text-accent-foreground text-xs">NOVÉ</Badge>
                  <span className="text-sm text-muted-foreground">4 návštěvníci</span>
                  <Button variant="link" className="text-xs p-0 h-auto text-primary">
                    Zobrazit živě
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">CELKOVÉ TRŽBY</CardTitle>
                <div className="text-xs text-muted-foreground">Dnes</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">$218.84</div>
                <div className="text-sm text-muted-foreground mt-2">6 objednávek</div>
                <div className="mt-4">
                  <ResponsiveContainer width="100%" height={60}>
                    <BarChart data={chartData}>
                      <Bar dataKey="sales" fill="var(--chart-1)" radius={2} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Action Items */}
            <div className="space-y-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <ShoppingCart className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium text-card-foreground">6 objednávek k vyřízení</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-accent" />
                      </div>
                      <span className="font-medium text-card-foreground">50+ plateb k zachycení</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center">
                        <RotateCcw className="h-4 w-4 text-destructive" />
                      </div>
                      <span className="font-medium text-card-foreground">1 zpětné zúčtování ke kontrole</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              {/* Apple Pay Promotion */}
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                        <Apple className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-card-foreground mb-1">
                        Přepněte na Shopify Payments a nabídněte Apple Pay
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Umožněte svým zákazníkům provádět snadné a bezpečné nákupy na jejich iPhone, iPad a Mac pomocí
                        Apple Pay.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sales Breakdown */}
            <div className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">ROZPIS CELKOVÝCH TRŽEB</CardTitle>
                    <span className="text-xs text-muted-foreground">Dnes</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Objednávky</span>
                    <span className="font-medium text-card-foreground">$714.84</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Vrácení</span>
                    <span className="font-medium text-card-foreground">$0.00</span>
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-card-foreground">Celkové tržby</span>
                      <span className="font-bold text-card-foreground">$714.84</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      CELKOVÉ TRŽBY PODLE KANÁLU
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">Dnes</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Online obchod</span>
                    <span className="font-medium text-card-foreground">$200.84</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Slevy</span>
                    <span className="font-medium text-card-foreground">-</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Ostatní</span>
                    <span className="font-medium text-card-foreground">$14.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Vyhledávač</span>
                    <span className="font-medium text-card-foreground">-</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
