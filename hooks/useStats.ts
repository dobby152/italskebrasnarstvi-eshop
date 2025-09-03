import { useState, useEffect } from 'react'

export interface Stats {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  totalProducts: number
  revenueGrowth: number
  ordersGrowth: number
  customersGrowth: number
  productsGrowth: number
  pendingOrders: number
  lowStockProducts: number
}

export function useStats() {
  const [data, setData] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true)
      // Mock data for demo
      setData({
        totalRevenue: 0,
        totalOrders: 0,
        totalCustomers: 0,
        totalProducts: 0,
        revenueGrowth: 0,
        ordersGrowth: 0,
        customersGrowth: 0,
        productsGrowth: 0,
        pendingOrders: 0,
        lowStockProducts: 0,
      })
      setIsLoading(false)
    }

    fetchStats()
  }, [])

  return { data, isLoading, error }
}