"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
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
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Separator } from './ui/separator'
import { useProducts, useProductStats } from '../hooks/useProducts'
import { formatPrice, getImageUrl, getProductDisplayName, getProductDisplayCollection, transformProduct, Product } from '../lib/api'
import { ProductEditDialog } from './product-edit-dialog'

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
const ProductCard = ({ product, onStatusChange }: { product: any, onStatusChange?: (productId: string, newStatus: string) => void }) => {
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
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Upravit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onStatusChange?.(product.id.toString(), status === 'active' ? 'archived' : 'active')}
                >
                  {status === 'active' ? (
                    <>
                      <ToggleLeft className="mr-2 h-4 w-4" />
                      Označit jako nedostupné
                    </>
                  ) : (
                    <>
                      <ToggleRight className="mr-2 h-4 w-4" />
                      Označit jako dostupné
                    </>
                  )}
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

// Pagination Component
const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number, 
  totalPages: number, 
  onPageChange: (page: number) => void 
}) => {
  const getVisiblePages = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="h-9 px-3"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Předchozí
      </Button>

      <div className="flex items-center gap-1">
        {getVisiblePages().map((page, index) => {
          if (page === '...') {
            return (
              <span key={`dots-${index}`} className="px-2 text-gray-400">
                ...
              </span>
            )
          }

          return (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page as number)}
              className="h-9 w-9"
            >
              {page}
            </Button>
          )
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="h-9 px-3"
      >
        Další
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  )
}

export function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  // Removed inventory tab - using dedicated warehouse system

  // Use real API data with pagination
  const itemsPerPage = 20
  const { products, loading, error, total, totalPages, setSearch, setPage } = useProducts({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    autoFetch: true
  })

  const { stats, loading: statsLoading } = useProductStats()
  
  // Status update handler
  const handleStatusChange = async (productId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          availability: newStatus === 'archived' ? 'out_of_stock' : 'in_stock'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update product status')
      }

      // Refresh the products list
      window.location.reload()
    } catch (error) {
      console.error('Error updating product status:', error)
      alert('Chyba při aktualizaci statusu produktu')
    }
  }
  
  // Debug logging
  useEffect(() => {
  }, [stats])

  // Update search when searchTerm changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearch(searchTerm)
      setCurrentPage(1) // Reset to first page when search changes
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, setSearch])

  // Reset to first page when status filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedStatus])

  // Update page when currentPage changes
  useEffect(() => {
    setPage(currentPage)
  }, [currentPage, setPage])

  // Filter products based on selected filters
  const filteredProducts = products.filter(product => {
    if (selectedStatus === 'all') return true
    
    // Map product stock to status
    if (selectedStatus === 'active') return (product.stock ?? 0) > 0
    if (selectedStatus === 'archived') return (product.stock ?? 0) === 0
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
  };

  const handleCloseEditDialog = () => {
    try {
      setIsEditDialogOpen(false)
      setEditingProduct(null)
    } catch (error) {
      console.error('Error closing product edit dialog:', error)
    }
  };

  const totalProducts = stats?.total || 0;
  const activeProducts = stats?.active || 0;
  const draftProducts = 0; // No draft products in real data
  const outOfStockProducts = stats?.outOfStock || 0;

  // Simple test return to isolate JSX parsing issue
  return (
    <div>
      <h1>Products Page - Testing</h1>
      <p>Total products: {totalProducts}</p>
    </div>
  );

  // TODO: Restore full ProductsPage UI after fixing JSX parsing issue
}

export default ProductsPage
