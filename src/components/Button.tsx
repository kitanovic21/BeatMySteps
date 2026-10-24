import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { radius, spacing, useTheme } from '@/theme';
import { Txt } from './Txt';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
  leading?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  style?: ViewStyle;
}

export function Button({ title, onPress, variant = 'primary', icon, leading, loading, disabled, small, style }: Props) {
  const { colors } = useTheme();
  const fg =
    variant === 'primary' ? colors.white : variant === 'danger' ? colors.danger : variant === 'ghost' ? colors.primary : colors.text;

  const content = (
    <View style={[styles.inner, small && styles.small]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {leading}
          {icon && <Ionicons name={icon} size={small ? 16 : 20} color={fg} />}
          <Txt variant={small ? 'label' : 'body'} weight="700" color={fg}>
            {title}
          </Txt>
        </>
      )}
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        variant === 'secondary' && { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
        variant === 'danger' && { backgroundColor: colors.danger + '15' },
        { opacity: disabled ? 0.5 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        style,
      ]}
    >
      {variant === 'primary' ? (
        <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradient}>
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.pill, overflow: 'hidden' },
  gradient: { borderRadius: radius.pill },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 15,
    paddingHorizontal: spacing.xl,
    minHeight: 52,
  },
  small: { paddingVertical: 8, paddingHorizontal: spacing.lg, minHeight: 36 },
});
