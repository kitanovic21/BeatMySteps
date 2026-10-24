import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { radius, spacing, useTheme } from '@/theme';

interface Props extends TextInputProps {
  icon?: keyof typeof Ionicons.glyphMap;
  secure?: boolean;
}

export function TextField({ icon, secure, style, ...rest }: Props) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: colors.card, borderColor: focused ? colors.primary : colors.border },
      ]}
    >
      {icon && <Ionicons name={icon} size={20} color={focused ? colors.primary : colors.textMuted} />}
      <TextInput
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        {...rest}
        secureTextEntry={secure && hidden}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        style={[styles.input, { color: colors.text }, style]}
      />
      {secure && (
        <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10}>
          <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textMuted} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    minHeight: 54,
  },
  // outlineWidth removes the browser focus ring on web; the border already shows focus.
  input: { flex: 1, fontSize: 16, fontWeight: '500', paddingVertical: 14, outlineWidth: 0 },
});
