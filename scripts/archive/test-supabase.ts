import { createClient } from '@supabase/supabase-js'
import { Database } from './lib/supabase/database-types'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

console.log('\n🔍 Testing Supabase Connection...\n')

async function testConnection() {
  // Test 1: Check environment variables
  console.log('1️⃣  Checking environment variables...')
  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is missing')
    return false
  }
  if (!supabasePublishableKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing')
    return false
  }
  if (!supabaseSecretKey) {
    console.error('❌ SUPABASE_SECRET_KEY is missing')
    return false
  }
  console.log('✅ All environment variables present')
  console.log(`   URL: ${supabaseUrl}`)
  console.log(`   Publishable Key: ${supabasePublishableKey.substring(0, 20)}...`)
  console.log(`   Secret Key: ${supabaseSecretKey.substring(0, 20)}...\n`)

  // Test 2: Test client connection with publishable key
  console.log('2️⃣  Testing client connection (publishable key)...')
  try {
    const client = createClient<Database>(supabaseUrl, supabasePublishableKey)
    const { data, error } = await client.from('users').select('count').limit(1)

    if (error) {
      console.error('❌ Client connection failed:', error.message)
      return false
    }
    console.log('✅ Client connection successful\n')
  } catch (error) {
    console.error('❌ Client connection error:', error)
    return false
  }

  // Test 3: Test server connection with secret key
  console.log('3️⃣  Testing server connection (secret key)...')
  try {
    const serverClient = createClient<Database>(supabaseUrl, supabaseSecretKey)
    const { data, error } = await serverClient.from('users').select('count').limit(1)

    if (error) {
      console.error('❌ Server connection failed:', error.message)
      return false
    }
    console.log('✅ Server connection successful\n')
  } catch (error) {
    console.error('❌ Server connection error:', error)
    return false
  }

  // Test 4: Check if tables exist
  console.log('4️⃣  Checking database schema...')
  try {
    const client = createClient<Database>(supabaseUrl, supabaseSecretKey)

    const tables = [
      'users',
      'leagues',
      'league_members',
      'markets',
      'outcomes',
      'picks',
      'scores',
      'draft_state'
    ]

    let allTablesExist = true
    for (const table of tables) {
      const { error } = await client.from(table as any).select('count').limit(0)
      if (error) {
        console.log(`   ⚠️  Table '${table}' not found or not accessible`)
        allTablesExist = false
      } else {
        console.log(`   ✅ Table '${table}' exists`)
      }
    }

    if (!allTablesExist) {
      console.log('\n⚠️  Some tables are missing. Schema needs to be applied.\n')
    } else {
      console.log('\n✅ All expected tables exist!\n')
    }

  } catch (error) {
    console.error('❌ Schema check error:', error)
    return false
  }

  return true
}

testConnection()
  .then((success) => {
    if (success) {
      console.log('✅ All tests passed!\n')
      process.exit(0)
    } else {
      console.log('❌ Some tests failed\n')
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error('❌ Test error:', error)
    process.exit(1)
  })
