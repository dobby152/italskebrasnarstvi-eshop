"use client"

import { useState, useEffect } from "react"
import { Button } from "../../app/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "../../app/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../app/components/ui/select"
import { Input } from "../../app/components/ui/input"
import { Heart, Plus, Check, Loader2 } from "lucide-react"
import { cn } from "../../app/lib/utils"

interface WishlistButtonProps {
  productId: string
  variantId?: string
  className?: string
  size?: "sm" | "default" | "lg"
  variant?: "default" | "outline" | "ghost"
}

interface Wishlist {
  id: string
  name: string
  items_count: number
}

export default function WishlistButton({ 
  productId, 
  variantId, 
  className,
  size = "default",
  variant = "outline"
}: WishlistButtonProps) {
  const [wishlists, setWishlists] = useState<Wishlist[]>([])
  const [selectedWishlist, setSelectedWishlist] = useState<string>('')
  const [newListName, setNewListName] = useState('')
  const [loading, setLoading] = useState(false)
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    checkAuthAndLoadWishlists()
  }, [])

  const checkAuthAndLoadWishlists = async () => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setIsAuthenticated(false)
      return
    }

    setIsAuthenticated(true)
    await loadWishlists()
    await checkIfInWishlist()
  }

  const loadWishlists = async () => {
    try {
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
    }
  }

  const checkIfInWishlist = async () => {
    try {
      const response = await fetch(`/api/wishlist/check?productId=${productId}&variantId=${variantId || ''}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setIsInWishlist(data.inWishlist)
      }
    } catch (error) {
      console.error('Failed to check wishlist status:', error)
    }
  }

  const addToWishlist = async (wishlistId?: string) => {
    if (!isAuthenticated) {
      // Redirect to login or show login modal
      window.location.href = '/ucet?tab=login'
      return
    }

    setLoading(true)
    
    try {
      const targetWishlistId = wishlistId || selectedWishlist
      
      const response = await fetch('/api/wishlist/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          wishlistId: targetWishlistId,
          productId,
          variantId,
          notes: ''
        })
      })

      if (response.ok) {
        setIsInWishlist(true)
        await loadWishlists() // Refresh counts
      }
    } catch (error) {
      console.error('Failed to add to wishlist:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeFromWishlist = async () => {
    setLoading(true)
    
    try {
      const response = await fetch(`/api/wishlist/items/remove`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          productId,
          variantId
        })
      })

      if (response.ok) {
        setIsInWishlist(false)
        await loadWishlists() // Refresh counts
      }
    } catch (error) {
      console.error('Failed to remove from wishlist:', error)
    } finally {
      setLoading(false)
    }
  }

  const createAndAddToWishlist = async () => {
    if (!newListName.trim()) return

    setLoading(true)
    
    try {
      // Create new wishlist
      const createResponse = await fetch('/api/wishlist', {
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

      if (createResponse.ok) {
        const newWishlist = await createResponse.json()
        await addToWishlist(newWishlist.wishlist.id)
        setNewListName('')
        setShowCreateForm(false)
      }
    } catch (error) {
      console.error('Failed to create wishlist:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClick = () => {
    if (!isAuthenticated) {
      window.location.href = '/ucet?tab=login'
      return
    }

    if (isInWishlist) {
      removeFromWishlist()
    } else if (wishlists.length === 1) {
      // If only one wishlist, add directly
      addToWishlist(wishlists[0].id)
    }
    // Otherwise, the popover will handle selection
  }

  if (!isAuthenticated) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
      >
        <Heart className="h-4 w-4 mr-2" />
        Přidat k oblíbeným
      </Button>
    )
  }

  if (wishlists.length <= 1) {
    return (
      <Button
        variant={variant}
        size={size}
        className={cn(className, isInWishlist && "text-red-600")}
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Heart className={cn("h-4 w-4 mr-2", isInWishlist && "fill-current")} />
        )}
        {isInWishlist ? 'V oblíbených' : 'Přidat k oblíbeným'}
      </Button>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn(className, isInWishlist && "text-red-600")}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Heart className={cn("h-4 w-4 mr-2", isInWishlist && "fill-current")} />
          )}
          {isInWishlist ? 'V oblíbených' : 'Přidat k oblíbeným'}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Vyberte seznam</h4>
            <Select value={selectedWishlist} onValueChange={setSelectedWishlist}>
              <SelectTrigger>
                <SelectValue placeholder="Vyberte seznam přání" />
              </SelectTrigger>
              <SelectContent>
                {wishlists.map((list) => (
                  <SelectItem key={list.id} value={list.id}>
                    {list.name} ({list.items_count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => addToWishlist()}
              disabled={!selectedWishlist || loading}
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Přidat
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {showCreateForm && (
            <div className="space-y-2 pt-2 border-t">
              <Input
                placeholder="Název nového seznamu"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createAndAddToWishlist()}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={createAndAddToWishlist}
                  disabled={!newListName.trim() || loading}
                  className="flex-1"
                >
                  Vytvořit a přidat
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false)
                    setNewListName('')
                  }}
                >
                  Zrušit
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}