"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { CartItem, CartContextType } from "../lib/types/variants"
import { formatPrice } from "../lib/utils"

interface CartProviderProps {
  children: ReactNode
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = (variant: any, quantity: number) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.variantId === variant.id)
      
      if (existingItem) {
        return prevItems.map(item =>
          item.variantId === variant.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      } else {
        const newItem: CartItem = {
          id: `${variant.id}-${Date.now()}`,
          variantId: variant.id,
          baseSku: variant.base_product_id ? `BP-${variant.base_product_id}` : 'unknown',
          sku: variant.sku,
          name: variant.name,
          price: variant.price,
          quantity,
          image: variant.images && variant.images.length > 0 ? variant.images[0].image_url : undefined,
          attributes: variant.attributes || {}
        }
        return [...prevItems, newItem]
      }
    })
  }

  const removeItem = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
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