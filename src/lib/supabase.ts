import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = createClient(url || 'https://placeholder.supabase.co', anonKey || 'placeholder', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Refresh tokens only while the app is in the foreground.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  daily_goal: number;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  steps: number;
  is_me: boolean;
}

export type PublicProfile = Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>;

export interface AppNotification {
  id: number;
  type: 'friend_request' | 'friend_accepted';
  read_at: string | null;
  created_at: string;
  friendship_id: number | null;
  actor: PublicProfile;
  friendship: { id: number; status: 'pending' | 'accepted' } | null;
}

export interface Friendship {
  id: number;
  status: 'pending' | 'accepted';
  requester_id: string;
  addressee_id: string;
  requester: PublicProfile;
  addressee: PublicProfile;
}
