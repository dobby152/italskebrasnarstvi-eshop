import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/app/lib/supabase'
import jwt from 'jsonwebtoken'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil'
})

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
    const { successUrl, cancelUrl } = await request.json()
    
    const userId = await getUserFromToken(authToken)
    
    // Get cart data
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
              compare_at_price,
              inventory_quantity,
              product:products (
                id,
                title,
                handle
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
              compare_at_price,
              inventory_quantity,
              product:products (
                id,
                title,
                handle
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
      return NextResponse.json(
        { error: 'Košík je prázdný nebo nebyl nalezen' },
        { status: 400 }
      )
    }
    
    // Validate inventory and prepare line items
    const lineItems = []
    let hasOutOfStock = false
    let outOfStockItems = []
    
    for (const item of cart.cart_items) {
      const variant = item.product_variant
      
      // Check inventory
      if (variant.inventory_quantity < item.quantity) {
        hasOutOfStock = true
        outOfStockItems.push({
          name: variant.product.title,
          sku: variant.sku,
          requested: item.quantity,
          available: variant.inventory_quantity
        })
        continue
      }
      
      // Add to Stripe line items
      lineItems.push({
        price_data: {
          currency: 'czk',
          product_data: {
            name: variant.product.title,
            metadata: {
              sku: variant.sku,
              variant_id: variant.id,
              cart_item_id: item.id
            }
          },
          unit_amount: Math.round(variant.price * 100), // Convert to haléře
        },
        quantity: item.quantity,
      })
    }
    
    if (hasOutOfStock) {
      return NextResponse.json(
        { 
          error: 'Některé produkty nejsou na skladě',
          outOfStockItems
        },
        { status: 400 }
      )
    }
    
    // Add shipping if subtotal < 2500 CZK
    const subtotal = lineItems.reduce((sum, item) => {
      return sum + (item.price_data.unit_amount * item.quantity / 100)
    }, 0)
    
    if (subtotal < 2500) {
      lineItems.push({
        price_data: {
          currency: 'czk',
          product_data: {
            name: 'Doprava',
          },
          unit_amount: 15000, // 150 CZK in haléře
        },
        quantity: 1,
      })
    }
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/cart`,
      metadata: {
        cart_id: cart.id,
        user_id: userId || '',
        session_id: sessionId || ''
      },
      shipping_address_collection: {
        allowed_countries: ['CZ', 'SK'],
      },
      customer_email: userId ? undefined : undefined, // Will be collected in checkout
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
    })
    
    // Store checkout session info
    await supabase
      .from('checkout_sessions')
      .insert({
        stripe_session_id: session.id,
        cart_id: cart.id,
        customer_id: userId,
        session_id: sessionId,
        status: 'pending',
        amount: session.amount_total,
        currency: session.currency
      })
    
    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    })
    
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Došlo k chybě při vytváření objednávky' },
      { status: 500 }
    )
  }
}