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

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const authToken = request.headers.get('authorization')
    const sessionIdHeader = request.headers.get('x-session-id')
    const { sessionId } = params
    
    const userId = await getUserFromToken(authToken)
    
    // Get checkout session
    const { data: checkoutSession } = await supabase
      .from('checkout_sessions')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .single()
    
    if (!checkoutSession) {
      return NextResponse.json(
        { error: 'Checkout session not found' },
        { status: 404 }
      )
    }
    
    // Verify ownership
    if (userId && checkoutSession.customer_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }
    
    if (!userId && sessionIdHeader && checkoutSession.session_id !== sessionIdHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }
    
    // Get order details if available
    const { data: order } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          price,
          product_variant:product_variants (
            id,
            sku,
            product:products (
              id,
              title
            )
          )
        )
      `)
      .eq('payment_id', checkoutSession.stripe_session_id)
      .single()
    
    return NextResponse.json({
      checkoutSession,
      order
    })
    
  } catch (error) {
    console.error('Session lookup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}