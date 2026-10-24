import {
  isHealthDataAvailableAsync,
  queryStatisticsCollectionForQuantity,
  requestAuthorization,
} from '@kingstinct/react-native-healthkit';
import { Linking } from 'react-native';

import { endOfDay, startOfDay, toKey } from '@/utils/dates';
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

  openSettings: () => {
    Linking.openURL('x-apple-health://').catch(() => Linking.openSettings());
  },
};
