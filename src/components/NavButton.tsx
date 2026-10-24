import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet } from 'react-native';

import { radius, useTheme } from '@/theme';

interface Props {
  icon: 'chevron-back' | 'chevron-forward';
  onPress: () => void;
  disabled?: boolean;
}

export function NavButton({ icon, onPress, disabled }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={[styles.btn, { backgroundColor: colors.card, borderColor: colors.border, opacity: disabled ? 0.35 : 1 }]}
    >
      <Ionicons name={icon} size={20} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
