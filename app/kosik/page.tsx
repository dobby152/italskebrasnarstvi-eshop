"use client"

import { useState, useEffect } from "react"
import { useCart } from "../context/cart-context"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { Minus, Plus, X, ShoppingCart } from "lucide-react"
import { formatPrice, getImageUrl } from "../lib/utils"
import Link from "next/link"
import dynamicImport from 'next/dynamic'

// Dynamically import Header to prevent SSR issues
const Header = dynamicImport(() => import("../components/header"), { ssr: false })

// Disable static generation for cart page since it requires client-side cart data
export const dynamic = 'force-dynamic'

// Client-only cart content
function CartContent() {
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCart()

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto px-6 py-20 text-center">
          <ShoppingCart className="h-24 w-24 text-gray-300 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Váš košík je prázdný</h1>
          <p className="text-gray-600 mb-8 text-xl">Přidejte nějaké produkty do košíku</p>
          <Link href="/produkty">
            <Button className="bg-black hover:bg-gray-800 text-white text-lg px-8 py-3">
              Pokračovat v nákupu
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-4xl font-black text-gray-900 mb-8">Váš nákupní košík</h1>
        
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {items.map((item) => (
                <Card key={item.id} className="p-6">
                  <div className="flex gap-6">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      {item.image ? (
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.name}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-500 text-sm">Bez obrázku</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
                          <p className="text-gray-600 text-sm">SKU: {item.sku}</p>
                          
                          {/* Variant Attributes */}
                          {Object.keys(item.attributes).length > 0 && (
                            <div className="mt-2">
                              {Object.entries(item.attributes).map(([key, attr]) => (
                                <span key={key} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded mr-2 mb-1">
                                  {attr.displayValue}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                      
                      {/* Price and Quantity */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-2 hover:bg-gray-100 transition-colors"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="px-4 py-2 font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-2 hover:bg-gray-100 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {formatPrice(item.price * item.quantity)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatPrice(item.price)} za kus
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          
          {/* Order Summary */}
          <div>
            <Card className="p-6 sticky top-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Shrnutí objednávky</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Celkem položek:</span>
                  <span className="font-semibold">{totalItems}</span>
                </div>
                
                <div className="flex justify-between text-lg">
                  <span className="text-gray-900 font-bold">Celková cena:</span>
                  <span className="text-gray-900 font-bold">{formatPrice(totalPrice)}</span>
                </div>
              </div>
              
              <Link href="/checkout" className="block">
                <Button className="w-full bg-black hover:bg-gray-800 text-white py-3 text-lg font-semibold mb-4">
                  Pokračovat k pokladně
                </Button>
              </Link>
              
              <Link href="/produkty" className="block text-center text-gray-600 hover:text-black transition-colors">
                Pokračovat v nákupu
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Create client-only wrapper for cart
const ClientOnlyCart = dynamicImport(() => Promise.resolve(CartContent), { 
  ssr: false,
  loading: () => <div className="min-h-screen bg-white flex items-center justify-center"><div className="text-lg">Načítání košíku...</div></div>
})

export default function CartPage() {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  if (!isClient) {
    return <div className="min-h-screen bg-white flex items-center justify-center"><div className="text-lg">Načítání košíku...</div></div>
  }
  
  return <ClientOnlyCart />
}
