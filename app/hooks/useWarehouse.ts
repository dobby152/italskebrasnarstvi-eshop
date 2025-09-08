import { useState, useEffect } from 'react'

export interface WarehouseStats {
  totalProducts: number
  totalValue: number
  lowStockAlerts: number
  recentMovements: number
  totalLocations: {
    chodov: number
    outlet: number
  }
}

export interface LowStockProduct {
  sku: string
  name: string
  currentStock: number
  chodovStock: number
  outletStock: number
  minStock: number
  location: string
  priority: 'critical' | 'high' | 'medium'
}

export interface StockMovement {
  id: number
  sku: string
  product_name: string
  movement_type: 'in' | 'out'
  quantity: number
  location: 'chodov' | 'outlet'
  reason: string
  created_at: string
  user_id: string
}

export function useWarehouseStats() {
  const [stats, setStats] = useState<WarehouseStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/warehouse/stats')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch warehouse stats: ${response.statusText}`)
      }
      
      const data = await response.json()
      setStats(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching warehouse stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch warehouse stats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return { stats, loading, error, refetch: fetchStats }
}

export function useLowStockProducts(page: number = 1, limit: number = 20) {
  const [products, setProducts] = useState<LowStockProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false
  })

  const fetchLowStock = async (currentPage: number = page) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/warehouse/low-stock?page=${currentPage}&limit=${limit}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch low stock products: ${response.statusText}`)
      }
      
      const data = await response.json()
      setProducts(data.products || [])
      setPagination(data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        hasNextPage: false,
        hasPreviousPage: false
      })
      setError(null)
    } catch (err) {
      console.error('Error fetching low stock products:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch low stock products')
    } finally {
      setLoading(false)
    }
  }

  const goToPage = (newPage: number) => {
    fetchLowStock(newPage)
  }

  useEffect(() => {
    fetchLowStock(page)
  }, [page, limit])

  return { products, loading, error, pagination, refetch: fetchLowStock, goToPage }
}

export function useStockMovements() {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMovements = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/warehouse/movements')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stock movements: ${response.statusText}`)
      }
      
      const data = await response.json()
      setMovements(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching stock movements:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch stock movements')
    } finally {
      setLoading(false)
    }
  }

  const createMovement = async (movement: {
    sku: string
    movement_type: 'in' | 'out'
    quantity: number
    location: 'chodov' | 'outlet'
    reason?: string
  }) => {
    try {
      const response = await fetch('/api/warehouse/movements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(movement)
      })
      
      if (!response.ok) {
        throw new Error(`Failed to create stock movement: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      // Refresh movements list
      await fetchMovements()
      
      return result
    } catch (err) {
      console.error('Error creating stock movement:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchMovements()
  }, [])

  return { movements, loading, error, refetch: fetchMovements, createMovement }
}

export function useOCRProcessing() {
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const processFile = async (file: File) => {
    try {
      setProcessing(true)
      setError(null)
      
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/warehouse/ocr', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`OCR processing failed: ${response.statusText}`)
      }
      
      const data = await response.json()
      setResults(data)
      return data
    } catch (err) {
      console.error('Error processing OCR:', err)
      setError(err instanceof Error ? err.message : 'OCR processing failed')
      throw err
    } finally {
      setProcessing(false)
    }
  }

  const confirmInvoice = async (invoiceNumber: string, items: any[], location: 'chodov' | 'outlet' = 'chodov') => {
    try {
      const response = await fetch('/api/warehouse/confirm-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ invoiceNumber, items, location })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to confirm invoice: ${response.statusText}`)
      }
      
      const result = await response.json()
      setResults(null) // Clear OCR results after confirmation
      return result
    } catch (err) {
      console.error('Error confirming invoice:', err)
      throw err
    }
  }

  const clearResults = () => {
    setResults(null)
    setError(null)
  }

  return { 
    processing, 
    results, 
    error, 
    processFile, 
    confirmInvoice, 
    clearResults 
  }
}