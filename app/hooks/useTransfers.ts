import { useState, useEffect } from 'react'

export interface Transfer {
  id: number
  sku: string
  product_name: string
  movement_type: 'in' | 'out'
  quantity: number
  from_location: 'chodov' | 'outlet'
  to_location: 'chodov' | 'outlet'
  status: 'pending' | 'completed' | 'rejected'
  notes: string
  reason: string
  created_at: string
  user_id: string
}

export interface TransferRequest {
  items: Array<{
    sku: string
    name?: string
    quantity: number
  }>
  from_location: 'chodov' | 'outlet'
  to_location: 'chodov' | 'outlet'
  notes?: string
  create_shipment?: boolean
}

export interface TransferResult {
  processed: Array<{
    sku: string
    quantity: number
    from_location: string
    to_location: string
    status: string
  }>
  errors: string[]
  shipment: any
  totalTransferred: number
}

export function useTransfers() {
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTransfers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/warehouse/transfers')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch transfers: ${response.statusText}`)
      }
      
      const data = await response.json()
      setTransfers(data.transfers || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching transfers:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch transfers')
    } finally {
      setLoading(false)
    }
  }

  const createTransfer = async (transferRequest: TransferRequest): Promise<TransferResult> => {
    try {
      const response = await fetch('/api/warehouse/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transferRequest)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to create transfer: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      // Refresh transfers list
      await fetchTransfers()
      
      return result.results
    } catch (err) {
      console.error('Error creating transfer:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchTransfers()
  }, [])

  return { 
    transfers, 
    loading, 
    error, 
    refetch: fetchTransfers, 
    createTransfer 
  }
}

export interface ProductAnalytics {
  sku: string
  name: string
  category: string
  currentStock: number
  chodovStock: number
  outletStock: number
  price: number
  popularity: {
    score: number
    rank: number
    trend: 'up' | 'down' | 'stable'
    category: 'hot' | 'popular' | 'average' | 'slow'
  }
  activity: {
    totalMovements: number
    inMovements: number
    outMovements: number
    totalQuantityIn: number
    totalQuantityOut: number
    turnoverRate: number
    lastActivity: string | null
  }
  stockStatus: 'critical' | 'low' | 'good' | 'excess'
  recommendations: string[]
}

export interface AnalyticsSummary {
  totalProducts: number
  hotProducts: number
  slowProducts: number
  criticalStock: number
  excessStock: number
  averagePopularity: number
}

export interface CategoryAnalytics {
  name: string
  totalMovements: number
  products: number
}

export function useAnalytics(days: number = 30, location?: 'chodov' | 'outlet') {
  const [analytics, setAnalytics] = useState<{
    summary: AnalyticsSummary | null
    topProducts: ProductAnalytics[]
    categoryAnalytics: CategoryAnalytics[]
    products: ProductAnalytics[]
  }>({
    summary: null,
    topProducts: [],
    categoryAnalytics: [],
    products: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ days: days.toString() })
      if (location) {
        params.append('location', location)
      }
      
      const response = await fetch(`/api/warehouse/analytics?${params}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`)
      }
      
      const data = await response.json()
      setAnalytics({
        summary: data.summary,
        topProducts: data.topProducts || [],
        categoryAnalytics: data.categoryAnalytics || [],
        products: data.products || []
      })
      setError(null)
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [days, location])

  return { 
    analytics, 
    loading, 
    error, 
    refetch: fetchAnalytics 
  }
}