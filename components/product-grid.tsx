"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Heart } from 'lucide-react'

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
}

interface ProductGridProps {
  category?: string
  searchQuery?: string
  limit?: number
}

export default function ProductGrid({ category, searchQuery, limit = 12 }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const params = new URLSearchParams()
        if (category) params.append('collection', category)
        if (searchQuery) params.append('search', searchQuery)
        if (limit) params.append('limit', limit.toString())

        const response = await fetch(`/api/products?${params}`)
        const data = await response.json()
        
        if (data.products) {
          setProducts(data.products)
        }
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [category, searchQuery, limit])

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <Card key={product.id} className="group hover:shadow-lg transition-shadow">
          <CardContent className="p-0">
            <div className="relative">
              <Link href={`/produkt/${product.sku}`}>
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
              <Link href={`/produkt/${product.sku}`}>
                <h3 className="font-medium text-sm mb-2 line-clamp-2 hover:text-primary transition-colors">
                  {product.name}
                </h3>
              </Link>
              
              {product.brand && (
                <Badge variant="secondary" className="text-xs mb-2">
                  {product.brand}
                </Badge>
              )}
              
              <div className="flex items-center justify-between">
                <span className="font-semibold text-lg">
                  {product.price.toLocaleString('cs-CZ')} Kč
                </span>
                
                <Button size="sm" variant="outline">
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}