"use client"

import { Card, CardContent } from "../app/components/ui/card"
import { Button } from "../app/components/ui/button"
import { Badge } from "../app/components/ui/badge"
import { Input } from "../app/components/ui/input"
import {
  BarChart3,
  Search,
  Filter,
  Star,
  Download,
  Settings,
  ExternalLink,
  Zap,
  Mail,
  Camera,
  CreditCard,
  Truck,
  MessageSquare,
} from "lucide-react"



const installedApps = [
  {
    id: "1",
    name: "Mailchimp",
    description: "Email marketing a automatizace",
    icon: Mail,
    category: "Marketing",
    rating: 4.8,
    reviews: 1247,
    status: "active",
    statusLabel: "Aktivní",
    lastUpdated: "před 2 dny",
    version: "2.1.4",
  },
  {
    id: "2",
    name: "Google Analytics",
    description: "Sledování návštěvnosti a konverzí",
    icon: BarChart3,
    category: "Analytika",
    rating: 4.9,
    reviews: 2156,
    status: "active",
    statusLabel: "Aktivní",
    lastUpdated: "před 1 týdnem",
    version: "1.8.2",
  },
  {
    id: "3",
    name: "Instagram Feed",
    description: "Zobrazení Instagram příspěvků",
    icon: Camera,
    category: "Sociální sítě",
    rating: 4.6,
    reviews: 892,
    status: "inactive",
    statusLabel: "Neaktivní",
    lastUpdated: "před 1 měsícem",
    version: "3.2.1",
  },
  {
    id: "4",
    name: "PayPal Express",
    description: "Rychlé platby přes PayPal",
    icon: CreditCard,
    category: "Platby",
    rating: 4.7,
    reviews: 1834,
    status: "active",
    statusLabel: "Aktivní",
    lastUpdated: "před 3 dny",
    version: "4.1.0",
  },
]

const recommendedApps = [
  {
    id: "5",
    name: "Klaviyo",
    description: "Pokročilý email marketing s AI",
    icon: Zap,
    category: "Marketing",
    rating: 4.9,
    reviews: 3421,
    price: "Zdarma",
    featured: true,
  },
  {
    id: "6",
    name: "Zendesk Chat",
    description: "Live chat podpora pro zákazníky",
    icon: MessageSquare,
    category: "Zákaznická podpora",
    rating: 4.8,
    reviews: 1567,
    price: "Od $14/měsíc",
    featured: false,
  },
  {
    id: "7",
    name: "ShipStation",
    description: "Správa dopravy a sledování zásilek",
    icon: Truck,
    category: "Doprava",
    rating: 4.7,
    reviews: 2234,
    price: "Od $9/měsíc",
    featured: true,
  },
  {
    id: "8",
    name: "Yotpo Reviews",
    description: "Sběr a zobrazení recenzí produktů",
    icon: Star,
    category: "Marketing",
    rating: 4.6,
    reviews: 1876,
    price: "Zdarma",
    featured: false,
  },
]

const categories = [
  { name: "Všechny", count: 1200 },
  { name: "Marketing", count: 340 },
  { name: "Analytika", count: 156 },
  { name: "Platby", count: 89 },
  { name: "Doprava", count: 124 },
  { name: "Zákaznická podpora", count: 78 },
  { name: "Sociální sítě", count: 92 },
  { name: "Produktivita", count: 145 },
]

const getStatusBadge = (status: string, label: string) => {
  const variants = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-800",
  }

  return <Badge className={`${variants[status as keyof typeof variants]} border-0`}>{label}</Badge>
}

const renderStars = (rating: number) => {
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating}</span>
    </div>
  )
}

export function AppsPage() {
  return (
    <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Aplikace</h1>
              <p className="text-muted-foreground">Rozšiřte funkčnost vašeho obchodu pomocí aplikací</p>
            </div>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Shopify App Store
            </Button>
          </div>

          {/* Search and Categories */}
          <div className="flex gap-6 mb-6">
            <div className="flex-1">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Hledat aplikace..." className="pl-10" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Filter className="h-4 w-4" />
                Filtrovat
              </Button>
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {categories?.map((category) => (
              <Button
                key={category.name}
                variant={category.name === "Všechny" ? "default" : "outline"}
                className="whitespace-nowrap flex items-center gap-2"
              >
                {category.name}
                <Badge variant="secondary" className="text-xs">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Installed Apps */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Nainstalované aplikace</h2>
              <Button variant="outline" size="sm">
                Spravovat vše
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {installedApps?.map((app) => (
                <Card key={app.id} className="bg-card border-border">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <app.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-card-foreground">{app.name}</h3>
                          <p className="text-sm text-muted-foreground">{app.description}</p>
                        </div>
                      </div>
                      {getStatusBadge(app.status, app.statusLabel)}
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-4">
                        {renderStars(app.rating)}
                        <span>({app.reviews} recenzí)</span>
                      </div>
                      <span>v{app.version}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Aktualizováno {app.lastUpdated}</span>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          {app.status === "active" ? "Deaktivovat" : "Aktivovat"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Recommended Apps */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Doporučené aplikace</h2>
              <Button variant="outline" size="sm">
                Zobrazit vše
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedApps?.map((app) => (
                <Card key={app.id} className="bg-card border-border relative">
                  {app.featured && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-yellow-100 text-yellow-800 border-0">Doporučeno</Badge>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <app.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-card-foreground">{app.name}</h3>
                        <p className="text-sm text-muted-foreground">{app.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm mb-4">
                      <div className="flex items-center gap-2">
                        {renderStars(app.rating)}
                        <span className="text-muted-foreground">({app.reviews})</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {app.category}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-medium text-card-foreground">{app.price}</span>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                          <Download className="h-4 w-4 mr-1" />
                          Instalovat
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* App Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-card-foreground">4</div>
                <div className="text-sm text-muted-foreground">Nainstalované aplikace</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">3</div>
                <div className="text-sm text-muted-foreground">Aktivní aplikace</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">2</div>
                <div className="text-sm text-muted-foreground">Aktualizace k dispozici</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-card-foreground">$47</div>
                <div className="text-sm text-muted-foreground">Měsíční náklady</div>
              </CardContent>
            </Card>
          </div>
    </div>
  )
}
