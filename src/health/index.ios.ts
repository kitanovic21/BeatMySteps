import {
  isHealthDataAvailableAsync,
  querySources,
  queryStatisticsCollectionForQuantity,
  queryStatisticsForQuantity,
  requestAuthorization,
} from '@kingstinct/react-native-healthkit';
import { Linking } from 'react-native';

import { addDays, endOfDay, startOfDay, toKey } from '@/utils/dates';
import type { DailySteps, HealthSource } from './types';

export * from './types';

const STEPS = 'HKQuantityTypeIdentifierStepCount' as const;

export const health: HealthSource = {
  name: 'Apple Health',

  isAvailable: () => isHealthDataAvailableAsync(),

  requestPermissions: () => requestAuthorization({ toRead: [STEPS] }),

  async getDailySteps(from, to) {
    // HealthKit never reports a denied read permission; it just returns no samples.
    const start = startOfDay(from);
    const results = await queryStatisticsCollectionForQuantity(
      STEPS,
      ['cumulativeSum'],
      start,
      { day: 1 },
      { filter: { date: { startDate: start, endDate: endOfDay(to) } }, unit: 'count' },
    );

    const out: DailySteps = {};
    for (const r of results) {
      if (!r.startDate || !r.sumQuantity) continue;
      out[toKey(r.startDate)] = Math.round(r.sumQuantity.quantity);
    }
    return out;
  },

  async getStepSources(days) {
    const date = { startDate: startOfDay(addDays(new Date(), 1 - days)), endDate: new Date() };
    const sources = await querySources(STEPS, { date });
    const out = await Promise.all(
      sources.map(async (source) => {
        const r = await queryStatisticsForQuantity(STEPS, ['cumulativeSum'], {
          filter: { date, sources: [source] },
          unit: 'count',
        });
        return { id: source.bundleIdentifier, name: source.name, steps: Math.round(r.sumQuantity?.quantity ?? 0) };
      }),
    );
    return out.sort((a, b) => b.steps - a.steps);
  },

  openSettings: () => {
    Linking.openURL('x-apple-health://').catch(() => Linking.openSettings());
  },
};
