import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import jwt from 'jsonwebtoken'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

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
    const { searchParams } = new URL(request.url)
    const trackingNumber = searchParams.get('number')
    
    if (!trackingNumber) {
      return NextResponse.json(
        { error: 'Tracking number is required' },
        { status: 400 }
      )
    }

    const authToken = request.headers.get('authorization')
    const userId = await getUserFromToken(authToken)
    
    // Build query to find order by tracking number
    let query = supabase
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
            price,
            product:products (
              id,
              title,
              handle
            )
          )
        ),
        shipping_address:addresses!orders_shipping_address_id_fkey (
          id,
          first_name,
          last_name,
          address1,
          address2,
          city,
          province,
          country,
          zip
        )
      `)
      .eq('tracking_number', trackingNumber)
    
    // If user is authenticated, only show their orders
    if (userId) {
      query = query.eq('customer_id', userId)
    }
    
    const { data: order, error } = await query.single()
    
    if (error || !order) {
      return NextResponse.json(
        { error: 'Order not found or access denied' },
        { status: 404 }
      )
    }
    
    // Format response similar to original API
    const trackingData = {
      order: {
        id: order.id,
        order_number: order.order_number,
        tracking_number: order.tracking_number,
        status: order.status,
        fulfillment_status: order.fulfillment_status,
        financial_status: order.financial_status,
        total_price: order.total_price,
        currency: order.currency,
        created_at: order.created_at,
        updated_at: order.updated_at,
        shipping_address: order.shipping_address,
        items: order.order_items?.map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          product: {
            id: item.product_variant?.product?.id,
            title: item.product_variant?.product?.title,
            handle: item.product_variant?.product?.handle
          },
          variant: {
            id: item.product_variant?.id,
            sku: item.product_variant?.sku,
            price: item.product_variant?.price
          }
        })) || []
      },
      tracking_events: [
        {
          status: order.status,
          description: `Order ${order.status}`,
          timestamp: order.updated_at,
          location: order.shipping_address ? `${order.shipping_address.city}, ${order.shipping_address.province}` : null
        }
      ]
    }

    return NextResponse.json(trackingData)
  } catch (error) {
    console.error('Order tracking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}