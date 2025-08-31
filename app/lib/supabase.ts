import { createClient } from '@supabase/supabase-js'

// Truly lazy Supabase client - only create when actually used
let supabaseInstance: any = null

function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
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
    return getSupabase()[prop]
  }
})