"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { OptimizedImage } from './ui/optimized-image'
import { ShoppingCart } from 'lucide-react'
import Link from 'next/link'

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
    // Debounce API calls to prevent rate limiting
    const timeoutId = setTimeout(() => {
      fetchRecommendations()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [type, productId, userId, cartItems, browsingHistory])

  const fetchRecommendations = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Use products API instead of problematic recommendations API
      const response = await fetch(`/api/products?limit=${limit}&inStockOnly=true`)
      
      if (response.ok) {
        const data = await response.json()
        const products = data.products || []
        
        // Convert products to recommendation format
        const recommendations: ProductRecommendation[] = products.map((product: any) => ({
          id: product.id.toString(),
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          sku: product.sku,
          brand: product.brand || 'Piquadro',
          category: product.collection_name || 'Produkty'
        }))
        
        setRecommendations(recommendations)
      } else {
        throw new Error(`HTTP ${response.status}: Failed to fetch products`)
      }
    } catch (error) {
      console.error('Products error:', error)
      setError('Nepodařilo se načíst produkty')
    }

    setIsLoading(false)
  }


  const addToCart = async (productId: string) => {
    try {
      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          quantity: 1
        })
      })

      if (response.ok) {
        // You might want to show a success message or update cart state
        console.log('Added to cart successfully')
      }
    } catch (error) {
      console.error('Failed to add to cart:', error)
    }
  }

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
                

                {/* Quick Actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-white/90 backdrop-blur-sm hover:bg-white w-8 h-8 p-0"
                    onClick={() => addToCart(product.id)}
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                </div>
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
                <Button 
                  className="w-full mt-3" 
                  size="sm"
                  onClick={() => addToCart(product.id)}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Do košíku
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}