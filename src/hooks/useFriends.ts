import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase, type Friendship, type LeaderboardEntry, type PublicProfile } from '@/lib/supabase';
import { useUserId } from '@/providers/AuthProvider';
import { syncSteps } from '@/sync/syncSteps';
import { periodRange, toKey, type Period } from '@/utils/dates';

const PROFILE_COLS = 'id, username, display_name, avatar_url';

export function useLeaderboard(period: Exclude<Period, 'year'>) {
  return useQuery({
    queryKey: ['leaderboard', period],
    queryFn: async () => {
      // Push our latest numbers first so the ranking is fair.
      await syncSteps().catch(() => undefined);
      const { start, end } = periodRange(period);
      const { data, error } = await supabase.rpc('get_leaderboard', {
        p_start: toKey(start),
        p_end: toKey(end),
      });
      if (error) throw error;
      return (data as LeaderboardEntry[]).map((e) => ({ ...e, steps: Number(e.steps) }));
    },
    staleTime: 60_000,
    refetchInterval: 2 * 60_000,
  });
}

export function useFriendships() {
  const userId = useUserId();
  const query = useQuery({
    queryKey: ['friendships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('friendships')
        .select(
          `id, status, requester_id, addressee_id,
           requester:profiles!friendships_requester_id_fkey(${PROFILE_COLS}),
           addressee:profiles!friendships_addressee_id_fkey(${PROFILE_COLS})`,
        )
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as Friendship[];
    },
  });

  const all = query.data ?? [];
  const other = (f: Friendship) => (f.requester_id === userId ? f.addressee : f.requester);
  return {
    ...query,
    friends: all.filter((f) => f.status === 'accepted').map((f) => ({ friendship: f, profile: other(f) })),
    incoming: all.filter((f) => f.status === 'pending' && f.addressee_id === userId).map((f) => ({ friendship: f, profile: other(f) })),
    outgoing: all.filter((f) => f.status === 'pending' && f.requester_id === userId).map((f) => ({ friendship: f, profile: other(f) })),
  };
}

function useInvalidateFriends() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['friendships'] });
    qc.invalidateQueries({ queryKey: ['leaderboard'] });
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };
}

export type FriendRequestResult = 'sent' | 'accepted' | 'already_friends' | 'already_sent';

export function useSendFriendRequest() {
  const invalidate = useInvalidateFriends();
  return useMutation({
    mutationFn: async (username: string) => {
      const { data, error } = await supabase.rpc('send_friend_request', { p_username: username });
      if (error) throw error;
      return data as FriendRequestResult;
    },
    onSuccess: invalidate,
  });
}

export function useAcceptFriend() {
  const invalidate = useInvalidateFriends();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

/** Declines a request, cancels an outgoing one, or removes a friend. */
export function useRemoveFriendship() {
  const invalidate = useInvalidateFriends();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('friendships').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useSearchUsers(term: string) {
  const userId = useUserId();
  const q = term.trim().replace(/[%_,()]/g, '');
  return useQuery({
    queryKey: ['userSearch', q],
    enabled: q.length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(PROFILE_COLS)
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
        .neq('id', userId)
        .limit(20);
      if (error) throw error;
      return data as PublicProfile[];
    },
  });
}
