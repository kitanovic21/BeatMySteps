import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { radius, spacing, useTheme } from '@/theme';
import { Card } from './Card';
import { Txt } from './Txt';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  hint?: string;
  tint?: string;
}

export function StatCard({ icon, label, value, hint, tint }: Props) {
  const { colors } = useTheme();
  const c = tint ?? colors.primary;
  return (
    <Card style={styles.card}>
      <View style={[styles.icon, { backgroundColor: c + '22' }]}>
        <Ionicons name={icon} size={18} color={c} />
      </View>
      <Txt variant="caption" muted>{label}</Txt>
      <Txt variant="heading" style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Txt>
      {hint && <Txt variant="caption" muted numberOfLines={1}>{hint}</Txt>}
    </Card>
  );
}

export function StatRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  card: { flex: 1, padding: spacing.md, gap: 2 },
  icon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  value: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
});
