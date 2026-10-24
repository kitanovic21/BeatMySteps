import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, spacing, useTheme } from '@/theme';
import { formatLongDate } from '@/utils/dates';
import { formatSteps, stepsToKcal, stepsToKm, stepsToMinutes } from '@/utils/format';
import { ProgressRing } from './ProgressRing';
import { StatCard, StatRow } from './StatCard';
import { Txt } from './Txt';

interface Props {
  day: Date | null;
  steps: number;
  goal: number;
  onClose: () => void;
}

export function DaySheet({ day, steps, goal, onClose }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const pct = goal ? steps / goal : 0;

  return (
    <Modal visible={day != null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        {day && (
          <>
            <Txt variant="heading" center>{formatLongDate(day)}</Txt>
            <View style={styles.ring}>
              <ProgressRing progress={pct} size={170} stroke={14}>
                <Txt variant="title" style={{ fontVariant: ['tabular-nums'] }}>{formatSteps(steps)}</Txt>
                <Txt variant="caption" muted>{Math.round(pct * 100)}% cilja</Txt>
              </ProgressRing>
            </View>
            <StatRow>
              <StatCard icon="navigate" label="Distanca" value={`${stepsToKm(steps)} km`} tint={colors.secondary} />
              <StatCard icon="flame" label="Kalorije" value={`${stepsToKcal(steps)}`} tint="#F97316" />
              <StatCard icon="time" label="Minuti" value={stepsToMinutes(steps)} tint="#8B5CF6" />
            </StatRow>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  handle: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center' },
  ring: { alignItems: 'center' },
});
