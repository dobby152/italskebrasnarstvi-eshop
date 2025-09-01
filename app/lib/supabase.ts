import { createClient } from '@supabase/supabase-js'

// Truly lazy Supabase client - only create when actually used
let supabaseInstance: any = null

function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://dbnfkzctensbpktgbsgn.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmZremN0ZW5zYnBrdGdic2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Nzk0NDgsImV4cCI6MjA3MTI1NTQ0OH0.vbtmSPS8ul57zeZ3W1LCZFAO0O6nyt475IY2_hGHKws'
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables:', { supabaseUrl: !!supabaseUrl, supabaseAnonKey: !!supabaseAnonKey })
    throw new Error(`Missing Supabase environment variables: ${!supabaseUrl ? 'SUPABASE_URL' : 'SUPABASE_ANON_KEY'}`)
  }
  
  return createClient(supabaseUrl, supabaseAnonKey)
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