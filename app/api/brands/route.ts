import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('API /brands called');
    
    // Return test data if Supabase is having issues
    const testMode = process.env.NODE_ENV === 'development' && process.env.TEST_MODE === 'true'
    if (testMode) {
      console.log('Running in test mode - returning mock brands data');
      return NextResponse.json({
        brands: [
          {
            id: 1,
            name: 'Test Brand',
            description: 'Test brand description',
            logo_url: '/placeholder.svg',
            website_url: 'https://example.com'
          }
        ]
      })
    }
    
    // Add timeout for Supabase operations
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 10000)
    )
    
    const { data: brands, error } = await Promise.race([
      supabase
        .from('brands')
        .select('id, name, description, logo_url, website_url'),
      timeoutPromise
    ])

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`Found ${brands?.length || 0} brands`);
    return NextResponse.json({ brands: brands || [] })

  } catch (error) {
    console.error('API Route Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}