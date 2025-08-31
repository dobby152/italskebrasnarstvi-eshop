"use client"

import { useState, useEffect } from "react"
import { Button } from "../../app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../app/components/ui/card"
import { Input } from "../../app/components/ui/input"
import { Separator } from "../../app/components/ui/separator"
import { Badge } from "../../app/components/ui/badge"
import { Trash2, Plus, Minus, Heart, ShoppingBag, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface CartItem {
  id: string
  product: {
    id: string
    name: string
    sku: string
    brand: string
    image_url: string
  }
  variant?: {
    id: string
    title: string
    option1_value?: string
    option2_value?: string
    option3_value?: string
  }
  quantity: number
  unit_price: number
  total_price: number
  added_at: string
}

interface Cart {
  id: string | null
  items: CartItem[]
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  items_count: number
}

export default function ShoppingCart() {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [promoCode, setPromoCode] = useState('')

  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/cart', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'x-session-id': getSessionId()
        }
      })

      const data = await response.json()
      setCart(data.cart)
    } catch (error) {
      console.error('Failed to load cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSessionId = () => {
    let sessionId = localStorage.getItem('sessionId')
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      localStorage.setItem('sessionId', sessionId)
    }
    return sessionId
  }

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    setUpdating(itemId)
    try {
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'x-session-id': getSessionId()
        },
        body: JSON.stringify({ quantity: newQuantity })
      })

      if (response.ok) {
        await loadCart()
      }
    } catch (error) {
      console.error('Failed to update quantity:', error)
    } finally {
      setUpdating(null)
    }
  }

  const removeItem = async (itemId: string) => {
    setUpdating(itemId)
    try {
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'x-session-id': getSessionId()
        }
      })

      if (response.ok) {
        await loadCart()
      }
    } catch (error) {
      console.error('Failed to remove item:', error)
    } finally {
      setUpdating(null)
    }
  }

  const saveForLater = async (itemId: string) => {
    // Implementation for save for later functionality
    console.log('Save for later:', itemId)
  }

  const applyPromoCode = async () => {
    if (!promoCode.trim()) return

    try {
      // Implementation for promo code application
      console.log('Applying promo code:', promoCode)
    } catch (error) {
      console.error('Failed to apply promo code:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
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

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Nákupní košík ({cart.items.length})
            </h2>
            <Button variant="outline" size="sm">
              Vymazat vše
            </Button>
          </div>

          <div className="space-y-4">
            {cart.items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={item.product.image_url || '/placeholder.svg'}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            <Link 
                              href={`/produkt/${item.product.id}`}
                              className="hover:text-blue-600"
                            >
                              {item.product.name}
                            </Link>
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {item.product.brand} • {item.product.sku}
                          </p>
                          
                          {item.variant && (
                            <div className="flex gap-2 mb-2">
                              {/* Color information */}
                              {item.variant.attributes?.color && (
                                <div className="flex items-center gap-1">
                                  <div 
                                    className="w-4 h-4 rounded-full border border-gray-300"
                                    style={{ backgroundColor: item.variant.attributes?.hexColor || '#CCCCCC' }}
                                  />
                                  <Badge variant="secondary">
                                    {item.variant.attributes.color}
                                  </Badge>
                                </div>
                              )}
                              {item.variant.option1_value && (
                                <Badge variant="secondary">
                                  {item.variant.option1_value}
                                </Badge>
                              )}
                              {item.variant.option2_value && (
                                <Badge variant="secondary">
                                  {item.variant.option2_value}
                                </Badge>
                              )}
                            </div>
                          )}

                          <p className="text-lg font-bold text-gray-900">
                            {item.unit_price.toLocaleString('cs-CZ')} Kč
                          </p>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={updating === item.id}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          {updating === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center border rounded-lg">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={updating === item.id || item.quantity <= 1}
                              className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="px-4 py-2 border-x min-w-[3rem] text-center">
                              {updating === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                              ) : (
                                item.quantity
                              )}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={updating === item.id}
                              className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          <button
                            onClick={() => saveForLater(item.id)}
                            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                          >
                            <Heart className="h-4 w-4 mr-1" />
                            Uložit na později
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {item.total_price.toLocaleString('cs-CZ')} Kč
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-sm text-gray-500">
                              {item.quantity} × {item.unit_price.toLocaleString('cs-CZ')} Kč
                            </p>
                          )}
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
              {/* Promo Code */}
              <div>
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Slevový kód"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                  />
                  <Button onClick={applyPromoCode} variant="outline">
                    Použít
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Price Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Mezisoučet ({cart.items_count} položek)</span>
                  <span>{cart.subtotal.toLocaleString('cs-CZ')} Kč</span>
                </div>

                {cart.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Sleva</span>
                    <span>-{cart.discount_amount.toLocaleString('cs-CZ')} Kč</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Doprava</span>
                  <span>
                    {cart.subtotal >= 2500 ? (
                      <span className="text-green-600">Zdarma</span>
                    ) : (
                      '150 Kč'
                    )}
                  </span>
                </div>

                {cart.tax_amount > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>DPH</span>
                    <span>{cart.tax_amount.toLocaleString('cs-CZ')} Kč</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Celkem</span>
                <span>
                  {(cart.total_amount + (cart.subtotal < 2500 ? 150 : 0)).toLocaleString('cs-CZ')} Kč
                </span>
              </div>

              {cart.subtotal < 2500 && (
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <strong>Tip:</strong> Přidejte produkty za{' '}
                  <strong>{(2500 - cart.subtotal).toLocaleString('cs-CZ')} Kč</strong>{' '}
                  a získáte dopravu zdarma!
                </div>
              )}

              <Button className="w-full" size="lg">
                Pokračovat k pokladně
              </Button>

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