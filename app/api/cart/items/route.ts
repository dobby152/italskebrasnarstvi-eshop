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
    const { productVariantId, quantity = 1 } = await request.json()
    
    if (!productVariantId) {
      return NextResponse.json(
        { error: 'Product variant ID is required' },
        { status: 400 }
      )
    }
    
    const userId = await getUserFromToken(authToken)
    
    // Find or create cart
    let cart
    
    if (userId) {
      const { data: existingCart } = await supabase
        .from('carts')
        .select('*')
        .eq('customer_id', userId)
        .eq('status', 'active')
        .single()
      
      cart = existingCart
    } else if (sessionId) {
      const { data: existingCart } = await supabase
        .from('carts')
        .select('*')
        .eq('session_id', sessionId)
        .eq('status', 'active')
        .single()
      
      cart = existingCart
    }
    
    if (!cart) {
      // Create new cart
      const cartData: any = {
        status: 'active',
        currency: 'CZK'
      }
      
      if (userId) {
        cartData.customer_id = userId
      } else if (sessionId) {
        cartData.session_id = sessionId
      } else {
        return NextResponse.json(
          { error: 'Session ID or authentication required' },
          { status: 400 }
        )
      }
      
      const { data: newCart, error } = await supabase
        .from('carts')
        .insert(cartData)
        .select()
        .single()
      
      if (error) {
        console.error('Cart creation error:', error)
        return NextResponse.json(
          { error: 'Failed to create cart' },
          { status: 500 }
        )
      }
      
      cart = newCart
    }
    
    // Check if item already exists in cart
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id)
      .eq('product_variant_id', productVariantId)
      .single()
    
    if (existingItem) {
      // Update quantity
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id)
      
      if (error) {
        console.error('Cart item update error:', error)
        return NextResponse.json(
          { error: 'Failed to update cart item' },
          { status: 500 }
        )
      }
      
      return NextResponse.json({ 
        message: 'Cart item quantity updated successfully',
        cartItem: { ...existingItem, quantity: existingItem.quantity + quantity }
      })
    } else {
      // Add new item
      const { data: newItem, error } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cart.id,
          product_variant_id: productVariantId,
          quantity
        })
        .select()
        .single()
      
      if (error) {
        console.error('Cart item creation error:', error)
        return NextResponse.json(
          { error: 'Failed to add item to cart' },
          { status: 500 }
        )
      }
      
      return NextResponse.json({ 
        message: 'Item added to cart successfully',
        cartItem: newItem
      })
    }
    
  } catch (error) {
    console.error('Add to cart error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}