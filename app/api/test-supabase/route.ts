import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .single();
    
    if (error) {
      return Response.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }
    
    return Response.json({ 
      success: true, 
      message: 'Supabase connection successful',
      data: data 
    });
    
  } catch (err) {
    return Response.json({ 
      success: false, 
      error: 'Connection failed' 
    }, { status: 500 });
  }
}