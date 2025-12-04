import { createBrowserClient } from '@supabase/ssr'
import { Database } from './database-types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Missing Supabase environment variables')
}

export function createClient() {
  try {
    return createBrowserClient<Database>(
      supabaseUrl,
      supabasePublishableKey
    )
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    throw new Error('Supabase client initialization failed')
  }
}