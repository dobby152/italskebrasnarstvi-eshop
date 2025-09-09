"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { X, Percent, Clock, ShoppingCart, Gift, AlertTriangle } from 'lucide-react'

interface CartItem {
  productId: string
  productName: string
  quantity: number
  price: number
  sku: string
  imageUrl?: string
}

interface DiscountOffer {
  percentage: number
  code: string
  validUntil: string
}

interface AbandonmentPreventionProps {
  cartItems: CartItem[]
  totalValue: number
  sessionId: string
  userId?: string
  email?: string
  onCartSaved?: (cartId: string) => void
  className?: string
}

export function CartAbandonmentPrevention({
  cartItems,
  totalValue,
  sessionId,
  userId,
  email,
  onCartSaved,
  className
}: AbandonmentPreventionProps) {
  const [showExitIntent, setShowExitIntent] = useState(false)
  const [showTimeWarning, setShowTimeWarning] = useState(false)
  const [discountOffer, setDiscountOffer] = useState<DiscountOffer | null>(null)
  const [timeOnPage, setTimeOnPage] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  
  const startTime = useRef(Date.now())
  const mouseLeaveTimeout = useRef<NodeJS.Timeout | null>(null)
  const timeWarningTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Track time on page
    const interval = setInterval(() => {
      setTimeOnPage(Date.now() - startTime.current)
    }, 1000)

    // Show time-based warning after 5 minutes
    timeWarningTimeout.current = setTimeout(() => {
      if (cartItems.length > 0) {
        setShowTimeWarning(true)
        saveAbandonedCart(false)
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => {
      clearInterval(interval)
      if (timeWarningTimeout.current) {
        clearTimeout(timeWarningTimeout.current)
      }
    }
  }, [cartItems])

  useEffect(() => {
    // Exit intent detection
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && cartItems.length > 0 && !showExitIntent) {
        // Mouse left at top of screen - potential exit
        mouseLeaveTimeout.current = setTimeout(() => {
          setShowExitIntent(true)
          saveAbandonedCart(true)
        }, 500)
      }
    }

    const handleMouseEnter = () => {
      if (mouseLeaveTimeout.current) {
        clearTimeout(mouseLeaveTimeout.current)
      }
    }

    const handleBeforeUnload = () => {
      if (cartItems.length > 0) {
        saveAbandonedCart(true)
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mouseenter', handleMouseEnter)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mouseenter', handleMouseEnter)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      
      if (mouseLeaveTimeout.current) {
        clearTimeout(mouseLeaveTimeout.current)
      }
    }
  }, [cartItems, showExitIntent])

  const saveAbandonedCart = async (exitIntent: boolean = false) => {
    if (cartItems.length === 0) return

    try {
      const response = await fetch('/api/cart/abandonment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userId,
          email,
          cartItems,
          totalValue,
          lastActivity: new Date().toISOString(),
          exitIntent,
          timeOnPage,
          source: 'website'
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.saved && data.recoveryOffer?.discountOffer) {
          setDiscountOffer(data.recoveryOffer.discountOffer)
        }
        
        if (onCartSaved && data.cartId) {
          onCartSaved(data.cartId)
        }
      }
    } catch (error) {
      console.error('Failed to save abandoned cart:', error)
    }
  }

  const applyDiscount = (code: string) => {
    // Apply discount logic - this would typically update cart state
    console.log('Applying discount code:', code)
    
    // Hide the modal
    setShowExitIntent(false)
    setShowTimeWarning(false)
  }

  const closeModal = () => {
    setShowExitIntent(false)
    setShowTimeWarning(false)
    setIsVisible(false)
  }

  if (!isVisible || cartItems.length === 0) {
    return null
  }

  return (
    <>
      {/* Exit Intent Modal */}
      {showExitIntent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg mx-auto shadow-2xl animate-in slide-in-from-bottom-4">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl font-bold">Počkejte!</CardTitle>
              <p className="text-gray-600">
                Opravdu chcete opustit stránku? Váš košík obsahuje {cartItems.length} {cartItems.length === 1 ? 'položku' : 'položky'} v hodnotě {totalValue.toLocaleString('cs-CZ')} Kč!
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Cart Summary */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Váš košík:</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {cartItems.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                      <div className="w-8 h-8 bg-gray-200 rounded flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.productName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.quantity}× {item.price.toLocaleString('cs-CZ')} Kč
                        </p>
                      </div>
                    </div>
                  ))}
                  {cartItems.length > 3 && (
                    <p className="text-sm text-gray-500 text-center">
                      ... a další {cartItems.length - 3} {cartItems.length - 3 === 1 ? 'položka' : 'položky'}
                    </p>
                  )}
                </div>
              </div>

              {/* Discount Offer */}
              {discountOffer && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800">Speciální nabídka!</span>
                  </div>
                  <p className="text-gray-700 mb-3">
                    Získejte <strong>{discountOffer.percentage}% slevu</strong> při dokončení objednávky nyní!
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Percent className="h-3 w-3 mr-1" />
                      {discountOffer.code}
                    </Badge>
                    <span className="text-xs text-gray-600 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Platí 24 hodin
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button 
                  className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  onClick={() => {
                    if (discountOffer) {
                      applyDiscount(discountOffer.code)
                    } else {
                      closeModal()
                    }
                  }}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {discountOffer ? `Použít slevu ${discountOffer.percentage}%` : 'Dokončit objednávku'}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={closeModal}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4 mr-1" />
                  Zavřít
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Váš košík zůstane uložen po dobu 7 dní
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Time Warning Bar */}
      {showTimeWarning && !showExitIntent && (
        <div className="fixed bottom-4 right-4 z-40 max-w-sm">
          <Card className="shadow-lg border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-orange-900 text-sm">
                    Košík uložen
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    Vaše položky zůstanou uložené po dobu 7 dní
                  </p>
                  
                  {discountOffer && (
                    <div className="mt-2">
                      <Button 
                        size="sm" 
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                        onClick={() => applyDiscount(discountOffer.code)}
                      >
                        Slevu {discountOffer.percentage}%
                      </Button>
                    </div>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTimeWarning(false)}
                  className="flex-shrink-0 p-1 h-6 w-6"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}