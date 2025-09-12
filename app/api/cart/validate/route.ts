import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Helper function to get user from token
async function getUserFromToken(authToken: string | null) {
  if (!authToken) return null
  
  try {
    const token = authToken.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    return decoded.userId
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const authToken = request.headers.get('authorization')
    const sessionId = request.headers.get('x-session-id')
    
    const userId = await getUserFromToken(authToken)
    
    // Get cart with inventory check
    let cart
    if (userId) {
      const { data: userCart } = await supabase
        .from('carts')
        .select(`
          *,
          cart_items (
            id,
            quantity,
            product_variant:product_variants (
              id,
              sku,
              price,
              inventory_quantity,
              product:products (
                id,
                title
              )
            )
          )
        `)
        .eq('customer_id', userId)
        .eq('status', 'active')
        .single()
      
      cart = userCart
    } else if (sessionId) {
      const { data: sessionCart } = await supabase
        .from('carts')
        .select(`
          *,
          cart_items (
            id,
            quantity,
            product_variant:product_variants (
              id,
              sku,
              price,
              inventory_quantity,
              product:products (
                id,
                title
              )
            )
          )
        `)
        .eq('session_id', sessionId)
        .eq('status', 'active')
        .single()
      
      cart = sessionCart
    }
    
    if (!cart || !cart.cart_items || cart.cart_items.length === 0) {
      return NextResponse.json({
        valid: false,
        error: 'Košík je prázdný',
        issues: []
      })
    }
    
    // Validate each item
    const issues = []
    let valid = true
    let totalAmount = 0
    
    for (const item of cart.cart_items) {
      const variant = item.product_variant
      const itemTotal = variant.price * item.quantity
      
      // Check if variant still exists
      if (!variant) {
        issues.push({
          type: 'product_unavailable',
          message: 'Produkt již není dostupný',
          itemId: item.id,
          quantity: item.quantity
        })
        valid = false
        continue
      }
      
      // Check inventory
      if (variant.inventory_quantity < item.quantity) {
        issues.push({
          type: 'insufficient_stock',
          message: `Nedostatek na skladě. Dostupné: ${variant.inventory_quantity}, požadované: ${item.quantity}`,
          itemId: item.id,
          productName: variant.product.title,
          sku: variant.sku,
          available: variant.inventory_quantity,
          requested: item.quantity
        })
        valid = false
      }
      
      // Check for price changes (could be implemented later)
      // Price validation could go here
      
      totalAmount += itemTotal
    }
    
    // Calculate shipping
    const shippingCost = totalAmount >= 2500 ? 0 : 150
    const finalTotal = totalAmount + shippingCost
    
    // Additional validations
    if (totalAmount < 1) {
      issues.push({
        type: 'minimum_order',
        message: 'Minimální hodnota objednávky musí být alespoň 1 Kč'
      })
      valid = false
    }
    
    return NextResponse.json({
      valid,
      issues,
      summary: {
        itemsCount: cart.cart_items.length,
        subtotal: totalAmount,
        shipping: shippingCost,
        total: finalTotal,
        currency: 'CZK',
        freeShipping: totalAmount >= 2500,
        freeShippingThreshold: 2500,
        amountToFreeShipping: Math.max(0, 2500 - totalAmount)
      }
    })
    
  } catch (error) {
    console.error('Cart validation error:', error)
    return NextResponse.json(
      { error: 'Chyba při validaci košíku' },
      { status: 500 }
    )
  }
}