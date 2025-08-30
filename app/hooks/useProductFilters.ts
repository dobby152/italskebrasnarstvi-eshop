"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProductFilters } from '../lib/types'

export function useProductFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [filters, setFilters] = useState<ProductFilters>({})
  const [isLoading, setIsLoading] = useState(false)

  // Parse URL parameters into filters
  const parseFiltersFromUrl = useCallback((): ProductFilters => {
    const urlFilters: ProductFilters = {}

    // Single value parameters
    const search = searchParams.get('search')
    if (search) urlFilters.search = search

    const sortBy = searchParams.get('sortBy')
    if (sortBy) urlFilters.sortBy = sortBy as any

    const sortOrder = searchParams.get('sortOrder')
    if (sortOrder) urlFilters.sortOrder = sortOrder as 'asc' | 'desc'

    // Array parameters
    const category = searchParams.getAll('category')
    if (category.length > 0) urlFilters.category = category

    const subcategory = searchParams.getAll('subcategory') 
    if (subcategory.length > 0) urlFilters.subcategory = subcategory

    const brand = searchParams.getAll('brand')
    if (brand.length > 0) urlFilters.brand = brand

    const gender = searchParams.getAll('gender')
    if (gender.length > 0) urlFilters.gender = gender as any

    const features = searchParams.getAll('features')
    if (features.length > 0) urlFilters.features = features

    const colors = searchParams.getAll('colors')
    if (colors.length > 0) urlFilters.colors = colors

    const materials = searchParams.getAll('materials')
    if (materials.length > 0) urlFilters.materials = materials

    const availability = searchParams.getAll('availability')
    if (availability.length > 0) urlFilters.availability = availability as any

    // Price range
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    if (minPrice || maxPrice) {
      urlFilters.priceRange = {
        min: minPrice ? parseInt(minPrice) : 0,
        max: maxPrice ? parseInt(maxPrice) : 10000
      }
    }

    return urlFilters
  }, [searchParams])

  // Update URL with current filters
  const updateUrl = useCallback((newFilters: ProductFilters) => {
    const params = new URLSearchParams()

    // Single value parameters
    if (newFilters.search) params.set('search', newFilters.search)
    if (newFilters.sortBy) params.set('sortBy', newFilters.sortBy)
    if (newFilters.sortOrder) params.set('sortOrder', newFilters.sortOrder)

    // Array parameters - use multiple values with same key
    newFilters.category?.forEach(cat => params.append('category', cat))
    newFilters.subcategory?.forEach(sub => params.append('subcategory', sub))
    newFilters.brand?.forEach(brand => params.append('brand', brand))
    newFilters.gender?.forEach(gender => params.append('gender', gender))
    newFilters.features?.forEach(feature => params.append('features', feature))
    newFilters.colors?.forEach(color => params.append('colors', color))
    newFilters.materials?.forEach(material => params.append('materials', material))
    newFilters.availability?.forEach(avail => params.append('availability', avail))

    // Price range
    if (newFilters.priceRange) {
      params.set('minPrice', newFilters.priceRange.min.toString())
      params.set('maxPrice', newFilters.priceRange.max.toString())
    }

    const queryString = params.toString()
    const newUrl = queryString ? `/produkty?${queryString}` : '/produkty'
    
    router.push(newUrl, { scroll: false })
  }, [router])

  // Initialize filters from URL on mount
  useEffect(() => {
    const urlFilters = parseFiltersFromUrl()
    setFilters(urlFilters)
  }, [parseFiltersFromUrl])

  // Update filters
  const updateFilters = useCallback((newFilters: ProductFilters) => {
    setIsLoading(true)
    setFilters(newFilters)
    updateUrl(newFilters)
    
    // Simulate loading delay
    setTimeout(() => setIsLoading(false), 300)
  }, [updateUrl])

  // Clear all filters
  const clearFilters = useCallback(() => {
    const clearedFilters: ProductFilters = {}
    updateFilters(clearedFilters)
  }, [updateFilters])

  // Add single filter
  const addFilter = useCallback((key: keyof ProductFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    updateFilters(newFilters)
  }, [filters, updateFilters])

  // Remove single filter
  const removeFilter = useCallback((key: keyof ProductFilters) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    updateFilters(newFilters)
  }, [filters, updateFilters])

  // Add value to array filter
  const addToArrayFilter = useCallback((key: keyof ProductFilters, value: string) => {
    const currentArray = (filters[key] as string[]) || []
    if (!currentArray.includes(value)) {
      const newArray = [...currentArray, value]
      addFilter(key, newArray)
    }
  }, [filters, addFilter])

  // Remove value from array filter  
  const removeFromArrayFilter = useCallback((key: keyof ProductFilters, value: string) => {
    const currentArray = (filters[key] as string[]) || []
    const newArray = currentArray.filter(item => item !== value)
    
    if (newArray.length === 0) {
      removeFilter(key)
    } else {
      addFilter(key, newArray)
    }
  }, [filters, addFilter, removeFilter])

  // Convert filters to API parameters
  const getApiParams = useCallback(() => {
    const params: Record<string, any> = {}

    if (filters.search) params.search = filters.search
    if (filters.sortBy) params.sortBy = filters.sortBy
    if (filters.sortOrder) params.sortOrder = filters.sortOrder

    // Convert arrays to comma-separated strings for API
    if (filters.category?.length) params.category = filters.category.join(',')
    if (filters.subcategory?.length) params.subcategory = filters.subcategory.join(',')
    if (filters.brand?.length) params.brand = filters.brand.join(',')
    if (filters.gender?.length) params.gender = filters.gender.join(',')
    if (filters.features?.length) params.features = filters.features.join(',')
    if (filters.colors?.length) params.colors = filters.colors.join(',')
    if (filters.materials?.length) params.materials = filters.materials.join(',')
    if (filters.availability?.length) params.availability = filters.availability.join(',')

    if (filters.priceRange) {
      params.minPrice = filters.priceRange.min
      params.maxPrice = filters.priceRange.max
    }

    return params
  }, [filters])

  // Check if any filters are active
  const hasActiveFilters = useCallback(() => {
    return Object.keys(filters).some(key => {
      const value = filters[key as keyof ProductFilters]
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'object' && value !== null) return true
      return Boolean(value)
    })
  }, [filters])

  // Get active filters count
  const getActiveFiltersCount = useCallback(() => {
    let count = 0
    if (filters.category?.length) count += filters.category.length
    if (filters.subcategory?.length) count += filters.subcategory.length
    if (filters.brand?.length) count += filters.brand.length
    if (filters.gender?.length) count += filters.gender.length
    if (filters.features?.length) count += filters.features.length
    if (filters.colors?.length) count += filters.colors.length
    if (filters.materials?.length) count += filters.materials.length
    if (filters.availability?.length) count += filters.availability.length
    if (filters.priceRange) count += 1
    if (filters.search) count += 1
    return count
  }, [filters])

  return {
    filters,
    isLoading,
    updateFilters,
    clearFilters,
    addFilter,
    removeFilter,
    addToArrayFilter,
    removeFromArrayFilter,
    getApiParams,
    hasActiveFilters,
    getActiveFiltersCount
  }
}