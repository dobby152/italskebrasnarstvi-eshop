"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Separator } from "./ui/separator"
import { ShoppingBag, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import CheckoutButton from "./checkout-button"

interface CartData {
  cart: {
    id: string
    cart_items: Array<{
      id: string
      quantity: number
      product: {
        id: string
        name: string
        sku: string
        price: number
        image_url: string | null
      }
    }>
  } | null
  total: number
  itemCount: number
}

export default function ShoppingCartSimple() {
  const [cartData, setCartData] = useState<CartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCart()
  }, [])

  const getSessionId = () => {
    if (typeof window === 'undefined') return 'server-session'
    
    let sessionId = localStorage.getItem('sessionId')
    if (!sessionId) {
      sessionId = 'test-session-12345' // Use our test session
      localStorage.setItem('sessionId', sessionId)
    }
    return sessionId
  }

  const loadCart = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/cart', {
        headers: {
          'x-session-id': getSessionId()
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('Cart data:', data)
      setCartData(data)
    } catch (error) {
      console.error('Failed to load cart:', error)
      setError(error instanceof Error ? error.message : 'Nepodařilo se načíst košík')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2">Načítám košík...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Chyba: {error}</div>
        <Button onClick={loadCart}>Zkusit znovu</Button>
      </div>
    )
  }

  if (!cartData?.cart || !cartData.cart.cart_items || cartData.cart.cart_items.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Váš košík je prázdný
        </h3>
        <p className="text-gray-600 mb-6">
          Přidejte nějaké produkty pro zahájení nákupu
        </p>
        <Link href="/produkty">
          <Button>
            Pokračovat v nákupu
          </Button>
        </Link>
      </div>
    )
  }

  const subtotal = cartData.cart.cart_items.reduce((sum, item) => 
    sum + (item.product.price * item.quantity), 0
  )
  
  const shippingCost = subtotal >= 2500 ? 0 : 150
  const total = subtotal + shippingCost

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Nákupní košík ({cartData.cart.cart_items.length})
            </h2>
          </div>

          <div className="space-y-4">
            {cartData.cart.cart_items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                        {item.product.image_url ? (
                          <Image
                            src={item.product.image_url}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                            Bez obrázku
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {item.product.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            SKU: {item.product.sku}
                          </p>
                          <p className="text-lg font-bold text-gray-900">
                            {item.product.price.toLocaleString('cs-CZ')} Kč
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-600">
                          Množství: {item.quantity}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {(item.product.price * item.quantity).toLocaleString('cs-CZ')} Kč
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Shrnutí objednávky</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Separator />

              {/* Price Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Mezisoučet ({cartData.itemCount} položek)</span>
                  <span>{subtotal.toLocaleString('cs-CZ')} Kč</span>
                </div>

                <div className="flex justify-between">
                  <span>Doprava</span>
                  <span>
                    {shippingCost === 0 ? (
                      <span className="text-green-600">Zdarma</span>
                    ) : (
                      `${shippingCost} Kč`
                    )}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Celkem</span>
                <span>{total.toLocaleString('cs-CZ')} Kč</span>
              </div>

              {subtotal < 2500 && (
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <strong>Tip:</strong> Přidejte produkty za{' '}
                  <strong>{(2500 - subtotal).toLocaleString('cs-CZ')} Kč</strong>{' '}
                  a získáte dopravu zdarma!
                </div>
              )}

              <CheckoutButton />

              <div className="text-center">
                <Link href="/produkty">
                  <Button variant="ghost" className="text-sm">
                    ← Pokračovat v nákupu
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}