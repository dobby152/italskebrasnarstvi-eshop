'use client'

import { useState, useEffect } from 'react'
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { 
  Package, 
  Warehouse, 
  AlertTriangle, 
  TrendingUp, 
  Search,
  Plus,
  Edit,
  ArrowUpDown,
  MapPin
} from "lucide-react"
import { Alert, AlertDescription } from "./ui/alert"

interface InventoryLocation {
  id: number
  name: string
  code: string
  city: string
  country: string
  location_type: string
  is_active: boolean
  fulfills_online_orders: boolean
}

interface ProductVariant {
  id: number
  product_id: number
  sku: string
  title: string
  option1_name?: string
  option1_value?: string
  option2_name?: string
  option2_value?: string
  price: number
  track_inventory: boolean
}

interface InventoryItem {
  id: number
  variant: ProductVariant
  location: InventoryLocation
  available_quantity: number
  committed_quantity: number
  incoming_quantity: number
  sellable_quantity: number
  cost_per_item: number
  is_low_stock: boolean
}

interface StockLevel {
  sku: string
  product_name: string
  variant_title: string
  location_name: string
  available_quantity: number
  committed_quantity: number
  incoming_quantity: number
  sellable_quantity: number
  cost_per_item: number
  is_low_stock: boolean
}

export function InventoryManagement() {
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([])
  const [locations, setLocations] = useState<InventoryLocation[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchInventoryData()
    fetchLocations()
  }, [])

  const fetchInventoryData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/inventory/stock-levels')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setStockLevels(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching inventory data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory data')
    } finally {
      setLoading(false)
    }
  }

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/inventory/locations')
      if (response.ok) {
        const data = await response.json()
        setLocations(data)
      }
    } catch (err) {
      console.error('Error fetching locations:', err)
    }
  }

  const filteredStockLevels = stockLevels.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesLocation = selectedLocation === 'all' || 
      item.location_name === selectedLocation
    
    const matchesLowStock = !showLowStockOnly || item.is_low_stock
    
    return matchesSearch && matchesLocation && matchesLowStock
  })

  const totalValue = filteredStockLevels.reduce((sum, item) => 
    sum + (item.available_quantity * item.cost_per_item), 0
  )

  const lowStockCount = stockLevels.filter(item => item.is_low_stock).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Správa skladu</h1>
          <p className="text-muted-foreground">
            Sledování zásob, lokací a pohybů skladu
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            Transfer zásob
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Úprava zásob
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error} - Inventory tracking tabulky pravděpodobně neexistují. 
            Spusťte inventory_tracking_system.sql v Supabase dashboard.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Celkové zásoby</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stockLevels.reduce((sum, item) => sum + item.available_quantity, 0).toLocaleString('cs-CZ')}
            </div>
            <p className="text-xs text-muted-foreground">
              kusů na skladě
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hodnota zásob</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalValue.toLocaleString('cs-CZ')} Kč
            </div>
            <p className="text-xs text-muted-foreground">
              celková hodnota
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nízké zásoby</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {lowStockCount}
            </div>
            <p className="text-xs text-muted-foreground">
              položek s nízkými zásobami
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lokace</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {locations.filter(l => l.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              aktivních lokací
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stock-levels" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stock-levels">Úrovně zásob</TabsTrigger>
          <TabsTrigger value="locations">Lokace</TabsTrigger>
          <TabsTrigger value="movements">Pohyby</TabsTrigger>
        </TabsList>

        <TabsContent value="stock-levels" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Hledat podle SKU nebo názvu produktu..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všechny lokace</SelectItem>
                    {locations.map(location => (
                      <SelectItem key={location.id} value={location.name}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant={showLowStockOnly ? "default" : "outline"}
                  onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Pouze nízké zásoby
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stock Levels Table */}
          <Card>
            <CardHeader>
              <CardTitle>Aktuální stav zásob</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Produkt</TableHead>
                      <TableHead>Lokace</TableHead>
                      <TableHead className="text-right">Dostupné</TableHead>
                      <TableHead className="text-right">Rezervované</TableHead>
                      <TableHead className="text-right">Příchozí</TableHead>
                      <TableHead className="text-right">K prodeji</TableHead>
                      <TableHead className="text-right">Hodnota</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStockLevels.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                          {error ? 'Chyba při načítání dat' : 'Žádné zásoby nenalezeny'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStockLevels.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.product_name}</div>
                              <div className="text-sm text-muted-foreground">{item.variant_title}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1 text-muted-foreground" />
                              {item.location_name}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{item.available_quantity}</TableCell>
                          <TableCell className="text-right text-orange-600">{item.committed_quantity}</TableCell>
                          <TableCell className="text-right text-blue-600">{item.incoming_quantity}</TableCell>
                          <TableCell className="text-right font-medium">{item.sellable_quantity}</TableCell>
                          <TableCell className="text-right">
                            {(item.available_quantity * item.cost_per_item).toLocaleString('cs-CZ')} Kč
                          </TableCell>
                          <TableCell>
                            {item.is_low_stock ? (
                              <Badge variant="destructive">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Nízké zásoby
                              </Badge>
                            ) : (
                              <Badge variant="secondary">V pořádku</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations">
          <Card>
            <CardHeader>
              <CardTitle>Skladové lokace</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Název</TableHead>
                    <TableHead>Kód</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Lokalita</TableHead>
                    <TableHead>Online objednávky</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Akce</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map(location => (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium">{location.name}</TableCell>
                      <TableCell className="font-mono">{location.code}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {location.location_type === 'warehouse' ? 'Sklad' :
                           location.location_type === 'store' ? 'Prodejna' :
                           location.location_type === 'supplier' ? 'Dodavatel' : location.location_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{location.city}, {location.country}</TableCell>
                      <TableCell>
                        {location.fulfills_online_orders ? (
                          <Badge variant="secondary">Ano</Badge>
                        ) : (
                          <Badge variant="outline">Ne</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {location.is_active ? (
                          <Badge variant="secondary">Aktivní</Badge>
                        ) : (
                          <Badge variant="destructive">Neaktivní</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle>Pohyby zásob</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                Pohyby zásob budou zobrazeny zde po implementaci backend endpointu
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}