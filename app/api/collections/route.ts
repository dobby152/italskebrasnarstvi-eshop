import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { data: collections, error } = await supabase
      .from('products')
      .select('collection')
      .not('collection', 'is', null)
      .not('collection', 'eq', '')

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get unique collections with explicit types
    const collectionList = collections?.map((product: any) => product.collection).filter(Boolean) || []
    const uniqueCollections = [...new Set(collectionList)]
      .map((name: unknown, index: number) => ({
        id: name as string,
        name: name as string,
        originalName: name as string,
        dbId: index + 1
      }))

    return NextResponse.json({ collections: uniqueCollections })

  } catch (error) {
    console.error('API Route Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}