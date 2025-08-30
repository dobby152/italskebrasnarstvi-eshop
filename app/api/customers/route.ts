import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dbnfkzctensbpktgbsgn.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Nzk0NDgsImV4cCI6MjA3MTI1NTQ0OH0.vbtmSPS8ul57zeZ3W1LCZFAO0O6nyt475IY2_hGHKws'
)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API Route: GET /api/customers called')

    // Fetch orders to aggregate customer data
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('❌ API Route: Error fetching orders:', ordersError)
      throw ordersError
    }

    console.log(`📦 API Route: Fetched ${orders?.length || 0} orders`)

    // Group orders by customer email to create customer statistics
    const customerMap = new Map<string, {
      id: string
      name: string
      email: string
      phone?: string
      orders_count: number
      total_spent: number
      last_order_date: string
      status: 'new' | 'regular' | 'vip'
      created_at: string
    }>()

    orders?.forEach(order => {
      const email = order.billing_email
      if (!email) return

      const existing = customerMap.get(email)
      const orderTotal = parseFloat(order.total_amount) || 0

      if (existing) {
        // Update existing customer
        existing.orders_count += 1
        existing.total_spent += orderTotal
        // Update last order date if this order is newer
        if (new Date(order.created_at) > new Date(existing.last_order_date)) {
          existing.last_order_date = order.created_at
        }
      } else {
        // Create new customer entry
        customerMap.set(email, {
          id: email,
          name: `${order.billing_first_name || ''} ${order.billing_last_name || ''}`.trim() || 'N/A',
          email: email,
          phone: order.billing_phone || undefined,
          orders_count: 1,
          total_spent: orderTotal,
          last_order_date: order.created_at,
          status: 'new',
          created_at: order.created_at
        })
      }
    })

    // Convert map to array and determine customer status
    const customers = Array.from(customerMap.values()).map(customer => {
      // Determine status based on orders and spending
      let status: 'new' | 'regular' | 'vip' = 'new'
      if (customer.orders_count >= 10 || customer.total_spent >= 50000) {
        status = 'vip'
      } else if (customer.orders_count >= 3 || customer.total_spent >= 10000) {
        status = 'regular'
      }

      return {
        ...customer,
        status,
        // Format total spent as currency
        total_spent_formatted: `${customer.total_spent.toLocaleString()} Kč`,
        // Format last order date
        last_order_formatted: new Date(customer.last_order_date).toLocaleDateString('cs-CZ')
      }
    })

    // Sort customers by total spent (descending)
    customers.sort((a, b) => b.total_spent - a.total_spent)

    // Calculate statistics
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const newThisMonth = customers.filter(customer => {
      const createdDate = new Date(customer.created_at)
      return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear
    }).length

    const totalRevenue = customers.reduce((sum, customer) => sum + customer.total_spent, 0)
    const totalOrders = customers.reduce((sum, customer) => sum + customer.orders_count, 0)

    const stats = {
      totalCustomers: customers.length,
      newThisMonth,
      totalRevenue,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      customers // Include customers in stats for easy access
    }

    console.log(`✅ API Route: Returning ${customers.length} customers`)
    
    return NextResponse.json({
      customers,
      stats,
      success: true
    })

  } catch (error) {
    console.error('❌ API Route: Error in customers endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers', success: false },
      { status: 500 }
    )
  }
}