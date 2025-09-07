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
  private readonly CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

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
    // Check cache first
    const cached = this.cache.get(sku)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }

    try {
      // Get stock data from our products API
      const response = await fetch(`/api/products?search=${encodeURIComponent(sku)}&limit=1`)
      
      if (!response.ok) {
        throw new Error(`Stock API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.products && data.products.length > 0) {
        const product = data.products[0]
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

        // Cache the result
        this.cache.set(sku, { data: stock, timestamp: Date.now() })
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
   * Clear cache
   */
  clearCache() {
    this.cache.clear()
  }
}

export const simpleStockService = new SimpleStockService()