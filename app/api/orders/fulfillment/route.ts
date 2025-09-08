import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      order_id,
      line_items,
      tracking_number,
      tracking_company,
      notify_customer = true
    } = body

    if (!order_id || !line_items || !Array.isArray(line_items)) {
      return NextResponse.json(
        { error: 'Order ID and line items are required' },
        { status: 400 }
      )
    }

    // Create fulfillment record
    const { data: fulfillment, error: fulfillmentError } = await supabase
      .from('order_fulfillments')
      .insert({
        order_id,
        status: 'fulfilled',
        tracking_number,
        tracking_company,
        shipped_at: new Date().toISOString(),
        line_items,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (fulfillmentError) {
      console.error('Error creating fulfillment:', fulfillmentError)
      throw fulfillmentError
    }

    // Update order fulfillment status
    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({
        fulfillment_status: 'fulfilled',
        shipped_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', order_id)

    if (orderUpdateError) {
      console.error('Error updating order:', orderUpdateError)
    }

    // Log fulfillment event
    await supabase.from('order_events').insert({
      order_id,
      event_type: 'order_fulfilled',
      event_status: 'success',
      description: `Objednávka byla expedována${tracking_number ? ` (tracking: ${tracking_number})` : ''}`,
      created_by: 'Admin',
      created_at: new Date().toISOString(),
      details: {
        tracking_number,
        tracking_company,
        fulfilled_items: line_items.length
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Fulfillment created successfully',
      fulfillment
    })

  } catch (error) {
    console.error('Error creating fulfillment:', error)
    return NextResponse.json(
      { error: 'Failed to create fulfillment' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const orderId = url.searchParams.get('order_id')

    let query = supabase
      .from('order_fulfillments')
      .select('*')
      .order('created_at', { ascending: false })

    if (orderId) {
      query = query.eq('order_id', orderId)
    }

    const { data: fulfillments, error } = await query

    if (error) {
      console.error('Error fetching fulfillments:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      fulfillments: fulfillments || []
    })

  } catch (error) {
    console.error('Error fetching fulfillments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fulfillments' },
      { status: 500 }
    )
  }
}