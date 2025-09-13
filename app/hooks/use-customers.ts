import { useState, useEffect } from 'react'

export interface Customer {
  id: number
  name: string
  email: string
  phone?: string
  orders_count: number
  total_spent: number
  last_order_date?: string
  status: 'new' | 'regular' | 'vip'
  created_at: string
}

export interface CustomerStats {
  total: number
  new_this_month: number
  total_revenue: number
  average_order_value: number
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState<CustomerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/customers')
        if (!response.ok) {
          throw new Error('Failed to fetch customers')
        }
        
        const data = await response.json()
        
        // Transform data to match Customer interface
        const transformedCustomers = (data.customers || []).map((customer: any) => ({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone || undefined,
          orders_count: customer.orders_count,
          total_spent: customer.total_spent,
          last_order_date: customer.last_order_date,
          status: customer.status,
          created_at: customer.created_at
        }))

        const transformedStats = {
          total: data.stats?.totalCustomers || 0,
          new_this_month: data.stats?.newThisMonth || 0,
          total_revenue: data.stats?.totalRevenue || 0,
          average_order_value: data.stats?.averageOrderValue || 0
        }

        setCustomers(transformedCustomers)
        setStats(transformedStats)
      } catch (err) {
        console.error('Error fetching customers:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setCustomers([])
        setStats({
          total: 0,
          new_this_month: 0,
          total_revenue: 0,
          average_order_value: 0
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCustomers()
  }, [])

  return { customers, stats, loading, error }
}