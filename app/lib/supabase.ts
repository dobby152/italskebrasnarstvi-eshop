import { createClient } from '@supabase/supabase-js'

// Simple lazy loading approach
let supabaseInstance: any = null

function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(`Missing Supabase environment variables: ${!supabaseUrl ? 'SUPABASE_URL' : 'SUPABASE_ANON_KEY'}`)
  }
  
  return createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient()
  }
  return supabaseInstance
})()