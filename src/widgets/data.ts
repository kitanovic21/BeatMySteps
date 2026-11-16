import AsyncStorage from '@react-native-async-storage/async-storage';

import { health } from '@/health';
import { supabase, type LeaderboardEntry } from '@/lib/supabase';
import { syncSteps } from '@/sync/syncSteps';
import { toKey } from '@/utils/dates';

const SNAPSHOT_KEY = 'bms:widgetSnapshot';
const DEFAULT_GOAL = 10_000;

export interface WidgetRow {
  name: string;
  steps: number;
  rank: number;
  isMe: boolean;
}

/** Everything the home screen widgets show, cached so they render instantly and offline. */
export interface WidgetSnapshot {
  signedIn: boolean;
  steps: number;
  goal: number;
  /** Top 3 of today's leaderboard. */
  top: WidgetRow[];
  /** The user's own row, wherever they rank. */
  me: WidgetRow | null;
  /** How many people are on the leaderboard (user + friends). */
  total: number;
  updatedAt: number;
}

export const EMPTY_SNAPSHOT: WidgetSnapshot = {
  signedIn: false,
  steps: 0,
  goal: DEFAULT_GOAL,
  top: [],
  me: null,
  total: 0,
  updatedAt: 0,
};

export async function loadSnapshot(): Promise<WidgetSnapshot> {
  try {
    const raw = await AsyncStorage.getItem(SNAPSHOT_KEY);
    return raw ? { ...EMPTY_SNAPSHOT, ...JSON.parse(raw) } : EMPTY_SNAPSHOT;
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

/**
 * Reads fresh numbers from the health store and Supabase and caches them.
 * Each part falls back to the cached value, so a failed request never blanks a widget.
 */
export async function fetchSnapshot(): Promise<WidgetSnapshot> {
  const cached = await loadSnapshot();
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) {
    const signedOut = { ...EMPTY_SNAPSHOT, updatedAt: Date.now() };
    await AsyncStorage.setItem(SNAPSHOT_KEY, JSON.stringify(signedOut));
    return signedOut;
  }

  const today = new Date();
  const key = toKey(today);
  const next: WidgetSnapshot = { ...cached, signedIn: true, updatedAt: Date.now() };

  try {
    next.steps = (await health.getDailySteps(today, today))[key] ?? 0;
  } catch {
    // No permission or Health Connect unavailable: keep the last known value.
  }

  try {
    const { data: profile } = await supabase.from('profiles').select('daily_goal').eq('id', userId).single();
    if (profile) next.goal = profile.daily_goal;
  } catch {
    // Offline: keep the cached goal.
  }

  try {
    // Upload our latest steps first so our own rank is current.
    await syncSteps().catch(() => undefined);
    const { data: rows, error } = await supabase.rpc('get_leaderboard', { p_start: key, p_end: key });
    if (!error && rows) {
      const board = (rows as LeaderboardEntry[]).map((e, i) => ({
        name: e.display_name,
        steps: Number(e.steps),
        rank: i + 1,
        isMe: e.is_me,
      }));
      next.top = board.slice(0, 3);
      next.me = board.find((r) => r.isMe) ?? null;
      next.total = board.length;
    }
  } catch {
    // Offline: keep the cached leaderboard.
  }

  await AsyncStorage.setItem(SNAPSHOT_KEY, JSON.stringify(next));
  return next;
}
