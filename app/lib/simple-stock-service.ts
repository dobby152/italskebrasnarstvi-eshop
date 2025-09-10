// Simple Stock Service that uses only API endpoints, no direct Supabase calls
export interface SimpleStock {
  sku: string
  totalStock: number
  outletStock: number
  chodovStock: number
  available: boolean
  status: 'in-stock' | 'low-stock' | 'out-of-stock'
  text: string
}

class SimpleStockService {
  private cache = new Map<string, { data: SimpleStock; timestamp: number }>()
  private readonly CACHE_DURATION = 30 * 1000 // 30 seconds - shorter cache for better consistency

  /**
   * Get stock status with text and availability
   */
  getStockInfo(totalStock: number): { status: SimpleStock['status'], text: string } {
    if (totalStock <= 0) {
      return { status: 'out-of-stock', text: 'Vyprodáno' }
    } else if (totalStock <= 3) {
      return { status: 'low-stock', text: 'Málo skladem' }
    } else {
      return { status: 'in-stock', text: 'Skladem' }
    }
  }

  /**
   * Get stock data from products API (which includes inventory data)
   */
  async getProductStock(sku: string): Promise<SimpleStock> {
    // Normalize SKU to prevent cache misses
    const normalizedSku = sku.trim()
    console.log(`🔧 SimpleStockService: Getting stock for normalized SKU: ${normalizedSku}`)
    
    // Check cache first
    const cached = this.cache.get(normalizedSku)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`💾 SimpleStockService: Using cached data for ${normalizedSku}`, cached.data)
      return cached.data
    }

    try {
      // Get stock data from our products API
      console.log(`🌐 SimpleStockService: Fetching from API for ${normalizedSku}`)
      const response = await fetch(`/api/products?search=${encodeURIComponent(normalizedSku)}&limit=1`)
      
      if (!response.ok) {
        throw new Error(`Stock API error: ${response.status}`)
      }

      const data = await response.json()
      console.log(`📡 SimpleStockService: API response:`, data)
      
      if (data.products && data.products.length > 0) {
        const product = data.products[0]
        console.log(`📦 SimpleStockService: Product data:`, {
          sku: product.sku,
          totalStock: product.totalStock,
          outletStock: product.outletStock,
          chodovStock: product.chodovStock,
          available: product.available
        })
        
        const stockInfo = this.getStockInfo(product.totalStock || 0)
        
        const stock: SimpleStock = {
          sku: product.sku,
          totalStock: product.totalStock || 0,
          outletStock: product.outletStock || 0,
          chodovStock: product.chodovStock || 0,
          available: product.available || false,
          status: stockInfo.status,
          text: stockInfo.text
        }

        // Cache the result with both original and normalized SKU
        this.cache.set(normalizedSku, { data: stock, timestamp: Date.now() })
        this.cache.set(product.sku, { data: stock, timestamp: Date.now() })
        console.log(`✅ SimpleStockService: Cached stock data:`, stock)
        return stock
      }

      // Fallback if product not found
      const fallbackStock: SimpleStock = {
        sku,
        totalStock: 0,
        outletStock: 0,
        chodovStock: 0,
        available: false,
        status: 'out-of-stock',
        text: 'Vyprodáno'
      }
      
      this.cache.set(sku, { data: fallbackStock, timestamp: Date.now() })
      return fallbackStock

    } catch (error) {
      console.error('Error fetching stock for SKU:', sku, error)
      
      // Return fallback data on error
      const fallbackStock: SimpleStock = {
        sku,
        totalStock: 0,
        outletStock: 0,
        chodovStock: 0,
        available: false,
        status: 'out-of-stock',
        text: 'Nedostupné'
      }
      
      this.cache.set(sku, { data: fallbackStock, timestamp: Date.now() })
      return fallbackStock
    }
  }

  /**
   * Clear cache for specific SKU
   */
  clearCacheForSku(sku: string) {
    const normalizedSku = sku.trim()
    this.cache.delete(normalizedSku)
    // Also try to delete other possible formats
    this.cache.delete(sku)
    console.log(`🗑️ SimpleStockService: Cleared cache for SKU: ${normalizedSku}`)
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear()
  }
}

export const simpleStockService = new SimpleStockService()