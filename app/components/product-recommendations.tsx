"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { OptimizedImage } from './ui/optimized-image'
import { Heart, ShoppingCart, Eye, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface ProductRecommendation {
  id: string
  name: string
  price: number
  image_url: string
  sku: string
  score: number
  reason: string
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
    trending: 'Trending produkty',
    personalized: 'Doporučeno pro vás',
    cross_sell: 'Doplňte svůj nákup'
  }

  const typeIcons = {
    similar: <Eye className="h-4 w-4" />,
    frequently_bought: <ShoppingCart className="h-4 w-4" />,
    trending: <Sparkles className="h-4 w-4" />,
    personalized: <Heart className="h-4 w-4" />,
    cross_sell: <ShoppingCart className="h-4 w-4" />
  }

  useEffect(() => {
    // Debounce API calls to prevent rate limiting
    const timeoutId = setTimeout(() => {
      fetchRecommendations()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [type, productId, userId, cartItems, browsingHistory])

  const fetchRecommendations = async (retryCount = 0) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/recommendations/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          currentProductId: productId,
          userId,
          cartItems,
          browsingHistory,
          limit
        })
      })

      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.recommendations || [])
      } else if (response.status === 429 && retryCount < 2) {
        // Rate limited - retry with exponential backoff
        const delay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s
        console.log(`Rate limited, retrying in ${delay}ms...`)
        setTimeout(() => fetchRecommendations(retryCount + 1), delay)
        return
      } else {
        throw new Error(`HTTP ${response.status}: Failed to fetch recommendations`)
      }
    } catch (error) {
      console.error('Recommendations error:', error)
      if (retryCount === 0) {
        // For development - show mock recommendations
        const mockRecommendations: ProductRecommendation[] = [
          {
            id: 'mock-1',
            name: 'Pánská kožená peněženka',
            price: 2500,
            image_url: '/placeholder.svg',
            sku: 'MOCK-1',
            score: 0.85,
            reason: 'Podobný styl',
            brand: 'Piquadro',
            category: 'Peněženky'
          },
          {
            id: 'mock-2', 
            name: 'Dámská kosmetická taška',
            price: 1800,
            image_url: '/placeholder.svg',
            sku: 'MOCK-2',
            score: 0.75,
            reason: 'Stejná značka',
            brand: 'Piquadro',
            category: 'Tašky'
          }
        ]
        setRecommendations(mockRecommendations)
      } else {
        setError('Nepodařilo se načíst doporučení')
      }
    }

    setIsLoading(false)
  }

  const trackRecommendationClick = async (recommendationId: string) => {
    try {
      await fetch('/api/analytics/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          productId: recommendationId,
          sourceProductId: productId,
          userId,
          action: 'click'
        })
      })
    } catch (error) {
      console.error('Failed to track recommendation click:', error)
    }
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
        // Track conversion
        await fetch('/api/analytics/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            productId,
            sourceProductId: productId,
            userId,
            action: 'add_to_cart'
          })
        })
        
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
        <p className="text-sm">Podobné produkty momentálně nejsou dostupné</p>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return null // Don't show anything if no recommendations
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            {typeIcons[type]}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {title || typeLabels[type]}
            </h3>
            <p className="text-sm text-gray-600">
              Na základě AI algoritmu
            </p>
          </div>
        </div>
        
        <Badge variant="secondary" className="bg-blue-50 text-blue-700">
          {recommendations.length} {recommendations.length === 1 ? 'produkt' : 'produkty'}
        </Badge>
      </div>

      {/* Recommendations Grid */}
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
                  onClick={() => trackRecommendationClick(product.id)}
                >
                  <OptimizedImage
                    src={product.image_url || '/placeholder.svg'}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </Link>
                
                {/* Recommendation Badge */}
                <div className="absolute top-2 left-2">
                  <Badge 
                    variant="secondary" 
                    className="bg-white/90 backdrop-blur-sm text-xs font-medium"
                  >
                    {Math.round(product.score * 100)}% shoda
                  </Badge>
                </div>

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
                    onClick={() => trackRecommendationClick(product.id)}
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

                {/* Recommendation Reason */}
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-600 italic">
                    {product.reason}
                  </p>
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