"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { CartItem, CartContextType } from "../lib/types/variants"
import { formatPrice, getImageUrl } from "../lib/utils"

interface CartProviderProps {
  children: ReactNode
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart-items')
      if (savedCart) {
        setItems(JSON.parse(savedCart))
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error)
    } finally {
      setIsInitialized(true)
    }
  }, [])

  // Save cart to localStorage whenever items change (but only after initialization)
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem('cart-items', JSON.stringify(items))
      } catch (error) {
        console.error('Error saving cart to localStorage:', error)
      }
    }
  }, [items, isInitialized])

  const addItem = async (variant: any, quantity: number) => {
    // Simple stock check - use variant data directly
    const availableStock = variant.inventory_quantity || variant.stock || 999
    
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.variantId === variant.id)
      const currentQuantityInCart = existingItem ? existingItem.quantity : 0
      const requestedTotal = currentQuantityInCart + quantity
      
      // Simple stock validation
      if (requestedTotal > availableStock) {
        const maxAddable = Math.max(0, availableStock - currentQuantityInCart)
        if (maxAddable === 0) {
          alert('Produkt není skladem.')
          return prevItems
        } else {
          alert(`Můžete přidat pouze ${maxAddable} kusů.`)
          quantity = maxAddable
        }
      }
      
      if (existingItem) {
        return prevItems.map(item =>
          item.variantId === variant.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      } else {
        // Simple image handling
        let imageUrl = '/placeholder.svg'
        if (variant.images && variant.images.length > 0) {
          const firstImage = variant.images[0]
          if (typeof firstImage === 'string') {
            imageUrl = getImageUrl(firstImage)
          } else if (firstImage?.image_url) {
            imageUrl = getImageUrl(firstImage.image_url)
          }
        } else if (variant.image_url) {
          imageUrl = getImageUrl(variant.image_url)
        } else if (variant.featured_image) {
          imageUrl = getImageUrl(variant.featured_image)
        }
        
        const newItem: CartItem = {
          id: `cart-${variant.id}-${Date.now()}`,
          variantId: variant.id,
          baseSku: variant.base_sku || variant.sku,
          sku: variant.sku,
          name: variant.name,
          price: variant.price,
          quantity,
          image: imageUrl,
          attributes: variant.attributes || {}
        }
        return [...prevItems, newItem]
      }
    })
  }

  const removeItem = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id))
  }

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
      return
    }
    
    setItems(prevItems =>
      prevItems.map(item => (item.id === id ? { ...item, quantity } : item))
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalPrice,
        totalItems
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}