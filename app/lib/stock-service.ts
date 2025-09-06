// Unified Stock Service for real-time availability across all components
import { supabase } from './supabase'

export interface StockLocation {
  location: string
  stock: number
  branch_id: string
}

export interface ProductStock {
  sku: string
  totalStock: number
  locations: StockLocation[]
  available: boolean
  lowStock: boolean
  lastUpdated: Date
}

export interface VariantStock {
  sku: string
  colorCode: string
  colorName: string
  stock: number
  available: boolean
  lowStock: boolean
}

// Stock thresholds
export const STOCK_THRESHOLDS = {
  OUT_OF_STOCK: 0,
  LOW_STOCK: 3,
  LIMITED_STOCK: 10
} as const

// Branch configurations
export const BRANCHES = {
  CHODOV: { 
    id: 'chodov', 
    name: 'PIQUADRO Westfield Chodov', 
    priority: 1,
    address: 'Roztylská 2321/19, Praha 11-Chodov 148 00, Česko',
    hours: 'Po — Ne: 9.00 — 21.00 hod.'
  },
  OUTLET: { 
    id: 'outlet', 
    name: 'PIQUADRO Premium Outlet Prague', 
    priority: 2,
    address: 'Ke Kopanině 421, Tuchoměřice 252 67, Česko',
    hours: 'Po — Ne: 10.00 — 20.00 hod.'
  }
} as const

// Stock status messages
export const STOCK_MESSAGES = {
  IN_STOCK: 'Skladem',
  LOW_STOCK: 'Poslední kusy',
  OUT_OF_STOCK: 'Není skladem',
  AVAILABLE_AT_CHODOV: 'K dispozici v PIQUADRO Westfield Chodov',
  AVAILABLE_AT_OUTLET: 'K dispozici v PIQUADRO Premium Outlet Prague',
  CONTACT_FOR_AVAILABILITY: 'Kontaktujte nás pro dostupnost'
} as const

class StockService {
  private cache = new Map<string, { data: ProductStock; timestamp: number }>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  /**
   * Get stock data for a single SKU with branch aggregation
   */
  async getProductStock(sku: string): Promise<ProductStock> {
    // Check cache first
    const cached = this.cache.get(sku)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }

    try {
      // Get stock from new inventory table
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('sku, outlet_stock, chodov_stock, total_stock, updated_at')
        .eq('sku', sku)
        .single()

      let locations: StockLocation[] = []
      let totalStock = 0

      if (inventory && !inventoryError) {
        // Add Chodov location if stock available
        if (inventory.chodov_stock > 0) {
          locations.push({
            location: BRANCHES.CHODOV.name,
            stock: inventory.chodov_stock,
            branch_id: BRANCHES.CHODOV.id
          })
        }

        // Add Outlet location if stock available  
        if (inventory.outlet_stock > 0) {
          locations.push({
            location: BRANCHES.OUTLET.name,
            stock: inventory.outlet_stock,
            branch_id: BRANCHES.OUTLET.id
          })
        }

        totalStock = inventory.total_stock || 0
      } else {
        // Fallback to products table if inventory not found
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('sku, stock')
          .eq('sku', sku)
          .single()

        if (product && !productError && product.stock > 0) {
          locations.push({
            location: 'Skladem',
            stock: product.stock,
            branch_id: 'fallback'
          })
          totalStock = product.stock
        }
      }

      // Fallback: Check inventory file system (existing API)
      if (totalStock === 0) {
        try {
          const response = await fetch(`/api/stock/${sku}`)
          if (response.ok) {
            const inventoryData = await response.json()
            if (inventoryData.totalStock > 0) {
              totalStock = inventoryData.totalStock
              locations = inventoryData.locations.map((loc: any) => ({
                location: loc.location,
                stock: loc.stock,
                branch_id: 'inventory'
              }))
            }
          }
        } catch (error) {
          console.warn('Inventory fallback failed:', error)
        }
      }

      const stockData: ProductStock = {
        sku,
        totalStock,
        locations,
        available: totalStock > STOCK_THRESHOLDS.OUT_OF_STOCK,
        lowStock: totalStock <= STOCK_THRESHOLDS.LOW_STOCK && totalStock > STOCK_THRESHOLDS.OUT_OF_STOCK,
        lastUpdated: new Date()
      }

      // Cache the result
      this.cache.set(sku, {
        data: stockData,
        timestamp: Date.now()
      })

      return stockData
    } catch (error) {
      console.error('Stock service error:', error)
      // Return safe fallback
      return {
        sku,
        totalStock: 0,
        locations: [],
        available: false,
        lowStock: false,
        lastUpdated: new Date()
      }
    }
  }

  /**
   * Get stock data for multiple SKUs (batch operation)
   */
  async getMultipleProductsStock(skus: string[]): Promise<Map<string, ProductStock>> {
    const results = new Map<string, ProductStock>()
    
    // Process in parallel with some rate limiting
    const batchSize = 10
    for (let i = 0; i < skus.length; i += batchSize) {
      const batch = skus.slice(i, i + batchSize)
      const batchPromises = batch.map(sku => this.getProductStock(sku))
      const batchResults = await Promise.all(batchPromises)
      
      batchResults.forEach(stock => {
        results.set(stock.sku, stock)
      })
    }

    return results
  }

  /**
   * Get availability status for color variants
   */
  async getVariantsStock(skus: string[]): Promise<VariantStock[]> {
    const stockResults = await this.getMultipleProductsStock(skus)
    
    return skus.map(sku => {
      const stock = stockResults.get(sku)
      
      // Extract color info from SKU
      const colorCode = this.extractColorFromSku(sku)
      const colorName = this.getColorName(colorCode)
      
      return {
        sku,
        colorCode,
        colorName,
        stock: stock?.totalStock || 0,
        available: stock?.available || false,
        lowStock: stock?.lowStock || false
      }
    })
  }

  /**
   * Get stock status with localized text and branch information
   */
  getStockStatus(productStock: ProductStock): {
    status: 'in-stock' | 'low-stock' | 'limited-stock' | 'out-of-stock' | 'available-at-branch'
    text: string
    color: 'green' | 'yellow' | 'orange' | 'red' | 'blue'
    priority: number
    locations?: StockLocation[]
  } {
    const totalStock = productStock.totalStock
    
    if (totalStock <= STOCK_THRESHOLDS.OUT_OF_STOCK) {
      return {
        status: 'out-of-stock',
        text: STOCK_MESSAGES.OUT_OF_STOCK,
        color: 'red',
        priority: 0
      }
    }
    
    // If stock is only available at branches, show branch info
    if (productStock.locations.length > 0) {
      const hasMultipleBranches = productStock.locations.length > 1
      const primaryLocation = productStock.locations[0]
      
      if (totalStock <= STOCK_THRESHOLDS.LOW_STOCK) {
        return {
          status: 'low-stock',
          text: hasMultipleBranches ? 
            STOCK_MESSAGES.LOW_STOCK : 
            `${STOCK_MESSAGES.LOW_STOCK} - ${primaryLocation.location}`,
          color: 'yellow',
          priority: 1,
          locations: productStock.locations
        }
      }
      
      if (totalStock <= STOCK_THRESHOLDS.LIMITED_STOCK) {
        return {
          status: 'available-at-branch',
          text: hasMultipleBranches ? 
            'K dispozici v našich prodejnách' : 
            primaryLocation.location === BRANCHES.CHODOV.name ? 
              STOCK_MESSAGES.AVAILABLE_AT_CHODOV : 
              STOCK_MESSAGES.AVAILABLE_AT_OUTLET,
          color: 'blue',
          priority: 2,
          locations: productStock.locations
        }
      }
    }
    
    return {
      status: 'in-stock',
      text: STOCK_MESSAGES.IN_STOCK,
      color: 'green',
      priority: 3,
      locations: productStock.locations
    }
  }

  /**
   * Clear cache for specific SKU or all cache
   */
  clearCache(sku?: string) {
    if (sku) {
      this.cache.delete(sku)
    } else {
      this.cache.clear()
    }
  }

  /**
   * Extract color code from SKU (helper method)
   */
  private extractColorFromSku(sku: string): string {
    const lastHyphenIndex = sku.lastIndexOf('-')
    return lastHyphenIndex > 0 ? sku.substring(lastHyphenIndex + 1) : 'DEFAULT'
  }

  /**
   * Get color name from color code (helper method)
   */
  private getColorName(colorCode: string): string {
    // Import the color mapping from smart-variants
    const COLOR_MAP: Record<string, { name: string; hex: string }> = {
      'BLK': { name: 'Černá', hex: '#000000' },
      'WHT': { name: 'Bílá', hex: '#FFFFFF' },
      'BLU': { name: 'Modrá', hex: '#1E40AF' },
      'RED': { name: 'Červená', hex: '#DC2626' },
      'GRN': { name: 'Zelená', hex: '#16A34A' },
      'GR': { name: 'Šedá', hex: '#6B7280' },
      'BR': { name: 'Hnědá', hex: '#92400E' },
      'R': { name: 'Růžová', hex: '#EC4899' },
      'ROSE': { name: 'Růžová', hex: '#EC4899' },
      'G': { name: 'Zelená', hex: '#16A34A' },
      'N': { name: 'Černá', hex: '#111827' },
      'NERO': { name: 'Černá', hex: '#111827' },
      'BEI': { name: 'Béžová', hex: '#D4B896' },
      'BEIGE': { name: 'Béžová', hex: '#D4B896' },
      'CUOIO': { name: 'Kožená', hex: '#CD853F' },
      'COGNAC': { name: 'Koňak', hex: '#8B4513' },
      'TAN': { name: 'Tan', hex: '#D2691E' },
      'CAMEL': { name: 'Velbloudí', hex: '#C19A6B' },
      'M': { name: 'Muse - Hnědá', hex: '#8B4513' },
    }

    const colorInfo = COLOR_MAP[colorCode.toUpperCase()]
    return colorInfo ? colorInfo.name : colorCode
  }
}

// Export singleton instance
export const stockService = new StockService()