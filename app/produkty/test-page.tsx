"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function TestProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log('🔍 Fetching products directly...')
        const response = await fetch('/api/products?limit=5')
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('📦 Products data:', data)
        
        setProducts(data.products || [])
      } catch (err) {
        console.error('❌ Error:', err)
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-6 py-20">
          <h1 className="text-4xl font-bold mb-8">Test Produkty</h1>
          <div>Načítání produktů...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-6 py-20">
          <h1 className="text-4xl font-bold mb-8">Test Produkty</h1>
          <div className="text-red-600">Chyba: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold mb-8">Test Produkty ({products.length})</h1>
        
        {products.length === 0 ? (
          <div>Žádné produkty nenalezeny.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div key={product.id} className="border rounded-lg p-4">
                {product.images && product.images[0] && (
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="w-full h-48 object-cover rounded mb-4"
                  />
                )}
                <h3 className="font-semibold mb-2">{product.name}</h3>
                <div className="flex justify-between items-center">
                  <span className="font-bold">{product.price} Kč</span>
                  <span className={`text-sm ${product.availability === 'in_stock' ? 'text-green-600' : 'text-red-600'}`}>
                    {product.availability === 'in_stock' ? 'Skladem' : 'Není skladem'}
                  </span>
                </div>
                <Link href={`/produkty/${product.sku}-${product.id}`}>
                  <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Detail
                  </button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}