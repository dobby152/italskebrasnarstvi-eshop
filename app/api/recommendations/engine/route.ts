import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import { createCachedResponse, CACHE_TTL } from '@/app/lib/cache'
import { sanitizeString, getSecurityHeaders } from '@/app/lib/security'

interface RecommendationInput {
  userId?: string
  currentProductId?: string
  cartItems?: string[]
  browsingHistory?: string[]
  type: 'similar' | 'frequently_bought' | 'trending' | 'personalized' | 'cross_sell'
  limit?: number
}

interface ProductRecommendation {
  id: string
  name: string
  price: number
  image_url: string
  sku: string
  score: number
  reason: string
  brand: string
  category: string
}

// Collaborative filtering algorithm
async function calculateSimilarProducts(productId: string, limit: number = 5): Promise<ProductRecommendation[]> {
  const { data: targetProduct } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (!targetProduct) return []

  // Find products with similar attributes
  let query = supabase
    .from('products')
    .select('*')
    .neq('id', productId)

  // Same brand gets high score
  const brandMatches = await supabase
    .from('products')
    .select('*')
    .eq('normalized_brand', targetProduct.normalized_brand)
    .neq('id', productId)
    .limit(Math.ceil(limit * 0.6))

  // Same category gets medium score  
  const categoryMatches = await supabase
    .from('products')
    .select('*')
    .eq('collection_name', targetProduct.collection_name)
    .neq('normalized_brand', targetProduct.normalized_brand)
    .neq('id', productId)
    .limit(Math.ceil(limit * 0.4))

  const recommendations: ProductRecommendation[] = []

  // Add brand matches with high score
  if (brandMatches.data) {
    brandMatches.data.forEach(product => {
      recommendations.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        sku: product.sku,
        score: 0.8 + Math.random() * 0.2, // 80-100% relevance
        reason: `Stejná značka jako ${targetProduct.name}`,
        brand: product.normalized_brand,
        category: product.collection_name
      })
    })
  }

  // Add category matches with medium score
  if (categoryMatches.data) {
    categoryMatches.data.forEach(product => {
      recommendations.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        sku: product.sku,
        score: 0.5 + Math.random() * 0.3, // 50-80% relevance
        reason: `Podobná kategorie: ${product.collection_name}`,
        brand: product.normalized_brand,
        category: product.collection_name
      })
    })
  }

  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

// Trending products algorithm
async function getTrendingProducts(limit: number = 5): Promise<ProductRecommendation[]> {
  // Mock trending algorithm - in real app, use view/order analytics
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .not('availability', 'is', null)
    .gt('availability', 0)
    .order('created_at', { ascending: false })
    .limit(limit * 2)

  if (!products) return []

  return products
    .map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      sku: product.sku,
      score: 0.7 + Math.random() * 0.3,
      reason: 'Populární produkt',
      brand: product.normalized_brand,
      category: product.collection_name
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

// Frequently bought together
async function getFrequentlyBoughtTogether(productId: string, limit: number = 3): Promise<ProductRecommendation[]> {
  // Mock algorithm - in real app, analyze order data
  const { data: targetProduct } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (!targetProduct) return []

  // Find complementary products (different category, similar price range)
  const { data: complementary } = await supabase
    .from('products')
    .select('*')
    .neq('collection_name', targetProduct.collection_name)
    .gte('price', targetProduct.price * 0.3)
    .lte('price', targetProduct.price * 2)
    .limit(limit)

  if (!complementary) return []

  return complementary.map(product => ({
    id: product.id,
    name: product.name,
    price: product.price,
    image_url: product.image_url,
    sku: product.sku,
    score: 0.6 + Math.random() * 0.4,
    reason: `Zákazníci často kupují s ${targetProduct.name}`,
    brand: product.normalized_brand,
    category: product.collection_name
  }))
}

// Personalized recommendations based on user history
async function getPersonalizedRecommendations(userId: string, browsingHistory: string[] = [], limit: number = 5): Promise<ProductRecommendation[]> {
  const recommendations: ProductRecommendation[] = []
  
  // Analyze user's browsing history
  if (browsingHistory.length > 0) {
    for (const productId of browsingHistory.slice(0, 3)) {
      const similar = await calculateSimilarProducts(productId, 2)
      recommendations.push(...similar)
    }
  }

  // Get trending if no history
  if (recommendations.length < limit) {
    const trending = await getTrendingProducts(limit - recommendations.length)
    recommendations.push(...trending)
  }

  // Remove duplicates and sort
  const unique = recommendations.filter((product, index, self) => 
    index === self.findIndex(p => p.id === product.id)
  )

  return unique
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export async function POST(request: NextRequest) {
  try {
    const input: RecommendationInput = await request.json()
    const { 
      userId, 
      currentProductId, 
      cartItems = [], 
      browsingHistory = [],
      type,
      limit = 5 
    } = input

    let recommendations: ProductRecommendation[] = []

    const cacheKey = `recommendations-${type}-${currentProductId || userId || 'anonymous'}-${limit}`
    
    const getCachedRecommendations = createCachedResponse(
      cacheKey,
      CACHE_TTL.PRODUCTS,
      async () => {
        switch (type) {
          case 'similar':
            if (currentProductId) {
              return await calculateSimilarProducts(currentProductId, limit)
            }
            break

          case 'frequently_bought':
            if (currentProductId) {
              return await getFrequentlyBoughtTogether(currentProductId, limit)
            }
            break

          case 'trending':
            return await getTrendingProducts(limit)

          case 'personalized':
            if (userId) {
              return await getPersonalizedRecommendations(userId, browsingHistory, limit)
            }
            return await getTrendingProducts(limit)

          case 'cross_sell':
            if (cartItems.length > 0) {
              const crossSell: ProductRecommendation[] = []
              for (const itemId of cartItems.slice(0, 2)) {
                const complementary = await getFrequentlyBoughtTogether(itemId, 2)
                crossSell.push(...complementary)
              }
              return crossSell
                .filter((product, index, self) => 
                  index === self.findIndex(p => p.id === product.id)
                )
                .slice(0, limit)
            }
            break
        }

        return []
      }
    )

    recommendations = await getCachedRecommendations()

    // Log recommendation request for analytics
    if (userId || currentProductId) {
      await supabase
        .from('recommendation_analytics')
        .insert({
          user_id: userId || null,
          product_id: currentProductId || null,
          recommendation_type: type,
          recommended_products: recommendations.map(r => r.id),
          created_at: new Date().toISOString()
        })
    }

    const response = NextResponse.json({
      recommendations,
      type,
      generated_at: new Date().toISOString(),
      cache_key: cacheKey.substring(0, 20) + '...'
    })

    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response

  } catch (error) {
    console.error('Recommendation engine error:', error)
    return NextResponse.json(
      { error: 'Recommendation generation failed' }, 
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}

// GET endpoint for simple recommendations
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('productId')
  const type = searchParams.get('type') || 'similar'
  const limit = parseInt(searchParams.get('limit') || '5')

  const body = {
    currentProductId: productId,
    type: type as RecommendationInput['type'],
    limit
  }

  // Reuse POST logic
  const mockRequest = new Request(request.url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: request.headers
  }) as NextRequest

  return POST(mockRequest)
}