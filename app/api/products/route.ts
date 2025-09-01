import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('API /products called');
    
    // Return minimal response first to test basic functionality
    return NextResponse.json({
      products: [],
      pagination: { total: 0, page: 1, limit: 20, pages: 0 }
    })

  } catch (error) {
    console.error('API Route Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      }, 
      { status: 500 }
    )
  }
}