import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('supplier_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: orders, error, count } = await query

    if (error) {
      console.error('Error fetching supplier orders:', error)
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    // Get statistics
    const { data: stats, error: statsError } = await supabase
      .from('order_statistics')
      .select('*')
      .single()

    return NextResponse.json({
      orders: orders || [],
      total: count || 0,
      statistics: stats || {
        total_orders: 0,
        pending_orders: 0,
        contacted_orders: 0,
        completed_orders: 0,
        orders_today: 0,
        orders_this_week: 0
      },
      success: true
    })
  } catch (error) {
    console.error('Supplier orders API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      customer_name,
      customer_email,
      customer_phone,
      product_sku,
      product_name,
      color_variant,
      quantity = 1,
      message
    } = body

    // Validate required fields
    if (!customer_name || !customer_email || !customer_phone || !product_sku || !product_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(customer_email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Insert order
    const { data: order, error } = await supabase
      .from('supplier_orders')
      .insert({
        customer_name,
        customer_email,
        customer_phone,
        product_sku,
        product_name,
        color_variant,
        quantity,
        message: message || null,
        status: 'pending',
        priority: 'normal'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating supplier order:', error)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    console.log('✅ New supplier order created:', {
      id: order.id,
      customer: customer_name,
      product: `${product_name} (${product_sku})`,
      color: color_variant
    })

    return NextResponse.json({
      order,
      success: true,
      message: 'Order created successfully'
    })
  } catch (error) {
    console.error('Supplier orders POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}