import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get all users to check if data is being stored
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      return Response.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: 'Supabase connection successful',
      userCount: data?.length || 0,
      users: data
    });

  } catch (err) {
    return Response.json({
      success: false,
      error: 'Connection failed'
    }, { status: 500 });
  }
}