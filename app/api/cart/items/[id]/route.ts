import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
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

// Helper function to verify cart item ownership
async function verifyCartItemOwnership(itemId: string, userId: string | null, sessionId: string | null) {
  const { data: cartItem } = await supabase
    .from('cart_items')
    .select(`
      *,
      cart:carts (
        id,
        customer_id,
        session_id
      )
    `)
    .eq('id', itemId)
    .single()
  
  if (!cartItem) return false
  
  // Check ownership
  if (userId && cartItem.cart.customer_id === userId) return true
  if (sessionId && cartItem.cart.session_id === sessionId) return true
  
  return false
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authToken = request.headers.get('authorization')
    const sessionId = request.headers.get('x-session-id')
    const { quantity } = await request.json()
    
    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'Valid quantity is required' },
        { status: 400 }
      )
    }
    
    const userId = await getUserFromToken(authToken)
    
    // Verify ownership
    const hasAccess = await verifyCartItemOwnership(id, userId, sessionId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Cart item not found or access denied' },
        { status: 404 }
      )
    }
    
    // Update cart item quantity
    const { data: updatedItem, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', id)
      .select(`
        *,
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
      `)
      .single()
    
    if (error) {
      console.error('Cart item update error:', error)
      return NextResponse.json(
        { error: 'Failed to update cart item' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      message: 'Cart item updated successfully',
      cartItem: updatedItem
    })
    
  } catch (error) {
    console.error('Update cart item error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authToken = request.headers.get('authorization')
    const sessionId = request.headers.get('x-session-id')
    
    const userId = await getUserFromToken(authToken)
    
    // Verify ownership
    const hasAccess = await verifyCartItemOwnership(id, userId, sessionId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Cart item not found or access denied' },
        { status: 404 }
      )
    }
    
    // Delete cart item
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Cart item deletion error:', error)
      return NextResponse.json(
        { error: 'Failed to remove cart item' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      message: 'Cart item removed successfully'
    })
    
  } catch (error) {
    console.error('Remove cart item error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}