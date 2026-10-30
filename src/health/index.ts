// Fallback used on web (and for type-checking). Produces stable demo data so the
// UI can be previewed without a phone. iOS/Android use index.ios.ts / index.android.ts.
import { eachDay, startOfDay, toKey } from '@/utils/dates';
import type { DailySteps, HealthSource } from './types';

export * from './types';

function demoSteps(day: Date): number {
  const seed = day.getFullYear() * 400 + day.getMonth() * 32 + day.getDate();
  const noise = Math.abs(Math.sin(seed * 12.9898) * 43758.5453) % 1;
  const weekend = day.getDay() === 0 || day.getDay() === 6;
  return Math.round(3500 + noise * 9500 + (weekend ? 1500 : 0));
}

export const health: HealthSource = {
  name: 'Demo data',
  isAvailable: async () => true,
  requestPermissions: async () => true,
  async getDailySteps(from, to) {
    const now = new Date();
    const today = startOfDay(now);
    const out: DailySteps = {};
    for (const d of eachDay(from, to)) {
      if (d > today) break;
      const full = demoSteps(d);
      // Scale today's value by how much of the day has passed.
      out[toKey(d)] = d.getTime() === today.getTime()
        ? Math.round(full * Math.min(1, (now.getHours() + now.getMinutes() / 60) / 20))
        : full;
    }
    return out;
  },
  openSettings: () => {},
};
