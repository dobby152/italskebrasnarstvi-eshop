import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

interface OrderItem {
  product_id?: number
  sku: string
  name: string
  quantity: number
  price: number
}

interface CreateOrderRequest {
  customer_name: string
  customer_email: string
  customer_phone?: string
  items: OrderItem[]
  shipping_address?: {
    line1: string
    city: string
    postal_code: string
    country?: string
  }
  billing_address?: {
    line1: string
    city: string
    postal_code: string
    country?: string
  }
  shipping_method?: string
  payment_method?: string
  order_note?: string
  tags?: string[]
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json()
    
    const {
      customer_name,
      customer_email,
      customer_phone,
      items,
      shipping_address,
      billing_address,
      shipping_method,
      payment_method,
      order_note,
      tags
    } = body

    // Validate required fields
    if (!customer_name || !customer_email || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Customer name, email, and at least one item are required' },
        { status: 400 }
      )
    }

    // Calculate order totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const shippingAmount = subtotal >= 2500 ? 0 : 99 // Free shipping over 2500 CZK
    const taxRate = 0.21 // 21% DPH
    const taxAmount = Math.round(subtotal * taxRate)
    const total = subtotal + shippingAmount + taxAmount

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name,
        customer_email,
        customer_phone,
        status: 'pending',
        payment_status: 'pending',
        fulfillment_status: 'unfulfilled',
        financial_status: 'pending',
        subtotal,
        tax_amount: taxAmount,
        shipping_amount: shippingAmount,
        discount_amount: 0,
        total,
        shipping_method: shipping_method || 'standard',
        payment_method: payment_method || 'online',
        order_note,
        tags: tags || [],
        shipping_address_line1: shipping_address?.line1,
        shipping_city: shipping_address?.city,
        shipping_postal_code: shipping_address?.postal_code,
        billing_address_line1: billing_address?.line1 || shipping_address?.line1,
        billing_city: billing_address?.city || shipping_address?.city,
        billing_postal_code: billing_address?.postal_code || shipping_address?.postal_code,
        line_items: items,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      throw orderError
    }

    // Create order creation event
    await supabase.from('order_events').insert({
      order_id: order.id,
      event_type: 'order_created',
      event_status: 'success',
      description: 'Objednávka byla vytvořena',
      created_by: 'System',
      created_at: new Date().toISOString(),
      details: {
        items_count: items.length,
        total_amount: total
      }
    })

    // Update inventory for each item (decrease stock)
    for (const item of items) {
      if (item.sku) {
        // Get current inventory
        const { data: inventory } = await supabase
          .from('inventory')
          .select('total_stock, chodov_stock, outlet_stock')
          .eq('sku', item.sku)
          .single()

        if (inventory && inventory.total_stock >= item.quantity) {
          // Decrease from chodov first, then outlet
          let chodovDecrease = Math.min(inventory.chodov_stock, item.quantity)
          let outletDecrease = item.quantity - chodovDecrease

          const newChodovStock = Math.max(0, inventory.chodov_stock - chodovDecrease)
          const newOutletStock = Math.max(0, inventory.outlet_stock - outletDecrease)
          const newTotalStock = newChodovStock + newOutletStock

          await supabase
            .from('inventory')
            .update({
              chodov_stock: newChodovStock,
              outlet_stock: newOutletStock,
              total_stock: newTotalStock,
              updated_at: new Date().toISOString()
            })
            .eq('sku', item.sku)

          // Record stock movement
          await supabase.from('stock_movements').insert({
            sku: item.sku,
            movement_type: 'out',
            quantity: item.quantity,
            location: chodovDecrease > 0 ? 'chodov' : 'outlet',
            reason: `Objednávka ${orderNumber}`,
            user_id: 'system',
            created_at: new Date().toISOString()
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: order.id,
        order_number: orderNumber,
        customer_name,
        customer_email,
        status: 'pending',
        payment_status: 'pending',
        total,
        created_at: order.created_at
      }
    })

  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}