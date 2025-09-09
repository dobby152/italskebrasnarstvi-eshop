import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import { createCachedResponse, CACHE_TTL } from '@/app/lib/cache'
import { sanitizeString, validateRequestSize, getSecurityHeaders } from '@/app/lib/security'

interface AutocompleteResult {
  type: 'product' | 'category' | 'brand' | 'suggestion'
  value: string
  label: string
  count?: number
  image?: string
  price?: number
}

async function fetchAutocompleteResults(query: string): Promise<AutocompleteResult[]> {
  const results: AutocompleteResult[] = []
  
  // Sanitize query
  const cleanQuery = sanitizeString(query).toLowerCase()
  if (cleanQuery.length < 2) return []

  // Search products by name and SKU
  const { data: products } = await supabase
    .from('products')
    .select('name, sku, price, image_url')
    .or(`name.ilike.%${cleanQuery}%,sku.ilike.%${cleanQuery}%`)
    .limit(5)

  if (products) {
    products.forEach(product => {
      results.push({
        type: 'product',
        value: product.sku,
        label: product.name,
        price: product.price,
        image: product.image_url
      })
    })
  }

  // Search by brand
  const { data: brands } = await supabase
    .from('products')
    .select('normalized_brand')
    .ilike('normalized_brand', `%${cleanQuery}%`)
    .limit(3)

  if (brands) {
    const uniqueBrands = [...new Set(brands.map(b => b.normalized_brand))]
    uniqueBrands.forEach(brand => {
      if (brand) {
        results.push({
          type: 'brand',
          value: brand,
          label: `Značka: ${brand}`
        })
      }
    })
  }

  // Search by category/collection
  const { data: categories } = await supabase
    .from('products')
    .select('collection_name')
    .ilike('collection_name', `%${cleanQuery}%`)
    .limit(3)

  if (categories) {
    const uniqueCategories = [...new Set(categories.map(c => c.collection_name))]
    uniqueCategories.forEach(category => {
      if (category) {
        results.push({
          type: 'category',
          value: category,
          label: `Kategorie: ${category}`
        })
      }
    })
  }

  // Add popular search suggestions
  const suggestions = [
    'kožené kabelky',
    'pánské peněženky',
    'dámské kabelky',
    'cestovní tašky',
    'aktovky',
    'batohy'
  ].filter(s => s.includes(cleanQuery))

  suggestions.forEach(suggestion => {
    results.push({
      type: 'suggestion',
      value: suggestion,
      label: suggestion
    })
  })

  return results
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    
    if (!query || query.length < 2) {
      return NextResponse.json([])
    }

    const getCachedResults = createCachedResponse(
      `autocomplete-${query}`,
      CACHE_TTL.FILTERS,
      () => fetchAutocompleteResults(query)
    )

    const results = await getCachedResults()
    
    const response = NextResponse.json(results)
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    return response

  } catch (error) {
    console.error('Autocomplete API Error:', error)
    return NextResponse.json(
      { error: 'Search failed' }, 
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}

// POST endpoint for search analytics
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!validateRequestSize(body, 1024)) {
      return NextResponse.json(
        { error: 'Request too large' },
        { status: 413, headers: getSecurityHeaders() }
      )
    }

    const { query, selectedResult, userId } = body

    // Log search analytics
    await supabase
      .from('search_analytics')
      .insert({
        query: sanitizeString(query),
        selected_result: selectedResult,
        user_id: userId || null,
        created_at: new Date().toISOString()
      })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Search analytics error:', error)
    return NextResponse.json(
      { error: 'Analytics logging failed' }, 
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}