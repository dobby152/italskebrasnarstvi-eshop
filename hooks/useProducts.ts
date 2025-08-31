'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient, Product, ProductsResponse, Collection, Brand, ProductStats } from '../lib/api-client'
import { extractIdFromSlug } from '../lib/utils'

export interface UseProductsOptions {
  page?: number
  limit?: number
  search?: string
  collection?: string
  brand?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  autoFetch?: boolean
}

export interface UseProductsReturn {
  products: Product[]
  total: number
  page: number
  totalPages: number
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  setPage: (page: number) => void
  setSearch: (search: string) => void
  setCollection: (collection: string) => void
  setBrand: (brand: string) => void
  setMinPrice: (minPrice: number | undefined) => void
  setMaxPrice: (maxPrice: number | undefined) => void
  setSortBy: (sortBy: string) => void
  setSortOrder: (sortOrder: 'asc' | 'desc') => void
}

export function useProducts(options: UseProductsOptions = {}): UseProductsReturn {
  const {
    page: initialPage = 1,
    limit = 20,
    search: initialSearch = '',
    collection: initialCollection = '',
    brand: initialBrand = '',
    minPrice: initialMinPrice,
    maxPrice: initialMaxPrice,
    sortBy: initialSortBy = 'created_at',
    sortOrder: initialSortOrder = 'desc',
    autoFetch = true
  } = options

  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState(initialSearch)
  const [collection, setCollection] = useState(initialCollection)
  const [brand, setBrand] = useState(initialBrand)
  const [minPrice, setMinPrice] = useState<number | undefined>(initialMinPrice)
  const [maxPrice, setMaxPrice] = useState<number | undefined>(initialMaxPrice)
  const [sortBy, setSortBy] = useState(initialSortBy)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.getProducts({
        page,
        limit,
        search: search || undefined,
        collection: collection || undefined,
        brand: brand || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        sortBy,
        sortOrder
      })

      setProducts(response.products)
      setTotal(response.pagination.total)
      setTotalPages(response.pagination.totalPages)
    } catch (err) {
      console.error('API error:', err)
      setError(err instanceof Error ? err.message : 'Chyba při načítání produktů')
      setProducts([])
      setTotal(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, collection, brand, minPrice, maxPrice, sortBy, sortOrder])

  // Fetch products when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchProducts()
    }
  }, [page, limit, search, collection, brand, minPrice, maxPrice, sortBy, sortOrder, autoFetch])

  return {
    products,
    total,
    page,
    totalPages,
    loading,
    error,
    refetch: fetchProducts,
    setPage,
    setSearch,
    setCollection,
    setBrand,
    setMinPrice,
    setMaxPrice,
    setSortBy,
    setSortOrder
  }
}

export function useProduct(slug: string) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    
    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Use the same API URL as the apiClient
        const baseUrl = ''
        let productId: string | null = null
        
        console.log('🔍 Fetching product with slug:', slug)
        
        // Strategy 1: Try to extract ID from slug (format: product-name-ID)
        productId = extractIdFromSlug(slug)
        
        if (productId) {
          console.log('📋 Extracted product ID from slug:', productId)
          const url = `${baseUrl}/api/products/${productId}`
          console.log('🔗 Request URL:', url)
          
          const response = await fetch(url)
          
          if (response.ok) {
            const productData = await response.json()
            console.log('✅ Product loaded successfully by ID:', productData.name)
            setProduct(productData)
            return
          } else {
            console.warn('⚠️ Product not found by extracted ID:', response.status)
          }
        }
        
        // Strategy 2: If slug looks like a pure numeric ID, try it directly
        if (/^\d+$/.test(slug)) {
          console.log('📋 Treating slug as direct product ID:', slug)
          const url = `${baseUrl}/api/products/${slug}`
          console.log('🔗 Request URL:', url)
          
          const response = await fetch(url)
          
          if (response.ok) {
            const productData = await response.json()
            console.log('✅ Product loaded successfully by direct ID:', productData.name)
            setProduct(productData)
            return
          } else {
            console.warn('⚠️ Product not found by direct ID:', response.status)
          }
        }
        
        // Strategy 3: Try to find product by SKU (fallback for old URLs)
        console.log('📋 Trying to find product by SKU:', slug)
        const skuUrl = `${baseUrl}/api/products?sku=${encodeURIComponent(slug)}&limit=1`
        console.log('🔗 SKU search URL:', skuUrl)
        
        const skuResponse = await fetch(skuUrl)
        
        if (skuResponse.ok) {
          const skuData = await skuResponse.json()
          if (skuData.products && skuData.products.length > 0) {
            console.log('✅ Product found by SKU:', skuData.products[0].name)
            setProduct(skuData.products[0])
            return
          }
        }
        
        // Strategy 4: Try to find product by partial name match (very last resort)
        const searchTerms = slug.replace(/-/g, ' ').replace(/\d+/g, '').trim()
        if (searchTerms.length > 3) {
          console.log('📋 Trying to find product by name search:', searchTerms)
          const searchUrl = `${baseUrl}/api/products?search=${encodeURIComponent(searchTerms)}&limit=1`
          console.log('🔗 Name search URL:', searchUrl)
          
          const searchResponse = await fetch(searchUrl)
          
          if (searchResponse.ok) {
            const searchData = await searchResponse.json()
            if (searchData.products && searchData.products.length > 0) {
              console.log('✅ Product found by name search:', searchData.products[0].name)
              setProduct(searchData.products[0])
              return
            }
          }
        }
        
        // If all strategies failed, throw error
        throw new Error(`Produkt se slugem "${slug}" nebyl nalezen. Zkontrolujte prosím URL.`)
        
      } catch (err) {
        console.error('Error fetching product:', err)
        setError(err instanceof Error ? err.message : 'Chyba při načítání produktu')
        setProduct(null)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProduct()
  }, [slug])

  return { product, loading, error }
}

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCollections = async () => {
      setLoading(true)
      setError(null)

      try {
        const collectionsData = await apiClient.getCollections()
        setCollections(collectionsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Chyba při načítání kolekcí')
        setCollections([])
      } finally {
        setLoading(false)
      }
    }

    fetchCollections()
  }, [])

  return { collections, loading, error }
}

export function useBrands() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBrands = async () => {
      setLoading(true)
      setError(null)

      try {
        const brandsData = await apiClient.getBrands()
        setBrands(brandsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Chyba při načítání značek')
        setBrands([])
      } finally {
        setLoading(false)
      }
    }

    fetchBrands()
  }, [])

  return { brands, loading, error }
}

export function useProductStats() {
  const [stats, setStats] = useState<ProductStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)

    try {
      const statsData = await apiClient.getProductStats()
      setStats(statsData)
    } catch (err) {
      console.error('Error loading stats:', err)
      setError(err instanceof Error ? err.message : 'Chyba při načítání statistik')
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return { stats, loading, error, refetch: fetchStats }
}