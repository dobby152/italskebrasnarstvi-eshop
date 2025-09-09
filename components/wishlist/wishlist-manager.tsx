"use client"

import { useState, useEffect } from "react"
import { Button } from "../../app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../app/components/ui/card"
import { Input } from "../../app/components/ui/input"
import { Badge } from "../../app/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../../app/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../app/components/ui/select"
import { Heart, Plus, X, ShoppingCart, Eye, Share2, Loader2, Edit3 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface WishlistItem {
  id: string
  product: {
    id: string
    name: string
    sku: string
    brand: string
    image_url: string
    price: number
    sale_price?: number
    stock_status: string
  }
  variant?: {
    id: string
    title: string
    option1_value?: string
    option2_value?: string
    option3_value?: string
  }
  notes?: string
  added_at: string
}

interface Wishlist {
  id: string
  name: string
  description?: string
  is_public: boolean
  items: WishlistItem[]
  items_count: number
  created_at: string
}

export default function WishlistManager() {
  const [wishlists, setWishlists] = useState<Wishlist[]>([])
  const [selectedWishlist, setSelectedWishlist] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [newListName, setNewListName] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    loadWishlists()
  }, [])

  const loadWishlists = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/wishlist', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setWishlists(data.wishlists)
        if (data.wishlists.length > 0 && !selectedWishlist) {
          setSelectedWishlist(data.wishlists[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to load wishlists:', error)
    } finally {
      setLoading(false)
    }
  }

  const createWishlist = async () => {
    if (!newListName.trim()) return

    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          name: newListName,
          description: '',
          is_public: false
        })
      })

      if (response.ok) {
        setNewListName('')
        setShowCreateForm(false)
        await loadWishlists()
      }
    } catch (error) {
      console.error('Failed to create wishlist:', error)
    }
  }

  const removeFromWishlist = async (itemId: string) => {
    setUpdating(itemId)
    try {
      const response = await fetch(`/api/wishlist/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (response.ok) {
        await loadWishlists()
      }
    } catch (error) {
      console.error('Failed to remove item:', error)
    } finally {
      setUpdating(null)
    }
  }

  const addToCart = async (item: WishlistItem) => {
    setUpdating(item.id)
    try {
      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'x-session-id': getSessionId()
        },
        body: JSON.stringify({
          productId: item.product.id,
          variantId: item.variant?.id,
          quantity: 1
        })
      })

      if (response.ok) {
        // Optionally remove from wishlist after adding to cart
        // await removeFromWishlist(item.id)
      }
    } catch (error) {
      console.error('Failed to add to cart:', error)
    } finally {
      setUpdating(null)
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

  const getCurrentWishlist = () => {
    return wishlists.find(list => list.id === selectedWishlist)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const currentWishlist = getCurrentWishlist()

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Oblíbené položky
          </h1>
          <p className="text-gray-600">
            Spravujte své oblíbené produkty a seznamy přání
          </p>
        </div>

        <Sheet open={showCreateForm} onOpenChange={setShowCreateForm}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nový seznam
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Vytvořit nový seznam</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-6">
              <div>
                <label className="text-sm font-medium">Název seznamu</label>
                <Input
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Např. Vánoční dárky"
                  className="mt-1"
                />
              </div>
              <Button onClick={createWishlist} className="w-full">
                Vytvořit seznam
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {wishlists.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Nemáte žádné oblíbené položky
          </h3>
          <p className="text-gray-600 mb-6">
            Začněte přidávat produkty do oblíbených pro snazší nákup
          </p>
          <Link href="/produkty">
            <Button>
              Procházet produkty
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Wishlist Tabs */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Select value={selectedWishlist} onValueChange={setSelectedWishlist}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Vyberte seznam" />
                </SelectTrigger>
                <SelectContent>
                  {wishlists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.name} ({list.items_count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {currentWishlist && (
                <div className="flex items-center gap-2">
                  <Badge variant={currentWishlist.is_public ? "default" : "secondary"}>
                    {currentWishlist.is_public ? "Veřejný" : "Soukromý"}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {currentWishlist.items_count} položek
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Wishlist Items */}
          {currentWishlist && (
            <div className="space-y-4">
              {currentWishlist.items.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Heart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">
                    Tento seznam je prázdný
                  </p>
                </div>
              ) : (
                currentWishlist.items?.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
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
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-1">
                                <Link 
                                  href={`/produkty/${item.product.id}`}
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

                              <div className="flex items-center gap-2 mb-2">
                                {item.product.sale_price ? (
                                  <>
                                    <span className="text-lg font-bold text-red-600">
                                      {item.product.sale_price.toLocaleString('cs-CZ')} Kč
                                    </span>
                                    <span className="text-sm text-gray-500 line-through">
                                      {item.product.price.toLocaleString('cs-CZ')} Kč
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-lg font-bold text-gray-900">
                                    {item.product.price.toLocaleString('cs-CZ')} Kč
                                  </span>
                                )}
                                
                                <Badge 
                                  variant={item.product.stock_status === 'in_stock' ? 'default' : 'secondary'}
                                >
                                  {item.product.stock_status === 'in_stock' ? 'Skladem' : 'Nedostupné'}
                                </Badge>
                              </div>

                              {item.notes && (
                                <p className="text-sm text-gray-600 italic mb-2">
                                  "{item.notes}"
                                </p>
                              )}

                              <p className="text-xs text-gray-500">
                                Přidáno {new Date(item.added_at).toLocaleDateString('cs-CZ')}
                              </p>
                            </div>

                            <button
                              onClick={() => removeFromWishlist(item.id)}
                              disabled={updating === item.id}
                              className="text-gray-400 hover:text-red-500 p-1"
                            >
                              {updating === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </button>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => addToCart(item)}
                              disabled={updating === item.id || item.product.stock_status !== 'in_stock'}
                            >
                              {updating === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <ShoppingCart className="h-4 w-4 mr-2" />
                              )}
                              Do košíku
                            </Button>
                            
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/produkty/${item.product.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Detail
                              </Link>
                            </Button>

                            <Button variant="ghost" size="sm">
                              <Share2 className="h-4 w-4 mr-2" />
                              Sdílet
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}