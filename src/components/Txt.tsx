import { StyleSheet, Text, type TextProps } from 'react-native';

import { useTheme } from '@/theme';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption';

interface Props extends TextProps {
  variant?: Variant;
  muted?: boolean;
  color?: string;
  weight?: '400' | '500' | '600' | '700' | '800' | '900';
  center?: boolean;
}

export function Txt({ variant = 'body', muted, color, weight, center, style, ...rest }: Props) {
  const { colors } = useTheme();
  return (
    <Text
      {...rest}
      style={[
        styles[variant],
        { color: color ?? (muted ? colors.textMuted : colors.text) },
        weight && { fontWeight: weight },
        center && { textAlign: 'center' },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  display: { fontSize: 44, fontWeight: '900', letterSpacing: -1.5, fontVariant: ['tabular-nums'] },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.6 },
  heading: { fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: '500' },
  label: { fontSize: 13, fontWeight: '600' },
  caption: { fontSize: 12, fontWeight: '500' },
});
