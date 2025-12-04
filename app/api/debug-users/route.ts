import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    // Get all users from database
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    return Response.json({
      success: true,
      currentAuthUser: authUser ? {
        id: authUser.id,
        email: authUser.email,
        user_metadata: authUser.user_metadata,
        created_at: authUser.created_at
      } : null,
      databaseUsers: dbUsers,
      errors: {
        authError: authError?.message,
        dbError: dbError?.message
      }
    });

  } catch (err) {
    return Response.json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();

    // Delete all test users (keep this endpoint for debugging)
    const { error } = await supabase
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) {
      return Response.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: 'All users deleted'
    });

  } catch (err) {
    return Response.json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
