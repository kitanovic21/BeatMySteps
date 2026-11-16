import {
  aggregateGroupByPeriod,
  aggregateRecord,
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  openHealthConnectSettings,
  requestPermission,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

import { addDays, startOfDay } from '@/utils/dates';
import { HealthPermissionError, type DailySteps, type HealthSource } from './types';
import { sourceName } from './wearables';

export * from './types';

let initialized: Promise<boolean> | null = null;

function ensureInitialized() {
  initialized ??= initialize().catch((e) => {
    initialized = null;
    throw e;
  });
  return initialized;
}

async function hasStepsPermission() {
  const granted = await getGrantedPermissions();
  return granted.some((p) => p.recordType === 'Steps' && p.accessType === 'read');
}

export const health: HealthSource = {
  name: 'Health Connect',

  async isAvailable() {
    const status = await getSdkStatus();
    return status === SdkAvailabilityStatus.SDK_AVAILABLE;
  },

  async requestPermissions() {
    await ensureInitialized();
    await requestPermission([
      { accessType: 'read', recordType: 'Steps' },
      // Without this Health Connect only exposes the last 30 days.
      { accessType: 'read', recordType: 'ReadHealthDataHistory' },
      { accessType: 'read', recordType: 'BackgroundAccessPermission' },
    ]);
    return hasStepsPermission();
  },

  async getDailySteps(from, to) {
    await ensureInitialized();
    if (!(await hasStepsPermission())) throw new HealthPermissionError();

    // Instants are converted to local date-times natively, so periods follow the device time zone.
    const groups = await aggregateGroupByPeriod({
      recordType: 'Steps',
      timeRangeFilter: {
        operator: 'between',
        startTime: startOfDay(from).toISOString(),
        endTime: addDays(to, 1).toISOString(),
      },
      timeRangeSlicer: { period: 'DAYS', length: 1 },
    });

    const out: DailySteps = {};
    for (const g of groups) {
      // startTime is a LocalDateTime such as "2026-10-24T00:00"
      out[g.startTime.slice(0, 10)] = g.result.COUNT_TOTAL ?? 0;
    }
    return out;
  },

  async getStepSources(days) {
    await ensureInitialized();
    if (!(await hasStepsPermission())) throw new HealthPermissionError();

    const timeRangeFilter = {
      operator: 'between' as const,
      startTime: startOfDay(addDays(new Date(), 1 - days)).toISOString(),
      endTime: new Date().toISOString(),
    };
    const all = await aggregateRecord({ recordType: 'Steps', timeRangeFilter });
    // Per-app totals can add up to more than the overall total: Health Connect
    // drops overlapping steps from the overall sum, not from each app.
    const sources = await Promise.all(
      all.dataOrigins.map(async (pkg) => {
        const r = await aggregateRecord({ recordType: 'Steps', timeRangeFilter, dataOriginFilter: [pkg] });
        return { id: pkg, name: sourceName(pkg), steps: r.COUNT_TOTAL ?? 0 };
      }),
    );
    return sources.sort((a, b) => b.steps - a.steps);
  },

  openSettings: () => openHealthConnectSettings(),
};
