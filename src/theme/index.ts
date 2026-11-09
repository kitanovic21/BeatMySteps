import { useColorScheme } from 'react-native';

import { useThemePreference } from './preference';

export { setThemePreference, useThemePreference, useThemePreferenceReady, type ThemePreference } from './preference';

// Brand palette: Paper #F6F4F1, Stone #E4DED2, Coral #F95C4B, Black #000000.
const shared = {
  primary: '#F95C4B',
  primaryDark: '#E2412F',
  /** Text and icons drawn on top of coral. */
  onPrimary: '#000000',
  gradient: ['#F95C4B', '#FF8E6E'] as const,
  danger: '#E5322D',
  gold: '#F5B301',
  silver: '#A3AFC0',
  bronze: '#D9822B',
  white: '#FFFFFF',
};

export const lightColors = {
  ...shared,
  // Icon accents for stat cards
  secondary: '#17A08A',
  amber: '#F29A1F',
  violet: '#7C5CFA',
  background: '#F6F4F1',
  card: '#FFFFFF',
  cardAlt: '#E4DED2',
  text: '#000000',
  textMuted: '#6B655C',
  border: '#E4DED2',
  track: '#E4DED2',
  tabBar: '#FFFFFF',
};

export const darkColors: typeof lightColors = {
  ...shared,
  secondary: '#3CCFB4',
  amber: '#FBBF24',
  violet: '#A78BFA',
  background: '#000000',
  card: '#151413',
  cardAlt: '#2A2826',
  text: '#F6F4F1',
  textMuted: '#9B958C',
  border: '#2A2826',
  track: '#2A2826',
  tabBar: '#000000',
};

export type Colors = typeof lightColors;

export const radius = { sm: 10, md: 16, lg: 24, xl: 32, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export function useTheme() {
  const scheme = useColorScheme();
  const preference = useThemePreference();
  const dark = preference === 'system' ? scheme === 'dark' : preference === 'dark';
  return { colors: dark ? darkColors : lightColors, dark };
}
