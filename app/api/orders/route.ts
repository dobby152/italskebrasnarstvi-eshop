import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        customer_email,
        customer_name,
        created_at,
        status,
        payment_status,
        total,
        line_items
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ 
        orders: [], 
        stats: { totalOrders: 0, fulfilled: 0, unfulfilled: 0, partiallyFulfilled: 0 }
      })
    }

    // Transform orders data
    const transformedOrders = orders?.map(order => ({
      id: order.id,
      customer: order.customer_name || order.customer_email || 'Unknown',
      date: order.created_at,
      status: order.status || 'pending',
      statusLabel: getStatusLabel(order.status),
      payment: order.payment_status || 'pending',
      paymentLabel: getPaymentLabel(order.payment_status),
      total: order.total || 0,
      items: Array.isArray(order.line_items) ? order.line_items.length : 0
    })) || []

    // Calculate stats
    const stats = {
      totalOrders: transformedOrders.length,
      fulfilled: transformedOrders.filter(order => order.status === 'fulfilled').length,
      unfulfilled: transformedOrders.filter(order => order.status === 'unfulfilled' || order.status === 'pending').length,
      partiallyFulfilled: transformedOrders.filter(order => order.status === 'partially_fulfilled').length
    }

    return NextResponse.json({
      orders: transformedOrders,
      stats
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ 
      orders: [], 
      stats: { totalOrders: 0, fulfilled: 0, unfulfilled: 0, partiallyFulfilled: 0 }
    })
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'fulfilled':
      return 'Vyřízeno'
    case 'pending':
    case 'unfulfilled':
      return 'Nevyřízeno'
    case 'partially_fulfilled':
      return 'Částečně vyřízeno'
    default:
      return status || 'Nevyřízeno'
  }
}

function getPaymentLabel(payment: string): string {
  switch (payment) {
    case 'paid':
      return 'Zaplaceno'
    case 'pending':
      return 'Čeká na platbu'
    case 'failed':
      return 'Selhala platba'
    default:
      return payment || 'Čeká na platbu'
  }
}