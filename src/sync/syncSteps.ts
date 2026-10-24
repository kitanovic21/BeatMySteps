import AsyncStorage from '@react-native-async-storage/async-storage';

import { health } from '@/health';
import { supabase } from '@/lib/supabase';
import { addDays, fromKey, startOfDay, toKey } from '@/utils/dates';

const LAST_SYNC_KEY = 'bms:lastSyncDay';
const FIRST_SYNC_DAYS = 365;
// Health data for recent days can still change (late watch syncs etc.).
const RESYNC_DAYS = 3;

let inFlight: Promise<number> | null = null;

/** Uploads daily step totals from the health store to Supabase. Returns rows written. */
export function syncSteps(): Promise<number> {
  inFlight ??= doSync().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function doSync(): Promise<number> {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return 0;

  const today = startOfDay(new Date());
  const stored = await AsyncStorage.getItem(`${LAST_SYNC_KEY}:${userId}`);
  const from = stored
    ? addDays(fromKey(stored), -RESYNC_DAYS)
    : addDays(today, -FIRST_SYNC_DAYS);

  const daily = await health.getDailySteps(from, today);
  const rows = Object.entries(daily).map(([day, steps]) => ({
    user_id: userId,
    day,
    steps,
    updated_at: new Date().toISOString(),
  }));
  // Always report today so friends see 0 rather than nothing.
  if (!daily[toKey(today)]) {
    rows.push({ user_id: userId, day: toKey(today), steps: 0, updated_at: new Date().toISOString() });
  }

  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase.from('daily_steps').upsert(rows.slice(i, i + 500));
    if (error) throw error;
  }

  await AsyncStorage.setItem(`${LAST_SYNC_KEY}:${userId}`, toKey(today));
  return rows.length;
}
