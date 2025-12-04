import { createServerClient } from '@supabase/ssr'
import { Database } from './database-types'
import { cookies } from 'next/headers'

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // IMPORTANT: SUPABASE_SECRET_KEY is server-only and must never be exposed to client-side code
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error('Missing Supabase environment variables')
  }

  try {
    const cookieStore = await cookies()
    
    return createServerClient<Database>(
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
    throw new Error('Supabase server client initialization failed')
  }
}