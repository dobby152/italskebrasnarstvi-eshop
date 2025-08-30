"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Plus,
  Download,
  Upload,
  Trash2,
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
  Package,
  Grid3X3,
  List,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { useProducts, useProductStats } from '@/hooks/useProducts'
import { formatPrice, getImageUrl, getProductDisplayName, getProductDisplayCollection, transformProduct, Product } from '@/lib/api'
import { ProductEditDialog } from './product-edit-dialog'
import { InventoryManagement } from './inventory-management'

// Helper function to get status badge
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Aktivní</Badge>
    case 'draft':
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Koncept</Badge>
    case 'archived':
      return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">Vyprodáno</Badge>
    default:
      return <Badge variant="secondary">Neznámý</Badge>
  }
}

// Product Card Component
const ProductCard = ({ product }: { product: any }) => {
  const transformedProduct = transformProduct(product)
  const status = transformedProduct.availability === 'out_of_stock' ? 'archived' : 'active'
  const displayName = getProductDisplayName(transformedProduct)
  const displayCollection = getProductDisplayCollection(transformedProduct)
  const mainImage = transformedProduct.mainImage || transformedProduct.image
  
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-white">
      <CardContent className="p-0">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden rounded-t-lg bg-gray-50">
          <img
            src={product.image_url || (product.images?.[0] ? getImageUrl(product.images[0]) : '/placeholder.svg?height=300&width=300')}
            alt={displayName}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = '/placeholder.svg?height=300&width=300'
            }}
          />
          
          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            {getStatusBadge(status)}
          </div>
          
          {/* Actions */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="h-8 w-8 p-0 bg-white/90 hover:bg-white">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  Zobrazit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Upravit
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Smazat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Product Info */}
        <div className="p-4">
          <div className="space-y-2">
            <div>
              <h3 className="font-semibold text-lg leading-tight line-clamp-2">{displayName}</h3>
              {displayCollection && (
                <p className="text-sm text-muted-foreground">{displayCollection}</p>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground bg-gray-100 px-2 py-1 rounded">
                {product.sku || 'N/A'}
              </span>
              <div className="flex items-center gap-1 text-sm">
                <Package className="h-3 w-3" />
                <span className={product.stock <= 0 ? 'text-red-600' : product.stock < 10 ? 'text-yellow-600' : 'text-green-600'}>
                  {product.stock} ks
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <span className="text-xl font-bold text-primary">{formatPrice(product.price)}</span>
              <Button size="sm" className="h-8">
                <ShoppingCart className="h-3 w-3 mr-1" />
                Upravit
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Loading Card Component
const LoadingCard = () => (
  <Card className="border-0 shadow-sm">
    <CardContent className="p-0">
      <div className="aspect-square bg-gray-200 rounded-t-lg animate-pulse"></div>
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
        </div>
        <div className="flex justify-between items-center pt-2">
          <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
        </div>
      </div>
    </CardContent>
  </Card>
)

export function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'products' | 'inventory'>('products')

  // Use real API data with higher limit to show all products
  const { products, loading, error, total, totalPages, setSearch, setPage } = useProducts({
    page: currentPage,
    limit: 1000, // Increased limit to show all products
    search: searchTerm,
    autoFetch: true
  })

  
  
  
  const { stats, loading: statsLoading } = useProductStats()
  
  // Debug logging
  useEffect(() => {
  }, [stats])

  // Update search when searchTerm changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearch(searchTerm)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, setSearch])

  // Filter products based on selected filters
  const filteredProducts = products.filter(product => {
    if (selectedStatus === 'all') return true
    
    // Map product stock to status
    if (selectedStatus === 'active') return product.stock > 0
    if (selectedStatus === 'archived') return product.stock === 0
    if (selectedStatus === 'draft') return false // No draft status in real data
    
    return true
  })

  // Handlers for product editing  
  const handleEditProduct = (product: Product) => {
    if (!product) {
      console.error('Cannot edit product: Product is null or undefined')
      return
    }
    
    try {
      setEditingProduct(product)
      setIsEditDialogOpen(true)
    } catch (error) {
      console.error('Error opening product edit dialog:', error)
    }
  }

  const handleProductUpdated = (updatedProduct: Product) => {
    // Refresh the products list - would need to implement refresh logic
    // TODO: Implement actual product refresh logic
  }

  const handleCloseEditDialog = () => {
    try {
      setIsEditDialogOpen(false)
      setEditingProduct(null)
    } catch (error) {
      console.error('Error closing product edit dialog:', error)
    }
  }

  const totalProducts = stats?.total || 0
  const activeProducts = stats?.active || 0
  const draftProducts = 0 // No draft products in real data
  const outOfStockProducts = stats?.outOfStock || 0

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Package className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Správa produktů</h1>
              </div>
              <p className="text-gray-600">Přehled a správa všech produktů v e-shopu</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                <Download className="h-4 w-4 mr-2" />
                Export dat
              </Button>
              <Button size="sm" className="flex-1 sm:flex-none">
                <Plus className="h-4 w-4 mr-2" />
                Přidat produkt
              </Button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="border-t mt-6 pt-4">
            <div className="flex space-x-6">
              <button
                onClick={() => setActiveTab('products')}
                className={`flex items-center gap-2 pb-2 border-b-2 font-medium transition-colors ${
                  activeTab === 'products'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Package className="h-4 w-4" />
                Produkty
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`flex items-center gap-2 pb-2 border-b-2 font-medium transition-colors ${
                  activeTab === 'inventory'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                Skladové zásoby
              </button>
            </div>
          </div>
        </div>

        {/* Products Tab Content */}
        {activeTab === 'products' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Celkem produktů</p>
                  <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Aktivní produkty</p>
                  <p className="text-2xl font-bold text-green-600">{activeProducts}</p>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Koncepty</p>
                  <p className="text-2xl font-bold text-yellow-600">{draftProducts}</p>
                </div>
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Vyprodáno</p>
                  <p className="text-2xl font-bold text-red-600">{outOfStockProducts}</p>
                </div>
                <div className="p-2 bg-red-50 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Hledat podle názvu, SKU nebo kolekce..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 lg:w-auto">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full sm:w-[160px] h-10">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Stav" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všechny stavy</SelectItem>
                    <SelectItem value="active">Aktivní</SelectItem>
                    <SelectItem value="draft">Koncept</SelectItem>
                    <SelectItem value="archived">Vyprodáno</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex border rounded-lg p-1 bg-gray-50">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8 px-3"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 px-3"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" className="h-10">
                  <Filter className="h-4 w-4 mr-2" />
                  Více filtrů
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Display */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Produkty ({filteredProducts.length})</h2>
          </div>
          
          {viewMode === 'list' ? (
            <Card className="border-0 shadow-sm">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-gray-900">Produkt</TableHead>
                      <TableHead className="font-semibold text-gray-900">SKU</TableHead>
                      <TableHead className="font-semibold text-gray-900">Stav</TableHead>
                      <TableHead className="font-semibold text-gray-900">Zásoby</TableHead>
                      <TableHead className="font-semibold text-gray-900">Cena</TableHead>
                      <TableHead className="font-semibold text-gray-900">Kolekce</TableHead>
                      <TableHead className="text-right font-semibold text-gray-900">Akce</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      [...Array(10)].map((_, i) => (
                        <TableRow key={i} className="hover:bg-gray-50">
                          <TableCell className="py-4">
                            <div className="flex items-center space-x-3">
                              <div className="h-14 w-14 bg-gray-200 rounded-lg animate-pulse"></div>
                              <div className="space-y-2">
                                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></TableCell>
                          <TableCell><div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div></TableCell>
                          <TableCell><div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div></TableCell>
                          <TableCell><div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div></TableCell>
                          <TableCell><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></TableCell>
                          <TableCell><div className="h-8 w-8 bg-gray-200 rounded animate-pulse ml-auto"></div></TableCell>
                        </TableRow>
                      ))
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <div className="flex flex-col items-center space-y-2">
                            <AlertTriangle className="h-8 w-8 text-red-500" />
                            <div className="text-red-600 font-medium">Chyba při načítání produktů</div>
                            <div className="text-gray-500 text-sm">{error}</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <div className="flex flex-col items-center space-y-2">
                            <Package className="h-8 w-8 text-gray-400" />
                            <div className="text-gray-500 font-medium">Žádné produkty nenalezeny</div>
                            <div className="text-gray-400 text-sm">Zkuste změnit filtry nebo vyhledávací kritéria</div>
                            <Button variant="outline" onClick={() => {
                              setSearchTerm('')
                              setSelectedStatus('all')
                            }}>
                              Vymazat filtry
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((product) => {
                        if (!product?.id) {
                          console.warn('Skipping product with missing ID:', product)
                          return null
                        }
                        
                        try {
                        const transformedProduct = transformProduct(product)
                        const status = transformedProduct.availability === 'out_of_stock' ? 'archived' : 'active'
                        const displayName = getProductDisplayName(transformedProduct)
                        const displayCollection = getProductDisplayCollection(transformedProduct)
                        const mainImage = transformedProduct.mainImage || transformedProduct.image
                        
                        return (
                          <TableRow key={product.id} className="hover:bg-gray-50 transition-colors">
                            <TableCell className="py-4">
                              <div className="flex items-center space-x-3">
                                <div className="relative">
                                  <div className="h-14 w-14 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 border">
                                    {product.image_url || product.images?.[0] ? (
                                      <img
                                        src={product.image_url || (product.images?.[0] ? getImageUrl(product.images[0]) : '')}
                                        alt={displayName}
                                        className="h-full w-full object-cover object-center"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement
                                          target.style.display = 'none'
                                          const icon = target.parentElement?.querySelector('.fallback-icon')
                                          if (icon) icon.classList.remove('hidden')
                                        }}
                                      />
                                    ) : null}
                                    <Package className={`h-6 w-6 text-gray-400 fallback-icon ${product.image_url || product.images?.[0] ? 'hidden' : ''}`} />
                                  </div>
                                  {product.stock === 0 && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-gray-900 truncate">{displayName}</div>
                                  <div className="text-sm text-gray-500 truncate">
                                    {(product.description_cz || product.description || 'Bez popisu').substring(0, 60)}...
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm text-gray-600">{product.sku || 'N/A'}</TableCell>
                            <TableCell>
                              {getStatusBadge(status)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <span className={product.stock <= 0 ? 'text-red-600 font-medium' : product.stock < 10 ? 'text-yellow-600 font-medium' : 'text-green-600 font-medium'}>
                                  {product.stock}
                                </span>
                                <span className="text-gray-400 text-sm">ks</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-gray-900">{formatPrice(product.price)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {displayCollection || 'Nezařazeno'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditProduct(product)}
                                  className="h-8 px-3"
                                >
                                  <Edit className="mr-1 h-3 w-3" />
                                  Upravit
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <Eye className="mr-2 h-4 w-4" />
                                      Zobrazit detail
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600">
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Smazat produkt
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                        } catch (productError) {
                          console.error('Error rendering product:', product?.id, productError)
                          return (
                            <TableRow key={`error-${product?.id || Math.random()}`}>
                              <TableCell colSpan={7} className="text-center py-4 text-red-600">
                                Chyba při zobrazení produktu {product?.name || product?.id}
                              </TableCell>
                            </TableRow>
                          )
                        }
                      }).filter(Boolean)
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               {loading ? (
                 Array.from({ length: 8 }).map((_, i) => (
                   <Card key={i} className="overflow-hidden">
                     <div className="aspect-square bg-gray-200 animate-pulse" />
                     <CardContent className="p-4">
                       <div className="space-y-2">
                         <div className="h-4 bg-gray-200 rounded animate-pulse" />
                         <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                         <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
                       </div>
                     </CardContent>
                   </Card>
                 ))
               ) : error ? (
                 <div className="col-span-full flex flex-col items-center justify-center py-12">
                   <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                   <div className="text-red-600 font-medium mb-2">Chyba při načítání produktů</div>
                   <div className="text-gray-500 text-sm">{error}</div>
                 </div>
               ) : filteredProducts.length === 0 ? (
                 <div className="col-span-full flex flex-col items-center justify-center py-12">
                   <Package className="h-12 w-12 text-gray-400 mb-4" />
                   <div className="text-gray-500 font-medium mb-2">Žádné produkty nenalezeny</div>
                   <div className="text-gray-400 text-sm mb-4">Zkuste změnit filtry nebo vyhledávací kritéria</div>
                   <Button variant="outline" onClick={() => {
                     setSearchTerm('')
                     setSelectedStatus('all')
                   }}>
                     Vymazat filtry
                   </Button>
                 </div>
               ) : (
                 filteredProducts.map((product) => {
                   if (!product?.id) {
                     console.warn('Skipping product with missing ID:', product)
                     return null
                   }
                   
                   try {
                     const transformedProduct = transformProduct(product)
                     const status = transformedProduct.availability === 'out_of_stock' ? 'archived' : 'active'
                     const displayName = getProductDisplayName(transformedProduct)
                     const displayCollection = getProductDisplayCollection(transformedProduct)
                     const mainImage = transformedProduct.mainImage || transformedProduct.image
                   
                   return (
                     <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                       <div className="aspect-square relative bg-gray-100">
                         {product.image_url || product.images?.[0] ? (
                           <img
                             src={product.image_url || (product.images?.[0] ? getImageUrl(product.images[0]) : '')}
                             alt={displayName}
                             className="w-full h-full object-cover"
                             onError={(e) => {
                               const target = e.target as HTMLImageElement
                               target.style.display = 'none'
                               const icon = target.parentElement?.querySelector('.fallback-icon')
                               if (icon) icon.classList.remove('hidden')
                             }}
                           />
                         ) : null}
                         <Package className={`absolute inset-0 m-auto h-12 w-12 text-gray-400 fallback-icon ${product.image_url || product.images?.[0] ? 'hidden' : ''}`} />
                         
                         {product.stock === 0 && (
                           <div className="absolute top-2 left-2">
                             <Badge variant="destructive" className="text-xs">Vyprodáno</Badge>
                           </div>
                         )}
                         
                         <div className="absolute top-2 right-2">
                           {getStatusBadge(status)}
                         </div>
                         
                         <div className="absolute bottom-2 right-2 flex space-x-1">
                           <Button 
                             variant="secondary" 
                             size="sm"
                             onClick={() => handleEditProduct(product)}
                             className="h-8 px-2"
                           >
                             <Edit className="h-3 w-3" />
                           </Button>
                           <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                               <Button variant="secondary" size="sm" className="h-8 w-8 p-0">
                                 <MoreHorizontal className="h-4 w-4" />
                               </Button>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="end">
                               <DropdownMenuItem>
                                 <Eye className="mr-2 h-4 w-4" />
                                 Zobrazit detail
                               </DropdownMenuItem>
                               <DropdownMenuItem className="text-red-600">
                                 <Trash2 className="mr-2 h-4 w-4" />
                                 Smazat produkt
                               </DropdownMenuItem>
                             </DropdownMenuContent>
                           </DropdownMenu>
                         </div>
                       </div>
                       
                       <CardContent className="p-4">
                         <div className="space-y-2">
                           <h3 className="font-medium text-sm line-clamp-2">{displayName}</h3>
                           <div className="flex items-center justify-between text-xs text-gray-500">
                             <span>SKU: {product.sku || 'N/A'}</span>
                             <Badge variant="outline" className="text-xs">
                               {displayCollection || 'Nezařazeno'}
                             </Badge>
                           </div>
                           <div className="flex items-center justify-between">
                             <div className="font-medium text-lg">{formatPrice(product.price)}</div>
                             <div className={`text-sm font-medium ${
                               product.stock <= 0 ? 'text-red-600' : 
                               product.stock < 10 ? 'text-yellow-600' : 'text-green-600'
                             }`}>
                               {product.stock} ks
                             </div>
                           </div>
                         </div>
                       </CardContent>
                     </Card>
                   )
                   } catch (productError) {
                     console.error('Error rendering product card:', product?.id, productError)
                     return (
                       <Card key={`error-${product?.id || Math.random()}`} className="overflow-hidden">
                         <CardContent className="p-4 text-center text-red-600">
                           <div className="text-sm">Chyba při zobrazení produktu</div>
                           <div className="text-xs text-gray-500">{product?.name || product?.id}</div>
                         </CardContent>
                       </Card>
                     )
                   }
                 }).filter(Boolean)
               )}
             </div>
          )}
        </div>
          </>
        )}

        {/* Inventory Management Tab */}
        {activeTab === 'inventory' && (
          <InventoryManagement />
        )}
      </div>
      
      {/* Product Edit Dialog */}
      <ProductEditDialog
        product={editingProduct}
        open={isEditDialogOpen}
        onOpenChange={handleCloseEditDialog}
        onProductUpdated={handleProductUpdated}
      />
    </div>
  )
}

export default ProductsPage
