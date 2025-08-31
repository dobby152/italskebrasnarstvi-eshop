import { createClient } from '@supabase/supabase-js'

let supabaseInstance: any = null

export function getSupabase() {
  // Only create instance during runtime, not during build
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production' && !process.env.SUPABASE_URL) {
    // During build time in production without env vars
    return null
  }
  
  if (supabaseInstance) {
    return supabaseInstance
  }
  
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  return supabaseInstance
}

// Create a proxy that handles the build-time case
export const supabase = new Proxy({} as any, {
  get(target, prop) {
    const client = getSupabase()
    if (!client) {
      throw new Error('Supabase client not available')
    }
    return client[prop]
  }
})