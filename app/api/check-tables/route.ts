import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Try to query from information_schema directly
    const { data: existingTables, error: schemaError } = await supabase
      .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
    
    if (schemaError) {
      return Response.json({ 
        success: false, 
        error: schemaError.message 
      }, { status: 500 });
    }
    
    const tableNames = existingTables?.map(t => t.table_name) || [];
    
    return Response.json({ 
      success: true, 
      message: 'Existing tables in public schema',
      tables: tableNames,
      count: tableNames.length
    });
    
  } catch (err) {
    return Response.json({ 
      success: false, 
      error: 'Failed to check tables: ' + err 
    }, { status: 500 });
  }
}