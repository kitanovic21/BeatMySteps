import { useQuery } from '@tanstack/react-query';

import { health, type DailySteps } from '@/health';
import { eachDay, elapsed, startOfDay, toKey, type Range } from '@/utils/dates';

export function useDailySteps(range: Range) {
  const today = startOfDay(new Date());
  const includesToday = range.start <= today && range.end >= today;
  return useQuery({
    queryKey: ['steps', toKey(range.start), toKey(range.end)],
    queryFn: () => health.getDailySteps(range.start, range.end),
    // Today's count keeps growing; older days are effectively immutable.
    staleTime: includesToday ? 30_000 : 10 * 60_000,
    refetchInterval: includesToday ? 60_000 : false,
  });
}

export interface RangeStats {
  total: number;
  /** Average over days that have already happened (future days excluded). */
  average: number;
  best: { key: string; steps: number } | null;
  daysAtGoal: number;
  elapsedDays: number;
}

export function computeStats(data: DailySteps | undefined, range: Range, goal: number): RangeStats {
  const past = elapsed(range);
  if (!data || !past) return { total: 0, average: 0, best: null, daysAtGoal: 0, elapsedDays: 0 };

  let total = 0;
  let daysAtGoal = 0;
  let best: RangeStats['best'] = null;
  const days = eachDay(past.start, past.end);
  for (const d of days) {
    const key = toKey(d);
    const steps = data[key] ?? 0;
    total += steps;
    if (steps >= goal) daysAtGoal++;
    if (steps > 0 && (!best || steps > best.steps)) best = { key, steps };
  }
  return { total, average: days.length ? total / days.length : 0, best, daysAtGoal, elapsedDays: days.length };
}

export function stepsOn(data: DailySteps | undefined, day: Date) {
  return data?.[toKey(day)] ?? 0;
}
