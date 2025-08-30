import { useState, useEffect } from 'react'

export interface InventoryProduct {
  id: number
  name: string
  sku: string
  price: number
  stock: number
  low_stock_threshold: number
}

export interface InventoryMetrics {
  totalProducts: number
  lowStock: number
  outOfStock: number
  totalValue: number
}

export interface InventoryData {
  products: InventoryProduct[]
  metrics: InventoryMetrics
}

export function useInventory() {
  const [data, setData] = useState<InventoryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchInventory = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('http://localhost:3001/api/inventory')
      if (!response.ok) {
        throw new Error('Failed to fetch inventory')
      }
      const data = await response.json()
      setData(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }

  const updateStock = async (productId: number, stock: number, lowStockThreshold?: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/inventory/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stock,
          low_stock_threshold: lowStockThreshold
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update inventory')
      }

      // Refresh data after update
      await fetchInventory()
      return true
    } catch (err) {
      console.error('Error updating inventory:', err)
      return false
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [])

  return { 
    data, 
    isLoading, 
    error, 
    refetch: fetchInventory,
    updateStock
  }
}