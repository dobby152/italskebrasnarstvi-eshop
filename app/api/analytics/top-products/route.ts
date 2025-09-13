import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7days'
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get orders with items from the specified period
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        payment_status,
        order_items (
          id,
          quantity,
          price,
          product_id,
          products!order_items_product_id_fkey (
            id,
            name,
            sku,
            image_url
          )
        )
      `)
      .eq('payment_status', 'paid')
      .gte('created_at', getDateRange(period))

    if (error) {
      throw error
    }

    // Process order items to calculate top products
    const productMap = new Map()

    orders?.forEach(order => {
      order.order_items?.forEach((item: any) => {
        const productId = item.product_id
        const product = item.products

        if (product && productId) {
          if (productMap.has(productId)) {
            const existing = productMap.get(productId)
            productMap.set(productId, {
              ...existing,
              totalSold: existing.totalSold + item.quantity,
              totalRevenue: existing.totalRevenue + (item.price * item.quantity),
              ordersCount: existing.ordersCount + 1
            })
          } else {
            productMap.set(productId, {
              id: product.id,
              name: product.name,
              sku: product.sku,
              image_url: product.image_url,
              totalSold: item.quantity,
              totalRevenue: item.price * item.quantity,
              ordersCount: 1
            })
          }
        }
      })
    })

    // Convert to array and sort by total sold
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, limit)
      .map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        image_url: product.image_url,
        sales: product.totalSold,
        revenue: Math.round(product.totalRevenue),
        orders: product.ordersCount,
        averageOrderValue: Math.round(product.totalRevenue / product.ordersCount)
      }))

    // Calculate total stats
    const totalRevenue = topProducts.reduce((sum, product) => sum + product.revenue, 0)
    const totalSales = topProducts.reduce((sum, product) => sum + product.sales, 0)

    return NextResponse.json({
      topProducts,
      stats: {
        totalProducts: productMap.size,
        totalRevenue,
        totalSales,
        period
      }
    })

  } catch (error) {
    console.error('Top products analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch top products analytics' },
      { status: 500 }
    )
  }
}

function getDateRange(period: string): string {
  const now = new Date()
  let days = 7

  switch (period) {
    case 'today':
      days = 1
      break
    case 'yesterday':
      days = 2
      break
    case '7days':
      days = 7
      break
    case '30days':
      days = 30
      break
    case '90days':
      days = 90
      break
  }

  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  return startDate.toISOString()
}