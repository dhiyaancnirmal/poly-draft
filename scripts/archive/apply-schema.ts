import { createClient } from '@supabase/supabase-js'
import { Database } from './lib/supabase/database-types'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl || !supabaseSecretKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

console.log('\n🔧 Applying Supabase Schema...\n')

async function applySchema() {
  const client = createClient<Database>(supabaseUrl, supabaseSecretKey)

  // Read the schema file
  const schemaPath = path.resolve(process.cwd(), 'supabase-schema.sql')
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ Schema file not found at:', schemaPath)
    return false
  }

  console.log('📄 Reading schema from:', schemaPath)
  const schema = fs.readFileSync(schemaPath, 'utf-8')

  console.log('📊 Applying schema to Supabase...\n')

  try {
    // Execute the SQL schema
    const { data, error } = await client.rpc('exec_sql', { sql: schema })

    if (error) {
      console.error('❌ Schema application failed:', error.message)
      console.error('Details:', error)
      return false
    }

    console.log('✅ Schema applied successfully!\n')
    return true
  } catch (error: any) {
    // If exec_sql RPC doesn't exist, we need to apply it manually through the Supabase dashboard
    console.log('⚠️  Direct SQL execution not available via RPC')
    console.log('📝 Please apply the schema manually:\n')
    console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/wlgjwaihjbrtblvoqxgz')
    console.log('2. Navigate to: SQL Editor')
    console.log('3. Copy the contents of: supabase-schema.sql')
    console.log('4. Paste into a new query')
    console.log('5. Click "Run"\n')
    console.log('Alternatively, use the Supabase CLI:')
    console.log('   npx supabase db push\n')
    return false
  }
}

applySchema()
  .then((success) => {
    if (success) {
      console.log('✅ Schema application complete!\n')
      console.log('Next steps:')
      console.log('1. Run: npx tsx test-supabase.ts')
      console.log('2. Verify all tables exist\n')
      process.exit(0)
    } else {
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
