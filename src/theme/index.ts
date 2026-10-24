import { useColorScheme } from 'react-native';

const shared = {
  primary: '#10B981',
  primaryDark: '#059669',
  secondary: '#06B6D4',
  gradient: ['#22C55E', '#06B6D4'] as const,
  warm: ['#F97316', '#F43F5E'] as const,
  danger: '#EF4444',
  gold: '#F5B301',
  silver: '#A3B1C2',
  bronze: '#D9822B',
  white: '#FFFFFF',
};

export const lightColors = {
  ...shared,
  background: '#F4F7FB',
  card: '#FFFFFF',
  cardAlt: '#EEF3F8',
  text: '#0B1220',
  textMuted: '#64748B',
  border: '#E2E8F0',
  track: '#E6ECF2',
  tabBar: '#FFFFFF',
};

export const darkColors: typeof lightColors = {
  ...shared,
  background: '#0B1220',
  card: '#131C2E',
  cardAlt: '#1A2539',
  text: '#F1F5F9',
  textMuted: '#94A3B8',
  border: '#1E293B',
  track: '#1F2B40',
  tabBar: '#0F1729',
};

export type Colors = typeof lightColors;

export const radius = { sm: 10, md: 16, lg: 24, xl: 32, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export function useTheme() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  return { colors: dark ? darkColors : lightColors, dark };
}
