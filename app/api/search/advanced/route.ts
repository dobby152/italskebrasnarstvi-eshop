import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import { sanitizeString, sanitizeNumber, getSecurityHeaders } from '@/app/lib/security'

interface SearchFilters {
  query?: string
  category?: string
  brand?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'name' | 'newest'
  page?: number
  limit?: number
}

export async function POST(request: NextRequest) {
  try {
    const filters: SearchFilters = await request.json()
    
    const {
      query = '',
      category,
      brand,
      minPrice,
      maxPrice,
      inStock = false,
      sortBy = 'relevance',
      page = 1,
      limit = 12
    } = filters

    let searchQuery = supabase
      .from('products')
      .select(`
        id, 
        name, 
        price, 
        image_url, 
        images, 
        description, 
        sku, 
        normalized_brand, 
        collection_name,
        availability
      `)

    // Full-text search
    if (query && query.length >= 2) {
      const cleanQuery = sanitizeString(query)
      searchQuery = searchQuery.or(`
        name.ilike.%${cleanQuery}%,
        description.ilike.%${cleanQuery}%,
        sku.ilike.%${cleanQuery}%,
        normalized_brand.ilike.%${cleanQuery}%,
        collection_name.ilike.%${cleanQuery}%
      `)
    }

    // Category filter
    if (category) {
      searchQuery = searchQuery.eq('collection_name', sanitizeString(category))
    }

    // Brand filter
    if (brand) {
      searchQuery = searchQuery.eq('normalized_brand', sanitizeString(brand))
    }

    // Price filters
    if (minPrice !== undefined) {
      searchQuery = searchQuery.gte('price', sanitizeNumber(minPrice, 0))
    }
    if (maxPrice !== undefined) {
      searchQuery = searchQuery.lte('price', sanitizeNumber(maxPrice, 0, 1000000))
    }

    // Stock filter
    if (inStock) {
      searchQuery = searchQuery.not('availability', 'is', null)
      searchQuery = searchQuery.gt('availability', 0)
    }

    // Sorting
    switch (sortBy) {
      case 'price_asc':
        searchQuery = searchQuery.order('price', { ascending: true })
        break
      case 'price_desc':
        searchQuery = searchQuery.order('price', { ascending: false })
        break
      case 'name':
        searchQuery = searchQuery.order('name', { ascending: true })
        break
      case 'newest':
        searchQuery = searchQuery.order('created_at', { ascending: false })
        break
      default:
        // Relevance sorting - products with availability first
        searchQuery = searchQuery.order('availability', { ascending: false, nullsLast: true })
        searchQuery = searchQuery.order('name', { ascending: true })
    }

    // Pagination
    const offset = (sanitizeNumber(page, 1) - 1) * sanitizeNumber(limit, 1, 50)
    searchQuery = searchQuery.range(offset, offset + sanitizeNumber(limit, 1, 50) - 1)

    const { data: products, error, count } = await searchQuery

    if (error) {
      console.error('Search error:', error)
      return NextResponse.json(
        { error: 'Search failed' },
        { status: 500, headers: getSecurityHeaders() }
      )
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    // Get search suggestions if no results
    let suggestions = []
    if (!products || products.length === 0) {
      const { data: suggestionData } = await supabase
        .from('products')
        .select('name, normalized_brand, collection_name')
        .limit(5)
      
      if (suggestionData) {
        suggestions = suggestionData.map(p => p.name)
      }
    }

    const response = NextResponse.json({
      products: products || [],
      pagination: {
        page: sanitizeNumber(page, 1),
        limit: sanitizeNumber(limit, 1, 50),
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / sanitizeNumber(limit, 1, 50))
      },
      suggestions,
      appliedFilters: {
        query: query || null,
        category: category || null,
        brand: brand || null,
        minPrice: minPrice || null,
        maxPrice: maxPrice || null,
        inStock,
        sortBy
      }
    })

    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response

  } catch (error) {
    console.error('Advanced search API Error:', error)
    return NextResponse.json(
      { error: 'Search failed' }, 
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}