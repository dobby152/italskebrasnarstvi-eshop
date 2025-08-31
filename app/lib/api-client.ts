// Types
export interface Product {
  id: string | number
  name?: string
  name_cz?: string
  description?: string
  description_cz?: string
  price: number
  originalPrice?: number
  savings?: number
  colorNames?: string[]
  sku?: string
  stock?: number
  brand?: string
  normalized_brand?: string
  collection?: string
  normalized_collection?: string
  collection_cz?: string
  image_url?: string
  images?: string[]
  tags?: any[]
  features?: any[]
  colors?: any[]
  color?: string
  created_at?: string
  availability?: string
  slug?: string
  stockStatus?: string
  stockCount?: number
  hasVariants?: boolean
  variantCount?: number
}

export interface Collection {
  id: string
  name: string
  originalName: string
  dbId: number
}

export interface Brand {
  id: string | number
  name: string
}

export interface ProductStats {
  total: number
  active: number
  outOfStock: number
}

export interface ProductsResponse {
  products: Product[]
  pagination: {
    total: number
    totalPages: number
    page: number
    limit: number
  }
}

// API client for all endpoints
class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async getProducts(params: {
    page?: number
    limit?: number
    search?: string
    collection?: string
    brand?: string
    minPrice?: number
    maxPrice?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  } = {}): Promise<ProductsResponse> {
    try {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
      
      const response = await fetch(`${this.baseUrl}/api/products?${searchParams}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    }
  }

  async getProduct(id: string): Promise<Product> {
    try {
      const response = await fetch(`${this.baseUrl}/api/products/${id}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching product:', error)
      throw error
    }
  }

  async getCollections(): Promise<Collection[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/collections`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching collections:', error)
      throw error
    }
  }

  async getBrands(): Promise<Brand[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/brands`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching brands:', error)
      throw error
    }
  }

  async getProductStats(): Promise<ProductStats> {
    try {
      const response = await fetch(`${this.baseUrl}/api/stats`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching product stats:', error)
      throw error
    }
  }

  async getVariantsByBaseSku(baseSku: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/product-variants/${baseSku}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching variants:', error)
      throw error
    }
  }

  async getVariantGroups(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/variants`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching variant groups:', error)
      throw error
    }
  }

  async updateProduct(id: string | number, updates: Partial<Product>): Promise<Product> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const error = new Error(`HTTP error! status: ${response.status}`)
        ;(error as any).response = { status: response.status, data: errorData }
        throw error
      }
      return await response.json()
    } catch (error) {
      console.error('Error updating product:', error)
      throw error
    }
  }

  async createProduct(productData: Partial<Product>): Promise<Product> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const error = new Error(`HTTP error! status: ${response.status}`)
        ;(error as any).response = { status: response.status, data: errorData }
        throw error
      }
      return await response.json()
    } catch (error) {
      console.error('Error creating product:', error)
      throw error
    }
  }

  async deleteProduct(id: string | number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/products/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      throw error
    }
  }
}

// Create and export the API client instance
// Use Next.js API routes instead of external server
export const apiClient = new ApiClient('')