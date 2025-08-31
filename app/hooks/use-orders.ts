import { useState, useEffect } from 'react'

export interface OrderItem {
  id: number
  name: string
  image: string
  quantity: number
  price: string
}

export interface Order {
  id: string
  customer: string
  date: string
  status: 'fulfilled' | 'unfulfilled' | 'partially_fulfilled' | 'pending'
  statusLabel: string
  payment: 'paid' | 'pending' | 'failed'
  paymentLabel: string
  total: string
  items: OrderItem[]
}

export interface OrderStats {
  totalOrders: number
  fulfilled: number
  unfulfilled: number
  partiallyFulfilled: number
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/orders')
        if (!response.ok) {
          throw new Error('Failed to fetch orders')
        }
        
        const data = await response.json()
        setOrders(data.orders || [])
        setStats(data.stats || null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  return {
    orders,
    stats,
    loading,
    error
  }
}

export function useOrder(id: string) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/orders/${id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch order')
        }
        
        const data = await response.json()
        setOrder(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchOrder()
    }
  }, [id])

  return {
    order,
    loading,
    error
  }
}