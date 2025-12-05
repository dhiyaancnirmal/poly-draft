import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { Database } from './database-types'
import { cookies } from 'next/headers'

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // IMPORTANT: SUPABASE_SECRET_KEY is server-only and must never be exposed to client-side code
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !supabaseSecretKey) {
    const missing = []
    if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL')
    if (!supabaseSecretKey) missing.push('SUPABASE_SECRET_KEY')
    const message = `Missing Supabase environment variables: ${missing.join(', ')}`
    console.error(message)
    throw new Error(message)
  }

  try {
    const cookieStore = await cookies()
    return createSupabaseServerClient<Database>(
      supabaseUrl,
      supabaseSecretKey,
      {
        global: {
          // Use service role on server to bypass RLS for trusted operations
          headers: {
            Authorization: `Bearer ${supabaseSecretKey}`,
          },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )
  } catch (error) {
    console.error('Failed to create Supabase server client:', error)
    const message =
      error instanceof Error ? error.message : 'Supabase server client initialization failed'
    throw new Error(`SUPABASE_INIT_FAILED: ${message}`)
  }
}

// Backward-compatible alias for existing route imports.
export async function createServerClient() {
  return createClient()
}