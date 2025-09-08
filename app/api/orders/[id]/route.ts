import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: orderId } = await params

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        customer_name,
        customer_email,
        status,
        payment_status,
        fulfillment_status,
        financial_status,
        subtotal,
        tax_amount,
        shipping_amount,
        discount_amount,
        total,
        created_at,
        updated_at,
        shipped_at,
        delivered_at,
        order_note,
        tags,
        shipping_address_line1,
        shipping_city,
        shipping_postal_code,
        billing_address_line1,
        billing_city,
        billing_postal_code,
        line_items
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('Error fetching order:', orderError)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Fetch order events/timeline (if we have a separate events table)
    const { data: events } = await supabase
      .from('order_events')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })

    // Fetch fulfillments
    const { data: fulfillments } = await supabase
      .from('order_fulfillments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })

    // Process line items to match expected interface
    const items = Array.isArray(order.line_items) ? order.line_items.map((item: any, index: number) => ({
      id: item.id || index,
      product_name: item.name || item.product_name || `Produkt ${item.sku}`,
      product_sku: item.sku || item.product_sku || '',
      quantity: item.quantity || 1,
      unit_price: item.price || item.unit_price || 0,
      total_price: (item.price || item.unit_price || 0) * (item.quantity || 1),
      fulfillable_quantity: item.fulfillable_quantity || item.quantity || 1,
      fulfilled_quantity: item.fulfilled_quantity || 0,
      refunded_quantity: item.refunded_quantity || 0,
      product_id: item.product_id
    })) : []

    // Transform order data to match expected interface
    const orderDetail = {
      id: parseInt(orderId),
      order_number: order.order_number || order.id,
      customer_name: order.customer_name || 'Neznámý zákazník',
      customer_email: order.customer_email || '',
      status: order.status || 'pending',
      payment_status: order.payment_status || 'pending',
      fulfillment_status: order.fulfillment_status || 'unfulfilled',
      financial_status: order.financial_status || order.payment_status || 'pending',
      subtotal: order.subtotal || order.total || 0,
      tax_amount: order.tax_amount || 0,
      shipping_amount: order.shipping_amount || 0,
      discount_amount: order.discount_amount || 0,
      total_amount: order.total || 0,
      created_at: order.created_at,
      updated_at: order.updated_at,
      shipped_at: order.shipped_at,
      delivered_at: order.delivered_at,
      order_note: order.order_note,
      tags: Array.isArray(order.tags) ? order.tags : [],
      
      // Address information
      shipping_address_line1: order.shipping_address_line1,
      shipping_city: order.shipping_city,
      shipping_postal_code: order.shipping_postal_code,
      billing_address_line1: order.billing_address_line1,
      billing_city: order.billing_city,
      billing_postal_code: order.billing_postal_code,
      
      // Related data
      items,
      events: events || [
        {
          id: 1,
          event_type: 'order_created',
          event_status: 'success',
          description: 'Objednávka byla vytvořena',
          created_by: 'System',
          created_at: order.created_at
        }
      ],
      fulfillments: fulfillments || [],
      refunds: [],
      notes: []
    }

    return NextResponse.json(orderDetail)

  } catch (error) {
    console.error('Error fetching order details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: orderId } = await params
    const body = await request.json()
    
    const {
      status,
      payment_status,
      fulfillment_status,
      order_note,
      tags
    } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Update order
    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update({
        status,
        payment_status,
        fulfillment_status,
        order_note,
        tags,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single()

    if (error) {
      console.error('Error updating order:', error)
      throw error
    }

    // Log the update event
    await supabase.from('order_events').insert({
      order_id: orderId,
      event_type: 'order_updated',
      event_status: 'success',
      description: 'Objednávka byla aktualizována',
      created_by: 'Admin',
      created_at: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order: updatedOrder
    })

  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}