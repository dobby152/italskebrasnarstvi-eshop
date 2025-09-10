"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { ShoppingCart, Loader2 } from "lucide-react"
import { useCart } from "../context/cart-context"

interface AddToCartButtonProps {
  variant: any
  quantity?: number
  className?: string
  children?: React.ReactNode
}

export function AddToCartButton({ 
  variant, 
  quantity = 1, 
  className = "",
  children 
}: AddToCartButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { addItem } = useCart()

  const handleAddToCart = async () => {
    if (!variant) return
    
    setIsLoading(true)
    try {
      await addItem(variant, quantity)
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Chyba při přidávání do košíku')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleAddToCart}
      disabled={isLoading || !variant}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <ShoppingCart className="h-4 w-4 mr-2" />
      )}
      {children || 'Do košíku'}
    </Button>
  )
}