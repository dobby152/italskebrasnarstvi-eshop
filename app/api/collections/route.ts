import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('API /collections called');
    
    const { data: collections, error } = await supabase
      .from('collections')
      .select('id, name, description, image_url, brand_id')

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`Found ${collections?.length || 0} collections`);
    return NextResponse.json({ collections: collections || [] })

  } catch (error) {
    console.error('API Route Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}