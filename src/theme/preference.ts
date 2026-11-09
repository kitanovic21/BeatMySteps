import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { Appearance, Platform } from 'react-native';

export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'bms:themePreference';

let preference: ThemePreference = 'system';
let ready = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

/** Native views (keyboard, modals, system dialogs) follow the same scheme as the app. */
function applyNative(p: ThemePreference) {
  if (Platform.OS === 'web') return;
  try {
    Appearance.setColorScheme(p === 'system' ? 'auto' : p);
  } catch {
    // Older native module without override support: the app colors still switch.
  }
}

// Read the saved choice as early as possible; the splash screen waits for it.
AsyncStorage.getItem(STORAGE_KEY)
  .then((v) => {
    if (v === 'light' || v === 'dark') preference = v;
  })
  .catch(() => undefined)
  .finally(() => {
    applyNative(preference);
    ready = true;
    emit();
  });

export function setThemePreference(p: ThemePreference) {
  preference = p;
  applyNative(p);
  emit();
  AsyncStorage.setItem(STORAGE_KEY, p).catch(() => undefined);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(subscribe, () => preference);
}

export function useThemePreferenceReady(): boolean {
  return useSyncExternalStore(subscribe, () => ready);
}
