"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { CartItem, CartContextType } from "../lib/types/variants"
import { formatPrice, getImageUrl } from "../lib/utils"

interface CartProviderProps {
  children: ReactNode
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = async (variant: any, quantity: number) => {
    // Check stock availability before adding
    let availableStock = 0
    try {
      const stockResponse = await fetch(`/api/stock/${variant.sku}`)
      if (stockResponse.ok) {
        const stockData = await stockResponse.json()
        availableStock = stockData.totalStock || 0
      }
    } catch (error) {
      console.error('Error checking stock:', error)
      // If we can't check stock, use fallback from variant
      availableStock = variant.inventory_quantity || variant.stock || 0
    }

    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.variantId === variant.id)
      const currentQuantityInCart = existingItem ? existingItem.quantity : 0
      const requestedTotal = currentQuantityInCart + quantity
      
      // Check if requested quantity exceeds available stock
      if (requestedTotal > availableStock) {
        console.warn(`Cannot add ${quantity} items. Available: ${availableStock}, Already in cart: ${currentQuantityInCart}`)
        // Only add what's available
        const maxAddable = Math.max(0, availableStock - currentQuantityInCart)
        if (maxAddable === 0) {
          alert('Produkt není skladem nebo již máte maximální množství v košíku.')
          return prevItems
        } else {
          alert(`Můžete přidat pouze ${maxAddable} kusů. Skladem je pouze ${availableStock} kusů.`)
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
        // Fix image handling
        let imageUrl = '/placeholder.svg'
        if (variant.images && variant.images.length > 0) {
          // Handle both array of strings and array of objects
          const firstImage = variant.images[0]
          if (typeof firstImage === 'string') {
            imageUrl = getImageUrl(firstImage)
          } else if (firstImage && firstImage.image_url) {
            imageUrl = getImageUrl(firstImage.image_url)
          }
        } else if (variant.image_url) {
          imageUrl = getImageUrl(variant.image_url)
        }
        
        const newItem: CartItem = {
          id: `${variant.id}-${Date.now()}`,
          variantId: variant.id,
          baseSku: variant.base_product_id ? `BP-${variant.base_product_id}` : 'unknown',
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
    
    // Find the item to get its SKU for stock checking
    const targetItem = items.find(item => item.id === id)
    if (!targetItem) return
    
    // Check stock availability
    let availableStock = 0
    try {
      const stockResponse = await fetch(`/api/stock/${targetItem.sku}`)
      if (stockResponse.ok) {
        const stockData = await stockResponse.json()
        availableStock = stockData.totalStock || 0
      }
    } catch (error) {
      console.error('Error checking stock:', error)
      availableStock = 999 // Fallback to allow update if stock check fails
    }
    
    // Check if requested quantity exceeds available stock
    if (quantity > availableStock) {
      alert(`Skladem je pouze ${availableStock} kusů. Množství bylo upraveno na maximum.`)
      quantity = availableStock
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