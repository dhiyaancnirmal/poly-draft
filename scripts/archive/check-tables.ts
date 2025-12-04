import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!

console.log('\n🔍 Checking Existing Tables...\n')

async function checkTables() {
  const client = createClient(supabaseUrl, supabaseSecretKey)

  const tables = ['users', 'leagues', 'league_members', 'picks', 'scores']

  for (const table of tables) {
    console.log(`\n📋 ${table}:`)
    const { data, error } = await client.from(table).select('*').limit(1)

    if (error) {
      console.log(`   ❌ Error: ${error.message}`)
    } else {
      if (data && data.length > 0) {
        console.log('   Columns:', Object.keys(data[0]).join(', '))
      } else {
        console.log('   ✅ Table exists but is empty')
        // Try to get structure anyway
        const { error: selectError } = await client.from(table).select('*').limit(0)
        if (!selectError) {
          console.log('   Table is accessible')
        }
      }
    }
  }
}

checkTables()
  .then(() => {
    console.log('\n✅ Check complete\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
