"use client"

import { useState, useEffect, useCallback } from 'react'
import { stockService, ProductStock, VariantStock } from '../lib/stock-service'

/**
 * Hook for tracking single product stock
 */
export function useProductStock(sku: string | undefined) {
  const [stock, setStock] = useState<ProductStock | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStock = useCallback(async (productSku: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const stockData = await stockService.getProductStock(productSku)
      setStock(stockData)
    } catch (err) {
      console.error('Error fetching stock:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch stock')
      setStock(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (sku) {
      fetchStock(sku)
    } else {
      setStock(null)
      setLoading(false)
    }
  }, [sku, fetchStock])

  const refetch = useCallback(() => {
    if (sku) {
      fetchStock(sku)
    }
  }, [sku, fetchStock])

  return {
    stock,
    loading,
    error,
    refetch,
    isAvailable: stock?.available || false,
    isLowStock: stock?.lowStock || false,
    totalStock: stock?.totalStock || 0
  }
}

/**
 * Hook for tracking multiple variants stock (for color variants in grid/product page)
 */
export function useVariantsStock(skus: string[]) {
  const [variants, setVariants] = useState<VariantStock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVariantsStock = useCallback(async (variantSkus: string[]) => {
    if (variantSkus.length === 0) {
      setVariants([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const variantStocks = await stockService.getVariantsStock(variantSkus)
      setVariants(variantStocks)
    } catch (err) {
      console.error('Error fetching variants stock:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch variants stock')
      setVariants([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVariantsStock(skus)
  }, [skus, fetchVariantsStock])

  const refetch = useCallback(() => {
    fetchVariantsStock(skus)
  }, [skus, fetchVariantsStock])

  const getVariantStock = useCallback((sku: string) => {
    return variants.find(v => v.sku === sku)
  }, [variants])

  return {
    variants,
    loading,
    error,
    refetch,
    getVariantStock,
    availableVariants: variants.filter(v => v.available),
    unavailableVariants: variants.filter(v => !v.available),
    lowStockVariants: variants.filter(v => v.lowStock)
  }
}

/**
 * Hook for batch stock checking (useful for product grids)
 */
export function useBatchStock(skus: string[]) {
  const [stockMap, setStockMap] = useState<Map<string, ProductStock>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBatchStock = useCallback(async (productSkus: string[]) => {
    if (productSkus.length === 0) {
      setStockMap(new Map())
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const stockResults = await stockService.getMultipleProductsStock(productSkus)
      setStockMap(stockResults)
    } catch (err) {
      console.error('Error fetching batch stock:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch batch stock')
      setStockMap(new Map())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBatchStock(skus)
  }, [skus, fetchBatchStock])

  const refetch = useCallback(() => {
    fetchBatchStock(skus)
  }, [skus, fetchBatchStock])

  const getProductStock = useCallback((sku: string) => {
    return stockMap.get(sku)
  }, [stockMap])

  const isProductAvailable = useCallback((sku: string) => {
    return stockMap.get(sku)?.available || false
  }, [stockMap])

  const isProductLowStock = useCallback((sku: string) => {
    return stockMap.get(sku)?.lowStock || false
  }, [stockMap])

  return {
    stockMap,
    loading,
    error,
    refetch,
    getProductStock,
    isProductAvailable,
    isProductLowStock,
    totalProducts: stockMap.size,
    availableProducts: Array.from(stockMap.values()).filter(s => s.available).length,
    outOfStockProducts: Array.from(stockMap.values()).filter(s => !s.available).length
  }
}

/**
 * Hook for color variants availability in product grids
 */
export function useColorVariantsAvailability(colorVariants: { colorName: string; hexColor: string; colorCode: string; sku?: string }[]) {
  const skus = colorVariants.map(v => v.sku).filter(Boolean) as string[]
  const { variants, loading, error, refetch } = useVariantsStock(skus)

  const getColorAvailability = useCallback((colorCode: string) => {
    const variant = variants.find(v => v.colorCode === colorCode)
    return {
      available: variant?.available || false,
      lowStock: variant?.lowStock || false,
      stock: variant?.stock || 0
    }
  }, [variants])

  const availableColors = colorVariants.filter(color => {
    if (!color.sku) return true // If no SKU, assume available
    const availability = getColorAvailability(color.colorCode)
    return availability.available
  })

  const unavailableColors = colorVariants.filter(color => {
    if (!color.sku) return false // If no SKU, assume available
    const availability = getColorAvailability(color.colorCode)
    return !availability.available
  })

  return {
    loading,
    error,
    refetch,
    getColorAvailability,
    availableColors,
    unavailableColors,
    totalColors: colorVariants.length,
    availableCount: availableColors.length,
    unavailableCount: unavailableColors.length
  }
}