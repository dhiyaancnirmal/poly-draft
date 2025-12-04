import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl || !supabaseSecretKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

console.log('\n🔍 Inspecting Current Database Schema...\n')

async function inspectSchema() {
  const client = createClient(supabaseUrl, supabaseSecretKey)

  // Get list of all tables
  const { data: tables, error: tablesError } = await client
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .neq('table_name', 'schema_migrations')

  if (tablesError) {
    console.error('❌ Error fetching tables:', tablesError)
    return
  }

  console.log('📊 Found tables:')
  const tableNames = tables?.map(t => t.table_name) || []
  tableNames.forEach(name => console.log(`   - ${name}`))

  console.log('\n📋 Table Structures:\n')

  // Get columns for each table
  for (const tableName of tableNames) {
    const { data: columns, error: columnsError } = await client
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .order('ordinal_position')

    if (columnsError) {
      console.error(`❌ Error fetching columns for ${tableName}:`, columnsError)
      continue
    }

    console.log(`\n${tableName}:`)
    columns?.forEach(col => {
      console.log(`   ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`)
    })
  }
}

inspectSchema()
  .then(() => {
    console.log('\n✅ Schema inspection complete\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
