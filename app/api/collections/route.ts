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

    // Get unique collections
    const uniqueCollections = [...new Set(collections?.map((p: any) => p.collection).filter(Boolean))]
      .map((name: any, index: number) => ({
        id: name,
        name: name,
        originalName: name,
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