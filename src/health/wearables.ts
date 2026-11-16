import { Platform } from 'react-native';

export interface Wearable {
  /** Devices, as people know them. */
  name: string;
  /** Companion app that syncs the device's steps. */
  app: string;
  /** Play Store package of the companion app; absent when it can't sync on Android. */
  androidPackage?: string;
  /** Whether the app writes steps to Apple Health. */
  ios: boolean;
  /** Overrides the generic setup text when a device works differently. */
  hint?: string;
}

const WEARABLES: Wearable[] = [
  {
    name: 'Apple Watch',
    app: 'Watch',
    ios: true,
    hint: 'Apple Watch saves steps to Apple Health on its own. Keep it paired with this iPhone and they show up here.',
  },
  { name: 'Samsung Galaxy Watch', app: 'Samsung Health', androidPackage: 'com.sec.android.app.shealth', ios: false },
  { name: 'Pixel Watch & Fitbit', app: 'Fitbit', androidPackage: 'com.fitbit.FitbitMobile', ios: false },
  { name: 'Garmin', app: 'Garmin Connect', androidPackage: 'com.garmin.android.apps.connectmobile', ios: true },
  { name: 'Xiaomi Mi Band & Redmi Watch', app: 'Mi Fitness', androidPackage: 'com.xiaomi.wearable', ios: true },
  { name: 'Amazfit', app: 'Zepp', androidPackage: 'com.huami.watch.hmwatchmanager', ios: true },
  { name: 'Withings', app: 'Withings', androidPackage: 'com.withings.wiscale2', ios: true },
  { name: 'Oura Ring', app: 'Oura', androidPackage: 'com.ouraring.oura', ios: true },
  { name: 'Polar', app: 'Polar Flow', androidPackage: 'fi.polar.polarflow', ios: true },
];

/** Devices whose steps can reach this platform's health store. */
export const wearables = WEARABLES.filter((w) => (Platform.OS === 'ios' ? w.ios : w.androidPackage != null));

const KNOWN_SOURCES: Record<string, string> = {
  android: 'This phone',
  'com.google.android.apps.fitness': 'Google Fit',
  'com.google.android.apps.healthdata': 'Health Connect',
};
for (const w of WEARABLES) if (w.androidPackage) KNOWN_SOURCES[w.androidPackage] = w.app;

/** Readable name for a Health Connect data origin (an Android package name). */
export function sourceName(pkg: string): string {
  return KNOWN_SOURCES[pkg] ?? pkg;
}

/** True when a source is a wearable's companion app rather than the phone itself. */
export function isWearableSource(id: string, name: string): boolean {
  if (WEARABLES.some((w) => w.androidPackage === id)) return true;
  return /watch|band|ring|garmin|fitbit|oura|polar|withings|zepp|amazfit/i.test(name);
}
