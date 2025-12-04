import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface UserProfile {
  id: string;
  fid: number | null;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  wallet_address: string | null;
  auth_method: 'farcaster' | 'wallet';
  bio: string | null;
  wins: number;
  total_leagues: number;
  total_points: number;
  created_at: string;
  last_active: string;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const supabase = createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          throw new Error('Not authenticated');
        }

        // Fetch user profile
        const { data, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        setProfile(data as UserProfile);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  return { profile, loading, error };
}
