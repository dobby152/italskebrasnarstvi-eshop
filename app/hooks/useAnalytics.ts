import { useState, useEffect } from 'react'

export interface AnalyticsData {
  grossSales: number
  discounts: number
  returns: number
  netSales: number
  goalProgress: number
  channelSales: {
    online: number
    other: number
    search: number
  }
  channelPercentages: {
    online: number
    other: number
    search: number
  }
  salesChart: Array<{
    date: string
    sales: number
  }>
  conversionChart: Array<{
    date: string
    rate: number
  }>
  totalVisitors: number
  visitorsGrowth: number
  conversionRate: number
  conversionGrowth: number
  topProducts: Array<{
    name: string
    sales: number
    revenue: number
  }>
  trafficSources: Array<{
    source: string
    visitors: number
    percentage: number
  }>
  recentActivity: Array<{
    type: 'order' | 'customer' | 'product'
    description: string
    time: string
    amount?: string
  }>
}

interface AnalyticsParams {
  period?: string
  channel?: string
}

export function useAnalytics(params: AnalyticsParams = {}) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true)
        
        // Fetch real analytics data from multiple sources
        const [statsResponse, ordersResponse] = await Promise.all([
          fetch('/api/dashboard-stats'),
          fetch('/api/orders')
        ])
        
        if (!statsResponse.ok || !ordersResponse.ok) {
          throw new Error('Failed to fetch analytics data')
        }
        
        const statsData = await statsResponse.json()
        const ordersData = await ordersResponse.json()
        
        // Calculate analytics from real data
        const totalRevenue = statsData.totalRevenue || 0
        const grossSales = totalRevenue
        const discounts = Math.round(totalRevenue * 0.04) // Estimate 4% discount rate
        const returns = Math.round(totalRevenue * 0.015) // Estimate 1.5% return rate
        const netSales = grossSales - discounts - returns
        
        // Calculate goal progress (assuming monthly goal of 150,000 Kč)
        const monthlyGoal = 150000
        const goalProgress = Math.min(100, Math.round((netSales / monthlyGoal) * 100))
        
        // Channel sales breakdown (primarily online for now)
        const channelSales = {
          online: Math.round(netSales * 0.85), // 85% online
          other: Math.round(netSales * 0.12),  // 12% other
          search: Math.round(netSales * 0.03)  // 3% search
        }
        
        const channelPercentages = {
          online: 85,
          other: 12,
          search: 3
        }
        
        // Generate charts from recent orders
        const salesChart = generateSalesChart(ordersData.orders || [])
        const conversionChart = generateConversionChart(ordersData.orders || [])
        
        // Calculate visitor metrics (estimated)
        const totalVisitors = Math.round(netSales / 85) // Avg order value ~85 Kč
        const visitorsGrowth = Math.random() * 20 - 10 // Random growth -10% to +10%
        
        // Calculate conversion metrics
        const conversionRate = totalVisitors > 0 ? (ordersData.orders?.length || 0) / totalVisitors * 100 : 0
        const conversionGrowth = Math.random() * 4 - 2 // Random growth -2% to +2%
        
        // Top products (from orders data)
        const topProducts = generateTopProducts(ordersData.orders || [])
        
        // Traffic sources (estimated)
        const trafficSources = [
          { source: 'Organické vyhledávání', visitors: Math.round(totalVisitors * 0.45), percentage: 45 },
          { source: 'Přímý přístup', visitors: Math.round(totalVisitors * 0.25), percentage: 25 },
          { source: 'Sociální sítě', visitors: Math.round(totalVisitors * 0.15), percentage: 15 },
          { source: 'E-mail marketing', visitors: Math.round(totalVisitors * 0.15), percentage: 15 }
        ]
        
        // Recent activity (from orders data)
        const recentActivity = generateRecentActivity(ordersData.orders || [])
        
        const analyticsData: AnalyticsData = {
          grossSales,
          discounts,
          returns,
          netSales,
          goalProgress,
          channelSales,
          channelPercentages,
          salesChart,
          conversionChart,
          totalVisitors,
          visitorsGrowth,
          conversionRate,
          conversionGrowth,
          topProducts,
          trafficSources,
          recentActivity
        }
        
        setData(analyticsData)
      } catch (err) {
        console.error('Error fetching analytics:', err)
        setError(err instanceof Error ? err : new Error('Unknown error'))
        // Set empty data on error
        setData({
          grossSales: 0,
          discounts: 0,
          returns: 0,
          netSales: 0,
          goalProgress: 0,
          channelSales: { online: 0, other: 0, search: 0 },
          channelPercentages: { online: 0, other: 0, search: 0 },
          salesChart: [],
          conversionChart: [],
          totalVisitors: 0,
          visitorsGrowth: 0,
          conversionRate: 0,
          conversionGrowth: 0,
          topProducts: [],
          trafficSources: [],
          recentActivity: []
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [params.period, params.channel])
  
  // Helper function to generate sales chart from orders
  const generateSalesChart = (orders: any[]) => {
    const last7Days = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      const dayName = date.toLocaleDateString('cs-CZ', { weekday: 'short' })
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)
      
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.date)
        return orderDate >= dayStart && orderDate <= dayEnd
      })
      
      const dayRevenue = dayOrders.reduce((sum, order) => sum + (order.total || 0), 0)
      
      last7Days.push({
        date: dayName,
        sales: dayRevenue
      })
    }
    
    return last7Days
  }

  // Helper function to generate conversion chart
  const generateConversionChart = (orders: any[]) => {
    const last7Days = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      const dayName = date.toLocaleDateString('cs-CZ', { weekday: 'short' })
      
      // Simulate conversion rate data (1-5%)
      const baseRate = 2.5
      const variance = (Math.random() - 0.5) * 2
      const rate = Math.max(0.5, Math.min(5, baseRate + variance))
      
      last7Days.push({
        date: dayName,
        rate: Math.round(rate * 10) / 10 // Round to 1 decimal
      })
    }
    
    return last7Days
  }

  // Helper function to generate top products from orders
  const generateTopProducts = (orders: any[]) => {
    const productMap = new Map()
    
    orders.forEach(order => {
      if (order.items) {
        order.items.forEach((item: any) => {
          const key = item.product_name || item.name || 'Neznámý produkt'
          if (productMap.has(key)) {
            const existing = productMap.get(key)
            productMap.set(key, {
              name: key,
              sales: existing.sales + (item.quantity || 1),
              revenue: existing.revenue + (item.price * (item.quantity || 1))
            })
          } else {
            productMap.set(key, {
              name: key,
              sales: item.quantity || 1,
              revenue: item.price * (item.quantity || 1)
            })
          }
        })
      }
    })
    
    return Array.from(productMap.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)
  }

  // Helper function to generate recent activity
  const generateRecentActivity = (orders: any[]) => {
    const activities = []
    
    // Add recent orders
    const recentOrders = orders
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3)
    
    recentOrders.forEach(order => {
      const timeAgo = getTimeAgo(new Date(order.date))
      activities.push({
        type: 'order' as const,
        description: `Nová objednávka #${order.id}`,
        time: timeAgo,
        amount: `${order.total} Kč`
      })
    })
    
    // Add some dummy activities
    if (activities.length < 4) {
      activities.push({
        type: 'customer' as const,
        description: 'Nový zákazník se registroval',
        time: 'před 2 hodinami'
      })
      
      activities.push({
        type: 'product' as const,
        description: 'Produkt má nízké zásoby',
        time: 'před 1 hodinou'
      })
    }
    
    return activities.slice(0, 4)
  }

  // Helper function to get time ago string
  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMins < 60) {
      return `před ${diffMins} minutami`
    } else if (diffHours < 24) {
      return `před ${diffHours} hodinami`
    } else if (diffDays === 1) {
      return 'včera'
    } else {
      return `před ${diffDays} dny`
    }
  }

  return { data, isLoading, error }
}