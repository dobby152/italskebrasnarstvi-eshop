"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Loader2, CreditCard, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "./ui/alert"

interface CheckoutButtonProps {
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

interface ValidationIssue {
  type: string
  message: string
  itemId?: string
  productName?: string
  sku?: string
  available?: number
  requested?: number
}

interface ValidationSummary {
  itemsCount: number
  subtotal: number
  shipping: number
  total: number
  currency: string
  freeShipping: boolean
  freeShippingThreshold: number
  amountToFreeShipping: number
}

interface ValidationResponse {
  valid: boolean
  issues: ValidationIssue[]
  summary?: ValidationSummary
  error?: string
}

export default function CheckoutButton({ 
  disabled = false, 
  className = "",
  children = "Pokračovat k pokladně"
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([])

  const getSessionId = () => {
    let sessionId = localStorage.getItem('sessionId')
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      localStorage.setItem('sessionId', sessionId)
    }
    return sessionId
  }

  const validateCart = async (): Promise<ValidationResponse> => {
    const response = await fetch('/api/cart/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'x-session-id': getSessionId()
      }
    })

    return response.json()
  }

  const createCheckoutSession = async () => {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'x-session-id': getSessionId()
      },
      body: JSON.stringify({
        successUrl: `${window.location.origin}/checkout/success`,
        cancelUrl: `${window.location.origin}/cart`
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Chyba při vytváření checkout session')
    }

    return response.json()
  }

  const handleCheckout = async () => {
    setLoading(true)
    setValidationError(null)
    setValidationIssues([])

    try {
      // First validate cart
      const validation = await validateCart()

      if (!validation.valid) {
        setValidationError(validation.error || 'Košík obsahuje chyby')
        setValidationIssues(validation.issues || [])
        return
      }

      // Create checkout session
      const { url } = await createCheckoutSession()
      
      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url
      } else {
        throw new Error('Nebyla vrácena URL pro checkout')
      }

    } catch (error) {
      console.error('Checkout error:', error)
      setValidationError(
        error instanceof Error 
          ? error.message 
          : 'Došlo k neočekávané chybě'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Validation Errors */}
      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      {/* Validation Issues */}
      {validationIssues.length > 0 && (
        <div className="space-y-2">
          {validationIssues.map((issue, index) => (
            <Alert key={index} variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {issue.productName && (
                  <span className="font-medium">{issue.productName}: </span>
                )}
                {issue.message}
                {issue.type === 'insufficient_stock' && issue.available !== undefined && (
                  <div className="text-sm mt-1">
                    Dostupné: {issue.available}, Požadované: {issue.requested}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <Button
        onClick={handleCheckout}
        disabled={disabled || loading}
        className={`w-full ${className}`}
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Zpracovávám...
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            {children}
          </>
        )}
      </Button>
    </div>
  )
}