import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useEffectEvent } from 'react';
import { AppState } from 'react-native';

import { supabase, type AppNotification, type PublicProfile } from '@/lib/supabase';
import { useUserId } from '@/providers/AuthProvider';

const PROFILE_COLS = 'id, username, display_name, avatar_url';

export function useNotifications() {
  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select(
          `id, type, read_at, created_at, friendship_id,
           actor:profiles!notifications_actor_id_fkey(${PROFILE_COLS}),
           friendship:friendships(id, status)`,
        )
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as unknown as AppNotification[];
    },
  });
  const unread = (query.data ?? []).filter((n) => !n.read_at).length;
  return { ...query, unread };
}

export function useMarkNotificationsRead() {
  const userId = useUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export interface IncomingNotification {
  type: AppNotification['type'];
  actor: PublicProfile;
}

/**
 * Keeps notification badges live: listens for new rows over Supabase Realtime and
 * refetches when the app returns to the foreground. Calls `onNew` for each new one.
 */
export function useNotificationsRealtime(onNew: (n: IncomingNotification) => void) {
  const userId = useUserId();
  const qc = useQueryClient();
  const handleNew = useEffectEvent(onNew);

  useEffect(() => {
    const refresh = () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['friendships'] });
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
    };

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        async (payload) => {
          refresh();
          const row = payload.new as { type: AppNotification['type']; actor_id: string };
          const { data } = await supabase.from('profiles').select(PROFILE_COLS).eq('id', row.actor_id).single();
          if (data) handleNew({ type: row.type, actor: data as PublicProfile });
        },
      )
      .subscribe();

    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => {
      sub.remove();
      supabase.removeChannel(channel);
    };
  }, [qc, userId]);
}
