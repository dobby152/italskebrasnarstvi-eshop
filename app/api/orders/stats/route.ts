import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const days = parseInt(url.searchParams.get('days') || '30')
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get orders within date range
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, status, payment_status, fulfillment_status, total, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (error) {
      console.error('Error fetching orders for stats:', error)
      return NextResponse.json({
        success: true,
        stats: {
          totalOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          ordersByStatus: {
            pending: 0,
            processing: 0,
            fulfilled: 0,
            cancelled: 0
          },
          ordersByPayment: {
            pending: 0,
            paid: 0,
            failed: 0,
            refunded: 0
          },
          ordersByFulfillment: {
            unfulfilled: 0,
            partial: 0,
            fulfilled: 0
          },
          dailyStats: []
        }
      })
    }

    const totalOrders = orders?.length || 0
    const totalRevenue = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Count orders by status
    const ordersByStatus = orders?.reduce((acc, order) => {
      const status = order.status || 'pending'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Count orders by payment status
    const ordersByPayment = orders?.reduce((acc, order) => {
      const payment = order.payment_status || 'pending'
      acc[payment] = (acc[payment] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Count orders by fulfillment status
    const ordersByFulfillment = orders?.reduce((acc, order) => {
      const fulfillment = order.fulfillment_status || 'unfulfilled'
      acc[fulfillment] = (acc[fulfillment] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Generate daily stats
    const dailyStats = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayStart = new Date(date.setHours(0, 0, 0, 0))
      const dayEnd = new Date(date.setHours(23, 59, 59, 999))
      
      const dayOrders = orders?.filter(order => {
        const orderDate = new Date(order.created_at)
        return orderDate >= dayStart && orderDate <= dayEnd
      }) || []

      dailyStats.push({
        date: dayStart.toISOString().split('T')[0],
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, order) => sum + (order.total || 0), 0)
      })
    }

    const stats = {
      totalOrders,
      totalRevenue: Math.round(totalRevenue),
      averageOrderValue: Math.round(averageOrderValue),
      ordersByStatus: {
        pending: ordersByStatus.pending || 0,
        processing: ordersByStatus.processing || 0,
        fulfilled: ordersByStatus.fulfilled || 0,
        cancelled: ordersByStatus.cancelled || 0
      },
      ordersByPayment: {
        pending: ordersByPayment.pending || 0,
        paid: ordersByPayment.paid || 0,
        failed: ordersByPayment.failed || 0,
        refunded: ordersByPayment.refunded || 0
      },
      ordersByFulfillment: {
        unfulfilled: ordersByFulfillment.unfulfilled || 0,
        partial: ordersByFulfillment.partial || 0,
        fulfilled: ordersByFulfillment.fulfilled || 0
      },
      dailyStats,
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Error fetching order stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order statistics' },
      { status: 500 }
    )
  }
}