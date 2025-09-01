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

export async function GET(request: NextRequest) {
  try {
    const authToken = request.headers.get('authorization')
    const sessionId = request.headers.get('x-session-id')
    
    const userId = await getUserFromToken(authToken)
    
    let cart
    
    if (userId) {
      // Get cart for authenticated user
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
                handle,
                product_images (
                  id,
                  src,
                  alt_text,
                  position
                )
              )
            )
          )
        `)
        .eq('customer_id', userId)
        .eq('status', 'active')
        .single()
      
      cart = userCart
    } else if (sessionId) {
      // Get cart for guest user by session
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
                handle,
                product_images (
                  id,
                  src,
                  alt_text,
                  position
                )
              )
            )
          )
        `)
        .eq('session_id', sessionId)
        .eq('status', 'active')
        .single()
      
      cart = sessionCart
    }
    
    if (!cart) {
      return NextResponse.json({
        cart: null,
        items: [],
        total: 0,
        itemCount: 0
      })
    }
    
    // Calculate totals
    const items = cart.cart_items || []
    const total = items.reduce((sum: number, item: any) => {
      return sum + (item.product_variant?.price || 0) * item.quantity
    }, 0)
    
    return NextResponse.json({
      cart,
      items,
      total,
      itemCount: items.reduce((sum: number, item: any) => sum + item.quantity, 0)
    })
    
  } catch (error) {
    console.error('Cart load error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authToken = request.headers.get('authorization')
    const sessionId = request.headers.get('x-session-id')
    const { action, productVariantId, quantity = 1 } = await request.json()
    
    const userId = await getUserFromToken(authToken)
    
    if (action === 'create') {
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
      
      return NextResponse.json({ cart: newCart })
    }
    
    if (action === 'add' && productVariantId) {
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
      } else {
        // Add new item
        const { error } = await supabase
          .from('cart_items')
          .insert({
            cart_id: cart.id,
            product_variant_id: productVariantId,
            quantity
          })
        
        if (error) {
          console.error('Cart item creation error:', error)
          return NextResponse.json(
            { error: 'Failed to add item to cart' },
            { status: 500 }
          )
        }
      }
      
      return NextResponse.json({ message: 'Item added to cart successfully' })
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Cart operation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}