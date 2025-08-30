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
        
        const response = await fetch('http://localhost:3001/api/customers')
        if (!response.ok) {
          throw new Error('Failed to fetch customers')
        }
        
        const data = await response.json()
        
        // Transform data to match Customer interface
        const transformedCustomers = (data.customers || []).map((customer: any) => ({
          id: customer.email, // Using email as ID since we don't have dedicated customer IDs
          name: customer.name,
          email: customer.email,
          phone: customer.phone || undefined,
          orders_count: customer.orders,
          total_spent: parseFloat(customer.totalSpent.replace(/[^\d]/g, '')) || 0,
          last_order_date: customer.lastOrder,
          status: customer.status,
          created_at: customer.joinDate
        }))

        const transformedStats = {
          total: data.stats?.totalCustomers || 0,
          new_this_month: data.stats?.newThisMonth || 0,
          total_revenue: transformedCustomers.reduce((sum: number, c: any) => sum + c.total_spent, 0),
          average_order_value: transformedCustomers.length > 0 ? 
            transformedCustomers.reduce((sum: number, c: any) => sum + c.total_spent, 0) / transformedCustomers.reduce((sum: number, c: any) => sum + c.orders_count, 0) :
            0
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