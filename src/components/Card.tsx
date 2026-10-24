import { StyleSheet, View, type ViewProps } from 'react-native';

import { radius, spacing, useTheme } from '@/theme';

export function Card({ style, ...rest }: ViewProps) {
  const { colors, dark } = useTheme();
  return (
    <View
      {...rest}
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        !dark && styles.shadow,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  shadow: {
    shadowColor: '#0B1220',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
});
