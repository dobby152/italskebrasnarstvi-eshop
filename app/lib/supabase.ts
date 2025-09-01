import { createClient } from '@supabase/supabase-js'

// Truly lazy Supabase client - only create when actually used
let supabaseInstance: any = null

function createSupabaseClient() {
  // Log environment variables for debugging
  console.log('Environment check:', {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
    NODE_ENV: process.env.NODE_ENV
  })
  
  // Use explicit fallbacks for production
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://dbnfkzctensbpktgbsgn.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Nzk0NDgsImV4cCI6MjA3MTI1NTQ0OH0.vbtmSPS8ul57zeZ3W1LCZFAO0O6nyt475IY2_hGHKws'
  
  console.log('Using Supabase config:', {
    url: supabaseUrl,
    keyPrefix: supabaseAnonKey.substring(0, 20) + '...',
    keyLength: supabaseAnonKey.length
  })
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables:', { supabaseUrl: !!supabaseUrl, supabaseAnonKey: !!supabaseAnonKey })
    throw new Error(`Missing Supabase environment variables: ${!supabaseUrl ? 'SUPABASE_URL' : 'SUPABASE_ANON_KEY'}`)
  }
  
  try {
    const client = createClient(supabaseUrl, supabaseAnonKey)
    console.log('Supabase client created successfully')
    return client
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    throw error
  }
}

function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient()
  }
  return supabaseInstance
}

// Use Proxy to defer client creation until method is actually called
export const supabase = new Proxy({} as any, {
  get(target, prop) {
    try {
      return getSupabase()[prop]
    } catch (error) {
      console.error('Error accessing Supabase client:', error)
      throw error
    }
  }
})