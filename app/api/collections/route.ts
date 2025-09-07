import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('API /collections called');
    
    // Get all unique collections with product counts
    const { data: collections, error } = await supabase
      .from('products')
      .select('collection_name, collection_code')
      .not('collection_code', 'is', null)
      .not('collection_name', 'is', null)

    if (error) {
      console.error('Collections query error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch collections',
        details: error 
      }, { status: 500 })
    }

    if (!collections) {
      return NextResponse.json({
        collections: []
      })
    }

    // Group collections and count products
    const collectionMap = new Map<string, { name: string; code: string; count: number }>()
    
    collections.forEach(item => {
      const key = item.collection_code
      if (collectionMap.has(key)) {
        const existing = collectionMap.get(key)!
        existing.count++
      } else {
        collectionMap.set(key, {
          name: item.collection_name,
          code: item.collection_code,
          count: 1
        })
      }
    })

    // Convert to array and sort by product count
    const collectionsArray = Array.from(collectionMap.values())
      .sort((a, b) => b.count - a.count)

    console.log(`Returning ${collectionsArray.length} collections`);

    return NextResponse.json({
      collections: collectionsArray
    })

  } catch (error) {
    console.error('Error in collections API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}