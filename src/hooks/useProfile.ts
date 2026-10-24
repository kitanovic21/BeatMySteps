import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase, type Profile } from '@/lib/supabase';
import { useUserId } from '@/providers/AuthProvider';

const DEFAULT_GOAL = 10_000;

export function useProfile() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) throw error;
      return data as Profile;
    },
  });
}

export function useGoal() {
  return useProfile().data?.daily_goal ?? DEFAULT_GOAL;
}

export function useUpdateProfile() {
  const userId = useUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Pick<Profile, 'display_name' | 'username' | 'daily_goal'>>) => {
      const { data, error } = await supabase.from('profiles').update(patch).eq('id', userId).select().single();
      if (error) throw error;
      return data as Profile;
    },
    onSuccess: (profile) => {
      qc.setQueryData(['profile', userId], profile);
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}
