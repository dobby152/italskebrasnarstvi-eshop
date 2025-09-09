"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '../app/components/ui/card'
import { Badge } from '../app/components/ui/badge'
import { Button } from '../app/components/ui/button'
import { ShoppingCart, Heart, AlertCircle } from 'lucide-react'
import { ColorVariantGrid } from './color-variant-grid'
import OutOfStockOrderButton from '../app/components/out-of-stock-order-button'
import { Pagination } from './pagination'

interface Product {
  id: number
  name: string
  price: number
  image_url: string
  images: string[]
  sku: string
  description?: string
  availability?: string
  brand?: string
  collection?: string
  colors?: string[]
  colorVariants?: { colorName: string; hexColor: string; colorCode: string; sku?: string }[]
  // Collection information
  collection_name?: string
  collection_code?: string
  // Stock information from new API
  totalStock?: number
  outletStock?: number
  chodovStock?: number
  available?: boolean
  // SEO slug
  slug?: string
}

interface ProductGridProps {
  category?: string
  searchQuery?: string
  limit?: number
  sortBy?: string
  sortOrder?: string
  // Filter props
  categories?: string
  brand?: string
  minPrice?: string
  maxPrice?: string
  inStockOnly?: string
}

export function ProductGrid({ 
  category, 
  searchQuery, 
  limit = 12, 
  sortBy, 
  sortOrder,
  categories,
  brand,
  minPrice,
  maxPrice,
  inStockOnly
}: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    hasNextPage: false,
    hasPrevPage: false
  })
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (category) params.append('collection', category)
        if (searchQuery) params.append('search', searchQuery)
        if (limit) params.append('limit', limit.toString())
        if (sortBy) params.append('sortBy', sortBy)
        if (sortOrder) params.append('sortOrder', sortOrder)
        params.append('page', currentPage.toString())
        
        // Add filter params
        if (categories) params.append('categories', categories)
        if (brand) params.append('brand', brand)
        if (minPrice) params.append('minPrice', minPrice)
        if (maxPrice) params.append('maxPrice', maxPrice)
        if (inStockOnly) params.append('inStockOnly', inStockOnly)

        console.log('Fetching products with params:', params.toString())
        
        const response = await fetch(`/api/products?${params}`)
        const data = await response.json()
        
        if (data.products) {
          setProducts(data.products)
          console.log('Loaded products:', data.products.length)
        }
        
        if (data.pagination) {
          setPagination(data.pagination)
        }
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [category, searchQuery, limit, sortBy, sortOrder, categories, brand, minPrice, maxPrice, inStockOnly, currentPage])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }, (_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="bg-gray-300 h-48 rounded-lg mb-4" />
              <div className="bg-gray-300 h-4 rounded mb-2" />
              <div className="bg-gray-300 h-4 rounded w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Žádné produkty nebyly nalezeny.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {products.map((product) => (
        <Card key={product.id} className="group hover:shadow-lg transition-shadow">
          <CardContent className="p-0">
            <div className="relative">
              <Link href={`/produkty/${product.slug || product.id}`}>
                <div className="relative aspect-square overflow-hidden rounded-t-lg">
                  <Image
                    src={product.image_url || '/placeholder.svg'}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </Link>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur"
              >
                <Heart className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-4">
              <Link href={`/produkty/${product.slug || product.id}`}>
                <h3 className="font-medium text-sm mb-2 line-clamp-2 hover:text-primary transition-colors">
                  {product.name}
                </h3>
              </Link>
              
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {product.collection_name && (
                  <Badge variant="outline" className="text-xs">
                    {product.collection_name}
                  </Badge>
                )}
                {product.brand && (
                  <Badge variant="secondary" className="text-xs">
                    {product.brand}
                  </Badge>
                )}
                {/* Stock availability badge */}
                {product.available !== undefined && (
                  <Badge 
                    variant={
                      product.available 
                        ? product.totalStock && product.totalStock <= 3 ? "outline" : "default"
                        : "destructive"
                    }
                    className="text-xs"
                  >
                    {!product.available 
                      ? "Na objednávku" 
                      : product.totalStock && product.totalStock <= 3 
                        ? "Málo skladem"
                        : "Skladem"
                    }
                  </Badge>
                )}
              </div>
              
              {/* Color variants with availability */}
              {product.colorVariants && product.colorVariants.length > 0 && (
                <div className="mb-3">
                  <ColorVariantGrid
                    variants={product.colorVariants}
                    maxVisible={6}
                    showLabels={false}
                    size="sm"
                  />
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="font-semibold text-lg">
                  {product.price.toLocaleString('cs-CZ')} Kč
                </span>
                
                {product.available ? (
                  <Button size="default" variant="outline" className="px-6 py-2">
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Přidat
                  </Button>
                ) : (
                  <OutOfStockOrderButton
                    productSku={product.sku}
                    productName={product.name}
                    price={product.price}
                    size="sm"
                    className="text-xs"
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        ))}
      </div>
      
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  )
}