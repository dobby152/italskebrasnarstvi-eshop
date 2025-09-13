"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { OptimizedImage } from './ui/optimized-image'
import { ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { getImageUrl } from '../lib/utils'
import { AddToCartButton } from './add-to-cart-button'

interface ProductRecommendation {
  id: string
  name: string
  price: number
  image_url: string
  sku: string
  brand: string
  category: string
}

interface ProductRecommendationsProps {
  type: 'similar' | 'frequently_bought' | 'trending' | 'personalized' | 'cross_sell'
  productId?: string
  userId?: string
  cartItems?: string[]
  browsingHistory?: string[]
  limit?: number
  title?: string
  className?: string
}

export function ProductRecommendations({
  type,
  productId,
  userId,
  cartItems = [],
  browsingHistory = [],
  limit = 4,
  title,
  className
}: ProductRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const typeLabels = {
    similar: 'Podobné produkty',
    frequently_bought: 'Často kupováno společně',
    trending: 'Populární produkty',
    personalized: 'Další produkty',
    cross_sell: 'Doplňte svůj nákup'
  }

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true)
      setError(null)

      try {
        let queryParams = new URLSearchParams({
          limit: (limit + (productId ? 1 : 0)).toString(), // Get one extra if we need to filter current product
          inStockOnly: 'true'
        })

        // Add different sorting/filtering based on recommendation type
        switch (type) {
          case 'similar':
            queryParams.append('sortBy', 'collection')
            queryParams.append('sortOrder', 'asc')
            break
          case 'frequently_bought':
            queryParams.append('sortBy', 'price')
            queryParams.append('sortOrder', 'asc')
            break
          case 'trending':
            queryParams.append('sortBy', 'created_at')
            queryParams.append('sortOrder', 'desc')
            break
          case 'cross_sell':
            queryParams.append('sortBy', 'price')
            queryParams.append('sortOrder', 'desc')
            break
          default:
            queryParams.append('sortBy', 'sortPriority')
            queryParams.append('sortOrder', 'asc')
        }

        const response = await fetch(`/api/products?${queryParams}`)

        if (response.ok) {
          const data = await response.json()
          let products = data.products || []

          // Filter out current product if productId is provided
          if (productId) {
            products = products.filter((product: any) => product.id.toString() !== productId)
          }

          // Take only the requested limit after filtering
          products = products.slice(0, limit)
          
          // Convert products to recommendation format with proper image handling
          const recommendations: ProductRecommendation[] = products.map((product: any) => {
            // Use primary image with proper fallback
            let imageUrl = '/placeholder.svg'
            if (product.images && product.images.length > 0) {
              imageUrl = getImageUrl(product.images[0])
            } else if (product.image_url) {
              imageUrl = getImageUrl(product.image_url)
            }
            
            return {
              id: product.id.toString(),
              name: product.name,
              price: product.price,
              image_url: imageUrl,
              sku: product.sku,
              brand: product.brand || 'Piquadro',
              category: product.collection_name || 'Produkty'
            }
          })
          
          setRecommendations(recommendations)
        } else {
          throw new Error(`HTTP ${response.status}: Failed to fetch products`)
        }
      } catch (error) {
        console.error('Products error:', error)
        setError('Nepodařilo se načíst produkty')
      } finally {
        setIsLoading(false)
      }
    }

    // Debounce API calls to prevent rate limiting
    const timeoutId = setTimeout(() => {
      fetchRecommendations()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [type, productId, limit])




  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-gray-200 animate-pulse"></div>
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="bg-gray-100 h-80 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    // Show minimal error state
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">Produkty momentálně nejsou dostupné</p>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return null // Don't show anything if no products
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {title || typeLabels[type]}
        </h2>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {recommendations.map((product) => (
          <Card 
            key={product.id} 
            className="group hover:shadow-lg transition-all duration-200 border-0 shadow-sm overflow-hidden"
          >
            <CardContent className="p-0">
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden bg-gray-50">
                <Link 
                  href={`/produkty/${product.id}`}
                >
                  <OptimizedImage
                    src={product.image_url || '/placeholder.svg'}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </Link>
                

              </div>

              {/* Product Info */}
              <div className="p-4 space-y-2">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    {product.brand}
                  </p>
                  <Link 
                    href={`/produkty/${product.id}`}
                    className="block"
                  >
                    <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 text-sm">
                      {product.name}
                    </h4>
                  </Link>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-gray-900">
                    {product.price.toLocaleString('cs-CZ')} Kč
                  </div>
                </div>


                {/* Action Button */}
                <AddToCartButton
                  variant={{
                    id: product.id,
                    sku: product.sku,
                    name: product.name,
                    price: product.price,
                    inventory_quantity: 999,
                    image_url: product.image_url,
                    attributes: {}
                  }}
                  className="w-full mt-3"
                  quantity={1}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}