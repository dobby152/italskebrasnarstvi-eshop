import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('API /collections called');
    
    // Return test data if Supabase is having issues
    const testMode = process.env.NODE_ENV === 'development' && process.env.TEST_MODE === 'true'
    if (testMode) {
      console.log('Running in test mode - returning mock collections data');
      return NextResponse.json({
        collections: [
          {
            id: 1,
            name: 'Test Collection',
            description: 'Test collection description',
            image_url: '/placeholder.svg',
            brand_id: 1
          }
        ]
      })
    }
    
    // Add timeout for Supabase operations
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 10000)
    )
    
    const { data: collections, error } = await Promise.race([
      supabase
        .from('collections')
        .select('id, name, description, image_url, brand_id'),
      timeoutPromise
    ])

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