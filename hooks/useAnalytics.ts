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
          fetch('http://localhost:3001/api/dashboard-stats'),
          fetch('http://localhost:3001/api/orders')
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
        
        // Generate sales chart from recent orders
        const salesChart = generateSalesChart(ordersData.orders || [])
        
        const analyticsData: AnalyticsData = {
          grossSales,
          discounts,
          returns,
          netSales,
          goalProgress,
          channelSales,
          channelPercentages,
          salesChart
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
          salesChart: []
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

  return { data, isLoading, error }
}